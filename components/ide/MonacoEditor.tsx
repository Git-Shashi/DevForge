'use client';

import { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateFileContent } from '@/store/slices/fileSystemSlice';
import { writeFile } from '@/store/thunks/fileSystemThunks';
import { 
  Save, 
  Search, 
  Copy, 
  Code2, 
  Maximize2, 
  Minimize2, 
  Settings,
  FileCode,
  Wrench,
  RefreshCw
} from 'lucide-react';

interface MonacoEditorProps {
  projectId: string;
}

export default function MonacoEditor({ projectId }: MonacoEditorProps) {
  const dispatch = useAppDispatch();
  const { openFiles, activeFileId } = useAppSelector((state) => state.fileSystem);
  const editorRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const monacoRef = useRef<any>(null);
  const [isMonacoLoaded, setIsMonacoLoaded] = useState(false);
  const [editorContent, setEditorContent] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const isSwitchingFiles = useRef(false);
  const [editorSettings, setEditorSettings] = useState({
    fontSize: 14,
    minimap: true,
    wordWrap: 'on' as 'on' | 'off',
    lineNumbers: 'on' as 'on' | 'off',
    theme: 'vs-dark' as 'vs-dark' | 'vs-light' | 'hc-black',
  });

  const activeFile = openFiles.find((f) => f.id === activeFileId);

  // Update local content when active file changes
  useEffect(() => {
    if (activeFile) {
      setEditorContent(activeFile.content);
    }
  }, [activeFile?.id, activeFile?.content, activeFile]);

  useEffect(() => {
    let isMounted = true;
    let initTimeout: NodeJS.Timeout;

    const initMonaco = async () => {
      if (typeof window === 'undefined' || !containerRef.current || editorRef.current) {
        return;
      }

      // Add a small delay to ensure container is ready
      initTimeout = setTimeout(async () => {
        try {
          // Dynamically import monaco-editor
          const monaco = await import('monaco-editor');
          monacoRef.current = monaco;

          if (!isMounted || !containerRef.current) return;

          // Create editor instance
          editorRef.current = monaco.editor.create(containerRef.current, {
            value: activeFile?.content || '',
            language: activeFile?.language || 'plaintext',
            theme: editorSettings.theme,
            automaticLayout: true,
            minimap: { enabled: editorSettings.minimap },
            fontSize: editorSettings.fontSize,
            tabSize: 2,
            wordWrap: editorSettings.wordWrap,
            lineNumbers: editorSettings.lineNumbers,
            // Advanced features
            folding: true,
            foldingStrategy: 'indentation',
            showFoldingControls: 'always',
            matchBrackets: 'always',
            autoClosingBrackets: 'always',
            autoClosingQuotes: 'always',
            autoIndent: 'full',
            formatOnPaste: true,
            formatOnType: true,
            suggestOnTriggerCharacters: true,
            quickSuggestions: true,
            wordBasedSuggestions: 'matchingDocuments',
            parameterHints: { enabled: true },
            hover: { enabled: true },
            links: true,
            colorDecorators: true,
            lightbulb: { enabled: 'on' },
            codeLens: true,
            // Scrollbar
            scrollbar: {
              vertical: 'visible',
              horizontal: 'visible',
              useShadows: false,
              verticalScrollbarSize: 10,
              horizontalScrollbarSize: 10,
            },
            // Find widget
            find: {
              addExtraSpaceOnTop: false,
              autoFindInSelection: 'never',
              seedSearchStringFromSelection: 'always',
            },
            // Smooth scrolling
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            // Bracket pair colorization
            'bracketPairColorization.enabled': true,
            guides: {
              bracketPairs: true,
              indentation: true,
            },
          });

          // Handle content changes
          editorRef.current.onDidChangeModelContent(() => {
            // Don't update Redux store if we're switching files
            if (isSwitchingFiles.current) return;
            
            if (!activeFileId) return;
            const content = editorRef.current?.getValue() || '';
            const activeFile = openFiles.find((f: any) => f.id === activeFileId);

            if (activeFile) {
              dispatch(
                updateFileContent({
                  path: activeFile.path,
                  content,
                })
              );
            }
          });

          // Add keyboard shortcuts
          editorRef.current.addCommand(
            monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
            () => {
              // Save file (Cmd/Ctrl+S)
              handleManualSave();
            }
          );

          editorRef.current.addCommand(
            monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyF,
            () => {
              // Find (Cmd/Ctrl+F) - already built-in, just ensuring
              editorRef.current.trigger('keyboard', 'actions.find', {});
            }
          );

          editorRef.current.addCommand(
            monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF,
            () => {
              // Format document (Cmd/Ctrl+Shift+F)
              editorRef.current.trigger('keyboard', 'editor.action.formatDocument', {});
            }
          );

          editorRef.current.addCommand(
            monaco.KeyMod.Alt | monaco.KeyMod.Shift | monaco.KeyCode.KeyF,
            () => {
              // Format selection
              editorRef.current.trigger('keyboard', 'editor.action.formatSelection', {});
            }
          );

          setIsMonacoLoaded(true);
        } catch (error) {
          console.error('Failed to load Monaco Editor:', error);
          setIsMonacoLoaded(false);
        }
      }, 100);
    };

    initMonaco();

    return () => {
      isMounted = false;
      clearTimeout(initTimeout);
      editorRef.current?.dispose();
      editorRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update editor settings when they change
  useEffect(() => {
    if (!editorRef.current) return;

    editorRef.current.updateOptions({
      fontSize: editorSettings.fontSize,
      minimap: { enabled: editorSettings.minimap },
      wordWrap: editorSettings.wordWrap,
      lineNumbers: editorSettings.lineNumbers,
    });

    if (monacoRef.current) {
      monacoRef.current.editor.setTheme(editorSettings.theme);
    }
  }, [editorSettings]);

  useEffect(() => {
    if (!editorRef.current || !activeFile || !monacoRef.current) return;

    // Set flag to prevent content updates during file switch
    isSwitchingFiles.current = true;

    // Update editor when active file changes
    const currentModel = editorRef.current.getModel();
    const newValue = activeFile.content;
    
    // Always update the value when switching files
    editorRef.current.setValue(newValue);
    
    // Update language
    monacoRef.current.editor.setModelLanguage(
      currentModel!,
      activeFile.language || 'plaintext'
    );
    
    // Set cursor to the beginning and focus
    editorRef.current.setPosition({ lineNumber: 1, column: 1 });
    editorRef.current.focus();
    
    // Reveal the first line
    editorRef.current.revealLineInCenter(1);

    // Re-enable content updates after a short delay
    setTimeout(() => {
      isSwitchingFiles.current = false;
    }, 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFileId]);

  // Auto-save handler
  useEffect(() => {
    if (!activeFile || !activeFile.isDirty) return;

    const timeoutId = setTimeout(() => {
      dispatch(
        writeFile({
          projectId,
          path: activeFile.path,
          content: activeFile.content,
        })
      );
    }, 2000);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFile?.content, activeFile?.isDirty, activeFile?.path, projectId, dispatch]);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value;
    setEditorContent(content);
    
    if (activeFile) {
      dispatch(
        updateFileContent({
          path: activeFile.path,
          content,
        })
      );
    }
  };

  const handleManualSave = () => {
    if (!activeFile) return;
    dispatch(
      writeFile({
        projectId,
        path: activeFile.path,
        content: activeFile.content,
      })
    );
  };

  const handleReloadFile = async () => {
    if (!activeFile || !editorRef.current) return;
    
    try {
      // Fetch fresh content from the server
      const response = await fetch(`/api/files/read?projectId=${projectId}&path=${encodeURIComponent(activeFile.path)}`);
      
      if (response.ok) {
        const data = await response.json();
        const freshContent = data.content || '';
        
        // Prevent the onChange handler from firing during reload
        isSwitchingFiles.current = true;
        
        // Update editor content
        editorRef.current.setValue(freshContent);
        
        // Update Redux store with fresh content
        dispatch(
          updateFileContent({
            path: activeFile.path,
            content: freshContent,
          })
        );
        
        // Re-enable change tracking
        setTimeout(() => {
          isSwitchingFiles.current = false;
        }, 100);
        
        console.log('✅ File reloaded from container:', activeFile.path);
      } else {
        console.error('Failed to reload file:', response.status);
      }
    } catch (error) {
      console.error('Error reloading file:', error);
    }
  };

  const handleFormatDocument = () => {
    if (!editorRef.current) return;
    editorRef.current.trigger('keyboard', 'editor.action.formatDocument', {});
  };

  const handleFind = () => {
    if (!editorRef.current) return;
    editorRef.current.trigger('keyboard', 'actions.find', {});
  };

  const handleCopyContent = async () => {
    if (!editorRef.current) return;
    const selection = editorRef.current.getSelection();
    const selectedText = editorRef.current.getModel().getValueInRange(selection);
    const textToCopy = selectedText || editorRef.current.getValue();
    
    try {
      await navigator.clipboard.writeText(textToCopy);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (!activeFile) {
    return (
      <div
        className="flex items-center justify-center h-full"
        style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-muted)' }}
      >
        <div className="text-center">
          <FileCode className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--text-tertiary)' }} />
          <p className="text-lg mb-2">No file selected</p>
          <p className="text-sm">Open a file from the explorer to start editing</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`flex flex-col ${isFullscreen ? 'fixed inset-0 z-50' : 'h-full'}`}
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {/* Enhanced Toolbar */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-primary)',
        }}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {activeFile.name}
            </span>
            {activeFile.isDirty && (
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: 'var(--accent-blue)' }}
                title="Unsaved changes"
              />
            )}
          </div>
          
          <div className="h-4 w-px" style={{ backgroundColor: 'var(--border-primary)' }} />
          
          <div className="flex items-center gap-1">
            {/* Save Button */}
            <button
              onClick={handleManualSave}
              disabled={!activeFile.isDirty}
              className="p-1.5 rounded transition-colors disabled:opacity-40"
              style={{ color: 'var(--text-tertiary)' }}
              onMouseEnter={(e) => {
                if (activeFile.isDirty) {
                  e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--text-tertiary)';
              }}
              title="Save (Cmd/Ctrl+S)"
            >
              <Save className="w-4 h-4" />
            </button>

            {/* Reload Button */}
            <button
              onClick={handleReloadFile}
              className="p-1.5 rounded transition-colors"
              style={{ color: 'var(--text-tertiary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--text-tertiary)';
              }}
              title="Reload file from container"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Find Button */}
            <button
              onClick={handleFind}
              className="p-1.5 rounded transition-colors"
              style={{ color: 'var(--text-tertiary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--text-tertiary)';
              }}
              title="Find (Cmd/Ctrl+F)"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Format Button */}
            <button
              onClick={handleFormatDocument}
              className="p-1.5 rounded transition-colors"
              style={{ color: 'var(--text-tertiary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--text-tertiary)';
              }}
              title="Format Document (Cmd/Ctrl+Shift+F)"
            >
              <Code2 className="w-4 h-4" />
            </button>

            {/* Copy Button */}
            <button
              onClick={handleCopyContent}
              className="p-1.5 rounded transition-colors"
              style={{ color: 'var(--text-tertiary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--text-tertiary)';
              }}
              title="Copy Selection/All"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Badge */}
          <span
            className="text-xs px-2 py-1 rounded"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-secondary)',
            }}
          >
            {isMonacoLoaded ? activeFile.language : 'Loading...'}
          </span>

          <div className="h-4 w-px" style={{ backgroundColor: 'var(--border-primary)' }} />

          {/* Settings Button */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1.5 rounded transition-colors ${showSettings ? 'ring-2 ring-blue-500' : ''}`}
            style={{
              color: showSettings ? 'var(--accent-blue)' : 'var(--text-tertiary)',
              backgroundColor: showSettings ? 'var(--bg-tertiary)' : 'transparent',
            }}
            onMouseEnter={(e) => {
              if (!showSettings) {
                e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }
            }}
            onMouseLeave={(e) => {
              if (!showSettings) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--text-tertiary)';
              }
            }}
            title="Editor Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded transition-colors"
            style={{ color: 'var(--text-tertiary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-tertiary)';
            }}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div
          className="border-b p-4"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border-primary)',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Wrench className="w-4 h-4" style={{ color: 'var(--accent-blue)' }} />
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Editor Settings
            </h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Font Size */}
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>
                Font Size
              </label>
              <input
                type="number"
                min="10"
                max="30"
                value={editorSettings.fontSize}
                onChange={(e) => setEditorSettings({ ...editorSettings, fontSize: parseInt(e.target.value) })}
                className="w-full px-2 py-1 rounded text-sm"
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border-secondary)',
                  borderWidth: '1px',
                }}
              />
            </div>

            {/* Theme */}
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>
                Editor Theme
              </label>
              <select
                value={editorSettings.theme}
                onChange={(e) => setEditorSettings({ ...editorSettings, theme: e.target.value as any })}
                className="w-full px-2 py-1 rounded text-sm"
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border-secondary)',
                  borderWidth: '1px',
                }}
              >
                <option value="vs-dark">Dark</option>
                <option value="vs-light">Light</option>
                <option value="hc-black">High Contrast</option>
              </select>
            </div>

            {/* Word Wrap */}
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>
                Word Wrap
              </label>
              <select
                value={editorSettings.wordWrap}
                onChange={(e) => setEditorSettings({ ...editorSettings, wordWrap: e.target.value as any })}
                className="w-full px-2 py-1 rounded text-sm"
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border-secondary)',
                  borderWidth: '1px',
                }}
              >
                <option value="on">On</option>
                <option value="off">Off</option>
              </select>
            </div>

            {/* Line Numbers */}
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>
                Line Numbers
              </label>
              <select
                value={editorSettings.lineNumbers}
                onChange={(e) => setEditorSettings({ ...editorSettings, lineNumbers: e.target.value as any })}
                className="w-full px-2 py-1 rounded text-sm"
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border-secondary)',
                  borderWidth: '1px',
                }}
              >
                <option value="on">On</option>
                <option value="off">Off</option>
              </select>
            </div>

            {/* Minimap */}
            <div className="col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editorSettings.minimap}
                  onChange={(e) => setEditorSettings({ ...editorSettings, minimap: e.target.checked })}
                  className="w-4 h-4 rounded"
                  style={{ accentColor: 'var(--accent-blue)' }}
                />
                <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                  Show Minimap
                </span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Editor Container */}
      <div className="flex-1 relative">
        <div ref={containerRef} className="absolute inset-0" style={{ display: isMonacoLoaded ? 'block' : 'none' }} />
        {!isMonacoLoaded && (
          <textarea
            value={editorContent}
            onChange={handleTextareaChange}
            className="absolute inset-0 p-4 font-mono text-sm focus:outline-none resize-none"
            style={{
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
            }}
            placeholder="Loading Monaco Editor..."
            spellCheck={false}
          />
        )}
      </div>

      {/* Status Bar */}
      <div
        className="flex items-center justify-between px-4 py-1 text-xs border-t"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-primary)',
          color: 'var(--text-tertiary)',
        }}
      >
        <div className="flex items-center gap-4">
          <span>UTF-8</span>
          <span>{activeFile.language?.toUpperCase()}</span>
          {activeFile.isDirty && <span style={{ color: 'var(--accent-yellow)' }}>● Modified</span>}
        </div>
        <div className="flex items-center gap-4">
          <span>Ln 1, Col 1</span>
          <span>Spaces: 2</span>
        </div>
      </div>
    </div>
  );
}
