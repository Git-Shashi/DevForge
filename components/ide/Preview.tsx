'use client';

import { useState, useEffect, useCallback } from 'react';
import { ExternalLink, RefreshCw, Play, Loader2 } from 'lucide-react';

interface PreviewProps {
  projectId: string;
}

export default function Preview({ projectId }: PreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [iframeKey, setIframeKey] = useState(0);
  const [waitingForServer, setWaitingForServer] = useState(false);
  const [serverStatus, setServerStatus] = useState<'unknown' | 'running' | 'stopped'>('unknown');
  const [startingServer, setStartingServer] = useState(false);
  const [waitTime, setWaitTime] = useState(0);

  // Reset all state when projectId changes
  useEffect(() => {
    console.log('🔄 Project changed, resetting preview state for:', projectId);
    setPreviewUrl('');
    setLoading(true);
    setError('');
    setWaitingForServer(false);
    setServerStatus('unknown');
    setStartingServer(false);
    setWaitTime(0);
    setIframeKey((k) => k + 1); // Force iframe reload
  }, [projectId]);

  const checkServerStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/preview/${projectId}/status`);
      if (response.ok) {
        const data = await response.json();
        console.log('Server status:', data);
        setServerStatus(data.running ? 'running' : 'stopped');
        if (!data.running) {
          setError(`Dev server is not running. ${data.message || ''}`);
        }
      } else {
        console.error('Status check failed:', response.status);
      }
    } catch (err) {
      console.error('Failed to check server status:', err);
    }
  }, [projectId]);

  useEffect(() => {
    const fetchPreviewUrl = async () => {
      try {
        console.log('🔍 Fetching preview URL for project:', projectId);
        // Ask server for the effective preview URL (host:port)
        // This endpoint will also auto-start the dev server if it's not running
        const response = await fetch(`/api/preview/${projectId}`);
        if (response.ok) {
          const data = await response.json();
          console.log('📡 Preview data received for project', projectId, ':', data);
          const url = data?.url as string;
          if (url) {
            setPreviewUrl(url);
            console.log(`🌐 Preview URL for project ${projectId}: ${url}`);
            
            // OPTIMIZATION: Check if server is already running first
            // This makes opening existing projects with running servers instant!
            try {
              console.log('Quick probe to check if server is already running:', url);
              await fetch(url, { method: 'GET', mode: 'no-cors' });
              console.log('✅ Server is already running! Showing preview immediately.');
              setServerStatus('running');
              setWaitingForServer(false);
              setLoading(false);
              return; // Exit early - server is ready!
            } catch {
              console.log('Server not responding yet, will start/wait for it...');
            }
            
            setLoading(false);
            
            // Server not running, so it was auto-started or needs to start
            if (data.autoStarted) {
              console.log('Dev server was auto-started, waiting for it to be ready...');
            }
            setWaitingForServer(true);
            
            // Poll for server to become ready (faster 1-second intervals)
            const startedAt = Date.now();
            
            // Update wait time counter
            const waitTimer = setInterval(() => {
              setWaitTime(Math.round((Date.now() - startedAt) / 1000));
            }, 1000);
            
            const timer = setInterval(async () => {
              try {
                await fetch(url, { method: 'GET', mode: 'no-cors' });
                console.log('✅ Server is now responding!');
                clearInterval(timer);
                clearInterval(waitTimer);
                setWaitingForServer(false);
                setServerStatus('running');
                setError(''); // Clear any errors
                setWaitTime(0);
                setIframeKey((k) => k + 1); // refresh iframe to pick up now-running server
              } catch {
                const elapsed = Date.now() - startedAt;
                if (elapsed > 45000) {
                  console.log('⏱️ Timeout waiting for server after', elapsed, 'ms');
                  clearInterval(timer);
                  clearInterval(waitTimer);
                  setWaitingForServer(false);
                  setError('Server took too long to start. Try clicking "Start Server" below.');
                } else {
                  console.log('Still waiting for server...', Math.round(elapsed / 1000), 'seconds elapsed');
                }
              }
            }, 1000); // Poll every 1 second (faster than before)
            
            // Also check server status in parallel
            checkServerStatus();
          } else {
            setError('Frontend port not found');
            setLoading(false);
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('Failed to load preview:', response.status, errorData);
          setError(errorData.error || 'Failed to load project');
          setLoading(false);
        }
      } catch (err: any) {
        console.error('Preview fetch error:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchPreviewUrl();
  }, [projectId, checkServerStatus]);

  const handleStartServer = async () => {
    setStartingServer(true);
    try {
      const response = await fetch(`/api/preview/${projectId}/start`, {
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setServerStatus('running');
          setWaitingForServer(false);
          // Refresh iframe after starting server
          setTimeout(() => {
            setIframeKey((k) => k + 1);
          }, 2000);
        } else {
          setError(data.message || 'Failed to start dev server');
        }
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to start dev server');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start dev server');
    } finally {
      setStartingServer(false);
    }
  };

  const handleRefresh = () => {
    setIframeKey((prev) => prev + 1);
    checkServerStatus();
  };

  const handleOpenExternal = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div style={{ color: 'var(--text-tertiary)' }}>Loading preview...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="text-center max-w-md">
          <div className="mb-2" style={{ color: 'var(--accent-red)' }}>{error}</div>
          <div className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
            Make sure your dev server is running in the terminal:
            <code className="block mt-2 px-3 py-2 rounded" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              cd frontend && npm run dev
            </code>
          </div>
          {serverStatus === 'stopped' && !startingServer && (
            <button
              onClick={handleStartServer}
              className="px-4 py-2 rounded transition-all flex items-center gap-2 mx-auto"
              style={{
                backgroundColor: 'var(--accent-blue)',
                color: 'white',
              }}
            >
              <Play className="w-4 h-4" />
              Start Dev Server
            </button>
          )}
          {startingServer && (
            <div className="flex items-center gap-2 justify-center" style={{ color: 'var(--text-muted)' }}>
              <Loader2 className="w-4 h-4 animate-spin" />
              Starting dev server...
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div
        className="flex items-center justify-between px-4 py-2 border-b"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-primary)',
        }}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm" style={{ color: 'var(--text-primary)' }}>Preview</span>
          <code
            className="text-xs px-2 py-1 rounded"
            style={{
              color: 'var(--text-muted)',
              backgroundColor: 'var(--bg-tertiary)',
            }}
          >
            {previewUrl}
          </code>
        </div>
        <div className="flex items-center gap-2">
          {serverStatus === 'stopped' && !startingServer && (
            <button
              onClick={handleStartServer}
              className="px-3 py-1.5 rounded transition-all flex items-center gap-1.5 text-sm"
              style={{
                backgroundColor: 'var(--accent-blue)',
                color: 'white',
              }}
              title="Start Dev Server"
            >
              <Play className="w-3.5 h-3.5" />
              Start Server
            </button>
          )}
          {startingServer && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 text-sm" style={{ color: 'var(--text-muted)' }}>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Starting...
            </div>
          )}
          {serverStatus === 'running' && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded text-xs" style={{ backgroundColor: 'var(--accent-green)', color: 'white' }}>
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              Running
            </div>
          )}
          <button
            onClick={handleRefresh}
            className="p-1.5 rounded transition-colors"
            style={{ color: 'var(--text-tertiary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-primary)';
              e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-tertiary)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleOpenExternal}
            className="p-1.5 rounded transition-colors"
            style={{ color: 'var(--text-tertiary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-primary)';
              e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-tertiary)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            title="Open in new tab"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="flex-1 relative">
        <iframe
          key={`${projectId}-${iframeKey}`}
          src={previewUrl ? `${previewUrl}?t=${Date.now()}` : ''}
          className="absolute inset-0 w-full h-full border-0 bg-white"
          title="Preview"
          sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
          onLoad={(e) => {
            console.log('Iframe loaded for project', projectId, ':', previewUrl);
            // Check if iframe content is actually loaded
            try {
              const iframe = e.currentTarget;
              console.log('Iframe content window:', iframe.contentWindow?.location.href);
            } catch (err) {
              console.log('Cannot access iframe content (CORS):', err);
            }
          }}
          onError={(e) => {
            console.error('Iframe error for project', projectId, ':', e);
            setError('Failed to load preview. Check if dev server is running.');
          }}
        />
        {waitingForServer && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" style={{ color: 'white' }} />
              <div className="text-sm mb-2" style={{ color: 'white' }}>
                Starting dev server... {waitTime > 0 && `(${waitTime}s)`}
              </div>
              {waitTime < 10 ? (
                <div className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  Installing dependencies and starting Vite...
                </div>
              ) : waitTime < 30 ? (
                <div className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  Still installing packages, this may take a moment...
                </div>
              ) : (
                <div className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  Taking longer than expected. Check browser console (F12) for details.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
