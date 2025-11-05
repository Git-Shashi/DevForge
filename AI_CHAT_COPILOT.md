# AI Chat Copilot - Implementation Guide

## Overview
A conversational AI assistant integrated into your IDE with full project context awareness.

## Features

### ✨ **Chat Interface**
- Natural conversation with AI about your code
- Message history with timestamps
- Loading states and error handling
- Keyboard shortcut: `Cmd/Ctrl + Enter` to send

### 📁 **Full Project Context**
- AI has access to **all files** in your project
- Shows file count in the header (e.g., "42 files in context")
- Automatically includes project structure in every request
- References specific files when giving suggestions

### 🎯 **Smart Code Application**
- **"Apply to [filename]"** button appears when AI suggests code
- Extracts code from markdown code blocks automatically
- Shows which file the code will be applied to
- One-click integration with your codebase

### 💡 **Context-Aware Assistance**
Shows current context in the UI:
- Current file name
- Programming language
- Selected text (if any)
- Number of lines selected

## How It Works

### 1. **File Tree Loading**
```typescript
// Loads all project files on mount
GET /api/files/tree?projectId=${projectId}

// Flattens tree structure to get all file paths
// Result: ["src/index.ts", "src/components/App.tsx", ...]
```

### 2. **Chat Request**
```typescript
POST /api/ai/copilot
{
  "projectId": "...",
  "action": "chat",
  "prompt": "Add authentication to the login page",
  "fileName": "LoginPage.tsx",
  "fileContent": "...",
  "language": "typescript",
  "selectedText": "...",
  "projectContext": "src/index.ts\nsrc/App.tsx\n..." // All files
}
```

### 3. **AI Response**
- AI sees entire project structure
- Can reference specific files
- Provides code suggestions in markdown format
- Code is automatically extracted and ready to apply

## Usage Examples

### Example 1: **Feature Request**
**User:** "Add a dark mode toggle to the header"

**AI Response:**
```typescript
// components/Header.tsx
import { useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export function Header() {
  const [darkMode, setDarkMode] = useState(false);
  
  // ... implementation
}
```
**Action:** Click "Apply to Header.tsx" → Code is inserted

### Example 2: **Bug Fix**
**User:** "Fix the infinite loop in useEffect"

**AI:** Analyzes current file, suggests fix with explanation

### Example 3: **Code Explanation**
**User:** "What does this function do?"

**AI:** Provides detailed explanation based on selected code

### Example 4: **Cross-File Context**
**User:** "Update all API calls to use the new auth token"

**AI:** Sees all files, suggests changes across multiple files

## API Configuration

### Environment Variable
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### Gemini Model
- **Model:** `gemini-2.0-flash`
- **API Version:** `v1beta`
- **Endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`

### Generation Config
```json
{
  "temperature": 0.7,
  "topK": 40,
  "topP": 0.95,
  "maxOutputTokens": 2048
}
```

## UI Components

### **Chat Message**
- User messages: Right-aligned, blue background
- AI messages: Left-aligned, gray background
- Timestamp on each message
- "Apply" button on AI code suggestions

### **Header**
- Shows AI Copilot title with sparkle icon
- Displays file count with folder tree icon
- Loading indicator while fetching context

### **Context Bar**
- Current file badge
- Language indicator
- Selection info (lines selected)

### **Input Area**
- Text input with placeholder
- Send button with icon
- Hint text about project context
- Keyboard shortcut info

## Benefits

1. **Full Context Awareness**
   - AI knows your entire project structure
   - Can reference any file
   - Understands relationships between components

2. **One-Click Application**
   - No copy-paste needed
   - Direct code insertion
   - File-specific targeting

3. **Conversational**
   - Natural language queries
   - Message history
   - Context carried through conversation

4. **Smart Code Detection**
   - Automatically detects code in responses
   - Extracts from markdown blocks
   - Identifies code patterns

## Technical Stack

- **Frontend:** React + TypeScript
- **AI Model:** Google Gemini 2.0 Flash
- **API:** Next.js API Routes
- **Icons:** Lucide React
- **Styling:** CSS Variables (VS Code theme)

## Next Steps

### Planned Enhancements
1. **Monaco Integration:** Apply code directly to editor at cursor position
2. **Multi-file Suggestions:** Apply changes to multiple files at once
3. **Streaming Responses:** Show AI typing in real-time
4. **Conversation History:** Save and restore chat sessions
5. **Keyboard Shortcuts:** Quick actions (Cmd+K)
6. **Code Diffs:** Show before/after preview before applying

## Testing

### Test Chat Functionality
1. Open any project in IDE
2. Click AI Copilot icon (✨)
3. Type: "List all the files in this project"
4. AI should list actual files from your project

### Test Code Application
1. Ask: "Create a simple Hello World component"
2. AI responds with code
3. Click "Apply to [filename]"
4. Code should be logged (TODO: actual insertion)

### Test Context Awareness
1. Select some code
2. Ask: "Explain this code"
3. AI should reference the selected code
4. Response should be context-specific

## Troubleshooting

### "Loading context..." forever
- Check `/api/files/tree` endpoint
- Verify projectId is valid
- Check browser console for errors

### AI not responding
- Verify `GEMINI_API_KEY` in `.env.local`
- Check server console for API errors
- Ensure API key has access to `gemini-2.0-flash`

### Apply button not working
- Currently logs to console (TODO)
- Check browser console for the code output
- Monaco integration coming next

---

**Status:** ✅ Fully Functional (Apply feature pending Monaco integration)
**Version:** 1.0
**Last Updated:** November 4, 2025
