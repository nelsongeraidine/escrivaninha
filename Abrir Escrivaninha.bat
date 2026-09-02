@echo off
title Escrivaninha
cd /d "%~dp0"

REM Segundo duplo-clique com o app ja rodando: --strictPort abortaria com erro
REM vermelho. Se a porta 5173 ja escuta, so reabre o navegador e sai limpo.
netstat -ano | findstr ":5173 " | findstr LISTENING >nul
if not errorlevel 1 (
  start "" "http://localhost:5173"
  echo A Escrivaninha ja esta aberta.
  exit /b 0
)

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
