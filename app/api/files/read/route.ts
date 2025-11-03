import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { findProjectById } from '@/lib/mongodb/models';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const filePath = searchParams.get('path');

    if (!projectId || !filePath) {
      return NextResponse.json({ success: false, error: 'Project ID and path required' }, { status: 400 });
    }

    const project = await findProjectById(projectId);
    if (!project || project.userId.toString() !== session.user.id) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }

    const fullPath = path.join(project.rootPath, filePath);
    const content = await fs.readFile(fullPath, 'utf-8');

    return NextResponse.json({ success: true, content });
  } catch (error: any) {
    console.error('Read file error:', error);
    return NextResponse.json({ success: false, error: 'Failed to read file' }, { status: 500 });
  }
}
