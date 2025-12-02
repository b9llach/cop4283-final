@echo off

REM No data setup needed - backend works without database

echo [1/4] Creating venv...
python -m venv .venv

echo [2/4] Installing Python packages...
call .venv\Scripts\activate
pip install --no-cache-dir pandas numpy scikit-learn xgboost lightgbm catboost joblib fastapi uvicorn pydantic python-multipart

echo [3/4] Installing frontend...
cd frontend
call npm install
cd ..

echo [4/4] Starting servers...

start "Backend" cmd /k "call .venv\Scripts\activate && python -m uvicorn backend.app.main:app --port 8000 --reload"

timeout /t 5 /nobreak >nul

start "Frontend" cmd /k "cd frontend && npm run dev"

timeout /t 5 /nobreak >nul
start http://localhost:3000

echo.
echo DONE! Website at http://localhost:3000
pause
