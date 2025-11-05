'use client';

// Import Monaco setup FIRST before any other imports
import '@/app/monaco-setup';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loadProject } from '@/store/thunks/projectThunks';
import { loadFileTree } from '@/store/thunks/fileSystemThunks';
import { togglePreview, toggleCopilot, toggleSidebar, toggleTerminal } from '@/store/slices/uiSlice';
import { 
  Eye, 
  Sparkles, 
  Sidebar as SidebarIcon, 
  LayoutDashboard,
  Terminal as TerminalIcon,
  PanelLeftClose,
  PanelLeftOpen,
  PanelBottomClose,
  PanelBottomOpen,
  X
} from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamically import heavy components
const MonacoEditor = dynamic(() => import('@/components/ide/MonacoEditor'), { ssr: false });
const FileExplorer = dynamic(() => import('@/components/ide/FileExplorer'), { ssr: false });
const Terminal = dynamic(() => import('@/components/ide/Terminal'), { ssr: false });
const Preview = dynamic(() => import('@/components/ide/Preview'), { ssr: false });
const AICopilot = dynamic(() => import('@/components/ide/AICopilot'), { ssr: false });
const ThemeSwitcher = dynamic(() => import('@/components/theme/ThemeSwitcher'), { ssr: false });

export default function IDEPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const dispatch = useAppDispatch();
  
  const projectId = params.projectId as string;
  const { activeProject, loading } = useAppSelector((state) => state.projects);
  const { sidebarOpen, terminalOpen, previewOpen, copilotOpen } = useAppSelector((state) => state.ui);
  
  const [activeTab, setActiveTab] = useState<'preview' | 'copilot'>('preview');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user && projectId) {
      dispatch(loadProject(projectId));
      dispatch(loadFileTree(projectId));
    }
  }, [session, projectId, dispatch]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="text-xl" style={{ color: 'var(--text-primary)' }}>Loading IDE...</div>
      </div>
    );
  }

  if (!activeProject) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="text-xl" style={{ color: 'var(--text-primary)' }}>Project not found</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Top Navbar */}
      <nav
        className="h-14 border-b flex items-center px-4"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-primary)',
        }}
      >
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors mr-4"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--text-primary)';
            e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-secondary)';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <LayoutDashboard className="w-4 h-4" />
          Dashboard
        </button>
        
        <div className="h-6 w-px mx-2" style={{ backgroundColor: 'var(--border-primary)' }} />

        {/* Toggle Sidebar */}
        <button
          onClick={() => dispatch(toggleSidebar())}
          className="p-1.5 rounded transition-colors"
          style={{ color: sidebarOpen ? 'var(--accent-blue)' : 'var(--text-tertiary)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          title="Toggle Sidebar"
        >
          {sidebarOpen ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>

        {/* Toggle Terminal */}
        <button
          onClick={() => dispatch(toggleTerminal())}
          className="p-1.5 rounded transition-colors"
          style={{ color: terminalOpen ? 'var(--accent-blue)' : 'var(--text-tertiary)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          title="Toggle Terminal"
        >
          {terminalOpen ? <PanelBottomOpen className="w-4 h-4" /> : <PanelBottomClose className="w-4 h-4" />}
        </button>
        
        <div className="h-6 w-px mx-2" style={{ backgroundColor: 'var(--border-primary)' }} />
        
        <h1 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
          {activeProject.projectName}
        </h1>
        
        <div className="ml-auto flex items-center gap-3">
          {/* Docker Status */}
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                activeProject.docker.status === 'running' ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
              {activeProject.docker.status}
            </span>
          </div>

          <div className="h-6 w-px" style={{ backgroundColor: 'var(--border-primary)' }} />

          {/* Preview Toggle */}
          <button
            onClick={() => dispatch(togglePreview())}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
              previewOpen ? 'ring-2 ring-blue-500' : ''
            }`}
            style={{
              backgroundColor: previewOpen ? 'var(--bg-tertiary)' : 'transparent',
              color: previewOpen ? 'var(--accent-blue)' : 'var(--text-secondary)',
            }}
            onMouseEnter={(e) => {
              if (!previewOpen) {
                e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }
            }}
            onMouseLeave={(e) => {
              if (!previewOpen) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }
            }}
            title="Toggle Preview"
          >
            <Eye className="w-4 h-4" />
            <span className="text-sm font-medium">Preview</span>
          </button>

          {/* Copilot Toggle */}
          <button
            onClick={() => dispatch(toggleCopilot())}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
              copilotOpen ? 'ring-2 ring-blue-500' : ''
            }`}
            style={{
              backgroundColor: copilotOpen ? 'var(--bg-tertiary)' : 'transparent',
              color: copilotOpen ? 'var(--accent-blue)' : 'var(--text-secondary)',
            }}
            onMouseEnter={(e) => {
              if (!copilotOpen) {
                e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }
            }}
            onMouseLeave={(e) => {
              if (!copilotOpen) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }
            }}
            title="Toggle AI Copilot"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Copilot</span>
          </button>

          <div className="h-6 w-px" style={{ backgroundColor: 'var(--border-primary)' }} />

          {/* Theme Switcher */}
          <ThemeSwitcher />
        </div>
      </nav>

      {/* Main IDE Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - File Explorer */}
        {sidebarOpen && (
          <div
            className="w-64 border-r overflow-auto"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-primary)',
            }}
          >
            <FileExplorer projectId={projectId} />
          </div>
        )}

        {/* Editor Area */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden">
            <MonacoEditor projectId={projectId} />
            
            {/* Bottom Panel - Terminal */}
            {terminalOpen && (
              <div
                className="h-80 border-t flex flex-col"
                style={{ borderColor: 'var(--border-primary)' }}
              >
                <Terminal projectId={projectId} />
              </div>
            )}
          </div>

          {/* Right Panel - Preview or Copilot */}
          {(previewOpen || copilotOpen) && (
            <div
              className="w-[500px] border-l flex flex-col"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-primary)',
              }}
            >
              {/* Header with Close Buttons */}
              <div
                className="flex items-center justify-between px-4 py-2 border-b"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border-primary)',
                }}
              >
                {/* Tabs if both are open */}
                {previewOpen && copilotOpen ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setActiveTab('preview')}
                      className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                        activeTab === 'preview' ? 'ring-2 ring-blue-500' : ''
                      }`}
                      style={{
                        color: activeTab === 'preview' ? 'var(--text-primary)' : 'var(--text-tertiary)',
                        backgroundColor: activeTab === 'preview' ? 'var(--bg-tertiary)' : 'transparent',
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        Preview
                      </div>
                    </button>
                    <button
                      onClick={() => setActiveTab('copilot')}
                      className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                        activeTab === 'copilot' ? 'ring-2 ring-blue-500' : ''
                      }`}
                      style={{
                        color: activeTab === 'copilot' ? 'var(--text-primary)' : 'var(--text-tertiary)',
                        backgroundColor: activeTab === 'copilot' ? 'var(--bg-tertiary)' : 'transparent',
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        Copilot
                      </div>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {previewOpen && (
                      <>
                        <Eye className="w-4 h-4" style={{ color: 'var(--accent-blue)' }} />
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          Preview
                        </span>
                      </>
                    )}
                    {copilotOpen && (
                      <>
                        <Sparkles className="w-4 h-4" style={{ color: 'var(--accent-blue)' }} />
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          AI Copilot
                        </span>
                      </>
                    )}
                  </div>
                )}

                {/* Close Buttons */}
                <div className="flex items-center gap-1">
                  {previewOpen && copilotOpen && (
                    <>
                      {activeTab === 'preview' ? (
                        <button
                          onClick={() => dispatch(togglePreview())}
                          className="p-1 rounded transition-colors"
                          style={{ color: 'var(--text-tertiary)' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                            e.currentTarget.style.color = 'var(--text-primary)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = 'var(--text-tertiary)';
                          }}
                          title="Close Preview"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => dispatch(toggleCopilot())}
                          className="p-1 rounded transition-colors"
                          style={{ color: 'var(--text-tertiary)' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                            e.currentTarget.style.color = 'var(--text-primary)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = 'var(--text-tertiary)';
                          }}
                          title="Close Copilot"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  )}
                  {previewOpen && !copilotOpen && (
                    <button
                      onClick={() => dispatch(togglePreview())}
                      className="p-1 rounded transition-colors"
                      style={{ color: 'var(--text-tertiary)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'var(--text-tertiary)';
                      }}
                      title="Close Preview"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  {copilotOpen && !previewOpen && (
                    <button
                      onClick={() => dispatch(toggleCopilot())}
                      className="p-1 rounded transition-colors"
                      style={{ color: 'var(--text-tertiary)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'var(--text-tertiary)';
                      }}
                      title="Close Copilot"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              
              {/* Content */}
              <div className="flex-1 overflow-hidden">
                {previewOpen && copilotOpen ? (
                  <>
                    {activeTab === 'preview' && <Preview projectId={projectId} />}
                    {activeTab === 'copilot' && (
                      <AICopilot 
                        projectId={projectId}
                        currentFile="untitled"
                        fileContent=""
                        language="typescript"
                        selectedText=""
                        onApplySuggestion={(code: string, filePath: string) => {
                          console.log('Apply suggestion to:', filePath, code);
                          // TODO: Dispatch action to insert suggestion at cursor
                        }}
                      />
                    )}
                  </>
                ) : previewOpen ? (
                  <Preview projectId={projectId} />
                ) : (
                  <AICopilot 
                    projectId={projectId}
                    currentFile="untitled"
                    fileContent=""
                    language="typescript"
                    selectedText=""
                    onApplySuggestion={(code: string, filePath: string) => {
                      console.log('Apply suggestion to:', filePath, code);
                      // TODO: Dispatch action to insert suggestion at cursor
                    }}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
