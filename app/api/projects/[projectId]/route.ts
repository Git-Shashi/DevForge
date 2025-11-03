import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { findProjectById } from '@/lib/mongodb/models';
import { ObjectId } from 'mongodb';

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

    // Validate ObjectId format
    if (!ObjectId.isValid(projectId)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    // Fetch project
    const project = await findProjectById(projectId);
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Verify ownership (compare userId in project with user email from session)
    // Note: We need to find the user by email first to get their ObjectId
    const { findUserByEmail } = await import('@/lib/mongodb/models');
    const user = await findUserByEmail(session.user.email);
    
    if (!user || project.userId.toString() !== user._id.toString()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ project }, { status: 200 });
  } catch (error: any) {
    console.error('Get project error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = params;

    // Validate ObjectId format
    if (!ObjectId.isValid(projectId)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    // Fetch project to verify ownership
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

    // Delete container
    const { destroyContainer } = await import('@/lib/docker/container');
    await destroyContainer(
      project.docker.containerId,
      project.docker.ports.frontend,
      project.docker.ports.backend
    );

    // Delete project from database
    const { deleteProject } = await import('@/lib/mongodb/models');
    await deleteProject(projectId);

    // Delete container mapping
    const { deleteContainerMapping } = await import('@/lib/mongodb/models');
    await deleteContainerMapping(project.docker.containerId);

    return NextResponse.json(
      { message: 'Project deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Delete project error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete project' },
      { status: 500 }
    );
  }
}
