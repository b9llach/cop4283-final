#!/bin/bash

echo "NBA Championship Predictor"
echo "=========================="
echo ""

# Check if virtual environment exists
if [ ! -d ".venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv .venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source .venv/bin/activate

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Setup data if needed
echo "Checking for NBA dataset..."
python setup_data.py

# Start backend in background
echo "Starting FastAPI backend on port 8000..."
python -m uvicorn backend.app.main:app --port 8000 --reload &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Check if frontend dependencies are installed
if [ ! -d "frontend/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
fi

# Start frontend
echo "Starting Next.js frontend on port 3000..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "=========================="
echo "Application is running!"
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:8000"
echo "=========================="
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
