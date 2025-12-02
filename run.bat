@echo off
setlocal enabledelayedexpansion

echo NBA Championship Predictor
echo ===========================
echo.

REM Check Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found! Install Python first.
    pause
    exit /b 1
)

REM Create venv if needed
if not exist ".venv" (
    echo [1/4] Creating Python virtual environment...
    python -m venv .venv
    if errorlevel 1 (
        echo ERROR: Failed to create virtual environment
        pause
        exit /b 1
    )
    echo Virtual environment created!
) else (
    echo [1/4] Virtual environment exists
)

REM Activate venv
echo [2/4] Activating virtual environment...
if exist ".venv\Scripts\activate.bat" (
    call .venv\Scripts\activate.bat
) else (
    echo ERROR: activate.bat not found
    pause
    exit /b 1
)

REM Install Python packages if needed
echo [3/4] Checking Python packages...
python -c "import catboost" >nul 2>&1
if errorlevel 1 (
    echo Installing Python packages (this may take a few minutes)...
    pip install --no-cache-dir pandas numpy scikit-learn xgboost lightgbm catboost joblib fastapi uvicorn pydantic python-multipart
    if errorlevel 1 (
        echo WARNING: Some packages failed to install
        echo Trying to continue anyway...
    )
) else (
    echo Python packages OK
)

REM Check Node.js installed
where npm >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js/npm not found! Install Node.js first.
    pause
    exit /b 1
)

REM Install frontend if needed
echo [4/4] Checking frontend packages...
if not exist "frontend\node_modules" (
    echo Installing frontend packages...
    cd frontend
    call npm install
    if errorlevel 1 (
        cd ..
        echo ERROR: npm install failed
        pause
        exit /b 1
    )
    cd ..
    echo Frontend packages installed!
) else (
    echo Frontend packages OK
)

echo.
echo ===========================
echo Starting servers...
echo ===========================
echo.

REM Start backend
echo Starting backend...
start "Backend API" cmd /k "cd /d "%~dp0" && call .venv\Scripts\activate.bat && python -m uvicorn backend.app.main:app --port 8000 --reload"

REM Wait
timeout /t 5 /nobreak >nul

REM Start frontend
echo Starting frontend...
start "Frontend Web" cmd /k "cd /d "%~dp0frontend" && npm run dev"

REM Wait and open browser
timeout /t 5 /nobreak >nul
echo Opening browser...
start http://localhost:3000

echo.
echo ===========================
echo SUCCESS!
echo Website: http://localhost:3000
echo Backend: http://localhost:8000
echo ===========================
echo.
echo Press any key to exit (servers will keep running)
pause >nul
