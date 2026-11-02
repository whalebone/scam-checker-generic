@echo off
rem Starts the dev server in the background (with live reload) and opens the app in your browser.
rem Stop it with shutdown.bat. Server output goes to dev-server.log.
setlocal
cd /d "%~dp0"
rem Keep PORT in sync with vite.config.js and shutdown.bat.
set "PORT=5190"
set "URL=http://localhost:%PORT%/"

where npm >nul 2>nul || (
  echo Node.js is not installed. Get the LTS version from https://nodejs.org and run this again.
  pause
  exit /b 1
)

rem Already running? Then just open another tab.
call :is_running && goto open

echo Installing dependencies...
call npm install --no-audit --no-fund --loglevel=error || (
  pause
  exit /b 1
)

echo Starting dev server...
rem Detached background process without a window - keeps running after this window closes.
node -e "const log = require('fs').openSync('dev-server.log', 'w'); require('child_process').spawn(process.execPath, ['node_modules/vite/bin/vite.js'], { detached: true, stdio: ['ignore', log, log], windowsHide: true }).unref()"

rem Wait up to 30 seconds for it to come up.
for /l %%i in (1,1,30) do (
  ping -n 2 127.0.0.1 >nul
  call :is_running && goto open
)
echo The dev server did not start. Output from dev-server.log:
echo.
type dev-server.log
pause
exit /b 1

:open
start "" "%URL%"
echo Running on %URL% - edits reload live. Stop it with shutdown.bat.
timeout /t 3 >nul 2>nul
exit /b 0

rem Exit code 0 if a server is listening on PORT (listening sockets have a remote address ending in :0).
:is_running
netstat -ano | findstr /R /C:":%PORT%  *[^ ]*:0 " >nul
exit /b
