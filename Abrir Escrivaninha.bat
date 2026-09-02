@echo off
title Escrivaninha
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js nao encontrado. Instale em https://nodejs.org e tente de novo.
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo Preparando a Escrivaninha pela primeira vez, aguarde...
  call npm install
  if errorlevel 1 (
    echo Falha ao instalar. Verifique a conexao e tente de novo.
    pause
    exit /b 1
  )
)

echo Abrindo a Escrivaninha... Feche esta janela para encerrar.
start "" "http://localhost:5173"
call npm run dev -- --port 5173 --strictPort
pause
