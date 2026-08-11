@echo off
set "BRAINSTORM_DIR=C:\Users\Miguel\Documents\New project\.superpowers\brainstorm\football-options-20260804"
set "BRAINSTORM_HOST=127.0.0.1"
set "BRAINSTORM_URL_HOST=localhost"
set "SUPERPOWERS_DISABLE_TELEMETRY=1"
cd /d "C:\Users\Miguel\.codex\superpowers\skills\brainstorming\scripts"
start "" /b node server.cjs
