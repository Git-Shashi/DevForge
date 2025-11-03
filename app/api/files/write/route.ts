import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { findProjectById } from '@/lib/mongodb/models';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, path: filePath, content } = await request.json();

    if (!projectId || !filePath) {
      return NextResponse.json({ success: false, error: 'Project ID and path required' }, { status: 400 });
    }

    const project = await findProjectById(projectId);
    if (!project || project.userId.toString() !== session.user.id) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }

    const fullPath = path.join(project.rootPath, filePath);
    await fs.writeFile(fullPath, content || '', 'utf-8');

    return NextResponse.json({ success: true, message: 'File saved successfully' });
  } catch (error: any) {
    console.error('Write file error:', error);
    return NextResponse.json({ success: false, error: 'Failed to write file' }, { status: 500 });
  }
}
