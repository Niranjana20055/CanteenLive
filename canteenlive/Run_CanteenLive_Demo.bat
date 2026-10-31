@echo off
title CanteenLive - Live Queue System
echo ===================================================
echo           CanteenLive - Live Web Application       
echo ===================================================
echo Starting frontend development server on port 5173...
echo Seamless fallback active: works with or without backend!
echo.
cd /d "%~dp0client"
start http://localhost:5173
call npm.cmd run dev
pause
