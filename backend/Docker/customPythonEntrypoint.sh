#!/bin/bash
set -e

REPO_URL="https://github.com/someRandomDude-a/VAT-Gate.git"
APP_DIR="/app"
BACKEND_DIR="$APP_DIR/backend"
REQ_FILE="$BACKEND_DIR/requirements.txt"
REQ_HASH_FILE="$APP_DIR/.requirements_hash"

# Clone the repo if it doesn't exist
if [ ! -d "$BACKEND_DIR" ]; then
    git clone "$REPO_URL" "$APP_DIR"
else
    # Pull latest changes
    cd "$APP_DIR"
    git reset --hard
    git pull
fi

# Install dependencies only if requirements.txt changed
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
