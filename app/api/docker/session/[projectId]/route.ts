import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { findProjectById } from '@/lib/mongodb/models';
import { getTerminalSession } from '@/lib/docker/terminal-session';

/**
 * GET: Get terminal session state for a project
 */
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

    // Get terminal session
    const terminalSession = getTerminalSession(user._id.toString(), projectId);

    return NextResponse.json({
      currentDir: terminalSession.currentDir,
      lastActivity: terminalSession.lastActivity,
    });
  } catch (error: any) {
    console.error('Failed to get terminal session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get terminal session' },
      { status: 500 }
    );
  }
}
