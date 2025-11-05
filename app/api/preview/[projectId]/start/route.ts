import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { findProjectById, findUserByEmail } from '@/lib/mongodb/models';
import { ObjectId } from 'mongodb';
import Docker from 'dockerode';

const docker = new Docker({ socketPath: '/var/run/docker.sock' });

export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = params;

    if (!ObjectId.isValid(projectId)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    const project = await findProjectById(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Verify ownership
    const user = await findUserByEmail(session.user.email);
    if (!user || project.userId.toString() !== user._id.toString()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if project type supports preview
    const supportedTypes = ['mern', 'react'];
    if (!supportedTypes.includes(project.projectType)) {
      return NextResponse.json({ 
        error: `Preview not available for ${project.projectType} projects`
      }, { status: 400 });
    }

    const containerId = project.docker?.containerId;
    if (!containerId) {
      return NextResponse.json({ error: 'Container not found' }, { status: 404 });
    }

    // Get container and check if it's running
    const container = docker.getContainer(containerId);
    const containerInfo = await container.inspect();
    
    if (!containerInfo.State.Running) {
      return NextResponse.json({ 
        error: 'Container is not running. Please restart the container first.' 
      }, { status: 400 });
    }

    // Kill any existing frontend dev server processes
    try {
      const killExec = await container.exec({
        Cmd: ['sh', '-c', 'pkill -f "npm run dev.*frontend" || true'],
        AttachStdout: true,
        AttachStderr: true,
      });
      await killExec.start({ Detach: false });
      // Wait a moment for processes to clean up
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (err) {
      console.log('No existing process to kill or kill failed (continuing):', err);
    }

    // Start the frontend dev server
    const startExec = await container.exec({
      Cmd: [
        'sh',
        '-c',
        'cd /app/frontend && nohup npm run dev > /app/frontend.log 2>&1 & echo $! > /app/frontend.pid'
      ],
      AttachStdout: true,
      AttachStderr: true,
    });

    const stream = await startExec.start({ Detach: false });
    let output = '';
    
    await new Promise((resolve, reject) => {
      stream.on('data', (chunk: Buffer) => {
        output += chunk.toString();
      });
      stream.on('end', resolve);
      stream.on('error', reject);
    });

    // Wait a moment for the server to start
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verify the process started
    const verifyExec = await container.exec({
      Cmd: ['sh', '-c', 'ps aux | grep "[n]pm run dev" | grep frontend'],
      AttachStdout: true,
      AttachStderr: true,
    });

    const verifyStream = await verifyExec.start({ Detach: false });
    let verifyOutput = '';
    
    await new Promise<void>((resolve) => {
      verifyStream.on('data', (chunk: Buffer) => {
        verifyOutput += chunk.toString();
      });
      verifyStream.on('end', () => resolve());
    });

    const isRunning = verifyOutput.trim().length > 0;

    if (isRunning) {
      return NextResponse.json({ 
        success: true,
        message: 'Frontend dev server started successfully',
        url: `http://localhost:${project.docker?.ports?.frontend || 5173}`
      });
    } else {
      return NextResponse.json({ 
        success: false,
        message: 'Failed to start dev server. Check frontend.log for errors.',
        output: output
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Failed to start dev server:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to start dev server' },
      { status: 500 }
    );
  }
}
