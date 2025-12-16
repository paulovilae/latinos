# Payload Installation Troubleshooting Guide

## Quick Reference

### Immediate Actions for Slow Installation

1. **Kill the hanging process**: `Ctrl+C` or `pkill -f "create-payload-app"`
2. **Apply quick fixes**: Run the optimization script
3. **Retry with monitoring**: Use the monitored installation script
4. **Fallback to manual**: Use step-by-step installation if needed

## Common Issues and Solutions

### 1. Installation Hangs at Dependency Resolution

**Symptoms:**
- Process stops responding after "Using pnpm"
- No progress for > 5 minutes
- High CPU usage but no network activity

**Root Causes:**
- Slow registry response
- Network timeout issues
- Memory exhaustion
- Corrupted pnpm cache

**Solutions:**
```bash
# Quick fix
pnpm store prune
pnpm config set network-timeout 600000
pnpm config set fetch-retries 10
export NODE_OPTIONS="--max-old-space-size=4096"

# Retry installation
pnpx create-payload-app@latest --verbose
```

### 2. Network Timeout Errors

**Symptoms:**
- "ETIMEDOUT" errors
- "ENOTFOUND" registry errors
- Intermittent connection failures

**Root Causes:**
- Slow internet connection
- Firewall/proxy blocking
- DNS resolution issues
- Registry server problems

**Solutions:**
```bash
# Test registry connectivity
curl -I https://registry.npmjs.org/

# Switch to faster registry
pnpm config set registry https://registry.npmmirror.com/

# Configure proxy if needed
pnpm config set proxy http://proxy.company.com:8080
pnpm config set https-proxy http://proxy.company.com:8080
```

### 3. Memory Exhaustion

**Symptoms:**
- "JavaScript heap out of memory" errors
- System becomes unresponsive
- Installation crashes without error

**Root Causes:**
- Insufficient RAM
- Node.js memory limits
- Large dependency tree
- Memory leaks in installation process

**Solutions:**
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=6144"

# Close unnecessary applications
# Check available memory
free -h

# Use swap if needed
sudo swapon -a
```

### 4. Permission Errors

**Symptoms:**
- "EACCES" permission denied errors
- Cannot write to directory
- npm/pnpm global installation issues

**Root Causes:**
- Incorrect directory permissions
- Running as wrong user
- Global npm directory issues

**Solutions:**
```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) ~/.pnpm-store

# Use different directory
mkdir ~/my-projects
cd ~/my-projects
pnpx create-payload-app@latest
```

### 5. Version Compatibility Issues

**Symptoms:**
- "Unsupported engine" errors
- Dependency version conflicts
- TypeScript compilation errors

**Root Causes:**
- Outdated Node.js version
- Incompatible pnpm version
- Conflicting dependency versions

**Solutions:**
```bash
# Check versions
node --version  # Should be >= 18.20.2
pnpm --version  # Should be >= 9.0.0

# Update Node.js using nvm
nvm install 18
nvm use 18

# Update pnpm
npm install -g pnpm@latest
```

## Advanced Troubleshooting

### Registry Performance Testing

```bash
#!/bin/bash
# test-registries.sh - Test multiple registries for performance

registries=(
    "https://registry.npmjs.org/"
    "https://registry.npmmirror.com/"
    "https://npm.taobao.org/"
    "https://registry.yarnpkg.com/"
)

echo "🧪 Testing registry performance..."

for registry in "${registries[@]}"; do
    echo "Testing $registry"
    
    # Test connectivity
    response_time=$(curl -o /dev/null -s -w "%{time_total}" "$registry")
    http_code=$(curl -o /dev/null -s -w "%{http_code}" "$registry")
    
    echo "  Response time: ${response_time}s"
    echo "  HTTP code: $http_code"
    
    # Test package download
    package_time=$(curl -o /dev/null -s -w "%{time_total}" "${registry}payload/latest")
    echo "  Package fetch: ${package_time}s"
    echo "  ---"
done
```

### System Resource Monitoring

```bash
#!/bin/bash
# monitor-installation.sh - Monitor system resources during installation

LOG_FILE="installation-monitor-$(date +%Y%m%d-%H%M%S).log"

echo "📊 Starting system monitoring..."
echo "Log file: $LOG_FILE"

# Function to log system stats
log_stats() {
    while true; do
        timestamp=$(date '+%Y-%m-%d %H:%M:%S')
        
        # Memory usage
        memory=$(free | grep Mem | awk '{printf "%.1f%%", $3/$2 * 100.0}')
        
        # CPU usage
        cpu=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
        
        # Disk usage
        disk=$(df . | tail -1 | awk '{print $5}')
        
        # Network activity
        network=$(cat /proc/net/dev | grep -E "(eth0|wlan0|enp)" | head -1 | awk '{print $2,$10}')
        
        echo "$timestamp - Memory: $memory, CPU: $cpu%, Disk: $disk, Network: $network" >> "$LOG_FILE"
        
        sleep 5
    done
}

# Start monitoring
log_stats &
MONITOR_PID=$!

# Cleanup function
cleanup() {
    kill $MONITOR_PID 2>/dev/null
    echo "📊 Monitoring stopped. Check log: $LOG_FILE"
}

trap cleanup EXIT

echo "🔍 Monitoring active. Press Ctrl+C to stop."
wait
```

### Network Diagnostics

```bash
#!/bin/bash
# network-diagnostics.sh - Comprehensive network diagnostics

echo "🌐 Network Diagnostics for Payload Installation"
echo "=============================================="

# Basic connectivity
echo "🔍 Basic connectivity test..."
ping -c 3 8.8.8.8 > /dev/null && echo "✅ Internet connectivity: OK" || echo "❌ Internet connectivity: FAILED"

# DNS resolution
echo "🔍 DNS resolution test..."
nslookup registry.npmjs.org > /dev/null && echo "✅ DNS resolution: OK" || echo "❌ DNS resolution: FAILED"

# Registry accessibility
echo "🔍 Registry accessibility test..."
registries=(
    "registry.npmjs.org"
    "registry.npmmirror.com"
    "npm.taobao.org"
)

for registry in "${registries[@]}"; do
    response=$(curl -s -o /dev/null -w "%{http_code}:%{time_total}" "https://$registry/")
    http_code=$(echo $response | cut -d: -f1)
    time_total=$(echo $response | cut -d: -f2)
    
    if [ "$http_code" = "200" ]; then
        echo "✅ $registry: OK (${time_total}s)"
    else
        echo "❌ $registry: FAILED (HTTP $http_code)"
    fi
done

# Bandwidth test
echo "🔍 Bandwidth test..."
download_speed=$(curl -s -w "%{speed_download}" -o /dev/null "https://registry.npmjs.org/payload/latest")
echo "📊 Download speed: $(echo "scale=2; $download_speed / 1024" | bc) KB/s"

# Proxy detection
echo "🔍 Proxy configuration..."
if [ -n "$HTTP_PROXY" ] || [ -n "$HTTPS_PROXY" ]; then
    echo "🔧 Proxy detected:"
    echo "  HTTP_PROXY: $HTTP_PROXY"
    echo "  HTTPS_PROXY: $HTTPS_PROXY"
else
    echo "✅ No proxy configuration detected"
fi
```

## Error Code Reference

### Common Error Codes and Solutions

| Error Code | Description | Solution |
|------------|-------------|----------|
| `ETIMEDOUT` | Network timeout | Increase timeout, check network |
| `ENOTFOUND` | DNS resolution failed | Check DNS settings, try different registry |
| `EACCES` | Permission denied | Fix file permissions, check user rights |
| `ENOSPC` | No space left on device | Free up disk space |
| `EMFILE` | Too many open files | Increase file descriptor limit |
| `ERR_SOCKET_TIMEOUT` | Socket timeout | Increase network timeout settings |
| `CERT_UNTRUSTED` | SSL certificate issue | Update certificates, disable strict SSL |

### Payload-Specific Errors

| Error | Cause | Solution |
|-------|-------|---------|
| "Unsupported engine" | Node.js version incompatibility | Update to Node.js 18+ |
| "Cannot resolve dependency" | Version conflicts | Clear cache, use `--force` flag |
| "Template not found" | Network/registry issue | Retry with different registry |
| "Database connection failed" | SQLite setup issue | Check file permissions, disk space |

## Recovery Procedures

### Complete Reset Procedure

```bash
#!/bin/bash
# complete-reset.sh - Complete environment reset

echo "🔄 Complete Payload Installation Reset"
echo "====================================="

# 1. Stop all Node.js processes
echo "🛑 Stopping Node.js processes..."
pkill -f node
pkill -f pnpm
pkill -f npm

# 2. Remove project directories
echo "🗑️ Removing project directories..."
rm -rf tradeapp*
rm -rf node_modules
rm -rf .next

# 3. Clear all caches
echo "🧹 Clearing caches..."
pnpm store prune
npm cache clean --force 2>/dev/null || true
rm -rf ~/.npm/_cacache
rm -rf ~/.pnpm-store

# 4. Reset configurations
echo "⚙️ Resetting configurations..."
pnpm config delete registry 2>/dev/null || true
pnpm config delete network-timeout 2>/dev/null || true
pnpm config delete fetch-retries 2>/dev/null || true

# 5. Apply optimal settings
echo "🔧 Applying optimal settings..."
pnpm config set registry https://registry.npmjs.org/
pnpm config set network-timeout 600000
pnpm config set fetch-retries 10
pnpm config set network-concurrency 8

# 6. Set environment variables
echo "💾 Setting environment variables..."
export NODE_OPTIONS="--max-old-space-size=4096"
export NPM_CONFIG_PROGRESS=true

echo "✅ Reset complete! Ready for fresh installation."
```

### Incremental Recovery

```bash
#!/bin/bash
# incremental-recovery.sh - Step-by-step recovery

echo "🔧 Incremental Recovery Process"
echo "=============================="

# Step 1: Soft reset
echo "Step 1: Soft reset..."
pnpm store prune
export NODE_OPTIONS="--max-old-space-size=4096"

# Step 2: Registry optimization
echo "Step 2: Registry optimization..."
pnpm config set network-timeout 300000
pnpm config set fetch-retries 5

# Step 3: Retry installation
echo "Step 3: Retry installation..."
timeout 900 pnpx create-payload-app@latest tradeapp-recovery

if [ $? -eq 0 ]; then
    echo "✅ Recovery successful!"
    exit 0
fi

# Step 4: Alternative registry
echo "Step 4: Trying alternative registry..."
pnpm config set registry https://registry.npmmirror.com/
timeout 900 pnpx create-payload-app@latest tradeapp-recovery-alt

if [ $? -eq 0 ]; then
    echo "✅ Recovery with alternative registry successful!"
    exit 0
fi

# Step 5: Manual installation
echo "Step 5: Manual installation fallback..."
./manual-payload-setup.sh tradeapp-manual

echo "🔄 Recovery process complete. Check results."
```

## Prevention Strategies

### Pre-Installation Checklist

- [ ] **System Requirements**
  - [ ] Node.js 18.20.2+ installed
  - [ ] pnpm 9.0.0+ installed
  - [ ] 4GB+ RAM available
  - [ ] 2GB+ disk space free

- [ ] **Network Configuration**
  - [ ] Stable internet connection (>1 Mbps)
  - [ ] Registry accessibility tested
  - [ ] Proxy settings configured if needed
  - [ ] Firewall exceptions added

- [ ] **Environment Setup**
  - [ ] No conflicting Node.js processes
  - [ ] Clean pnpm cache
  - [ ] Optimal configuration applied
  - [ ] Environment variables set

### Monitoring Setup

```bash
# Add to ~/.bashrc or ~/.zshrc
export NODE_OPTIONS="--max-old-space-size=4096"
alias payload-install="pnpm config set network-timeout 600000 && pnpm config set fetch-retries 10 && pnpx create-payload-app@latest"
alias payload-reset="pnpm store prune && pnpm config delete registry"
```

## Support Resources

### Log Analysis

When reporting issues, include:
1. **System Information**: OS, Node.js version, pnpm version
2. **Network Details**: Connection speed, proxy configuration
3. **Error Logs**: Complete error messages and stack traces
4. **Installation Command**: Exact command used
5. **Timing**: When the installation started hanging

### Community Resources

- **Payload CMS Discord**: Official community support
- **GitHub Issues**: Bug reports and feature requests
- **Stack Overflow**: Technical questions and solutions
- **Documentation**: Official Payload CMS documentation

### Emergency Contacts

For critical installation issues:
1. Check official Payload CMS status page
2. Search existing GitHub issues
3. Create detailed bug report with logs
4. Use alternative installation methods as workaround

---

*This troubleshooting guide is part of the Payload Installation Performance Optimization Architecture. For complete documentation, see the main architecture document.*