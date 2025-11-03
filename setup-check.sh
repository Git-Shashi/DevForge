#!/bin/bash

echo "🔍 DevForge Environment Setup Checker"
echo "======================================"
echo ""

# Check Node.js
echo "📦 Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✅ Node.js is installed: $NODE_VERSION"
else
    echo "❌ Node.js is NOT installed"
    echo "   Install from: https://nodejs.org/"
fi
echo ""

# Check npm
echo "📦 Checking npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo "✅ npm is installed: $NPM_VERSION"
else
    echo "❌ npm is NOT installed"
fi
echo ""

# Check Docker
echo "🐳 Checking Docker..."
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    echo "✅ Docker is installed: $DOCKER_VERSION"
    
    # Check if Docker is running
    if docker ps &> /dev/null; then
        echo "✅ Docker is running"
    else
        echo "❌ Docker is installed but NOT running"
        echo "   Please start Docker Desktop"
    fi
else
    echo "❌ Docker is NOT installed"
    echo "   Install from: https://www.docker.com/products/docker-desktop"
fi
echo ""

# Check MongoDB
echo "🍃 Checking MongoDB..."
if command -v mongosh &> /dev/null; then
    echo "✅ MongoDB shell (mongosh) is installed"
    
    # Try to connect
    if mongosh --eval "db.version()" --quiet &> /dev/null; then
        MONGO_VERSION=$(mongosh --eval "db.version()" --quiet)
        echo "✅ MongoDB is running: $MONGO_VERSION"
    else
        echo "⚠️  MongoDB shell is installed but connection failed"
        echo "   Start MongoDB: brew services start mongodb-community"
    fi
else
    echo "❌ MongoDB is NOT installed"
    echo "   Install: brew tap mongodb/brew && brew install mongodb-community@7.0"
fi
echo ""

# Check Redis
echo "🔴 Checking Redis..."
if command -v redis-cli &> /dev/null; then
    echo "✅ Redis CLI is installed"
    
    # Try to ping
    if redis-cli ping &> /dev/null; then
        echo "✅ Redis is running"
    else
        echo "⚠️  Redis is installed but NOT running"
        echo "   Start Redis: brew services start redis"
    fi
else
    echo "⚠️  Redis is NOT installed (optional but recommended)"
    echo "   Install: brew install redis"
fi
echo ""

# Check project directory
echo "📁 Checking Docker projects directory..."
if [ -d "/docker-projects" ]; then
    echo "✅ /docker-projects directory exists"
    
    # Check permissions
    if [ -w "/docker-projects" ]; then
        echo "✅ /docker-projects is writable"
    else
        echo "⚠️  /docker-projects exists but is NOT writable"
        echo "   Fix: sudo chmod 777 /docker-projects"
    fi
else
    echo "❌ /docker-projects directory does NOT exist"
    echo "   Create: sudo mkdir -p /docker-projects && sudo chmod 777 /docker-projects"
fi
echo ""

# Check .env.local
echo "⚙️  Checking environment configuration..."
if [ -f ".env.local" ]; then
    echo "✅ .env.local file exists"
    
    # Check for required variables
    if grep -q "MONGODB_URI" .env.local && grep -q "NEXTAUTH_SECRET" .env.local; then
        echo "✅ Required environment variables are present"
    else
        echo "⚠️  Some required environment variables may be missing"
        echo "   Check MONGODB_URI and NEXTAUTH_SECRET in .env.local"
    fi
else
    echo "❌ .env.local file NOT found"
    echo "   Copy from: cp .env.example .env.local"
fi
echo ""

# Check node_modules
echo "📚 Checking dependencies..."
if [ -d "node_modules" ]; then
    echo "✅ node_modules directory exists"
else
    echo "⚠️  node_modules NOT found"
    echo "   Run: npm install"
fi
echo ""

echo "======================================"
echo "🎉 Setup check complete!"
echo ""
echo "Next steps:"
echo "1. Fix any ❌ or ⚠️  issues above"
echo "2. Update .env.local with your configuration"
echo "3. Run: npm run dev"
echo ""
