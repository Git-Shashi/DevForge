import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { findProjectById } from '@/lib/mongodb/models';
import { ObjectId } from 'mongodb';
import Docker from 'dockerode';

const docker = new Docker({ socketPath: '/var/run/docker.sock' });

export async function GET(
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
    const { findUserByEmail } = await import('@/lib/mongodb/models');
    const user = await findUserByEmail(session.user.email);
    if (!user || project.userId.toString() !== user._id.toString()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if project type supports preview
    const supportedTypes = ['mern', 'react'];
    if (!supportedTypes.includes(project.projectType)) {
      return NextResponse.json({ 
        error: `Preview not available for ${project.projectType} projects`,
        message: 'Preview is only available for React and MERN projects'
      }, { status: 400 });
    }

    const hostPort = project.docker?.ports?.frontend;
    if (!hostPort) {
      return NextResponse.json({ error: 'Frontend port not found on project' }, { status: 404 });
    }

    // Check if dev server is running, and start it if not
    const containerId = project.docker?.containerId;
    
    console.log(`🔍 Preview requested for project ${projectId}: ${project.projectName}`);
    console.log(`📡 Container: ${containerId}, Frontend Port: ${hostPort}`);
    if (containerId) {
      try {
        const container = docker.getContainer(containerId);
        const containerInfo = await container.inspect();
        
        if (containerInfo.State.Running) {
          // Check if dev server process is running
          const exec = await container.exec({
            Cmd: ['sh', '-c', 'ps aux | grep "[n]pm run dev" | grep frontend'],
            AttachStdout: true,
            AttachStderr: true,
          });

          const stream = await exec.start({ Detach: false });
          const output = await new Promise<string>((resolve) => {
            let data = '';
            stream.on('data', (chunk: Buffer) => {
              data += chunk.toString();
            });
            stream.on('end', () => resolve(data));
          });

          const isRunning = output.trim().length > 0;

          // If not running, start it automatically
          if (!isRunning) {
            console.log(`Dev server not running for project ${projectId}, starting automatically...`);
            
            // Kill any existing processes
            await container.exec({
              Cmd: ['sh', '-c', 'pkill -f "npm run dev" || true'],
              AttachStdout: true,
              AttachStderr: true,
            }).then(exec => exec.start({ Detach: false }));

            // Wait a moment for cleanup
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Start dev server
            const startExec = await container.exec({
              Cmd: ['sh', '-c', 'cd /app/frontend && nohup npm run dev > /app/frontend.log 2>&1 & echo $! > /app/frontend.pid'],
              AttachStdout: true,
              AttachStderr: true,
            });

            await startExec.start({ Detach: false });
            console.log(`Dev server started automatically for project ${projectId}`);
          }
        }
      } catch (error) {
        console.error('Error checking/starting dev server:', error);
        // Don't fail the request, just log the error
      }
    }

    const url = `http://localhost:${hostPort}`;
    return NextResponse.json({ url, hostPort, containerPort: 5173, autoStarted: true });
  } catch (error: any) {
    console.error('Failed to compute preview URL:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to compute preview URL' },
      { status: 500 }
    );
  }
}
