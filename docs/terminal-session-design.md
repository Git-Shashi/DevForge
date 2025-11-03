# Terminal Session Management - Like Your Custom Shell

## How It Works (Similar to Your C Shell with `chdir()`)

### Your Custom Shell Approach
```c
if (strcmp(argv[0], "cd") == 0) {
    if (chdir(argv[1]) != 0) {
        perror("cd failed");
    }
}
// The process maintains its current directory via chdir()
// All subsequent commands run in that directory automatically
```

### Our Docker Terminal Approach

**Problem:** Docker `exec` creates a NEW process each time, so `chdir()` doesn't persist.

**Solution:** Maintain server-side session state (like your shell maintains process state).

## Architecture

### 1. Terminal Session Manager (`lib/docker/terminal-session.ts`)
- **Stores state in memory** for each user's terminal session
- **Key:** `${userId}-${projectId}`
- **State:** Current directory, last activity timestamp
- **Timeout:** 1 hour of inactivity
- **Like:** Your shell's process maintaining its working directory

### 2. API Route Handler (`app/api/docker/exec/[projectId]/route.ts`)
- **Gets session state** before executing commands
- **For `cd` commands:**
  - Parses the target directory (absolute, relative, `.`, `..`)
  - Tests if directory exists
  - Updates session state on success (like `chdir()`)
- **For other commands:**
  - Prepends `cd ${currentDir} &&` to maintain context
  - Like how your shell already has the working directory set
- **Returns:** Command output + current directory

### 3. Terminal Component (`components/ide/Terminal.tsx`)
- **Fetches current directory** from server on mount
- **Sends plain commands** to server (no client-side manipulation)
- **Updates UI state** from server response
- **Displays current directory** in prompt

## Command Flow Comparison

### Your C Shell
```
User: cd frontend
Shell: chdir("frontend") → Process cwd = /path/frontend

User: ls
Shell: execve("ls", ...) → Runs in /path/frontend automatically
```

### Our Docker Terminal
```
User: cd frontend
Client: POST /api/docker/exec { command: "cd frontend" }
Server: 
  - Session says currentDir = "/app"
  - Parse target: "frontend"
  - Calculate newDir: "/app/frontend"
  - Execute: "cd /app/frontend && pwd"
  - Success! Update session: currentDir = "/app/frontend"
  - Return: { currentDir: "/app/frontend", ... }
Client: Update UI state

User: ls
Client: POST /api/docker/exec { command: "ls" }
Server:
  - Session says currentDir = "/app/frontend"
  - Build command: "cd /app/frontend && ls"
  - Execute and return output
Client: Display output
```

## Advantages

✅ **Persistent state** across Docker exec calls
✅ **Handles relative paths** (., .., subdir)
✅ **Validates directories** before changing
✅ **Session cleanup** prevents memory leaks
✅ **Same UX** as your custom shell

## Testing

1. Open DevForge terminal
2. Type: `cd frontend`
3. Type: `ls` - should show frontend files
4. Type: `pwd` - should show `/app/frontend`
5. Type: `cd ..`
6. Type: `pwd` - should show `/app`
7. Type: `cd backend`
8. Type: `npm install` - runs in backend directory

Just like your custom shell! 🎉
