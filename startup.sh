#!/bin/sh
set -e

echo "=== Azure App Service Startup Script (Standalone) ==="
echo "Working directory: $(pwd)"
echo "Node version: $(node --version)"

# Change to the app directory
cd /home/site/wwwroot

echo "App directory contents:"
ls -la

# Verify server.js exists (standalone build)
if [ ! -f "server.js" ]; then
    echo "ERROR: server.js not found in /home/site/wwwroot"
    echo "This suggests the standalone build was not properly deployed"
    exit 1
    fi
    exit 1
fi

echo "✓ Standalone server.js found"
echo "Starting Next.js standalone server..."
exec node server.js
