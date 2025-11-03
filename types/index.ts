import { ObjectId } from 'mongodb';

// User Types
export interface User {
  _id: ObjectId;
  email: string;
  name: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

// Project Types
export interface Project {
  _id: ObjectId;
  userId: ObjectId;
  projectName: string;
  projectType: 'mern' | 'react' | 'node' | 'python';
  docker: DockerInfo;
  rootPath: string;
  createdAt: Date;
  updatedAt: Date;
  lastAccessed: Date;
  activeConnections: number;
  lastActiveAt: Date;
}

export interface DockerInfo {
  containerId: string;
  containerName: string;
  imageId: string;
  status: 'running' | 'error' | 'stopped';
  ports: {
    frontend: number;
    backend: number;
  };
  resourceLimits: {
    memory: string;
    cpus: string;
  };
  createdAt: Date;
  lastHealthCheck: Date;
}

// Container Mapping Types
export interface ContainerMapping {
  _id: ObjectId;
  containerId: string;
  containerName: string;
  userId: ObjectId;
  projectId: ObjectId;
  ports: {
    frontend: number;
    backend: number;
  };
  status: 'running' | 'error' | 'stopped';
  createdAt: Date;
  lastPingAt: Date;
}

// File System Types
export interface FileNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  size?: number;
  modifiedAt?: Date;
}

export interface OpenFile {
  id: string;
  path: string;
  name: string;
  content: string;
  language: string;
  isDirty: boolean;
}

// Editor Types
export interface Tab {
  id: string;
  path: string;
  name: string;
  isDirty: boolean;
  icon?: string;
}

export interface EditorConfig {
  fontSize: number;
  fontFamily: string;
  theme: 'vs-dark' | 'vs-light' | 'hc-black';
  tabSize: number;
  wordWrap: 'on' | 'off';
  minimap: boolean;
  lineNumbers: 'on' | 'off';
}

export interface CursorPosition {
  line: number;
  column: number;
}

// Terminal Types
export interface LogEntry {
  id: string;
  timestamp: Date;
  type: 'stdout' | 'stderr' | 'system';
  content: string;
}

// Docker Types
export interface ContainerInfo {
  id: string;
  name: string;
  status: string;
  ports: {
    frontend: number;
    backend: number;
  };
  resourceUsage?: ResourceUsage;
}

export interface ResourceUsage {
  cpu: number;
  memory: number;
  memoryLimit: number;
  networkRx: number;
  networkTx: number;
}

// UI Types
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// WebSocket Message Types
export interface WebSocketMessage {
  type: 'terminal' | 'file-change' | 'container-status' | 'error' | 'ping' | 'pong';
  data: any;
  timestamp: Date;
}

// Redux State Types (will be used in slices)
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  loading: boolean;
  error: string | null;
}

export interface ProjectsState {
  list: Project[];
  activeProject: Project | null;
  loading: boolean;
  error: string | null;
}

export interface FileSystemState {
  fileTree: FileNode[];
  openFiles: OpenFile[];
  activeFileId: string | null;
  fileContents: Record<string, string>;
  unsavedChanges: Record<string, boolean>;
  loading: boolean;
  error: string | null;
}

export interface EditorState {
  activeTabs: Tab[];
  activeTabId: string | null;
  editorSettings: EditorConfig;
  cursorPosition: CursorPosition;
}

export interface TerminalState {
  logs: LogEntry[];
  isConnected: boolean;
  containerStatus: 'running' | 'error' | 'stopped';
}

export interface DockerState {
  containerInfo: ContainerInfo | null;
  buildLogs: string[];
  resourceUsage: ResourceUsage | null;
  loading: boolean;
  error: string | null;
}

export interface UIState {
  sidebarOpen: boolean;
  terminalOpen: boolean;
  previewOpen: boolean;
  copilotOpen: boolean;
  theme: 'light' | 'dark';
  notifications: Notification[];
}

export interface RootState {
  auth: AuthState;
  projects: ProjectsState;
  fileSystem: FileSystemState;
  editor: EditorState;
  terminal: TerminalState;
  docker: DockerState;
  ui: UIState;
}
