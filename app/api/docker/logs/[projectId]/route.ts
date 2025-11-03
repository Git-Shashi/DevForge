import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { findProjectById } from '@/lib/mongodb/models';
import { getDockerClient } from '@/lib/docker/client';

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

    // Verify project ownership
    const project = await findProjectById(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get user by email to compare IDs
    const { findUserByEmail } = await import('@/lib/mongodb/models');
    const user = await findUserByEmail(session.user.email);
    
    if (!user || project.userId.toString() !== user._id.toString()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const docker = getDockerClient();
    const container = docker.getContainer(project.docker.containerId);

    // Get container logs (last 100 lines)
    const logs = await container.logs({
      stdout: true,
      stderr: true,
      tail: 100,
      timestamps: false,
    });

    // Convert buffer to string and split into lines
    const logString = logs.toString('utf-8');
    const logLines = logString
      .split('\n')
      .filter((line) => line.trim().length > 0)
      .map((line) => {
        // Remove Docker stream headers (first 8 bytes)
        return line.length > 8 ? line.substring(8) : line;
      });

    return NextResponse.json({ logs: logLines });
  } catch (error: any) {
    console.error('Failed to fetch container logs:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch logs' },
      { status: 500 }
    );
  }
}
