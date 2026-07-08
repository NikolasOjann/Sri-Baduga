@echo off
echo Creating frontend directory...
mkdir frontend

echo Moving frontend files to frontend/ ...
move src frontend\
move public frontend\ 2>nul
move index.html frontend\
move vite.config.js frontend\
move package.json frontend\
move package-lock.json frontend\
move node_modules frontend\
move move_to_frontend.js frontend\ 2>nul

echo Folder structure updated successfully!
echo.
echo Note: If you want to run the project, navigate into the frontend folder:
echo cd frontend
echo npm run dev
pause
