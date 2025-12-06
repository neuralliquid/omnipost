#!/bin/sh
set -e

echo "=== Azure App Service Startup Script ==="
echo "Working directory: $(pwd)"
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"

# Change to the app directory
cd /home/site/wwwroot

echo "App directory contents:"
ls -la

# Verify package.json exists
if [ ! -f "package.json" ]; then
    echo "ERROR: package.json not found in /home/site/wwwroot"
    exit 1
fi

echo "Starting application..."
exec npm start
