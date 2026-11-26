@echo off
setlocal
chcp 65001 >nul
title SmartFoodPop
cd /d "%~dp0"

echo ====================================================
echo   SmartFoodPop - preparando y arrancando la app
echo ====================================================
echo.

rem --- 1. Node.js 20.19 o superior (lo exige Vite) ---
where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js no esta instalado. Descarga la version LTS de https://nodejs.org y vuelve a abrir este archivo.
  goto :fin
)
node -e "const [a,b]=process.versions.node.split('.').map(Number);process.exit(a>22||a===22&&b>=12||a===20&&b>=19?0:1)"
if errorlevel 1 (
  echo [ERROR] Tu Node.js es muy antiguo. Instala la version LTS de https://nodejs.org ^(20.19 o superior^).
  goto :fin
)

rem --- 2. Dependencias de Node (incluye clones anteriores a TypeScript) ---
if not exist "backend\node_modules\typescript\bin\tsc" (
  echo Instalando dependencias del backend...
  call npm --prefix backend install
  if errorlevel 1 goto :error_npm
)
if not exist "frontend\node_modules" (
  echo Instalando dependencias del frontend...
  call npm --prefix frontend install
  if errorlevel 1 goto :error_npm
)

rem --- 3. Python para actualizar precios (opcional: sin el, la app usa los precios guardados) ---
where python >nul 2>nul
if errorlevel 1 (
  echo [AVISO] Python no esta instalado: la app funcionara con los precios guardados.
  echo         Para actualizar precios instala Python 3.10+ desde https://www.python.org
) else (
  python -c "import requests" >nul 2>nul
  if errorlevel 1 (
    echo Instalando dependencias del scraper...
    python -m pip install -r scraper\requirements.txt
  )
)

rem --- 4. Base de datos PostgreSQL (automatico, solo la primera vez) ---
if not exist "backend\.env" (
  echo.
  echo Configurando la base de datos PostgreSQL ^(solo la primera vez^)...
  call npm --prefix backend run db:setup --silent
  if errorlevel 1 (
    echo.
    echo [AVISO] La app arrancara SIN base de datos: usuarios, resenas y guardados se pierden al cerrarla.
    echo         Cuando PostgreSQL funcione, vuelve a abrir start.bat y se configurara solo.
  )
)

echo.
echo Arrancando backend, frontend y actualizacion de precios...
echo Abre en el navegador la direccion "Local" que muestra el FRONTEND ^(normalmente http://localhost:5173^).
echo Para detener la app: Ctrl+C
echo.
node run-dev.js %*
goto :fin

:error_npm
echo [ERROR] No se pudieron instalar las dependencias. Revisa tu conexion a internet y vuelve a intentarlo.

:fin
echo.
pause
