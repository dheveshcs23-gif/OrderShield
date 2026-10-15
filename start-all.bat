@echo off
title OrderShield Launcher
echo ===================================================
echo           OrderShield Full-Stack Launcher
echo ===================================================
echo.
echo Starting Spring Boot Backend on port 8085...
start "OrderShield Backend (Port 8085)" cmd /k "cd /d %~dp0backend && set ""JAVA_HOME=C:\Program Files\Java\jdk-17"" && mvn spring-boot:run"

echo Starting Vite React Frontend on port 5173...
start "OrderShield Frontend (Port 5173)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ---------------------------------------------------
echo Servers are booting up!
echo Frontend will be available at: http://localhost:5173
echo Backend REST API at:          http://localhost:8085/api
echo ---------------------------------------------------
timeout /t 5
