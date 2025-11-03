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
      
      // Update Vite config to accept connections from all hosts
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
  },
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
