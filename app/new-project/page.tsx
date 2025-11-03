'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useAppDispatch } from '@/store/hooks';
import { createProject } from '@/store/thunks/projectThunks';
import ThemeSwitcher from '@/components/theme/ThemeSwitcher';

const templates = [
  {
    id: 'react',
    name: 'React',
    description: 'Build modern web applications with React and Vite',
    icon: '⚛️',
    color: 'from-cyan-500 to-blue-500',
    features: ['React 18', 'Vite', 'Hot Module Replacement', 'TypeScript Support'],
  },
  {
    id: 'mern',
    name: 'MERN Stack',
    description: 'Full-stack application with MongoDB, Express, React, and Node.js',
    icon: '🚀',
    color: 'from-green-500 to-emerald-500',
    features: ['MongoDB', 'Express.js', 'React', 'Node.js', 'Full-stack Setup'],
  },
  {
    id: 'cpp',
    name: 'C++',
    description: 'High-performance C++ development environment',
    icon: '⚙️',
    color: 'from-blue-600 to-indigo-600',
    features: ['GCC Compiler', 'C++17/20', 'CMake Support', 'Debugging Tools'],
  },
  {
    id: 'java',
    name: 'Java',
    description: 'Enterprise Java application development',
    icon: '☕',
    color: 'from-orange-500 to-red-500',
    features: ['JDK 17', 'Maven/Gradle', 'Spring Boot Ready', 'JUnit Testing'],
  },
];

export default function NewProjectPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const dispatch = useAppDispatch();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    setShowNameInput(true);
    setError(null);
  };

  const handleCreateProject = async () => {
    if (!projectName.trim() || !selectedTemplate) return;

    setCreating(true);
    setError(null);

    try {
      const result = await dispatch(
        createProject({
          projectName: projectName.trim(),
          projectType: selectedTemplate as 'mern' | 'react' | 'node',
        })
      ).unwrap();

      // Navigate to the IDE
      router.push(`/ide/${result._id}`);
    } catch (err: any) {
      console.error('Failed to create project:', err);
      setError(err?.message || 'Failed to create project. Please try again.');
      setCreating(false);
    }
  };

  const handleBack = () => {
    if (showNameInput) {
      setShowNameInput(false);
      setSelectedTemplate(null);
      setProjectName('');
      setError(null);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom right, var(--bg-primary), var(--bg-secondary), var(--bg-primary))' }}>
      {/* Header */}
      <header style={{ backgroundColor: 'var(--bg-secondary)', backdropFilter: 'blur(8px)', opacity: '0.95', borderBottom: '1px solid var(--border-primary)' }}>
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="transition-colors"
              style={{ color: 'var(--text-tertiary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-tertiary)';
              }}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </button>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {showNameInput ? 'Name Your Project' : 'Choose a Template'}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span style={{ color: 'var(--text-tertiary)' }}>Welcome, {session?.user?.name}</span>
            <ThemeSwitcher />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        {!showNameInput ? (
          <>
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                Start Your Next Project
              </h2>
              <p className="text-lg" style={{ color: 'var(--text-tertiary)' }}>
                Select a template to get started with your development environment
              </p>
            </div>

            {/* Template Cards Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
              {templates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => handleTemplateSelect(template.id)}
                  className="group relative rounded-xl overflow-hidden transition-all cursor-pointer"
                  style={{ 
                    backgroundColor: 'var(--bg-secondary)', 
                    border: '1px solid var(--border-primary)' 
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-secondary)';
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 20px 25px -5px var(--shadow)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-primary)';
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Gradient Background */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${template.color} opacity-0 group-hover:opacity-10 transition-opacity`}
                  />

                  <div className="relative p-6">
                    {/* Icon */}
                    <div className="text-6xl mb-4 transform group-hover:scale-110 transition-transform">
                      {template.icon}
                    </div>

                    {/* Title */}
                    <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                      {template.name}
                    </h3>

                    {/* Description */}
                    <p className="text-sm mb-4 min-h-[40px]" style={{ color: 'var(--text-tertiary)' }}>
                      {template.description}
                    </p>

                    {/* Features */}
                    <div className="space-y-2">
                      {template.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--accent-blue)' }} />
                          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{feature}</span>
                        </div>
                      ))}
                    </div>

                    {/* Hover Effect */}
                    <div className="mt-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="font-medium" style={{ color: 'var(--accent-blue)' }}>
                        Select Template →
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="max-w-2xl mx-auto">
            {/* Selected Template Preview */}
            <div className="rounded-lg p-6 mb-8" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
              <div className="flex items-center gap-4">
                <div className="text-5xl">
                  {templates.find((t) => t.id === selectedTemplate)?.icon}
                </div>
                <div>
                  <h3 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    {templates.find((t) => t.id === selectedTemplate)?.name}
                  </h3>
                  <p style={{ color: 'var(--text-tertiary)' }}>
                    {templates.find((t) => t.id === selectedTemplate)?.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Project Name Input */}
            <div className="rounded-lg p-8" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
              {error && (
                <div className="px-4 py-3 rounded mb-6" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--accent-red)', color: 'var(--accent-red)' }}>
                  {error}
                </div>
              )}

              <label className="block text-lg font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
                Project Name
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateProject()}
                placeholder="my-awesome-project"
                autoFocus
                className="w-full px-4 py-4 rounded-lg text-lg transition-all"
                style={{ 
                  backgroundColor: 'var(--bg-primary)', 
                  border: '1px solid var(--border-primary)', 
                  color: 'var(--text-primary)' 
                }}
                onFocus={(e) => {
                  e.currentTarget.style.outline = '2px solid var(--accent-blue)';
                  e.currentTarget.style.borderColor = 'transparent';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.outline = 'none';
                  e.currentTarget.style.borderColor = 'var(--border-primary)';
                }}
              />
              <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
                Use lowercase letters, numbers, and hyphens
              </p>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={handleBack}
                  disabled={creating}
                  className="flex-1 px-6 py-4 font-medium rounded-lg transition-colors disabled:opacity-50"
                  style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                  onMouseEnter={(e) => {
                    if (!creating) e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                  }}
                >
                  Back
                </button>
                <button
                  onClick={handleCreateProject}
                  disabled={creating || !projectName.trim()}
                  className="flex-1 px-6 py-4 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ backgroundColor: 'var(--accent-blue)', color: 'var(--text-primary)' }}
                  onMouseEnter={(e) => {
                    if (!creating && projectName.trim()) e.currentTarget.style.backgroundColor = 'var(--accent-blue-hover)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--accent-blue)';
                  }}
                >
                  {creating ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Creating...
                    </>
                  ) : (
                    'Create Project'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
