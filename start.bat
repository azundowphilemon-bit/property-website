@echo off
echo ==========================================
echo    STARTING FALIBARIPRO PROJECT
echo ==========================================
echo.

:: Start Backend in a new window
echo [1/2] Starting Backend Server...
start powershell -NoExit -Command "echo 'Starting Backend...'; cd backend; python -m uvicorn main_new:app --reload --port 8007"

:: Start Frontend in a new window
echo [2/2] Starting Next.js Frontend Server...
start powershell -NoExit -Command "echo 'Starting Frontend...'; cd frontend; npm run dev"

echo.
echo ==========================================
echo    BOTH SERVERS ARE STARTING UP!
echo    Backend: http://127.0.0.1:8007
echo    Frontend: http://localhost:3000
echo ==========================================
echo.
echo Waiting a few seconds for the frontend server to be ready...
timeout /t 5 /nobreak >nul
echo Opening your browser to http://localhost:3000...
start http://localhost:3000

pause
