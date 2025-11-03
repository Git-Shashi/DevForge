'use client';

import { useState } from 'react';
import { Send, Sparkles, Paperclip } from 'lucide-react';

interface CopilotChatProps {
  projectId: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function CopilotChat({ projectId }: CopilotChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your AI coding assistant. I can help you with code explanations, debugging, suggestions, and more. How can I assist you today?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'This is a placeholder response. In production, this would connect to an AI service to provide intelligent coding assistance.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setLoading(false);
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-primary)',
        }}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" style={{ color: 'var(--accent-blue)' }} />
          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            AI Copilot
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: 'var(--accent-green)' }}
          />
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Ready
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-3 ${
                message.role === 'user' ? 'rounded-br-none' : 'rounded-bl-none'
              }`}
              style={{
                backgroundColor:
                  message.role === 'user' ? 'var(--accent-blue)' : 'var(--bg-secondary)',
                color: message.role === 'user' ? '#ffffff' : 'var(--text-primary)',
              }}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <p
                className="text-xs mt-2 opacity-70"
                style={{
                  color: message.role === 'user' ? '#ffffff' : 'var(--text-tertiary)',
                }}
              >
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div
              className="max-w-[80%] rounded-lg rounded-bl-none px-4 py-3"
              style={{ backgroundColor: 'var(--bg-secondary)' }}
            >
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div
                    className="w-2 h-2 rounded-full animate-bounce"
                    style={{
                      backgroundColor: 'var(--text-tertiary)',
                      animationDelay: '0ms',
                    }}
                  />
                  <div
                    className="w-2 h-2 rounded-full animate-bounce"
                    style={{
                      backgroundColor: 'var(--text-tertiary)',
                      animationDelay: '150ms',
                    }}
                  />
                  <div
                    className="w-2 h-2 rounded-full animate-bounce"
                    style={{
                      backgroundColor: 'var(--text-tertiary)',
                      animationDelay: '300ms',
                    }}
                  />
                </div>
                <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  Thinking...
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div
        className="border-t p-4"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-primary)',
        }}
      >
        <div className="flex items-end gap-2">
          <div className="flex flex-col flex-1 gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about your code..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg resize-none focus:outline-none focus:ring-2 transition-all"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                borderColor: 'var(--border-secondary)',
                borderWidth: '1px',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--accent-blue)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border-secondary)';
              }}
            />
            <div className="flex items-center justify-between">
              <button
                title="Attach file for context"
                className="flex items-center gap-1.5 text-xs px-2 py-1 rounded transition-colors"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--accent-blue)';
                  e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--text-muted)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                onClick={() => {
                  // TODO: Implement file attachment dialog
                  alert('File attachment feature - Select files to provide context to AI');
                }}
              >
                <Paperclip className="w-3.5 h-3.5" />
                <span>Attach file</span>
              </button>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 self-end"
            style={{
              backgroundColor: 'var(--accent-blue)',
              color: '#ffffff',
              height: 'fit-content',
            }}
            onMouseEnter={(e) => {
              if (!loading && input.trim()) {
                e.currentTarget.style.backgroundColor = 'var(--accent-blue-hover)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--accent-blue)';
            }}
          >
            <Send className="w-4 h-4" />
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
