# How to Use Dev Server in Terminal

## Problem: Dev Server "Hangs" Terminal

When you run `npm run dev`, the dev server is a **long-running process** that keeps the terminal busy.

## ✅ Solution: Commands Now Run in Background

The terminal automatically detects dev server commands and runs them in the background with `nohup`.

### Supported Commands (Auto-Background):
- `npm run dev`
- `npm start`
- `yarn dev`

## How to Use:

### 1. Start Dev Server
```bash
cd frontend
npm run dev
```

**Result:**
- Terminal shows: "Dev server started in background"
- Terminal shows: Log file location
- Terminal shows: Process ID (PID)
- Terminal becomes available immediately for more commands!

### 2. Check If It's Running
```bash
ps aux | grep "npm run dev"
```

Or check the logs:
```bash
cat /tmp/YOUR_PROJECT_ID-dev.log
```

### 3. Switch to Preview Tab
- Click the **Preview** tab (next to Terminal)
- Your app will load once Vite starts (a few seconds)

### 4. Stop Dev Server
```bash
pkill -f "npm run dev"
```

Or find the PID and kill it:
```bash
ps aux | grep "npm run dev"
kill <PID>
```

## Example Workflow:

```bash
# 1. Navigate to frontend
cd frontend

# 2. Start dev server (runs in background automatically)
npm run dev
# Output: Dev server started in background. Check logs at /tmp/xxx-dev.log
# Output: PID: 12345

# 3. Terminal is still available! You can run more commands:
ls
pwd
cd ../backend

# 4. Switch to Preview tab to see your app

# 5. If needed, stop the dev server:
kill 12345
```

## Alternative: View Logs

To see what's happening with your dev server:

```bash
# View logs in real-time
tail -f /tmp/YOUR_PROJECT_ID-dev.log

# View last 50 lines
tail -n 50 /tmp/YOUR_PROJECT_ID-dev.log
```

## Tips:

✅ **Dev server runs automatically in background** - no need to worry!  
✅ **Terminal stays responsive** - run other commands while server is running  
✅ **Check Preview tab** - your app will appear there once server starts  
✅ **Logs are saved** - check `/tmp/` if you need to debug  

## What Changed?

### Before (Blocking):
```bash
cd frontend
npm run dev
# Terminal hangs here... can't run other commands
```

### Now (Background):
```bash
cd frontend
npm run dev
# ✨ Dev server started in background
# Terminal is ready for more commands!
ls
cd ..
# etc.
```

Happy coding! 🚀
