import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { getDatabase } from '@/lib/mongodb/client';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDatabase();
    const projectsCollection = db.collection('projects');
    
    // Find projects without rootPath
    const projectsWithoutRootPath = await projectsCollection.find({
      $or: [
        { rootPath: { $exists: false } },
        { rootPath: null },
        { rootPath: '' }
      ]
    }).toArray();
    
    const updates = [];
    
    // Update each project
    for (const project of projectsWithoutRootPath) {
      const userId = project.userId.toString();
      const projectId = project._id.toString();
      const rootPath = `${process.env.DOCKER_PROJECTS_PATH}/${userId}/${projectId}`;
      
      await projectsCollection.updateOne(
        { _id: project._id },
        { 
          $set: { 
            rootPath,
            updatedAt: new Date()
          } 
        }
      );
      
      updates.push({
        projectId,
        projectName: project.projectName,
        rootPath
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Fixed ${updates.length} projects`,
      updates 
    });
  } catch (error: any) {
    console.error('Error fixing projects:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fix projects' },
      { status: 500 }
    );
  }
}
