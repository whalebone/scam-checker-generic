@echo off
rem Stops the dev server started by runapp.bat (finds it by its port).
setlocal
rem Keep PORT in sync with vite.config.js and runapp.bat.
set "PORT=5190"
set "PID="

rem Listening sockets have a remote address ending in :0; the PID is the last column.
for /f "delims=" %%l in ('netstat -ano ^| findstr /R /C:":%PORT%  *[^ ]*:0 "') do for %%t in (%%l) do set "PID=%%t"

if defined PID (
  taskkill /PID %PID% /T /F >nul
  echo Dev server stopped.
) else (
  echo Dev server is not running.
)
timeout /t 2 >nul 2>nul
exit /b 0
