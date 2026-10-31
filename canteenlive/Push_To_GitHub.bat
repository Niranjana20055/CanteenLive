@echo off
title CanteenLive - Git Push to GitHub
echo ===================================================
echo           CanteenLive - Push to GitHub             
echo ===================================================
cd /d "%~dp0"
echo Staging all changes...
git add .
echo Committing changes...
git commit -m "Implement zero-backend live demo, mock store engine, 1-click personas, and project documentation"
echo Pushing to GitHub (main branch)...
git push origin main
echo.
echo If GitHub asks for credentials, please enter your Personal Access Token (PAT).
echo ===================================================
pause
