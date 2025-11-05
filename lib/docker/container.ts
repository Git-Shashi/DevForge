import { getDockerClient, ensureNetwork } from './client';
import { acquirePort, releasePort } from '@/lib/redis/client';
import path from 'path';
import fs from 'fs/promises';
import type { DockerInfo } from '@/types';

interface CreateContainerOptions {
  userId: string;
  projectId: string;
  projectName: string;
  projectType: 'mern' | 'react' | 'node' | 'python';
}

export async function createPersistentContainer(
  options: CreateContainerOptions
): Promise<DockerInfo> {
  const { userId, projectId, projectName, projectType } = options;
  const docker = getDockerClient();

  // Ensure network exists
  await ensureNetwork();

  // Generate container name
  const containerName = `mern-${userId}-${projectId}`;

  // Acquire ports
  const frontendPort = await acquirePort('frontend');
  const backendPort = await acquirePort('backend');

  try {
    // Create project directory on host
    const projectPath = path.join(
      process.env.DOCKER_PROJECTS_PATH || '/docker-projects',
      userId,
      projectId
    );

    await fs.mkdir(projectPath, { recursive: true });

    // Initialize project structure based on type
    await initializeProjectStructure(projectPath, projectType, projectName);

    // Ensure Docker image exists (pull if not present)
    const imageName = process.env.DOCKER_BASE_IMAGE || 'node:18-alpine';
    await ensureDockerImage(docker, imageName);

    // Container configuration
    const containerConfig = {
      Image: imageName,
      name: containerName,
      Hostname: containerName,
      Env: [
        `USER_ID=${userId}`,
        `PROJECT_ID=${projectId}`,
        `PROJECT_NAME=${projectName}`,
        `FRONTEND_PORT=5173`,
        `BACKEND_PORT=3001`,
        `NODE_ENV=development`,
      ],
      ExposedPorts: {
        '5173/tcp': {},
        '3001/tcp': {},
      },
      HostConfig: {
        Binds: [`${projectPath}:/app`],
        PortBindings: {
          '5173/tcp': [{ HostPort: frontendPort.toString() }],
          '3001/tcp': [{ HostPort: backendPort.toString() }],
        },
        Memory: parseMemoryLimit(process.env.CONTAINER_MEMORY_LIMIT || '512m'),
        NanoCpus: parseCpuLimit(process.env.CONTAINER_CPU_LIMIT || '0.5'),
        RestartPolicy: {
          Name: 'unless-stopped',
        },
        NetworkMode: process.env.DOCKER_NETWORK_NAME || 'devforge-network',
      },
      WorkingDir: '/app',
      Cmd: ['sh', '-c', 'tail -f /dev/null'], // Keep container running
      Labels: {
        'app': 'devforge',
        'userId': userId,
        'projectId': projectId,
        'projectName': projectName,
        'projectType': projectType,
      },
    };

    // Create container
    const container = await docker.createContainer(containerConfig);
    await container.start();

    // Get container info
    const info = await container.inspect();

    // Install dependencies and start dev servers
    await setupProjectInContainer(container.id, projectType, projectName);

    const dockerInfo: DockerInfo = {
      containerId: container.id,
      containerName,
      imageId: info.Image,
      status: 'running',
      ports: {
        frontend: frontendPort,
        backend: backendPort,
      },
      resourceLimits: {
        memory: process.env.CONTAINER_MEMORY_LIMIT || '512m',
        cpus: process.env.CONTAINER_CPU_LIMIT || '0.5',
      },
      createdAt: new Date(),
      lastHealthCheck: new Date(),
    };

    return dockerInfo;
  } catch (error) {
    // Release ports if container creation fails
    await releasePort('frontend', frontendPort);
    await releasePort('backend', backendPort);
    throw error;
  }
}

async function initializeProjectStructure(
  projectPath: string,
  projectType: string,
  projectName: string
): Promise<void> {
  if (projectType === 'mern') {
    // Create MERN stack structure
    // Note: Frontend will be created by Vite CLI in the container
    const backendPath = path.join(projectPath, 'backend');

    // Create backend directory
    await fs.mkdir(backendPath, { recursive: true });

    // Create backend package.json
    const backendPackageJson = {
      name: `${projectName}-backend`,
      version: '0.1.0',
      private: true,
      type: 'module',
      scripts: {
        dev: 'nodemon --watch src src/index.ts',
        build: 'tsc',
        start: 'node dist/index.js',
      },
      dependencies: {
        express: '^4.18.2',
        cors: '^2.8.5',
        dotenv: '^16.3.1',
        mongoose: '^8.0.3',
      },
      devDependencies: {
        '@types/express': '^4.17.21',
        '@types/cors': '^2.8.17',
        '@types/node': '^20.10.5',
        nodemon: '^3.0.2',
        'ts-node': '^10.9.2',
        typescript: '^5.3.3',
      },
    };

    await fs.writeFile(
      path.join(backendPath, 'package.json'),
      JSON.stringify(backendPackageJson, null, 2)
    );

    // Create basic backend files
    await createBasicBackendFiles(backendPath, projectName);
  }
  // Add other project types as needed
}

async function createBasicBackendFiles(
  backendPath: string,
  projectName: string
): Promise<void> {
  // Backend files
  await fs.mkdir(path.join(backendPath, 'src'), { recursive: true });

  const indexTs = `import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '${projectName} backend is running' });
});

app.listen(PORT, () => {
  console.log(\`Server is running on port \${PORT}\`);
});`;

  await fs.writeFile(path.join(backendPath, 'src', 'index.ts'), indexTs);

  const tsconfig = {
    compilerOptions: {
      target: 'ES2020',
      module: 'ESNext',
      moduleResolution: 'node',
      esModuleInterop: true,
      strict: true,
      skipLibCheck: true,
      outDir: './dist',
      rootDir: './src',
    },
    include: ['src/**/*'],
  };

  await fs.writeFile(
    path.join(backendPath, 'tsconfig.json'),
    JSON.stringify(tsconfig, null, 2)
  );
}

async function setupProjectInContainer(
  containerId: string,
  projectType: string,
  projectName: string
): Promise<void> {
  const docker = getDockerClient();
  const container = docker.getContainer(containerId);

  if (projectType === 'mern') {
    try {
      console.log('Setting up MERN project in container...');
      
      // Create Vite React project directly in /app/frontend
      console.log('Creating Vite + React + TypeScript project in frontend...');
      await execCommand(container, [
        'sh',
        '-c',
        `cd /app && npm create vite@latest frontend -- --template react-ts`,
      ]);
      
      // Install frontend dependencies
      console.log('Installing frontend dependencies...');
      await execCommand(container, ['sh', '-c', `cd /app/frontend && npm install`]);
      
      // Create proper App.tsx and main.tsx files with functional features
      console.log('Creating functional starter frontend files...');
      const createStarterFiles = `
cat > /app/frontend/src/App.tsx << 'APPEOF'
import { useState, useEffect } from 'react';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'error'>('checking');

  useEffect(() => {
    // Check backend connection
    fetch('http://localhost:3001/api/health')
      .then(res => res.json())
      .then(() => setBackendStatus('connected'))
      .catch(() => setBackendStatus('error'));

    // Load todos from localStorage
    const savedTodos = localStorage.getItem('todos');
    if (savedTodos) {
      setTodos(JSON.parse(savedTodos));
    }
  }, []);

  useEffect(() => {
    // Save todos to localStorage whenever they change
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  const addTodo = () => {
    if (inputValue.trim()) {
      setTodos([...todos, { id: Date.now(), text: inputValue, completed: false }]);
      setInputValue('');
    }
  };

  const toggleTodo = (id: number) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id: number) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const completedCount = todos.filter(t => t.completed).length;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '1rem 1rem 0 0',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        }}>
          <h1 style={{ 
            fontSize: '2.5rem', 
            margin: '0 0 0.5rem 0',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            📝 DevForge Todo App
          </h1>
          <p style={{ color: '#666', margin: 0 }}>
            A functional React + TypeScript starter application
          </p>
        </div>

        {/* Backend Status */}
        <div style={{
          background: backendStatus === 'connected' ? '#d4edda' : backendStatus === 'error' ? '#f8d7da' : '#fff3cd',
          padding: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.875rem'
        }}>
          <span style={{ 
            width: '8px', 
            height: '8px', 
            borderRadius: '50%',
            background: backendStatus === 'connected' ? '#28a745' : backendStatus === 'error' ? '#dc3545' : '#ffc107',
            display: 'inline-block'
          }} />
          <span style={{ color: '#333' }}>
            Backend API: {backendStatus === 'connected' ? '✓ Connected' : backendStatus === 'error' ? '✗ Disconnected' : 'Checking...'}
          </span>
        </div>

        {/* Add Todo Input */}
        <div style={{
          background: 'white',
          padding: '1.5rem',
          display: 'flex',
          gap: '1rem'
        }}>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addTodo()}
            placeholder="What needs to be done?"
            style={{
              flex: 1,
              padding: '0.75rem',
              fontSize: '1rem',
              border: '2px solid #e0e0e0',
              borderRadius: '0.5rem',
              outline: 'none',
            }}
          />
          <button
            onClick={addTodo}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '1rem'
            }}
          >
            Add
          </button>
        </div>

        {/* Todo List */}
        <div style={{
          background: 'white',
          maxHeight: '400px',
          overflowY: 'auto'
        }}>
          {todos.length === 0 ? (
            <div style={{ 
              padding: '3rem', 
              textAlign: 'center', 
              color: '#999',
              fontSize: '1.1rem'
            }}>
              🎉 No todos yet! Add one above to get started.
            </div>
          ) : (
            todos.map(todo => (
              <div
                key={todo.id}
                style={{
                  padding: '1rem 1.5rem',
                  borderBottom: '1px solid #f0f0f0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f8f9fa'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
              >
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleTodo(todo.id)}
                  style={{
                    width: '20px',
                    height: '20px',
                    cursor: 'pointer'
                  }}
                />
                <span style={{
                  flex: 1,
                  textDecoration: todo.completed ? 'line-through' : 'none',
                  color: todo.completed ? '#999' : '#333',
                  fontSize: '1rem'
                }}>
                  {todo.text}
                </span>
                <button
                  onClick={() => deleteTodo(todo.id)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.25rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>

        {/* Stats Footer */}
        <div style={{
          background: 'white',
          padding: '1rem 1.5rem',
          borderRadius: '0 0 1rem 1rem',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.875rem',
          color: '#666'
        }}>
          <span>
            {todos.length} {todos.length === 1 ? 'task' : 'tasks'} total
          </span>
          <span>
            {completedCount} completed
          </span>
          {todos.length > 0 && (
            <button
              onClick={() => setTodos(todos.filter(t => !t.completed))}
              style={{
                padding: '0.5rem 1rem',
                background: '#f8f9fa',
                color: '#666',
                border: '1px solid #ddd',
                borderRadius: '0.25rem',
                cursor: 'pointer',
                fontSize: '0.75rem'
              }}
            >
              Clear Completed
            </button>
          )}
        </div>

        {/* Info Card */}
        <div style={{
          marginTop: '2rem',
          background: 'rgba(255, 255, 255, 0.95)',
          padding: '1.5rem',
          borderRadius: '1rem',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        }}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#333', fontSize: '1.1rem' }}>
            🚀 Features Included:
          </h3>
          <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#666', lineHeight: '1.8' }}>
            <li>✓ React Hooks (useState, useEffect)</li>
            <li>✓ TypeScript interfaces</li>
            <li>✓ LocalStorage persistence</li>
            <li>✓ Backend API integration</li>
            <li>✓ Responsive design</li>
            <li>✓ Hot Module Reload (HMR)</li>
          </ul>
          <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#999' }}>
            Edit <code style={{ background: '#f0f0f0', padding: '0.2rem 0.4rem', borderRadius: '0.25rem' }}>src/App.tsx</code> to customize!
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
APPEOF

cat > /app/frontend/src/main.tsx << 'MAINEOF'
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
MAINEOF

cat > /app/frontend/src/index.css << 'CSSEOF'
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#root {
  width: 100%;
  min-height: 100vh;
}
CSSEOF
`;
      await execCommand(container, ['sh', '-c', createStarterFiles]);
      
      // Update Vite config to accept connections from all hosts and allow iframe embedding
      console.log('Configuring Vite server...');
      const viteConfigUpdate = `
cat > /app/frontend/vite.config.ts << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Security-Policy': "frame-ancestors *"
    }
  }
})
EOF
`;
      await execCommand(container, ['sh', '-c', viteConfigUpdate]);
      
      // Install backend dependencies
      console.log('Installing backend dependencies...');
      await execCommand(container, ['sh', '-c', `cd /app/backend && npm install`]);
      
      // Start dev servers in background with proper logging
      console.log('Starting dev servers...');
      await execCommand(container, [
        'sh',
        '-c',
        `cd /app/frontend && nohup npm run dev > /app/frontend.log 2>&1 & echo $! > /app/frontend.pid`,
      ]);
      
      await execCommand(container, [
        'sh',
        '-c',
        `cd /app/backend && nohup npm run dev > /app/backend.log 2>&1 & echo $! > /app/backend.pid`,
      ]);
      
      console.log('Project setup completed successfully');
    } catch (error) {
      console.error('Error setting up project in container:', error);
      throw error;
    }
  } else if (projectType === 'react') {
    try {
      console.log('Setting up React project in container...');
      
      // Create Vite React project directly in /app/frontend
      console.log('Creating Vite + React + TypeScript project...');
      await execCommand(container, [
        'sh',
        '-c',
        `cd /app && npm create vite@latest frontend -- --template react-ts`,
      ]);
      
      // Install frontend dependencies
      console.log('Installing frontend dependencies...');
      await execCommand(container, ['sh', '-c', `cd /app/frontend && npm install`]);
      
      // Create proper App.tsx and main.tsx files with functional features
      console.log('Creating functional starter frontend files...');
      const createStarterFiles = `
cat > /app/frontend/src/App.tsx << 'APPEOF'
import { useState, useEffect } from 'react';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    // Load todos from localStorage
    const savedTodos = localStorage.getItem('todos');
    if (savedTodos) {
      setTodos(JSON.parse(savedTodos));
    }
  }, []);

  useEffect(() => {
    // Save todos to localStorage whenever they change
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  const addTodo = () => {
    if (inputValue.trim()) {
      setTodos([...todos, { id: Date.now(), text: inputValue, completed: false }]);
      setInputValue('');
    }
  };

  const toggleTodo = (id: number) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id: number) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const completedCount = todos.filter(t => t.completed).length;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '1rem 1rem 0 0',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        }}>
          <h1 style={{ 
            fontSize: '2.5rem', 
            margin: '0 0 0.5rem 0',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            📝 DevForge Todo App
          </h1>
          <p style={{ color: '#666', margin: 0 }}>
            A functional React + TypeScript starter application
          </p>
        </div>

        {/* Add Todo Input */}
        <div style={{
          background: 'white',
          padding: '1.5rem',
          display: 'flex',
          gap: '1rem'
        }}>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addTodo()}
            placeholder="What needs to be done?"
            style={{
              flex: 1,
              padding: '0.75rem',
              fontSize: '1rem',
              border: '2px solid #e0e0e0',
              borderRadius: '0.5rem',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#667eea'}
            onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
          />
          <button
            onClick={addTodo}
            style={{
              padding: '0.75rem 2rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'transform 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            Add
          </button>
        </div>

        {/* Stats */}
        <div style={{
          background: 'white',
          padding: '1rem 1.5rem',
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.875rem',
          color: '#666'
        }}>
          <span>Total: {todos.length}</span>
          <span>Completed: {completedCount}</span>
          <span>Pending: {todos.length - completedCount}</span>
        </div>

        {/* Todo List */}
        <div style={{
          background: 'white',
          borderRadius: '0 0 1rem 1rem',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          maxHeight: '400px',
          overflowY: 'auto'
        }}>
          {todos.length === 0 ? (
            <div style={{
              padding: '3rem',
              textAlign: 'center',
              color: '#999'
            }}>
              <p style={{ fontSize: '3rem', margin: '0 0 1rem 0' }}>📋</p>
              <p style={{ margin: 0 }}>No todos yet. Add one above to get started!</p>
            </div>
          ) : (
            todos.map(todo => (
              <div
                key={todo.id}
                style={{
                  padding: '1rem 1.5rem',
                  borderBottom: '1px solid #f0f0f0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleTodo(todo.id)}
                  style={{
                    width: '1.25rem',
                    height: '1.25rem',
                    cursor: 'pointer',
                    accentColor: '#667eea'
                  }}
                />
                <span style={{
                  flex: 1,
                  textDecoration: todo.completed ? 'line-through' : 'none',
                  color: todo.completed ? '#999' : '#333',
                  fontSize: '1rem'
                }}>
                  {todo.text}
                </span>
                <button
                  onClick={() => deleteTodo(todo.id)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    transition: 'opacity 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.opacity = '0.8'}
                  onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
APPEOF

cat > /app/frontend/src/index.css << 'CSSEOF'
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#root {
  width: 100%;
  min-height: 100vh;
}
CSSEOF
`;
      await execCommand(container, ['sh', '-c', createStarterFiles]);
      
      // Update Vite config to accept connections from all hosts and allow iframe embedding
      console.log('Configuring Vite server...');
      const viteConfigUpdate = `
cat > /app/frontend/vite.config.ts << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Security-Policy': "frame-ancestors *"
    }
  }
})
EOF
`;
      await execCommand(container, ['sh', '-c', viteConfigUpdate]);
      
      // Start dev server in background with proper logging
      console.log('Starting dev server...');
      await execCommand(container, [
        'sh',
        '-c',
        `cd /app/frontend && nohup npm run dev > /app/frontend.log 2>&1 & echo $! > /app/frontend.pid`,
      ]);
      
      console.log('React project setup completed successfully');
    } catch (error) {
      console.error('Error setting up React project in container:', error);
      throw error;
    }
  }
}

async function execCommand(container: any, command: string[]): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const exec = await container.exec({
        Cmd: command,
        AttachStdout: true,
        AttachStderr: true,
      });

      const stream = await exec.start({ Detach: false, Tty: false });
      
      // Collect output
      let output = '';
      stream.on('data', (chunk: Buffer) => {
        const text = chunk.toString('utf-8');
        output += text;
        console.log(text);
      });

      stream.on('end', async () => {
        // Check exit code
        const inspectData = await exec.inspect();
        if (inspectData.ExitCode === 0) {
          resolve();
        } else {
          reject(new Error(`Command failed with exit code ${inspectData.ExitCode}: ${output}`));
        }
      });

      stream.on('error', (err: Error) => {
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  });
}

function parseMemoryLimit(limit: string): number {
  const match = limit.match(/^(\d+)([kmg]?)$/i);
  if (!match) return 512 * 1024 * 1024; // Default 512MB

  const value = parseInt(match[1]);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case 'k':
      return value * 1024;
    case 'm':
      return value * 1024 * 1024;
    case 'g':
      return value * 1024 * 1024 * 1024;
    default:
      return value;
  }
}

function parseCpuLimit(limit: string): number {
  // Convert CPU limit (e.g., "0.5") to NanoCPUs (0.5 * 1e9)
  return parseFloat(limit) * 1e9;
}

// Helper function to ensure Docker image exists
async function ensureDockerImage(docker: any, imageName: string): Promise<void> {
  try {
    console.log(`Checking for Docker image: ${imageName}`);
    
    // Try to inspect the image
    const image = docker.getImage(imageName);
    await image.inspect();
    
    console.log(`Image ${imageName} already exists`);
  } catch (error: any) {
    // Image doesn't exist, pull it
    if (error.statusCode === 404) {
      console.log(`Image ${imageName} not found locally, pulling from Docker Hub...`);
      
      try {
        await new Promise<void>((resolve, reject) => {
          docker.pull(imageName, (err: any, stream: any) => {
            if (err) {
              reject(err);
              return;
            }

            // Follow the pull progress
            docker.modem.followProgress(
              stream,
              (err: any, output: any) => {
                if (err) {
                  reject(err);
                } else {
                  console.log(`Successfully pulled ${imageName}`);
                  resolve();
                }
              },
              (event: any) => {
                // Log progress
                if (event.status) {
                  console.log(`${event.status}${event.progress || ''}`);
                }
              }
            );
          });
        });
      } catch (pullError) {
        console.error(`Failed to pull image ${imageName}:`, pullError);
        throw new Error(`Failed to pull Docker image ${imageName}. Please ensure Docker is running and you have internet connectivity.`);
      }
    } else {
      throw error;
    }
  }
}

export async function destroyContainer(
  containerId: string,
  frontendPort: number,
  backendPort: number
): Promise<void> {
  const docker = getDockerClient();
  const container = docker.getContainer(containerId);

  try {
    // Stop container
    await container.stop({ t: 10 });
    
    // Remove container
    await container.remove({ force: true, v: true });
    
    // Release ports
    await releasePort('frontend', frontendPort);
    await releasePort('backend', backendPort);
  } catch (error) {
    console.error('Error destroying container:', error);
    throw error;
  }
}
