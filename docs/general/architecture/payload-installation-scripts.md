# Payload Installation Performance Scripts

## Quick Fix Script

### 1. Immediate Registry Optimization
```bash
#!/bin/bash
# payload-install-fix.sh - Quick fixes for slow Payload installation

echo "🔧 Payload Installation Performance Fix"
echo "======================================"

# Check current pnpm version
echo "📋 Current pnpm version:"
pnpm --version

# Clear pnpm cache
echo "🧹 Clearing pnpm cache..."
pnpm store prune

# Configure optimal registry settings
echo "⚙️ Configuring optimal registry settings..."
pnpm config set registry https://registry.npmjs.org/
pnpm config set network-timeout 300000
pnpm config set fetch-retries 5
pnpm config set fetch-retry-mintimeout 10000
pnpm config set fetch-retry-maxtimeout 60000
pnpm config set prefer-offline true
pnpm config set progress true
pnpm config set network-concurrency 16
pnpm config set child-concurrency 5

# Set Node.js memory optimization
echo "💾 Setting Node.js memory optimization..."
export NODE_OPTIONS="--max-old-space-size=4096"

# Display current configuration
echo "📊 Current pnpm configuration:"
pnpm config list

echo "✅ Optimization complete! Now try:"
echo "   pnpx create-payload-app@latest"
```

### 2. System Resource Check
```bash
#!/bin/bash
# system-check.sh - Check system resources for Payload installation

echo "🖥️ System Resource Check for Payload Installation"
echo "================================================"

# Check available memory
echo "💾 Memory Status:"
free -h

# Check disk space
echo "💿 Disk Space:"
df -h .

# Check Node.js version
echo "🟢 Node.js Version:"
node --version

# Check pnpm version
echo "📦 pnpm Version:"
pnpm --version

# Test network connectivity
echo "🌐 Network Connectivity Test:"
curl -o /dev/null -s -w "Registry Response Time: %{time_total}s\n" https://registry.npmjs.org/

# Check for running processes that might interfere
echo "🔍 Resource-intensive processes:"
ps aux --sort=-%mem | head -10

echo "✅ System check complete!"
```

## Advanced Installation Script

### 3. Monitored Installation
```bash
#!/bin/bash
# monitored-payload-install.sh - Install Payload with monitoring

PROJECT_NAME=${1:-"tradeapp"}
LOG_FILE="payload-install-$(date +%Y%m%d-%H%M%S).log"

echo "🚀 Starting Monitored Payload Installation"
echo "=========================================="
echo "Project: $PROJECT_NAME"
echo "Log file: $LOG_FILE"

# Function to monitor system resources
monitor_resources() {
    while true; do
        echo "$(date): Memory: $(free -h | grep Mem | awk '{print $3"/"$2}')" >> "$LOG_FILE"
        echo "$(date): CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)%" >> "$LOG_FILE"
        sleep 10
    done
}

# Start resource monitoring in background
monitor_resources &
MONITOR_PID=$!

# Function to cleanup on exit
cleanup() {
    echo "🧹 Cleaning up monitoring processes..."
    kill $MONITOR_PID 2>/dev/null
    echo "📊 Installation log saved to: $LOG_FILE"
}
trap cleanup EXIT

# Apply optimizations
echo "⚙️ Applying performance optimizations..."
export NODE_OPTIONS="--max-old-space-size=4096"
pnpm config set network-timeout 300000
pnpm config set fetch-retries 5

# Start installation with timeout
echo "📦 Starting Payload installation..."
timeout 1800 pnpx create-payload-app@latest "$PROJECT_NAME" 2>&1 | tee -a "$LOG_FILE"

INSTALL_RESULT=$?

if [ $INSTALL_RESULT -eq 0 ]; then
    echo "✅ Installation completed successfully!"
else
    echo "❌ Installation failed or timed out"
    echo "📋 Check log file for details: $LOG_FILE"
    exit 1
fi
```

## Alternative Installation Methods

### 4. Manual Step-by-Step Installation
```bash
#!/bin/bash
# manual-payload-setup.sh - Manual Payload project setup

PROJECT_NAME=${1:-"tradeapp"}

echo "🔧 Manual Payload Project Setup"
echo "==============================="

# Create project directory
echo "📁 Creating project directory..."
mkdir -p "$PROJECT_NAME"
cd "$PROJECT_NAME"

# Initialize package.json
echo "📋 Initializing package.json..."
pnpm init

# Install core dependencies step by step
echo "📦 Installing core dependencies..."
pnpm add payload@latest --save
echo "✅ Payload installed"

pnpm add next@latest --save
echo "✅ Next.js installed"

pnpm add react@latest react-dom@latest --save
echo "✅ React installed"

# Install Payload plugins
echo "🔌 Installing Payload plugins..."
pnpm add @payloadcms/richtext-lexical@latest --save
pnpm add @payloadcms/db-sqlite@latest --save
pnpm add @payloadcms/next@latest --save

# Install development dependencies
echo "🛠️ Installing development dependencies..."
pnpm add -D typescript @types/node @types/react @types/react-dom

# Create basic project structure
echo "🏗️ Creating project structure..."
mkdir -p src/app
mkdir -p src/payload

# Create basic configuration files
cat > next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    reactCompiler: false
  }
}

module.exports = nextConfig
EOF

cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
EOF

echo "✅ Manual setup complete!"
echo "📁 Project created in: $PROJECT_NAME"
echo "🚀 Next steps:"
echo "   cd $PROJECT_NAME"
echo "   pnpm dev"
```

### 5. Docker-based Installation
```dockerfile
# Dockerfile.payload-dev
FROM node:18-alpine

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml* ./

# Install dependencies with optimizations
RUN pnpm config set network-timeout 300000 && \
    pnpm config set fetch-retries 5 && \
    pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start development server
CMD ["pnpm", "dev"]
```

```bash
#!/bin/bash
# docker-payload-install.sh - Docker-based Payload installation

PROJECT_NAME=${1:-"tradeapp"}

echo "🐳 Docker-based Payload Installation"
echo "===================================="

# Create project directory
mkdir -p "$PROJECT_NAME"
cd "$PROJECT_NAME"

# Create docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  payload-app:
    build:
      context: .
      dockerfile: Dockerfile.payload-dev
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - NODE_OPTIONS=--max-old-space-size=4096
    command: sh -c "pnpx create-payload-app@latest . --template=website --db=sqlite && pnpm dev"
EOF

# Create optimized Dockerfile
cat > Dockerfile.payload-dev << 'EOF'
FROM node:18-alpine

RUN npm install -g pnpm

WORKDIR /app

# Optimize pnpm settings
RUN pnpm config set network-timeout 300000 && \
    pnpm config set fetch-retries 5 && \
    pnpm config set network-concurrency 16

EXPOSE 3000

CMD ["sh"]
EOF

echo "🚀 Starting Docker installation..."
docker-compose up --build

echo "✅ Docker installation complete!"
```

## Troubleshooting Scripts

### 6. Installation Diagnostics
```bash
#!/bin/bash
# payload-install-diagnostics.sh - Comprehensive installation diagnostics

echo "🔍 Payload Installation Diagnostics"
echo "==================================="

# Test registry connectivity
echo "🌐 Testing registry connectivity..."
registries=(
    "https://registry.npmjs.org/"
    "https://registry.npmmirror.com/"
    "https://npm.taobao.org/"
)

for registry in "${registries[@]}"; do
    response_time=$(curl -o /dev/null -s -w "%{time_total}" "$registry")
    echo "  $registry: ${response_time}s"
done

# Check pnpm store
echo "📦 pnpm store information:"
pnpm store path
pnpm store status

# Check for conflicting processes
echo "🔍 Checking for conflicting processes..."
pgrep -f "node\|npm\|pnpm" | while read pid; do
    echo "  PID $pid: $(ps -p $pid -o comm=)"
done

# Network interface check
echo "🌐 Network interface status:"
ip route show default

# DNS resolution test
echo "🔍 DNS resolution test:"
nslookup registry.npmjs.org

echo "✅ Diagnostics complete!"
```

### 7. Recovery Script
```bash
#!/bin/bash
# payload-install-recovery.sh - Recover from failed installation

echo "🔄 Payload Installation Recovery"
echo "==============================="

# Remove partial installation
echo "🧹 Cleaning up partial installation..."
rm -rf node_modules
rm -f pnpm-lock.yaml
rm -f package-lock.json

# Clear all caches
echo "🗑️ Clearing caches..."
pnpm store prune
npm cache clean --force 2>/dev/null || true

# Reset pnpm configuration
echo "⚙️ Resetting pnpm configuration..."
pnpm config delete registry 2>/dev/null || true
pnpm config delete network-timeout 2>/dev/null || true

# Apply fresh optimizations
echo "🔧 Applying fresh optimizations..."
pnpm config set registry https://registry.npmjs.org/
pnpm config set network-timeout 600000
pnpm config set fetch-retries 10

# Restart with clean environment
echo "🚀 Restarting installation..."
export NODE_OPTIONS="--max-old-space-size=6144"
pnpx create-payload-app@latest

echo "✅ Recovery attempt complete!"
```

## Usage Instructions

1. **For immediate fix**: Run `payload-install-fix.sh`
2. **For system check**: Run `system-check.sh`
3. **For monitored installation**: Run `monitored-payload-install.sh [project-name]`
4. **For manual setup**: Run `manual-payload-setup.sh [project-name]`
5. **For Docker installation**: Run `docker-payload-install.sh [project-name]`
6. **For diagnostics**: Run `payload-install-diagnostics.sh`
7. **For recovery**: Run `payload-install-recovery.sh`

Make all scripts executable:
```bash
chmod +x *.sh