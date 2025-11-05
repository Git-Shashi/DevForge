'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2, Send, Sparkles, FileCode, FolderTree, Copy, Check } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  canApply?: boolean;
}

interface FileTreeItem {
  path: string;
  type: 'file' | 'folder';
}

interface AICopilotProps {
  projectId: string;
  currentFile: string;
  fileContent: string;
  language: string;
  selectedText?: string;
  onApplySuggestion: (code: string, filePath: string) => void;
}

// Component to format AI messages with code blocks
function FormattedMessage({ content }: { content: string }) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Split content by code blocks
  const parts = content.split(/(```[\w]*\n[\s\S]*?```)/g);

  return (
    <div className="space-y-2">
      {parts.map((part, index) => {
        // Check if this part is a code block
        const codeMatch = part.match(/```([\w]*)\n([\s\S]*?)```/);
        
        if (codeMatch) {
          const language = codeMatch[1] || 'text';
          const code = codeMatch[2].trim();
          
          return (
            <div key={index} className="my-2">
              <div className="flex items-center justify-between px-3 py-1 bg-[var(--vscode-textCodeBlock-background)] border-b border-[var(--vscode-panel-border)] rounded-t">
                <span className="text-xs text-[var(--vscode-descriptionForeground)] font-mono">
                  {language}
                </span>
                <button
                  onClick={() => copyToClipboard(code, index)}
                  className="text-xs px-2 py-1 hover:bg-[var(--vscode-list-hoverBackground)] rounded flex items-center gap-1"
                  title="Copy code"
                >
                  {copiedIndex === index ? (
                    <>
                      <Check className="w-3 h-3" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3 bg-[var(--vscode-textCodeBlock-background)] text-[var(--vscode-editor-foreground)] rounded-b overflow-x-auto">
                <code className="text-sm font-mono">{code}</code>
              </pre>
            </div>
          );
        }
        
        // Regular text
        if (part.trim()) {
          return (
            <div key={index} className="whitespace-pre-wrap break-words">
              {part}
            </div>
          );
        }
        
        return null;
      })}
    </div>
  );
}

export default function AICopilot({
  projectId,
  currentFile,
  fileContent,
  language,
  selectedText,
  onApplySuggestion,
}: AICopilotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [projectFiles, setProjectFiles] = useState<FileTreeItem[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load project file tree
  useEffect(() => {
    const loadProjectFiles = async () => {
      try {
        const response = await fetch(`/api/files/tree?projectId=${projectId}`);
        const data = await response.json();
        
        // Flatten the tree structure
        const flattenTree = (items: any[], prefix = ''): FileTreeItem[] => {
          let result: FileTreeItem[] = [];
          items.forEach(item => {
            const path = prefix ? `${prefix}/${item.name}` : item.name;
            result.push({
              path,
              type: item.type
            });
            if (item.children) {
              result = result.concat(flattenTree(item.children, path));
            }
          });
          return result;
        };

        const files = flattenTree(data.tree || []);
        setProjectFiles(files);
      } catch (error) {
        console.error('Failed to load project files:', error);
      } finally {
        setLoadingFiles(false);
      }
    };

    loadProjectFiles();
  }, [projectId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Build context with all project files
      const projectContext = projectFiles
        .filter(f => f.type === 'file')
        .map(f => f.path)
        .join('\n');

      const response = await fetch('/api/ai/copilot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          action: 'chat',
          prompt: input,
          fileName: currentFile,
          fileContent,
          language,
          selectedText,
          projectContext,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get AI response');
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.suggestion,
        timestamp: new Date(),
        canApply: data.suggestion.includes('```') || data.suggestion.includes('function') || data.suggestion.includes('const '),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Failed to get AI response'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const extractCode = (content: string): string => {
    // Extract code from markdown code blocks
    const codeBlockMatch = content.match(/```[\w]*\n([\s\S]*?)```/);
    if (codeBlockMatch) {
      return codeBlockMatch[1].trim();
    }
    return content;
  };

  return (
    <div className="h-full flex flex-col bg-[var(--vscode-editor-background)]">
      {/* Header */}
      <div className="p-4 border-b border-[var(--vscode-panel-border)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[var(--vscode-textLink-foreground)]" />
          <h2 className="text-lg font-semibold text-[var(--vscode-foreground)]">
            AI Copilot
          </h2>
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--vscode-descriptionForeground)]">
          <FolderTree className="w-4 h-4" />
          {loadingFiles ? (
            <span>Loading context...</span>
          ) : (
            <span>{projectFiles.length} files in context</span>
          )}
        </div>
      </div>

      {/* Context Info */}
      <div className="px-4 py-2 bg-[var(--vscode-editor-inactiveSelectionBackground)] border-b border-[var(--vscode-panel-border)] flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <FileCode className="w-3 h-3" />
          <span className="text-[var(--vscode-descriptionForeground)]">Current:</span>
          <span className="text-[var(--vscode-foreground)] font-mono">{currentFile}</span>
        </div>
        <span className="text-[var(--vscode-descriptionForeground)]">•</span>
        <span className="text-[var(--vscode-foreground)]">{language}</span>
        {selectedText && (
          <>
            <span className="text-[var(--vscode-descriptionForeground)]">•</span>
            <span className="text-[var(--vscode-foreground)]">{selectedText.split('\n').length} lines selected</span>
          </>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center text-center">
            <div className="space-y-2">
              <Sparkles className="w-12 h-12 mx-auto text-[var(--vscode-textLink-foreground)] opacity-50" />
              <p className="text-sm text-[var(--vscode-descriptionForeground)]">
                Ask me anything about your code!
              </p>
              <p className="text-xs text-[var(--vscode-descriptionForeground)]">
                I have access to all {projectFiles.length} files in your project
              </p>
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-[var(--vscode-button-background)] text-[var(--vscode-button-foreground)]'
                  : 'bg-[var(--vscode-editor-inactiveSelectionBackground)] text-[var(--vscode-foreground)]'
              }`}
            >
              <div className="text-sm">
                {message.role === 'assistant' ? (
                  <FormattedMessage content={message.content} />
                ) : (
                  <div className="whitespace-pre-wrap break-words">{message.content}</div>
                )}
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--vscode-panel-border)]">
                <span className="text-xs opacity-60">
                  {message.timestamp.toLocaleTimeString()}
                </span>
                {message.role === 'assistant' && message.canApply && (
                  <button
                    onClick={() => {
                      const code = extractCode(message.content);
                      onApplySuggestion(code, currentFile);
                    }}
                    className="text-xs px-2 py-1 bg-[var(--vscode-button-background)] text-[var(--vscode-button-foreground)] rounded hover:bg-[var(--vscode-button-hoverBackground)] flex items-center gap-1"
                  >
                    <FileCode className="w-3 h-3" />
                    Apply to {currentFile}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-[var(--vscode-editor-inactiveSelectionBackground)] rounded-lg p-3">
              <Loader2 className="w-5 h-5 animate-spin text-[var(--vscode-textLink-foreground)]" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-[var(--vscode-panel-border)]">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask AI anything about your code... (Cmd/Ctrl + Enter)"
            disabled={loading}
            className="flex-1 px-3 py-2 bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] rounded focus:outline-none focus:border-[var(--vscode-focusBorder)] disabled:opacity-50"
          />
          <button
            onClick={handleSendMessage}
            disabled={loading || !input.trim()}
            className="px-4 py-2 bg-[var(--vscode-button-background)] text-[var(--vscode-button-foreground)] rounded hover:bg-[var(--vscode-button-hoverBackground)] disabled:opacity-50 flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Send
          </button>
        </div>
        <p className="text-xs text-[var(--vscode-descriptionForeground)] mt-2">
          💡 AI has context of all project files and can help you write, explain, or modify code
        </p>
      </div>
    </div>
  );
}
