import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { findProjectById, findUserByEmail } from '@/lib/mongodb/models';
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
    const user = await findUserByEmail(session.user.email);
    if (!user || project.userId.toString() !== user._id.toString()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if project type supports preview
    const supportedTypes = ['mern', 'react'];
    if (!supportedTypes.includes(project.projectType)) {
      return NextResponse.json({ 
        running: false,
        message: `Preview not available for ${project.projectType} projects`
      });
    }

    const containerId = project.docker?.containerId;
    if (!containerId) {
      return NextResponse.json({ 
        running: false, 
        message: 'Container not found' 
      });
    }

    // Check if container is running
    const container = docker.getContainer(containerId);
    const containerInfo = await container.inspect();
    
    if (!containerInfo.State.Running) {
      return NextResponse.json({ 
        running: false, 
        message: 'Container is not running' 
      });
    }

    // Check if frontend dev server process is running
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

    return NextResponse.json({ 
      running: isRunning,
      message: isRunning ? 'Dev server is running' : 'Dev server is not running',
      containerRunning: true
    });
  } catch (error: any) {
    console.error('Failed to check dev server status:', error);
    return NextResponse.json(
      { running: false, error: error.message || 'Failed to check status' },
      { status: 500 }
    );
  }
}
