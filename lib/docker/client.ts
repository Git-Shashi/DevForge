import Docker from 'dockerode';

let docker: Docker | null = null;

export function getDockerClient(): Docker {
  if (!docker) {
    const dockerHost = process.env.DOCKER_HOST || '/var/run/docker.sock';
    
    docker = new Docker({
      socketPath: dockerHost,
    });
  }

  return docker;
}

// Verify Docker is accessible
export async function verifyDockerConnection(): Promise<boolean> {
  try {
    const client = getDockerClient();
    await client.ping();
    return true;
  } catch (error) {
    console.error('Docker connection failed:', error);
    return false;
  }
}

// Ensure network exists
export async function ensureNetwork(): Promise<void> {
  const client = getDockerClient();
  const networkName = process.env.DOCKER_NETWORK_NAME || 'devforge-network';

  try {
    const networks = await client.listNetworks({
      filters: { name: [networkName] }
    });

    if (networks.length === 0) {
      await client.createNetwork({
        Name: networkName,
        Driver: 'bridge',
      });
      console.log(`Created Docker network: ${networkName}`);
    }
  } catch (error) {
    console.error('Error ensuring network:', error);
    throw error;
  }
}

// Get container stats
export async function getContainerStats(containerId: string) {
  try {
    const client = getDockerClient();
    const container = client.getContainer(containerId);
    const stats = await container.stats({ stream: false });
    
    // Calculate CPU usage
    const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
    const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
    const cpuPercent = (cpuDelta / systemDelta) * stats.cpu_stats.online_cpus * 100;

    // Calculate memory usage
    const memoryUsage = stats.memory_stats.usage || 0;
    const memoryLimit = stats.memory_stats.limit || 0;
    const memoryPercent = (memoryUsage / memoryLimit) * 100;

    return {
      cpu: parseFloat(cpuPercent.toFixed(2)),
      memory: memoryUsage,
      memoryLimit: memoryLimit,
      memoryPercent: parseFloat(memoryPercent.toFixed(2)),
      networkRx: stats.networks?.eth0?.rx_bytes || 0,
      networkTx: stats.networks?.eth0?.tx_bytes || 0,
    };
  } catch (error) {
    console.error('Error getting container stats:', error);
    return null;
  }
}

// Get container info
export async function getContainerInfo(containerId: string) {
  try {
    const client = getDockerClient();
    const container = client.getContainer(containerId);
    const info = await container.inspect();
    
    return {
      id: info.Id,
      name: info.Name,
      status: info.State.Status,
      running: info.State.Running,
      ports: info.NetworkSettings.Ports,
      created: info.Created,
      image: info.Config.Image,
    };
  } catch (error) {
    console.error('Error getting container info:', error);
    return null;
  }
}

// List all containers with specific label
export async function listProjectContainers() {
  try {
    const client = getDockerClient();
    const containers = await client.listContainers({
      all: true,
      filters: {
        label: ['app=devforge']
      }
    });
    
    return containers;
  } catch (error) {
    console.error('Error listing containers:', error);
    return [];
  }
}

// Check if container is healthy
export async function checkContainerHealth(containerId: string): Promise<boolean> {
  try {
    const info = await getContainerInfo(containerId);
    return info?.running || false;
  } catch (error) {
    return false;
  }
}

// Restart container
export async function restartContainer(containerId: string): Promise<boolean> {
  try {
    const client = getDockerClient();
    const container = client.getContainer(containerId);
    await container.restart();
    return true;
  } catch (error) {
    console.error('Error restarting container:', error);
    return false;
  }
}

// Stop container
export async function stopContainer(containerId: string): Promise<boolean> {
  try {
    const client = getDockerClient();
    const container = client.getContainer(containerId);
    await container.stop();
    return true;
  } catch (error) {
    console.error('Error stopping container:', error);
    return false;
  }
}

// Remove container
export async function removeContainer(containerId: string): Promise<boolean> {
  try {
    const client = getDockerClient();
    const container = client.getContainer(containerId);
    await container.remove({ force: true, v: true });
    return true;
  } catch (error) {
    console.error('Error removing container:', error);
    return false;
  }
}

// Get container logs
export async function getContainerLogs(containerId: string, tail: number = 100): Promise<string> {
  try {
    const client = getDockerClient();
    const container = client.getContainer(containerId);
    const logs = await container.logs({
      stdout: true,
      stderr: true,
      tail,
      timestamps: true,
    });
    
    return logs.toString();
  } catch (error) {
    console.error('Error getting container logs:', error);
    return '';
  }
}

// Execute command in container
export async function execInContainer(containerId: string, command: string[]): Promise<string> {
  try {
    const client = getDockerClient();
    const container = client.getContainer(containerId);
    
    const exec = await container.exec({
      Cmd: command,
      AttachStdout: true,
      AttachStderr: true,
    });
    
    const stream = await exec.start({ hijack: true, stdin: false });
    
    return new Promise((resolve, reject) => {
      let output = '';
      
      stream.on('data', (chunk: Buffer) => {
        output += chunk.toString();
      });
      
      stream.on('end', () => {
        resolve(output);
      });
      
      stream.on('error', (err: Error) => {
        reject(err);
      });
    });
  } catch (error) {
    console.error('Error executing command in container:', error);
    throw error;
  }
}

export default getDockerClient;
