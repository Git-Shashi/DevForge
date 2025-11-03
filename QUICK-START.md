# Quick Start Guide - Terminal & Preview

## 🚀 Your DevForge IDE is Ready!

### Access Your IDE
Open: **http://localhost:3001**

---

## ✅ Testing the CD Command

The `cd` command now works exactly like a real shell (using server-side session state).

### Test Sequence:

1. **Open Terminal Tab** (bottom panel in IDE)

2. **Check current directory:**
   ```bash
   pwd
   ```
   Output: `/app`

3. **Change to frontend:**
   ```bash
   cd frontend
   ```
   No output (silent success) - Check the prompt, it should now show `/app/frontend $`

4. **Verify you're in frontend:**
   ```bash
   pwd
   ```
   Output: `/app/frontend`

5. **List files:**
   ```bash
   ls
   ```
   Output: Shows `src`, `package.json`, `index.html`, etc.

6. **Install dependencies:**
   ```bash
   npm install
   ```
   Installs all packages in frontend directory

7. **Start the dev server:**
   ```bash
   npm run dev
   ```
   Starts Vite on port 5173

8. **Switch to Preview Tab** to see your app running!

---

## 🖼️ Using the Preview Feature

### Method 1: Preview Tab
1. After running `npm run dev` in terminal
2. Click the **Preview** tab (next to Terminal tab)
3. Your Vite app will load in an iframe

### Method 2: External Browser
1. In the Preview tab, click the **External Link** icon (top right)
2. Opens in a new browser tab
3. URL will be `http://localhost:5XXXX` (mapped port)

### Refresh Preview
- Click the **Refresh** button in Preview tab to reload

---

## 📝 Example Workflow

### Starting a New Project:

```bash
# 1. Go to frontend
cd frontend

# 2. Install dependencies (if not already installed)
npm install

# 3. Start dev server
npm run dev
```

**Then**: Switch to **Preview tab** to see your app!

### Working in Backend:

```bash
# 1. Go to backend
cd backend

# 2. Install dependencies
npm install

# 3. Start server
npm run dev
```

Backend runs on different port (check terminal output)

---

## 🎯 CD Command Features

### Absolute Paths:
```bash
cd /app/frontend/src
```

### Relative Paths:
```bash
cd ../backend          # Go to backend from frontend
cd ./src              # Go into src folder
```

### Parent Directory:
```bash
cd ..                 # Go up one level
```

### Home Directory:
```bash
cd                    # Go back to /app
```

### Current Directory:
```bash
cd .                  # Stay in current directory
```

---

## 🔧 How It Works

### Server-Side Session Persistence

Like your C shell's `chdir()`:

```c
// Your shell: Process remembers directory
chdir("/app/frontend");
// Next command runs in /app/frontend
```

```typescript
// DevForge: Server remembers directory
updateCurrentDir(userId, projectId, "/app/frontend");
// Next command gets: "cd /app/frontend && your-command"
```

### What Happens:

1. **You type:** `cd frontend`
2. **Server receives:** `cd frontend`
3. **Server calculates:** `/app/frontend`
4. **Server tests:** `cd /app/frontend && pwd`
5. **If success:** Updates session state
6. **Returns:** `{ currentDir: "/app/frontend", exitCode: 0 }`
7. **Terminal updates:** Prompt shows `/app/frontend $`
8. **You type:** `ls`
9. **Server receives:** `ls`
10. **Server runs:** `cd /app/frontend && ls`
11. **Returns:** File listing from frontend directory

---

## 🐛 Troubleshooting

### CD not working?
1. **Check browser console** (F12) for errors
2. **Refresh the page** to reset terminal session
3. **Type `pwd`** to see current directory

### Preview not loading?
1. **Make sure dev server is running:** Check Terminal output for "Local: http://..."
2. **Wait a few seconds** after starting `npm run dev`
3. **Click Refresh** in Preview tab
4. **Check container ports:** Your project should have mapped ports

### Dev server won't start?
1. **Check if dependencies are installed:** `npm install` first
2. **Check for errors** in Terminal output
3. **Make sure you're in the right directory:** `cd frontend` then `npm run dev`

---

## 📦 Full Example Session

```bash
# Start fresh
pwd                          # /app

# Setup frontend
cd frontend                  # (no output)
pwd                         # /app/frontend
npm install                 # Installing dependencies...
npm run dev                 # Vite dev server starting...

# Switch to Preview tab to see app
# (Click Preview tab at bottom)

# In a new terminal session or after stopping server:
cd ..                       # Back to /app
cd backend                  # To backend
npm install                 # Install backend deps
npm run dev                 # Start backend server

# Navigate around
cd ../frontend/src          # Relative path
pwd                         # /app/frontend/src
ls                          # List src files
cd                          # Back to /app
```

---

## ✨ Features

✅ **Persistent directory state** across commands  
✅ **Preview tab** with iframe and external link  
✅ **Refresh button** for preview  
✅ **Relative and absolute paths**  
✅ **Error handling** for invalid directories  
✅ **Command history** with ↑/↓ arrows  
✅ **Auto-save** in editor  
✅ **File tree auto-refresh**  

Enjoy your new IDE! 🎉
