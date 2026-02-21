#!/bin/bash
set -e

REPO_URL="git@github.com:someRandomDude-a/VAT-Gate.git"
APP_DIR="/app"
BACKEND_DIR="$APP_DIR/backend"
REQ_FILE="$BACKEND_DIR/requirements.txt"
REQ_HASH_FILE="$APP_DIR/.requirements_hash"
SSH_KEY_PATH="/run/secrets/deploy_key" # Path where we will mount the key
SECURE_KEY="/root/.ssh/id_rsa_deploy"

# Check for SSH key
if [ ! -f "$SSH_KEY_PATH" ]; then
    echo "Error: SSH Key not found at $SSH_KEY_PATH"
    exit 1
fi
# Setup SSH known hosts
mkdir -p ~/.ssh
ssh-keyscan github.com >> ~/.ssh/known_hosts 2>/dev/null

mkdir -p /root/.ssh
chmod 700 /root/.ssh
cp "$SSH_KEY_PATH" "$SECURE_KEY"
chmod 600 "$SECURE_KEY"

export GIT_SSH_COMMAND="ssh -i $SECURE_KEY -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no"

# Clone the repo if it doesn't exist
BRANCH="${BRANCH:-main}"

if [ ! -d "$APP_DIR/.git" ]; then
    git clone --branch "$BRANCH" --single-branch "$REPO_URL" "$APP_DIR"
else
    cd "$APP_DIR"
    git fetch origin
    git checkout "$BRANCH" || git checkout -b "$BRANCH" "origin/$BRANCH"
    git reset --hard "origin/$BRANCH"
fi

# Install python dependencies only if requirements.txt changed
if [ -f "$REQ_FILE" ]; then
    CURRENT_HASH=$(sha256sum "$REQ_FILE" | awk '{print $1}')
    PREV_HASH=$(cat "$REQ_HASH_FILE" 2>/dev/null || echo "")

    if [ "$CURRENT_HASH" != "$PREV_HASH" ]; then
        echo "Installing/updating Python dependencies..."
        pip install --no-cache-dir -r "$REQ_FILE"
        echo "$CURRENT_HASH" > "$REQ_HASH_FILE"
    else
        echo "Python dependencies unchanged, skipping install."
    fi
fi

# Start the app
cd "$BACKEND_DIR"
exec python main.py
