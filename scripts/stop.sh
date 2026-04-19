#!/bin/bash

# Navigate to project root
cd "$(dirname "$0")/.."

if [ -f "logs/server.pid" ]; then
    PID=$(cat logs/server.pid)
    echo "--- Stopping server (PID: $PID) ---"
    kill $PID
    rm logs/server.pid
    echo "--- Server stopped ---"
else
    echo "Error: server.pid not found. Is the server running?"
    # Fallback: try to find the process if PID file is missing
    PID=$(pgrep -f "python main.py")
    if [ ! -z "$PID" ]; then
        echo "Found running server process: $PID. Killing it..."
        kill $PID
        echo "--- Server stopped ---"
    fi
fi
