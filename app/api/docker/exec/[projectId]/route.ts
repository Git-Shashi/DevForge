import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { findProjectById } from '@/lib/mongodb/models';
import { getDockerClient } from '@/lib/docker/client';
import { getTerminalSession, updateCurrentDir, touchSession } from '@/lib/docker/terminal-session';

export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const authSession = await getServerSession(authOptions);
    if (!authSession?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = params;
    const { command, background } = await req.json();

    if (!command) {
      return NextResponse.json({ error: 'Command is required' }, { status: 400 });
    }
    
    // Detect if this is a long-running dev server command
    const isDevServer = command.includes('npm run dev') || 
                       command.includes('npm start') || 
                       command.includes('node ') ||
                       background === true;

    // Verify project ownership
    const project = await findProjectById(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get user by email to compare IDs
    const { findUserByEmail } = await import('@/lib/mongodb/models');
    const user = await findUserByEmail(authSession.user.email);
    
    if (!user || project.userId.toString() !== user._id.toString()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const docker = getDockerClient();
    const container = docker.getContainer(project.docker.containerId);

    // Get terminal session (like maintaining shell state with chdir())
    const terminalSession = getTerminalSession(user._id.toString(), projectId);
    
    console.log('🎯 Session state at start:', {
      userId: user._id.toString(),
      projectId,
      currentDir: terminalSession.currentDir,
      command
    });
    
    // Check if this is a cd command (handle it like chdir() in your shell)
    const isCdCommand = command.trim().startsWith('cd ');
    const isCdHome = command.trim() === 'cd';
    
    let actualCommand = command;
    
    if (isCdCommand || isCdHome) {
      // Extract target directory
      const targetDir = isCdHome 
        ? '/app' 
        : command.trim().substring(3).trim();
      
      // Handle relative and absolute paths
      let newDir: string;
      if (targetDir.startsWith('/')) {
        // Absolute path
        newDir = targetDir;
      } else if (targetDir === '..') {
        // Parent directory
        const parts = terminalSession.currentDir.split('/').filter((p: string) => p);
        parts.pop();
        newDir = '/' + parts.join('/');
        if (newDir === '') newDir = '/';
      } else if (targetDir === '.') {
        // Current directory
        newDir = terminalSession.currentDir;
      } else {
        // Relative path
        newDir = terminalSession.currentDir === '/' 
          ? `/${targetDir}` 
          : `${terminalSession.currentDir}/${targetDir}`;
      }
      
      // Test if directory exists by trying to cd into it
      actualCommand = `cd ${newDir} && pwd`;
    } else {
      // For non-cd commands, execute in the current directory
      // (Like how your shell maintains its cwd with chdir())
      
      // If it's a dev server command, run in background with nohup
      if (isDevServer) {
        // Extract the base command and run in background
        const logFile = `/tmp/${projectId}-dev.log`;
        actualCommand = `cd ${terminalSession.currentDir} && nohup ${command} > ${logFile} 2>&1 & echo "Dev server started in background. Check logs at ${logFile}" && echo "PID: $!"`;
      } else {
        actualCommand = `cd ${terminalSession.currentDir} && ${command}`;
      }
      
      touchSession(user._id.toString(), projectId);
    }

    // Execute command in container
    const exec = await container.exec({
      Cmd: ['sh', '-c', actualCommand],
      AttachStdout: true,
      AttachStderr: true,
      WorkingDir: '/app', // Always start from /app
    });

    const stream = await exec.start({ Detach: false, Tty: false });

    // Collect output
    return new Promise((resolve) => {
      let output = '';

      stream.on('data', (chunk: Buffer) => {
        output += chunk.toString('utf-8');
      });

      stream.on('end', async () => {
        const inspectData = await exec.inspect();
        
        let updatedCurrentDir = terminalSession.currentDir;
        
        // If this was a cd command and it succeeded, update the session
        if ((isCdCommand || isCdHome) && inspectData.ExitCode === 0) {
          // Clean Docker stream output - remove control characters
          // Docker multiplexes stdout/stderr with 8-byte headers: [stream_type, 0, 0, 0, size_bytes...]
          const cleanOutput = output.replace(/[\x00-\x08\x0B-\x1F\x7F]/g, '').trim();
          
          const lines = cleanOutput.split('\n').filter((line: string) => line.trim());
          const newDir = lines[lines.length - 1].trim();
          
          console.log('🔍 CD Command detected:', { 
            rawOutput: JSON.stringify(output), 
            cleanOutput,
            lines, 
            newDir, 
            isCdCommand, 
            isCdHome 
          });
          
          if (newDir && newDir.startsWith('/')) {
            updateCurrentDir(user._id.toString(), projectId, newDir);
            updatedCurrentDir = newDir;
            console.log('✅ Updated session currentDir to:', newDir);
            
            // ALWAYS clear output for cd commands - user doesn't need to see pwd result
            output = '';
            console.log('🧹 Cleared output for cd command');
          }
        }
        
        console.log('📤 Sending response:', {
          command,
          currentDir: updatedCurrentDir,
          exitCode: inspectData.ExitCode,
          output: JSON.stringify(output),
          outputLength: output.length
        });
        
        resolve(
          NextResponse.json({
            output,
            exitCode: inspectData.ExitCode,
            currentDir: updatedCurrentDir, // Send back current directory
          })
        );
      });

      stream.on('error', (err: Error) => {
        resolve(
          NextResponse.json(
            { error: err.message, output },
            { status: 500 }
          )
        );
      });
    });
  } catch (error: any) {
    console.error('Failed to execute command:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to execute command' },
      { status: 500 }
    );
  }
}
