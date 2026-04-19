#!/bin/bash

# Navigate to project root
cd "$(dirname "$0")/.."

echo "--- Pulling latest changes ---"
git pull

# Create venv if it doesn't exist
if [ ! -d ".venv" ]; then
    echo "--- Creating virtual environment ---"
    python3 -m venv .venv
fi

# Activate virtual environment
echo "--- Activating virtual environment ---"
source .venv/bin/activate

# Install requirements
echo "--- Installing requirements ---"
pip install -r requirements.txt

# Kill existing server if running
if [ -f "logs/server.pid" ]; then
    echo "--- Stopping existing server ---"
    kill $(cat logs/server.pid) 2>/dev/null
    rm logs/server.pid
fi

# Start server in background
echo "--- Starting server in background ---"
mkdir -p logs
cd server
nohup python main.py > ../logs/server.log 2>&1 &
echo $! > ../logs/server.pid

echo "--- Setup complete! ---"
echo "Server is running in the background (PID: $(cat ../logs/server.pid))"
echo "Logs are being written to logs/server.log"
