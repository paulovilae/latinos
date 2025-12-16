#!/bin/bash

echo "🔧 Reorganizing packages structure..."

# Base directory
BASE_DIR="/home/paulo/Programs/paulovila.org/packages"
OLD_PLUGINS_DIR="$BASE_DIR/payload plugins"
NEW_PLUGINS_DIR="$BASE_DIR/payload-plugins"

# Create new directory structure
echo "📁 Creating new directory structure..."
mkdir -p "$NEW_PLUGINS_DIR/paulovila-org"
mkdir -p "$NEW_PLUGINS_DIR/third-party"
mkdir -p "$NEW_PLUGINS_DIR/debug"

# Move your custom plugins
echo "📦 Moving paulovila.org plugins..."
if [ -d "$OLD_PLUGINS_DIR/paulovila.org" ]; then
    mv "$OLD_PLUGINS_DIR/paulovila.org"/* "$NEW_PLUGINS_DIR/paulovila-org/"
    echo "✅ Moved paulovila.org plugins"
fi

# Move third-party plugins
echo "📦 Moving third-party plugins..."
if [ -d "$OLD_PLUGINS_DIR/payload-appointments-plugin" ]; then
    mv "$OLD_PLUGINS_DIR/payload-appointments-plugin" "$NEW_PLUGINS_DIR/third-party/"
    echo "✅ Moved payload-appointments-plugin"
fi

if [ -d "$OLD_PLUGINS_DIR/payload-auth-plugin" ]; then
    mv "$OLD_PLUGINS_DIR/payload-auth-plugin" "$NEW_PLUGINS_DIR/third-party/"
    echo "✅ Moved payload-auth-plugin"
fi

# Move debug plugins
echo "📦 Moving debug plugins..."
if [ -d "$OLD_PLUGINS_DIR/debug" ]; then
    mv "$OLD_PLUGINS_DIR/debug" "$NEW_PLUGINS_DIR/"
    echo "✅ Moved debug plugins"
fi

# Remove old directory if empty
echo "🧹 Cleaning up old directory..."
if [ -d "$OLD_PLUGINS_DIR" ]; then
    rmdir "$OLD_PLUGINS_DIR/paulovila.org" 2>/dev/null || true
    rmdir "$OLD_PLUGINS_DIR" 2>/dev/null || echo "⚠️  Old directory not empty, please check manually"
fi

echo "✅ Package reorganization complete!"
echo ""
echo "📋 New structure:"
echo "├── frontend/"
echo "│   └── flow-runner-ui/"
echo "├── payload-plugins/"
echo "│   ├── paulovila-org/        # Your custom plugins"
echo "│   ├── third-party/          # Third-party plugins"
echo "│   └── debug/                # Debug plugins"