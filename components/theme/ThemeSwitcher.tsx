'use client';

import { useTheme, Theme } from '@/contexts/ThemeContext';
import { useState } from 'react';

// All 4 available themes - v2
const themes: { id: Theme; name: string; icon: string; preview: string }[] = [
  { id: 'dark', name: 'Dark', icon: '🌙', preview: 'bg-slate-900' },
  { id: 'light', name: 'Light', icon: '☀️', preview: 'bg-white' },
  { id: 'grey', name: 'Grey', icon: '⚫', preview: 'bg-zinc-800' },
  { id: 'dim', name: 'Dim', icon: '🌆', preview: 'bg-slate-800' },
];

export default function ThemeSwitcher() {
  const { theme, setTheme, mounted } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const currentTheme = themes.find((t) => t.id === theme) || themes[0];

  // Don't render until mounted to avoid hydration issues
  if (!mounted) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <span className="text-lg">🌙</span>
        <span className="text-sm font-medium hidden sm:inline" style={{ color: 'var(--text-primary)' }}>Loading...</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          color: 'var(--text-primary)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
        }}
      >
        <span className="text-lg">{currentTheme.icon}</span>
        <span className="text-sm font-medium hidden sm:inline">{currentTheme.name}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div
            className="absolute right-0 mt-2 w-64 rounded-lg shadow-xl z-50 overflow-hidden"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-primary)',
              borderWidth: '1px',
            }}
          >
            <div
              className="px-4 py-3 border-b"
              style={{
                borderColor: 'var(--border-primary)',
                color: 'var(--text-secondary)',
              }}
            >
              <p className="text-sm font-semibold">Choose Theme ({themes.length} available)</p>
            </div>

            <div className="p-2">
              {themes.map((themeOption) => (
                <button
                  key={themeOption.id}
                  onClick={() => {
                    setTheme(themeOption.id);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all"
                  style={{
                    backgroundColor:
                      theme === themeOption.id ? 'var(--bg-tertiary)' : 'transparent',
                    color: 'var(--text-primary)',
                  }}
                  onMouseEnter={(e) => {
                    if (theme !== themeOption.id) {
                      e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (theme !== themeOption.id) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    } else {
                      e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                    }
                  }}
                >
                  <span className="text-2xl">{themeOption.icon}</span>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium">{themeOption.name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {themeOption.id === 'dark' && 'Default dark theme'}
                      {themeOption.id === 'light' && 'Bright and clean'}
                      {themeOption.id === 'grey' && 'Neutral grey tones'}
                      {themeOption.id === 'dim' && 'Softer than dark'}
                    </p>
                  </div>
                  {theme === themeOption.id && (
                    <svg
                      className="w-5 h-5"
                      style={{ color: 'var(--accent-blue)' }}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              ))}
            </div>

            <div
              className="px-4 py-3 border-t"
              style={{
                borderColor: 'var(--border-primary)',
                backgroundColor: 'var(--bg-tertiary)',
              }}
            >
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Theme preference is saved locally
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
