@echo off
title CanteenLive - Live Local Server + Public Cloudflare Tunnel
echo ======================================================================
echo           CanteenLive - Live Server + Public Tunnel URL              
echo ======================================================================
echo.
echo 1. Starting local frontend server on http://localhost:5173...
start "CanteenLive Local Server" cmd /k "cd /d "%~dp0client" && npm.cmd run dev"

echo 2. Waiting 3 seconds for server to initialize...
timeout /t 3 /nobreak >nul

echo.
echo ======================================================================
echo 3. Starting Cloudflare Public Tunnel...
echo    Watch the terminal below for your live public HTTPS link:
echo    e.g. https://[random-subdomain].trycloudflare.com
echo    Share that link with your professor to view on any laptop or phone!
echo ======================================================================
echo.
"C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel --url http://localhost:5173
pause
