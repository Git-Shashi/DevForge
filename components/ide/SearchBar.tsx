'use client';

import { useState, useCallback } from 'react';
import { Search, X, ChevronDown, ChevronUp } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string, options: SearchOptions) => void;
  onClose: () => void;
}

export interface SearchOptions {
  caseSensitive: boolean;
  wholeWord: boolean;
  useRegex: boolean;
}

export default function SearchBar({ onSearch, onClose }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [showReplace, setShowReplace] = useState(false);
  const [options, setOptions] = useState<SearchOptions>({
    caseSensitive: false,
    wholeWord: false,
    useRegex: false,
  });

  const handleSearch = useCallback(() => {
    if (query.trim()) {
      onSearch(query, options);
    }
  }, [query, options, onSearch]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      className="border-b p-3 shadow-lg"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border-primary)',
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1 flex items-center gap-2">
          <Search className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Find in files..."
            autoFocus
            className="flex-1 px-3 py-1.5 rounded text-sm focus:outline-none focus:ring-2 transition-all"
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
            onClick={() => setShowReplace(!showReplace)}
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
            title="Toggle Replace"
          >
            {showReplace ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          <button
            onClick={onClose}
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
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showReplace && (
        <div className="flex items-center gap-2 mb-2 ml-6">
          <input
            type="text"
            value={replaceText}
            onChange={(e) => setReplaceText(e.target.value)}
            placeholder="Replace with..."
            className="flex-1 px-3 py-1.5 rounded text-sm focus:outline-none focus:ring-2 transition-all"
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
            className="px-3 py-1.5 rounded text-sm transition-colors"
            style={{
              backgroundColor: 'var(--accent-blue)',
              color: '#ffffff',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--accent-blue-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--accent-blue)';
            }}
          >
            Replace
          </button>
          <button
            className="px-3 py-1.5 rounded text-sm transition-colors"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
            }}
          >
            Replace All
          </button>
        </div>
      )}

      <div className="flex items-center gap-3 ml-6">
        <label className="flex items-center gap-1.5 cursor-pointer text-sm">
          <input
            type="checkbox"
            checked={options.caseSensitive}
            onChange={(e) => setOptions({ ...options, caseSensitive: e.target.checked })}
            className="w-3.5 h-3.5 rounded"
            style={{ accentColor: 'var(--accent-blue)' }}
          />
          <span style={{ color: 'var(--text-secondary)' }}>Match Case</span>
        </label>
        
        <label className="flex items-center gap-1.5 cursor-pointer text-sm">
          <input
            type="checkbox"
            checked={options.wholeWord}
            onChange={(e) => setOptions({ ...options, wholeWord: e.target.checked })}
            className="w-3.5 h-3.5 rounded"
            style={{ accentColor: 'var(--accent-blue)' }}
          />
          <span style={{ color: 'var(--text-secondary)' }}>Whole Word</span>
        </label>
        
        <label className="flex items-center gap-1.5 cursor-pointer text-sm">
          <input
            type="checkbox"
            checked={options.useRegex}
            onChange={(e) => setOptions({ ...options, useRegex: e.target.checked })}
            className="w-3.5 h-3.5 rounded"
            style={{ accentColor: 'var(--accent-blue)' }}
          />
          <span style={{ color: 'var(--text-secondary)' }}>Use Regex</span>
        </label>
      </div>
    </div>
  );
}
