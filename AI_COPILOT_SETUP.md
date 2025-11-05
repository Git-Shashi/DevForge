# AI Copilot Setup Guide

## ✨ Features

Your DevForge IDE now has an **AI-Powered Coding Assistant** using Google's Gemini API!

### What It Can Do:
- 🤖 **Code Completion** - Continue code from cursor position
- 📖 **Code Explanation** - Understand what code does
- 🔧 **Bug Fixing** - Find and fix issues automatically
- ♻️ **Refactoring** - Improve code quality and structure
- 💬 **Custom Requests** - Ask anything about your code
- 📝 **Comment Generation** - Add helpful documentation
- 🧪 **Test Generation** - Create unit tests

## 🚀 Setup Instructions

### Step 1: Get Your Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Get API Key"** or **"Create API Key"**
4. Copy the generated API key

### Step 2: Add API Key to Your Project

1. Open your project's `.env.local` file (create it if it doesn't exist)
2. Add this line:
   ```bash
   GEMINI_API_KEY=your-actual-api-key-here
   ```
3. Replace `your-actual-api-key-here` with your actual Gemini API key

### Step 3: Restart Your Dev Server

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

## 🎯 How to Use

### Open AI Copilot

1. Open any project in the IDE
2. Click the **"Copilot"** button in the top toolbar (✨ icon)
3. The AI Copilot panel will open on the right side

### Quick Actions

Click any quick action button for instant help:

- **Complete Code** - Automatically continue your code
- **Explain** - Get explanation of selected code
- **Fix Issues** - Debug and improve code
- **Refactor** - Optimize code structure

### Custom Requests

1. Type your question in the text area
2. Examples:
   - "Add error handling to this function"
   - "Convert this to async/await"
   - "Optimize this loop"
   - "Add TypeScript types"
   - "What does this code do?"
3. Press **Cmd/Ctrl+Enter** or click **"Generate Suggestion"**

### Apply Suggestions

1. AI generates a suggestion based on your request
2. Review the suggested code
3. Click **"Apply to Editor"** to insert it into your file
4. Or click **Copy** icon to copy to clipboard

## 💡 Best Practices

### Get Better Suggestions

1. **Select Code First** - Highlight the code you want help with
2. **Be Specific** - "Add input validation" is better than "fix this"
3. **Provide Context** - The AI sees your current file automatically
4. **Iterate** - Ask follow-up questions to refine suggestions

### Use Cases

#### 1. Code Completion
```typescript
// You write:
function calculateTotal(items) {
  
// Ask: "Complete this function"
// AI generates the rest!
```

#### 2. Bug Fixing
```typescript
// Select problematic code
// Click "Fix Issues"
// AI identifies and fixes bugs
```

#### 3. Refactoring
```typescript
// Select messy code
// Click "Refactor"
// AI suggests cleaner version
```

#### 4. Documentation
```typescript
// Select function
// Ask: "Add JSDoc comments"
// AI adds proper documentation
```

## 🔧 Troubleshooting

### "Gemini API key not configured"
- Make sure you added `GEMINI_API_KEY` to `.env.local`
- Restart your dev server after adding the key
- Check for typos in the key

### "Failed to generate suggestion"
- Check your internet connection
- Verify your API key is valid
- Check if you've exceeded API quota (Gemini has free tier limits)

### Slow Responses
- Gemini API may take 2-5 seconds to respond
- Complex requests take longer
- Check your network speed

### No Context Being Used
- Make sure you have a file open in the editor
- Select specific code for more targeted help
- Context includes: filename, language, content

## 🎨 Features Overview

### Context-Aware
The AI automatically knows:
- Current filename
- Programming language
- File content
- Selected code

### Smart Actions
Different actions use different prompts:
- **Complete**: Continues from cursor
- **Explain**: Educational descriptions
- **Fix**: Identifies problems
- **Refactor**: Suggests improvements

### Safe to Use
- Suggestions are reviewed before applying
- You can copy instead of applying
- Original code is never automatically changed
- You're always in control

## 🌟 Tips & Tricks

1. **Keyboard Shortcut**: Use Cmd/Ctrl+Enter to generate suggestions quickly
2. **Tab Switching**: Toggle between Preview and Copilot tabs
3. **Multi-line Selection**: Select multiple lines for context
4. **Iterative Improvements**: Ask follow-up questions to refine code
5. **Copy First**: Try copying and testing before applying directly

## 🚦 API Limits

Gemini API Free Tier:
- 60 requests per minute
- 1,500 requests per day
- 1 million tokens per day

For production use, consider upgrading to a paid plan.

## 📚 Example Prompts

### General
- "Explain what this code does in simple terms"
- "Are there any bugs in this code?"
- "How can I make this more efficient?"

### Specific
- "Add TypeScript types to this function"
- "Convert this callback to async/await"
- "Add error handling for network requests"
- "Refactor this to use modern ES6 syntax"

### Documentation
- "Add JSDoc comments"
- "Write README documentation for this code"
- "Explain the parameters and return value"

### Testing
- "Generate Jest tests for this function"
- "Add test cases for edge cases"
- "Create integration tests"

## 🎉 You're Ready!

Start coding with AI assistance! Open your IDE, click the Copilot button, and let AI help you write better code faster.

---

Need help? Check the browser console (F12) for detailed logs and error messages.
