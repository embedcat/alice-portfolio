@echo off
setlocal
set "ALICE_EDITOR_NODE="
for /f "delims=" %%N in ('where node.exe 2^>nul') do if not defined ALICE_EDITOR_NODE set "ALICE_EDITOR_NODE=%%N"
if not defined ALICE_EDITOR_NODE if exist "%~dp0..\..\.tools\node\node.exe" set "ALICE_EDITOR_NODE=%~dp0..\..\.tools\node\node.exe"
if not defined ALICE_EDITOR_NODE (
  echo Node.js not found. Install Node.js 20 or newer, then restart the terminal.
  exit /b 1
)
if not defined HUGO_BINARY (
  where hugo.exe >nul 2>nul
  if errorlevel 1 if exist "%~dp0..\..\.tools\hugo\hugo.exe" set "HUGO_BINARY=%~dp0..\..\.tools\hugo\hugo.exe"
)
"%ALICE_EDITOR_NODE%" "%~dp0server.mjs" %*
exit /b %errorlevel%
