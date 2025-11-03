import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { createProject as createProjectDb, createContainerMapping } from '@/lib/mongodb/models';
import { createPersistentContainer } from '@/lib/docker/container';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { projectName, projectType = 'mern' } = await request.json();

    if (!projectName) {
      return NextResponse.json(
        { success: false, error: 'Project name is required' },
        { status: 400 }
      );
    }

    // Create project ID
    const projectId = new ObjectId();
    const userId = session.user.id;

    // Create persistent Docker container
    const dockerInfo = await createPersistentContainer({
      userId,
      projectId: projectId.toString(),
      projectName,
      projectType,
    });

    // Save project to database with the same projectId
    const newProject = {
      _id: projectId,
      userId: new ObjectId(userId),
      projectName,
      projectType,
      docker: dockerInfo,
      rootPath: `${process.env.DOCKER_PROJECTS_PATH}/${userId}/${projectId}`,
      activeConnections: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastAccessed: new Date(),
      lastActiveAt: new Date(),
    };

    const collection = await (await import('@/lib/mongodb/models')).getProjectsCollection();
    await collection.insertOne(newProject as any);

    // Create container mapping
    await createContainerMapping({
      containerId: dockerInfo.containerId,
      containerName: dockerInfo.containerName,
      userId: new ObjectId(userId),
      projectId,
      ports: dockerInfo.ports,
      status: 'running',
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Project created successfully',
        project: {
          _id: projectId,
          projectName,
          projectType,
          docker: dockerInfo,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create project error:', error);
    
    // Handle Docker connection errors
    if (error.code === 'ECONNREFUSED' && error.address?.includes('docker.sock')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Docker is not running. Please start Docker Desktop and try again.' 
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create project' },
      { status: 500 }
    );
  }
}
