'use client';

import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { readFile, loadFileTree } from '@/store/thunks/fileSystemThunks';
import { openFile } from '@/store/slices/fileSystemSlice';
import { Search, X } from 'lucide-react';
import type { FileNode } from '@/types';

interface FileExplorerProps {
  projectId: string;
}

export default function FileExplorer({ projectId }: FileExplorerProps) {
  const dispatch = useAppDispatch();
  const { fileTree, loading, error } = useAppSelector((state) => state.fileSystem);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['']));
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTree, setFilteredTree] = useState<FileNode[]>([]);

  // Initial load of file tree
  useEffect(() => {
    dispatch(loadFileTree(projectId));
  }, [projectId, dispatch]);

  // Auto-refresh file tree every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch(loadFileTree(projectId));
    }, 5000);

    return () => clearInterval(interval);
  }, [projectId, dispatch]);

  // Filter file tree based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredTree(fileTree);
      return;
    }

    const filterFiles = (nodes: FileNode[]): FileNode[] => {
      const results: FileNode[] = [];
      
      for (const node of nodes) {
        if (node.name.toLowerCase().includes(searchQuery.toLowerCase())) {
          results.push(node);
          // Auto-expand parent folders when searching
          if (node.type === 'folder') {
            expandedFolders.add(node.path);
          }
        } else if (node.type === 'folder' && node.children) {
          const filteredChildren = filterFiles(node.children);
          if (filteredChildren.length > 0) {
            results.push({
              ...node,
              children: filteredChildren,
            });
            expandedFolders.add(node.path);
          }
        }
      }
      
      return results;
    };

    const filtered = filterFiles(fileTree);
    setFilteredTree(filtered);
    setExpandedFolders(new Set(expandedFolders)); // Trigger re-render
  }, [searchQuery, fileTree, expandedFolders]);

  const handleRefresh = () => {
    dispatch(loadFileTree(projectId));
  };

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const handleFileClick = async (file: FileNode) => {
    if (file.type === 'folder') {
      toggleFolder(file.path);
      return;
    }

    try {
      const result = await dispatch(readFile({ projectId, path: file.path })).unwrap();
      
      dispatch(
        openFile({
          id: file.path,
          path: file.path,
          name: file.name,
          content: result.content,
          language: getLanguageFromExtension(file.name),
          isDirty: false,
        })
      );
    } catch (error) {
      console.error('Failed to read file:', error);
    }
  };

  const renderFileTree = (nodes: FileNode[], level = 0) => {
    return nodes.map((node) => {
      const isExpanded = expandedFolders.has(node.path);

      return (
        <div key={node.path}>
          <div
            className="flex items-center px-2 py-1 cursor-pointer text-sm transition-colors rounded"
            style={{ 
              paddingLeft: `${level * 12 + 8}px`,
              color: 'var(--text-primary)',
            }}
            onClick={() => handleFileClick(node)}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {node.type === 'folder' && (
              <span className="mr-1" style={{ color: 'var(--text-tertiary)' }}>
                {isExpanded ? '▼' : '▶'}
              </span>
            )}
            <span className="mr-2">{node.type === 'folder' ? '📁' : '📄'}</span>
            <span className="text-sm">{node.name}</span>
          </div>
          {node.type === 'folder' && isExpanded && node.children && (
            <div>{renderFileTree(node.children, level + 1)}</div>
          )}
        </div>
      );
    });
  };

  if (loading) {
    return (
      <div className="p-4" style={{ color: 'var(--text-tertiary)' }}>
        Loading files...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center" style={{ color: 'var(--accent-red)' }}>
        <div className="mb-2">Error loading files</div>
        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{error}</div>
        <button
          onClick={() => dispatch(loadFileTree(projectId))}
          className="mt-4 px-4 py-2 rounded transition-colors"
          style={{ backgroundColor: 'var(--accent-blue)', color: 'white' }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (fileTree.length === 0 && !loading) {
    return (
      <div className="p-4 text-center" style={{ color: 'var(--text-muted)' }}>
        <div className="mb-2">📁 No files found</div>
        <button
          onClick={() => dispatch(loadFileTree(projectId))}
          className="mt-2 px-3 py-1.5 text-sm rounded transition-colors"
          style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-primary)' }}
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto flex flex-col" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      {/* Header with Search */}
      <div
        className="border-b"
        style={{ borderColor: 'var(--border-primary)' }}
      >
        {/* Title and Refresh */}
        <div className="p-2 flex items-center justify-between">
          <h3
            className="text-xs font-semibold uppercase"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Explorer
          </h3>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="text-xs px-2 py-1 rounded transition-colors disabled:opacity-50"
            style={{ color: 'var(--text-tertiary)' }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.color = 'var(--text-primary)';
                e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-tertiary)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            title="Refresh file tree"
          >
            {loading ? '⟳' : '↻'}
          </button>
        </div>
        
        {/* Search Bar */}
        <div className="px-2 pb-2">
          <div className="relative">
            <Search 
              className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5" 
              style={{ color: 'var(--text-muted)' }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files..."
              className="w-full pl-8 pr-8 py-1.5 text-xs rounded transition-all focus:outline-none focus:ring-1"
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
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 transition-colors"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--text-muted)';
                }}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="text-xs mt-1 px-1" style={{ color: 'var(--text-muted)' }}>
              {filteredTree.length === 0 ? 'No files found' : `${countFiles(filteredTree)} file(s) found`}
            </p>
          )}
        </div>
      </div>
      
      {/* File Tree */}
      <div className="flex-1 overflow-auto py-2">
        {filteredTree.length === 0 && searchQuery ? (
          <div className="p-4 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
            No files match &ldquo;{searchQuery}&rdquo;
          </div>
        ) : (
          renderFileTree(filteredTree)
        )}
      </div>
    </div>
  );
}

function countFiles(nodes: FileNode[]): number {
  let count = 0;
  for (const node of nodes) {
    if (node.type === 'file') {
      count++;
    }
    if (node.children) {
      count += countFiles(node.children);
    }
  }
  return count;
}

function getLanguageFromExtension(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const languageMap: Record<string, string> = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    json: 'json',
    html: 'html',
    css: 'css',
    scss: 'scss',
    md: 'markdown',
    py: 'python',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
  };
  return languageMap[ext || ''] || 'plaintext';
}
