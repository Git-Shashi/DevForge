# DevForge - Web-Based IDE with Persistent Docker Containers

A full-stack web-based integrated development environment (IDE) built with Next.js 14, featuring persistent Docker containers, MongoDB storage, and real-time code editing.

## 🚀 Features

- **Full Authentication System**: NextAuth with credentials provider, secure password hashing with bcrypt
- **Project Management**: Create, list, and manage multiple projects with different tech stacks (MERN, React, Node, Python)
- **Persistent Docker Containers**: Each project runs in its own Docker container that never stops
- **File System Management**: Full file tree navigation, read/write operations
- **Monaco Editor Integration**: Professional code editor with syntax highlighting and auto-save
- **Real-time Terminal**: View container logs and output in real-time
- **Redux State Management**: Centralized state with 7 slices (auth, projects, fileSystem, editor, terminal, docker, ui)
- **Port Management**: Automatic port allocation using Redis (50000-70000 range)
- **Dark Theme UI**: Modern dark theme with Tailwind CSS and shadcn/ui components

## 📋 Tech Stack

### Frontend
- **Next.js 14.2**: App Router, Server/Client Components, API Routes
- **React 18**: Hooks, Dynamic Imports, Suspense
- **TypeScript 5**: Full type safety
- **Redux Toolkit**: State management with async thunks
- **Monaco Editor**: VS Code editor engine
- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: Pre-built accessible components

### Backend
- **MongoDB 7.0**: User and project data storage
- **Redis**: Port allocation and caching
- **Docker**: Container management with dockerode
- **NextAuth**: Authentication and session management
- **bcryptjs**: Password hashing

## 🛠️ Setup

### Prerequisites
- Node.js 18+
- MongoDB 7.0+
- Redis
- Docker Desktop

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start services**
   ```bash
   # Start MongoDB
   brew services start mongodb-community@7.0

   # Start Redis
   redis-server

   # Ensure Docker Desktop is running
   open -a Docker
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Build for Production**
   ```bash
   npm run build
   npm start
   ```

## 📁 Project Structure

```
DevForge/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── projects/             # Project CRUD operations
│   │   ├── files/                # File operations (read, write, tree)
│   │   └── docker/               # Docker container management
│   ├── auth/                     # Auth pages (signin, signup)
│   ├── dashboard/                # Main dashboard
│   ├── ide/[projectId]/          # IDE interface
│   └── layout.tsx                # Root layout with providers
├── components/
│   └── ide/                      # IDE components
│       ├── FileExplorer.tsx      # File tree navigation
│       ├── MonacoEditor.tsx      # Code editor
│       └── Terminal.tsx          # Terminal output viewer
├── store/                        # Redux store
│   ├── slices/                   # Redux slices (7 total)
│   ├── thunks/                   # Async thunks
│   └── middleware/               # Custom middleware (auto-save, logger)
├── lib/                          # Utility libraries
│   ├── auth/                     # NextAuth configuration
│   ├── mongodb/                  # MongoDB client and models
│   ├── docker/                   # Docker utilities
│   └── redis/                    # Redis client
└── types/                        # TypeScript type definitions
```

## 🔑 Key Features

### Authentication
- Signup and signin with email/password
- JWT-based sessions with 30-day expiry
- Password hashing with bcrypt
- Protected API routes

### Project Management
- Multiple project types: MERN, React, Node, Python
- Automatic Docker container provisioning
- Port allocation (Frontend: 50000-60000, Backend: 60001-70000)
- Persistent containers with "unless-stopped" restart policy

### IDE Interface
- Split view: File Explorer | Editor | Terminal
- Monaco Editor with syntax highlighting
- Auto-save with 2-second debounce
- Real-time container logs

## 🐳 Docker Configuration

Each project runs in a persistent Docker container:
- Base Image: `node:18-alpine`
- Volume Mount: Host project files
- Restart Policy: `unless-stopped`
- Resource Limits: 512MB RAM, 1 CPU core

## 📝 API Routes

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login

### Projects
- `GET /api/projects/list` - List user projects
- `POST /api/projects/create` - Create new project

### Files
- `GET /api/files/tree` - Get project file tree
- `GET /api/files/read` - Read file content
- `POST /api/files/write` - Write file content

### Docker
- `GET /api/docker/logs/[projectId]` - Get container logs

## 🚀 Getting Started

1. Visit `http://localhost:3001`
2. Sign up for an account
3. Create a new project
4. Start coding in the IDE!

## 🐛 Troubleshooting

### MongoDB Connection Issues
```bash
brew services start mongodb-community@7.0
```

### Docker Connection Issues
```bash
open -a Docker
```

## 📄 License

MIT License

---

**Happy Coding! 🎉**
