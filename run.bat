@echo off
echo NBA Championship Predictor
echo ==========================
echo.

REM Check if virtual environment exists
if not exist ".venv" (
    echo Creating Python virtual environment...
    python -m venv .venv
)

REM Activate virtual environment
echo Activating virtual environment...
call .venv\Scripts\activate.bat

REM Install Python dependencies
echo Installing Python dependencies...
pip install -r requirements.txt

REM Setup data if needed
echo Checking for NBA dataset...
python setup_data.py

REM Start backend in new window
echo Starting FastAPI backend on port 8000...
start "NBA Predictor - Backend" cmd /k "call .venv\Scripts\activate.bat && python -m uvicorn backend.app.main:app --port 8000 --reload"

REM Wait a moment for backend to start
timeout /t 3 /nobreak > nul

REM Check if frontend dependencies are installed
if not exist "frontend\node_modules" (
    echo Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
)

REM Start frontend in new window
echo Starting Next.js frontend on port 3000...
cd frontend
start "NBA Predictor - Frontend" cmd /k "npm run dev"
cd ..

echo.
echo ==========================
echo Application is running!
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:8000
echo ==========================
echo.
echo Close the backend and frontend windows to stop the servers
pause
