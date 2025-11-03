import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth/authOptions';

export default async function Home() {
  const session = await getServerSession(authOptions);

  // If user is authenticated, redirect to dashboard
  if (session?.user) {
    redirect('/dashboard');
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-white mb-6">
            DevForge
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            A powerful web-based IDE with persistent Docker containers.
            Build, code, and deploy your projects in the cloud.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/auth/signup"
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Get Started
            </Link>
            <Link
              href="/auth/signin"
              className="px-8 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="text-blue-500 text-4xl mb-4">🐳</div>
            <h3 className="text-xl font-bold text-white mb-2">Persistent Containers</h3>
            <p className="text-gray-400">
              Always-on development environments that persist across sessions.
              No more waiting for containers to start.
            </p>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="text-blue-500 text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-bold text-white mb-2">Real-time Editing</h3>
            <p className="text-gray-400">
              Monaco Editor integration with live preview.
              Auto-save and instant feedback on your code.
            </p>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="text-blue-500 text-4xl mb-4">🚀</div>
            <h3 className="text-xl font-bold text-white mb-2">MERN Stack Ready</h3>
            <p className="text-gray-400">
              Built-in templates for full-stack development.
              React, Node.js, and MongoDB pre-configured.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
