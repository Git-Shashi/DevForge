import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { findProjectById } from '@/lib/mongodb/models';
import fs from 'fs/promises';
import path from 'path';

async function buildFileTree(dirPath: string, basePath: string = ''): Promise<any[]> {
  const items = await fs.readdir(dirPath, { withFileTypes: true });
  const tree = [];
  
  // Files/folders to exclude from the tree
  const excludeList = [
    'node_modules',
    '.git',
    '.DS_Store',
    '*.log',
    '*.pid',
    'dist',
    'build',
    '.next',
  ];

  for (const item of items) {
    // Skip excluded items
    if (excludeList.some(pattern => {
      if (pattern.includes('*')) {
        const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
        return regex.test(item.name);
      }
      return item.name === pattern;
    })) {
      continue;
    }

    const itemPath = path.join(dirPath, item.name);
    const relativePath = path.join(basePath, item.name);

    if (item.isDirectory()) {
      const children = await buildFileTree(itemPath, relativePath);
      tree.push({
        id: relativePath,
        name: item.name,
        path: relativePath,
        type: 'folder',
        children,
      });
    } else {
      const stats = await fs.stat(itemPath);
      tree.push({
        id: relativePath,
        name: item.name,
        path: relativePath,
        type: 'file',
        size: stats.size,
        modifiedAt: stats.mtime,
      });
    }
  }

  return tree.sort((a, b) => {
    if (a.type === b.type) return a.name.localeCompare(b.name);
    return a.type === 'folder' ? -1 : 1;
  });
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ success: false, error: 'Project ID required' }, { status: 400 });
    }

    const project = await findProjectById(projectId);
    if (!project || project.userId.toString() !== session.user.id) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }

    const tree = await buildFileTree(project.rootPath);

    return NextResponse.json({ success: true, tree });
  } catch (error: any) {
    console.error('File tree error:', error);
    return NextResponse.json({ success: false, error: 'Failed to load file tree' }, { status: 500 });
  }
}
