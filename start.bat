@echo off
echo Starting Flask backend...
start "Flask API" cmd /k "cd /d %~dp0 && python api.py"

echo Waiting for Flask to start...
timeout /t 3 /nobreak >nul

echo Starting React frontend...
start "React UI" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ========================================
echo   QueryMind is starting!
echo ========================================
echo.
echo   Flask API:  http://localhost:5001
echo   React UI:   http://localhost:5173
echo.
echo   Open http://localhost:5173 in your browser
echo.
pause
