@echo off
REM dsh-win-desktop ? Zero-dependency Windows Desktop plugin launcher
setlocal enabledelayedexpansion

set "SCRIPT_DIR=%~dp0"
set "ROOT_DIR=%SCRIPT_DIR%.."

set "NODE_EXE="
if exist "%ROOT_DIR%\node.exe" set "NODE_EXE=%ROOT_DIR%\node.exe"
if not defined NODE_EXE where node >nul 2>&1 && set "NODE_EXE=node"

if not defined NODE_EXE (
    echo Error: Node.js not found. Please install Node.js ^>= 22.
    exit /b 1
)

"%NODE_EXE%" "%ROOT_DIR%\scripts\standalone-dsh.cjs" %*
