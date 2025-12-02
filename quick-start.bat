@echo off
echo NBA Championship Predictor - Quick Start
echo ==========================================
echo.

REM Create venv if needed
if not exist ".venv" (
    echo Creating virtual environment...
    python -m venv .venv
)

REM Activate
call .venv\Scripts\activate.bat

REM Install ONLY essential packages (no optuna, no kagglehub if it fails)
echo Installing essential packages...
pip install --no-cache-dir pandas numpy scikit-learn xgboost lightgbm catboost joblib fastapi uvicorn pydantic

REM Install frontend
if not exist "frontend\node_modules" (
    echo Installing frontend...
    cd frontend
    npm install
    cd ..
)

echo.
echo Starting servers...
echo.

REM Start backend
start "Backend" cmd /k "call .venv\Scripts\activate.bat && python -m uvicorn backend.app.main:app --port 8000"

REM Wait
timeout /t 3 /nobreak > nul

REM Start frontend
cd frontend
start "Frontend" cmd /k "npm run dev"
cd ..

REM Wait and open browser
timeout /t 3 /nobreak > nul
start http://localhost:3000

echo.
echo ==========================================
echo RUNNING at http://localhost:3000
echo ==========================================
echo.
pause
