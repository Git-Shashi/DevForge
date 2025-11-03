'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchProjects } from '@/store/thunks/projectThunks';
import ThemeSwitcher from '@/components/theme/ThemeSwitcher';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { list: projects, loading } = useAppSelector((state) => state.projects);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      dispatch(fetchProjects());
    }
  }, [session, dispatch]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="text-xl" style={{ color: 'var(--text-primary)' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
      <header style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-primary)' }}>
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>DevForge</h1>
          <div className="flex items-center gap-4">
            <span style={{ color: 'var(--text-secondary)' }}>Welcome, {session?.user?.name}</span>
            <ThemeSwitcher />
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="px-4 py-2 rounded-md transition-colors"
              style={{ 
                backgroundColor: 'var(--accent-red)', 
                color: 'var(--text-primary)' 
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>My Projects</h2>
          <button
            onClick={() => router.push('/new-project')}
            className="px-6 py-3 font-medium rounded-lg transition-colors"
            style={{ 
              backgroundColor: 'var(--accent-blue)', 
              color: 'var(--text-primary)' 
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--accent-blue-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--accent-blue)';
            }}
          >
            + New Project
          </button>
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div className="text-center py-12" style={{ color: 'var(--text-tertiary)' }}>Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-lg mb-4" style={{ color: 'var(--text-tertiary)' }}>No projects yet</div>
            <p className="mb-6" style={{ color: 'var(--text-muted)' }}>Create your first project to get started</p>
            <button
              onClick={() => router.push('/new-project')}
              className="px-6 py-3 font-medium rounded-lg transition-colors"
              style={{ 
                backgroundColor: 'var(--accent-blue)', 
                color: 'var(--text-primary)' 
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--accent-blue-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--accent-blue)';
              }}
            >
              Create Project
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project._id.toString()}
                className="rounded-lg p-6 transition-all cursor-pointer"
                style={{ 
                  backgroundColor: 'var(--bg-secondary)', 
                  border: '1px solid var(--border-primary)' 
                }}
                onClick={() => router.push(`/ide/${project._id.toString()}`)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent-blue)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-primary)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                  {project.projectName}
                </h3>
                <p className="mb-4 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  {project.projectType.toUpperCase()}
                </p>
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: project.docker.status === 'running' ? 'var(--accent-green)' : 'var(--accent-red)'
                    }}
                  />
                  <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                    {project.docker.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
