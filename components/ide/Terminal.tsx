'use client';

import { useEffect, useRef, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { Paperclip, FolderOpen } from 'lucide-react';

interface TerminalProps {
  projectId: string;
}

interface LogEntry {
  timestamp: Date;
  type: 'stdout' | 'stderr' | 'system' | 'command';
  message: string;
}

export default function Terminal({ projectId }: TerminalProps) {
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      timestamp: new Date(),
      type: 'system',
      message: 'Container terminal ready. Type commands below.',
    },
  ]);
  const [isConnected, setIsConnected] = useState(false);
  const [command, setCommand] = useState('');
  const [executing, setExecuting] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [currentDir, setCurrentDir] = useState('/app'); // Synced with server
  const logsEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch current directory from server session on mount
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch(`/api/docker/session/${projectId}`);
        if (response.ok) {
          const data = await response.json();
          setCurrentDir(data.currentDir || '/app');
        }
      } catch (error) {
        console.error('Failed to fetch session:', error);
      }
    };
    
    fetchSession();
  }, [projectId]);

  // Auto-scroll to bottom
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Fetch container logs periodically
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch(`/api/docker/logs/${projectId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.logs && data.logs.length > 0) {
            // Only add new logs, avoid duplicates
            const newLogs = data.logs.slice(-10).map((log: string) => ({
              timestamp: new Date(),
              type: 'stdout' as const,
              message: log,
            }));
            
            setLogs((prev) => {
              const combined = [...prev, ...newLogs];
              // Keep only last 200 entries
              return combined.slice(-200);
            });
          }
          setIsConnected(true);
        } else {
          setIsConnected(false);
        }
      } catch (error) {
        console.error('Failed to fetch logs:', error);
        setIsConnected(false);
      }
    };

    // Initial fetch
    fetchLogs();

    // Poll every 5 seconds
    const interval = setInterval(fetchLogs, 5000);

    return () => clearInterval(interval);
  }, [projectId]);

  const executeCommand = async () => {
    if (!command.trim() || executing) return;

    const cmd = command.trim();
    setExecuting(true);

    // Add command to logs
    setLogs((prev) => [
      ...prev,
      {
        timestamp: new Date(),
        type: 'command',
        message: `${currentDir} $ ${cmd}`,
      },
    ]);

    // Add to history
    setCommandHistory((prev) => [...prev, cmd]);
    setHistoryIndex(-1);
    setCommand('');

    // Check if this is a dev server command
    const isDevServer = cmd.includes('npm run dev') || 
                       cmd.includes('npm start') || 
                       cmd.includes('yarn dev');

    try {
      const response = await fetch(`/api/docker/exec/${projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          command: cmd,
          background: isDevServer 
        }),
      });

      const data = await response.json();
      
      console.log('📥 Server Response:', {
        command: cmd,
        currentDir: data.currentDir,
        output: data.output,
        exitCode: data.exitCode
      });

      if (response.ok) {
        // ALWAYS update current directory from server response
        if (data.currentDir) {
          console.log('📂 Updating currentDir:', currentDir, '→', data.currentDir);
          setCurrentDir(data.currentDir);
        }
        
        // Add output to logs (only if there's actual output AND it's not empty)
        if (data.output && data.output.trim() && data.output.trim().length > 0) {
          setLogs((prev) => [
            ...prev,
            {
              timestamp: new Date(),
              type: data.exitCode === 0 ? 'stdout' : 'stderr',
              message: data.output,
            },
          ]);
        }
        
        // Add helpful message for dev server commands
        if (isDevServer && data.exitCode === 0) {
          setLogs((prev) => [
            ...prev,
            {
              timestamp: new Date(),
              type: 'system',
              message: '✨ Dev server is starting... Switch to the Preview tab to see your app!',
            },
          ]);
        }

        // Show error code if command failed
        if (data.exitCode !== 0 && (!data.output || !data.output.trim())) {
          setLogs((prev) => [
            ...prev,
            {
              timestamp: new Date(),
              type: 'stderr',
              message: `Command exited with code ${data.exitCode}`,
            },
          ]);
        }
      } else {
        setLogs((prev) => [
          ...prev,
          {
            timestamp: new Date(),
            type: 'stderr',
            message: `Error: ${data.error || 'Failed to execute command'}`,
          },
        ]);
      }
    } catch (error: any) {
      setLogs((prev) => [
        ...prev,
        {
          timestamp: new Date(),
          type: 'stderr',
          message: `Error: ${error.message}`,
        },
      ]);
    } finally {
      setExecuting(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeCommand();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex =
          historyIndex === -1
            ? commandHistory.length - 1
            : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setCommand(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setCommand('');
        } else {
          setHistoryIndex(newIndex);
          setCommand(commandHistory[newIndex]);
        }
      }
    }
  };

  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'stdout':
        return 'text-output';
      case 'stderr':
        return 'text-error';
      case 'system':
        return 'text-system';
      case 'command':
        return 'text-command';
      default:
        return 'text-output';
    }
  };

  return (
    <div className="h-full flex flex-col terminal-container" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Custom styles for terminal */}
      <style jsx>{`
        .terminal-container .text-output {
          color: var(--text-primary);
        }
        .terminal-container .text-error {
          color: var(--accent-red);
        }
        .terminal-container .text-system {
          color: var(--accent-yellow);
          font-style: italic;
        }
        .terminal-container .text-command {
          color: var(--accent-green);
          font-weight: 500;
        }
        .terminal-scrollbar::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }
        .terminal-scrollbar::-webkit-scrollbar-track {
          background: var(--bg-secondary);
        }
        .terminal-scrollbar::-webkit-scrollbar-thumb {
          background: var(--border-secondary);
          border-radius: 5px;
        }
        .terminal-scrollbar::-webkit-scrollbar-thumb:hover {
          background: var(--text-muted);
        }
      `}</style>

      <div
        className="flex items-center justify-between px-4 py-2 border-b"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-primary)',
        }}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Terminal
            </span>
            <div className="flex items-center gap-1">
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
          
          <div
            className="flex items-center gap-1.5 text-xs px-2 py-1 rounded font-mono"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-secondary)',
            }}
          >
            <FolderOpen className="w-3.5 h-3.5" style={{ color: 'var(--accent-blue)' }} />
            {currentDir}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            title="Attach file to terminal"
            className="p-1.5 rounded transition-colors"
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
              alert('File attachment feature - Select a file to reference in terminal');
            }}
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <div
            className="w-px h-4"
            style={{ backgroundColor: 'var(--border-primary)' }}
          />
          <button
            onClick={() => setLogs([])}
            className="text-xs px-2 py-1 rounded transition-colors font-medium"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-primary)';
              e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-muted)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            Clear
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-3 font-mono text-sm terminal-scrollbar">
        {logs.map((log, index) => (
          <div key={index} className="flex gap-3 mb-1 leading-relaxed">
            <span
              className="text-xs shrink-0 select-none"
              style={{ color: 'var(--text-muted)', opacity: 0.5, minWidth: '70px' }}
            >
              {log.timestamp.toLocaleTimeString()}
            </span>
            {log.type === 'command' && (
              <span className="select-none" style={{ color: 'var(--accent-green)' }}>$</span>
            )}
            <span className={`${getLogColor(log.type)} whitespace-pre-wrap break-all flex-1`}>
              {log.message}
            </span>
          </div>
        ))}
        {executing && (
          <div className="flex gap-3 mb-1 items-center">
            <span
              className="text-xs"
              style={{ color: 'var(--text-muted)', opacity: 0.5, minWidth: '70px' }}
            >
              {new Date().toLocaleTimeString()}
            </span>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <div
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ backgroundColor: 'var(--accent-yellow)' }}
                />
                <div
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ backgroundColor: 'var(--accent-yellow)', animationDelay: '0.2s' }}
                />
                <div
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ backgroundColor: 'var(--accent-yellow)', animationDelay: '0.4s' }}
                />
              </div>
              <span style={{ color: 'var(--accent-yellow)' }}>Executing...</span>
            </div>
          </div>
        )}
        <div ref={logsEndRef} />
      </div>

      <div
        className="border-t px-3 py-2"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-primary)',
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="font-mono text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
            {currentDir}
          </span>
          <span className="font-mono text-sm font-bold" style={{ color: 'var(--accent-green)' }}>
            ❯
          </span>
          <input
            ref={inputRef}
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={executing}
            placeholder="Type a command..."
            className="flex-1 px-3 py-2 rounded font-mono text-sm focus:outline-none focus:ring-2 disabled:opacity-50 transition-all"
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
          <button
            onClick={executeCommand}
            disabled={!command.trim() || executing}
            className="px-4 py-2 rounded text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: 'var(--accent-green)',
              color: '#ffffff',
            }}
            onMouseEnter={(e) => {
              if (!executing && command.trim()) {
                e.currentTarget.style.opacity = '0.9';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Run
          </button>
        </div>
        <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
          <span>Press ↑/↓ for history • Ctrl+C to cancel • Ctrl+L to clear</span>
          <span>{commandHistory.length} commands in history</span>
        </div>
      </div>
    </div>
  );
}