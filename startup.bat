@echo off
title AgentHive — Dev Server
color 0A
cls

echo.
echo  ================================================
echo    ^>_^<  AgentHive — Starting Dev Environment
echo  ================================================
echo.

:: ─── Check Python ───────────────────────────────
where python >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found. Please install Python 3.11+
    pause
    exit /b 1
)

:: ─── Check Node ─────────────────────────────────
where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found. Please install Node.js 18+
    pause
    exit /b 1
)

:: ─────────────────────────────────────────────────
:: BACKEND — Create venv if needed, activate, install, run
:: ─────────────────────────────────────────────────
echo [1/3] Setting up Python virtual environment...
if not exist "backend\venv" (
    echo       Creating venv for the first time...
    python -m venv backend\venv
    if errorlevel 1 (
        echo [ERROR] Failed to create venv.
        pause
        exit /b 1
    )
    echo       Installing Python dependencies - this may take 1-2 minutes...
    call backend\venv\Scripts\activate.bat
    pip install --quiet -r backend\requirements.txt
    echo       [OK] Dependencies installed.
) else (
    echo       [OK] venv already exists. Activating...
    call backend\venv\Scripts\activate.bat
)

:: Copy .env if not present
if not exist "backend\.env" (
    if exist "backend\.env.example" (
        echo       [INFO] Copying .env.example to .env — fill in your keys!
        copy backend\.env.example backend\.env >nul
    )
)

echo [2/3] Starting FastAPI backend on http://localhost:8000 ...
start "AgentHive — FastAPI Backend" cmd /k "cd /d %~dp0backend && call venv\Scripts\activate.bat && echo. && echo  [BACKEND] FastAPI starting at http://localhost:8000 && echo  [BACKEND] API Docs at http://localhost:8000/docs && echo. && uvicorn main:app --reload --host 0.0.0.0 --port 8000"

:: Wait for backend to start
timeout /t 3 /nobreak >nul

:: ─────────────────────────────────────────────────
:: FRONTEND — Install deps if needed, then run
:: ─────────────────────────────────────────────────
echo [3/3] Setting up Next.js frontend...
if not exist "frontend\node_modules" (
    echo       Installing Node.js dependencies - this may take 2-3 minutes...
    cd frontend
    call npm install
    cd ..
    echo       [OK] Node modules installed.
) else (
    echo       [OK] node_modules already exist.
)

:: Copy .env.local if not present
if not exist "frontend\.env.local" (
    if exist "frontend\.env.local.example" (
        echo       [INFO] Copying .env.local.example to .env.local — fill in your keys!
        copy frontend\.env.local.example frontend\.env.local >nul
    )
)

echo.
echo  Starting Next.js frontend on http://localhost:3000 ...
start "AgentHive — Next.js Frontend" cmd /k "cd /d %~dp0frontend && echo. && echo  [FRONTEND] Next.js starting at http://localhost:3000 && echo. && npm run dev"

:: Wait then open browser
timeout /t 5 /nobreak >nul
start http://localhost:3000

echo.
echo  ================================================
echo   [OK] AgentHive is running!
echo.
echo   Frontend : http://localhost:3000
echo   Backend  : http://localhost:8000
echo   API Docs : http://localhost:8000/docs
echo.
echo   Close the terminal windows to stop the servers.
echo  ================================================
echo.
pause
