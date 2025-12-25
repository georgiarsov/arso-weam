#!/bin/bash

# WEAM Nginx Setup Script (Cross-Platform)
# Supports: Ubuntu, macOS, and Windows (Git Bash / WSL / MSYS)

set -e

echo "🚀 Starting WEAM Nginx Setup..."

# -------------------------------
# Step 1: Load environment variables
# -------------------------------
if [ -f .env ]; then
    set -a
    source .env
    set +a
    echo "✅ Loaded environment variables from .env"
else
    echo "❌ .env file not found. Please create one with NEXT_PUBLIC_DOMAIN_URL"
    exit 1
fi

if [ -z "$NEXT_PUBLIC_DOMAIN_URL" ]; then
    echo "❌ NEXT_PUBLIC_DOMAIN_URL not found in .env file"
    exit 1
fi

DOMAIN=$(echo "$NEXT_PUBLIC_DOMAIN_URL" | sed -E 's|^[a-zA-Z]+:/{0,2}||' | sed -E 's|[:/].*$||')
echo "🌐 Using domain: $DOMAIN"

# -------------------------------
# Step 2: Detect environment (local vs cloud)
# -------------------------------
echo "🔍 Detecting environment..."
if curl -s --connect-timeout 1 http://169.254.169.254/ >/dev/null 2>&1; then
    ENVIRONMENT_TYPE="cloud"
    echo "☁️ Environment: Cloud Platform"
    echo "ℹ️ Cloud environment detected - nginx setup will be skipped"
    echo "✅ Cloud setup complete (no nginx configuration needed)"
    exit 0
else
    ENVIRONMENT_TYPE="local"
    echo "🏠 Environment: Local"
fi

# -------------------------------
# Step 3: Detect OS
# -------------------------------
OS_TYPE="$(uname -s)"
echo "💻 Detected OS: $OS_TYPE"

# Default values
HOST_ENTRY="127.0.0.1 $DOMAIN"

# -------------------------------
# Step 4: Add domain entry to hosts file
# -------------------------------

echo "🌐 Configuring hosts file..."
# -------- Windows (Git Bash / MSYS / MINGW)
if [[ "$OS_TYPE" =~ MINGW|MSYS|CYGWIN ]]; then
    HOSTS_FILE="/c/Windows/System32/drivers/etc/hosts"

    echo "🪟 Windows detected"

    # Check admin rights
    if ! touch "$HOSTS_FILE" 2>/dev/null; then
        echo ""
        echo "❌ ERROR: Insufficient privileges"
        echo ""
        echo "👉 Git Bash MUST be run as Administrator"
        echo "   1. Close Git Bash"
        echo "   2. Right-click Git Bash"
        echo "   3. Select 'Run as Administrator'"
        echo "   4. Re-run this script"
        echo ""
        exit 1
    fi

    if grep -qE "^[^#]*\b$DOMAIN\b" "$HOSTS_FILE"; then
        echo "✅ Host entry already exists"
    else
        echo "📝 Adding host entry to Windows hosts file..."
        echo "$HOST_ENTRY" >> "$HOSTS_FILE"
        echo "✅ Host entry added"
    fi
fi

# -------- macOS / Linux
if [[ "$OS_TYPE" == "Linux" || "$OS_TYPE" == "Darwin" ]]; then
    HOSTS_FILE="/etc/hosts"

    if grep -qE "^[^#]*\b$DOMAIN\b" "$HOSTS_FILE"; then
        echo "✅ Host entry already exists"
    else
        echo "📝 Adding host entry to $HOSTS_FILE..."
        echo "$HOST_ENTRY" | sudo tee -a "$HOSTS_FILE" >/dev/null
        echo "✅ Host entry added"
    fi
fi

# -------------------------------
# Step 5: Stop and remove existing nginx container
# -------------------------------
echo "🛑 Stopping existing nginx container..."
docker stop weam-nginx 2>/dev/null || true
docker rm weam-nginx 2>/dev/null || true

# -------------------------------
# Step 5.5: Detect Docker network dynamically
# -------------------------------
echo "🔍 Detecting Docker network..."

# Try to get network from running frontend container
if docker inspect weam-frontend-container >/dev/null 2>&1; then
    DOCKER_NETWORK=$(docker inspect weam-frontend-container --format='{{range $net,$v := .NetworkSettings.Networks}}{{$net}}{{end}}')
    echo "✅ Detected network from frontend container: $DOCKER_NETWORK"
else
    # Fallback: look for app-network variations
    echo "⚠️  Frontend container not running, checking for existing networks..."
    DOCKER_NETWORK=$(docker network ls --format '{{.Name}}' | grep -E 'app-network$' | head -n 1)
    
    if [ -z "$DOCKER_NETWORK" ]; then
        echo "❌ Could not find Docker network. Please ensure docker-compose services are running."
        echo "   Run: docker-compose up -d"
        exit 1
    fi
    echo "✅ Using network: $DOCKER_NETWORK"
fi

# Verify the network exists
if ! docker network inspect "$DOCKER_NETWORK" >/dev/null 2>&1; then
    echo "❌ Network '$DOCKER_NETWORK' does not exist"
    exit 1
fi

# -------------------------------
# Step 6: Detect Docker Compose network name
# -------------------------------
PROJECT_NAME=$(basename "$(pwd)")
NETWORK_NAME="${PROJECT_NAME}_app-network"

echo "🔗 Using Docker network: $NETWORK_NAME"

if ! docker network inspect "$NETWORK_NAME" >/dev/null 2>&1; then
    echo "❌ Docker network '$NETWORK_NAME' not found"
    echo "👉 Run: docker compose up -d first"
    exit 1
fi

# -------------------------------
# Step 7: Build and run nginx container (local only)
# -------------------------------
if [ "$ENVIRONMENT_TYPE" = "local" ]; then
    echo "🐳 Building nginx Docker image..."
    docker build -t weam-nginx:latest ./nginx

    echo "🚀 Starting nginx container on network: $NETWORK_NAME..."
    docker run -d \
        --name weam-nginx \
        --network "$NETWORK_NAME" \
        -p 80:80 \
        -p 443:443 \
        -e DOMAIN_NAME="$DOMAIN" \
        weam-nginx:latest

    echo "✅ Local nginx setup completed successfully!"
    echo "🌐 Nginx is now running on network: $DOCKER_NETWORK"
fi

echo "🎉 Setup Finished!"


