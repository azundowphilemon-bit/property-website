@echo off
echo ==========================================
echo    SETTING UP PROJECT DEPENDENCIES
echo ==========================================
echo.

echo [1/2] Installing Backend Dependencies (Python)...
cd backend
pip install fastapi uvicorn sqlalchemy python-jose requests passlib python-multipart
cd ..

echo.
echo [2/2] Installing Frontend Dependencies (Node.js)...
cd frontend
npm install
cd ..

echo.
echo ==========================================
echo    DEPENDENCIES INSTALLED SUCCESSFULLY!
echo    You can now run START_PROJECT.bat
echo ==========================================
echo.
pause
