/**
 * Terminal Session Manager
 * Maintains shell state (current directory, environment) for each container
 * Similar to how a real shell maintains its state with chdir()
 */

interface SessionState {
  currentDir: string;
  lastActivity: Date;
}

// Store terminal sessions in memory
// Key: `${userId}-${projectId}`
// Use globalThis to survive Next.js hot reloads in development
const globalForSessions = globalThis as unknown as {
  terminalSessions: Map<string, SessionState> | undefined;
};

if (!globalForSessions.terminalSessions) {
  globalForSessions.terminalSessions = new Map<string, SessionState>();
}

const sessions = globalForSessions.terminalSessions;

// Session timeout: 1 hour of inactivity
const SESSION_TIMEOUT = 60 * 60 * 1000;

/**
 * Get or create a terminal session for a project
 */
export function getTerminalSession(userId: string, projectId: string): SessionState {
  const sessionKey = `${userId}-${projectId}`;
  
  console.log('🔍 getTerminalSession called:', {
    sessionKey,
    totalSessions: sessions.size,
    allKeys: Array.from(sessions.keys()),
    globalThis: !!globalForSessions.terminalSessions
  });
  
  let session = sessions.get(sessionKey);
  
  // Create new session if doesn't exist or expired
  if (!session || Date.now() - session.lastActivity.getTime() > SESSION_TIMEOUT) {
    const isNew = !session;
    const isExpired = session ? Date.now() - session.lastActivity.getTime() > SESSION_TIMEOUT : false;
    
    session = {
      currentDir: '/app',
      lastActivity: new Date(),
    };
    sessions.set(sessionKey, session);
    
    console.log('📝 Created new session:', {
      sessionKey,
      reason: isNew ? 'no session' : 'expired',
      isExpired,
      currentDir: session.currentDir
    });
  } else {
    console.log('✅ Found existing session:', {
      sessionKey,
      currentDir: session.currentDir,
      age: Date.now() - session.lastActivity.getTime()
    });
  }
  
  return session;
}

/**
 * Update the current directory for a session (like chdir())
 */
export function updateCurrentDir(
  userId: string,
  projectId: string,
  newDir: string
): void {
  const sessionKey = `${userId}-${projectId}`;
  let session = sessions.get(sessionKey);
  
  console.log('📝 updateCurrentDir called:', {
    sessionKey,
    newDir,
    sessionExists: !!session,
    oldDir: session?.currentDir
  });
  
  // Create session if it doesn't exist
  if (!session) {
    session = {
      currentDir: newDir,
      lastActivity: new Date(),
    };
    sessions.set(sessionKey, session);
    console.log('⚠️ Session did not exist, created new one:', sessionKey, newDir);
  } else {
    const oldDir = session.currentDir;
    session.currentDir = newDir;
    session.lastActivity = new Date();
    console.log('✅ Updated existing session:', {
      sessionKey,
      from: oldDir,
      to: newDir,
      totalSessions: sessions.size
    });
  }
  
  // Verify the update
  const verification = sessions.get(sessionKey);
  console.log('🔍 Verification after update:', {
    sessionKey,
    storedDir: verification?.currentDir,
    matches: verification?.currentDir === newDir
  });
}

/**
 * Touch session to update last activity time
 */
export function touchSession(userId: string, projectId: string): void {
  const sessionKey = `${userId}-${projectId}`;
  const session = sessions.get(sessionKey);
  
  if (session) {
    session.lastActivity = new Date();
  }
}

/**
 * Clear a terminal session (on logout or project deletion)
 */
export function clearSession(userId: string, projectId: string): void {
  const sessionKey = `${userId}-${projectId}`;
  sessions.delete(sessionKey);
}

/**
 * Clean up expired sessions
 */
export function cleanupExpiredSessions(): void {
  const now = Date.now();
  
  for (const [key, session] of sessions.entries()) {
    if (now - session.lastActivity.getTime() > SESSION_TIMEOUT) {
      sessions.delete(key);
    }
  }
}

// Run cleanup every 10 minutes
setInterval(cleanupExpiredSessions, 10 * 60 * 1000);
