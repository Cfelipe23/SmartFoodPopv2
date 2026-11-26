# compartir.ps1 — Levanta SmartFoodPop y la publica por HTTPS con un túnel de Cloudflare para probarla desde un celular.
#
# Uso:  powershell -ExecutionPolicy Bypass -File compartir.ps1
#
# - Comparte el build de PRODUCCIÓN del frontend (vite preview en :4173). No muestra los botones de acceso rápido
#   con las cuentas demo, que solo existen en `npm run dev`.
# - Todo va por un solo origen: el celular pide /api al túnel y vite preview lo reenvía al backend (:5000).
# - Si `npm run dev` ya está corriendo, reutiliza ese backend.
# - El enlace https://...trycloudflare.com cambia cada vez que se abre el túnel. Queda en ENLACE_CELULAR.txt y,
#   si existe aviso-celular.txt (ntfy=..., no se sube a git), llega como notificación al celular.
# - Si el túnel se cae (el PC perdió la red), tunel-vigilante.ps1 abre otro y avisa del enlace nuevo.
# - Para apagar todo: cerrar las ventanas "SmartFoodPop backend", "SmartFoodPop frontend" y "SmartFoodPop tunel".
# - Cualquiera con el enlace puede usar la app. Las cuentas demo tienen contraseñas conocidas: cámbialas antes
#   de compartir el enlace fuera de tu equipo de trabajo.

$ErrorActionPreference = 'Stop'
$raiz = $PSScriptRoot
$cloudflared = Join-Path $env:LOCALAPPDATA 'cloudflared\cloudflared.exe'
$archivoEnlace = Join-Path $raiz 'ENLACE_CELULAR.txt'
$archivoAviso = Join-Path $raiz 'aviso-celular.txt'
$avisoRutaPopa = 'C:\Users\jupiter\Documents\datos no lineales\App de rutas para repartidores\aviso-celular.txt'

function Esperar($descripcion, $segundos, [scriptblock]$listo) {
    Write-Host "Esperando $descripcion..." -ForegroundColor Yellow
    for ($i = 0; $i -lt $segundos; $i += 2) {
        if (& $listo) { Write-Host "[OK] $descripcion" -ForegroundColor Green; return $true }
        Start-Sleep -Seconds 2
    }
    Write-Host "[ERROR] $descripcion no respondió en $segundos s" -ForegroundColor Red
    return $false
}

function Salud([string]$url) {
    try { return Invoke-RestMethod $url -TimeoutSec 3 } catch { return $null }
}

if (-not (Test-Path $cloudflared)) { throw "No se encontró $cloudflared" }
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Node.js no está instalado (https://nodejs.org)' }

# Mismo tema de ntfy que RutaPopa: se copia una vez desde ese proyecto (queda fuera de git).
if (-not (Test-Path $archivoAviso) -and (Test-Path $avisoRutaPopa)) {
    Copy-Item $avisoRutaPopa $archivoAviso
    Write-Host '[OK] Aviso por ntfy configurado con el mismo tema de RutaPopa' -ForegroundColor Green
}

# 1. Dependencias (solo la primera vez)
foreach ($parte in 'backend', 'frontend') {
    if (-not (Test-Path (Join-Path $raiz "$parte\node_modules"))) {
        Write-Host "Instalando dependencias del $parte..." -ForegroundColor Yellow
        cmd /c "npm --prefix `"$(Join-Path $raiz $parte)`" ci"
        if ($LASTEXITCODE -ne 0) { throw "No se pudieron instalar las dependencias del $parte" }
    }
}

# 2. Base de datos: la configura db:setup una sola vez (pide la clave de postgres). Sin ella, la app va en memoria.
if (-not (Test-Path (Join-Path $raiz 'backend\.env'))) {
    Write-Host 'Configurando la base de datos PostgreSQL (solo la primera vez)...' -ForegroundColor Yellow
    cmd /c "npm --prefix `"$(Join-Path $raiz 'backend')`" run db:setup --silent"
    if ($LASTEXITCODE -ne 0) { Write-Host '[AVISO] Sin base de datos: usuarios, reseñas y guardados se pierden al cerrar.' -ForegroundColor Yellow }
}

# 3. Backend (en su propia ventana)
if (-not (Salud 'http://localhost:5000/api/health')) {
    $backend = Join-Path $raiz 'backend'
    Start-Process powershell -WorkingDirectory $backend -ArgumentList '-NoExit', '-Command',
        "`$Host.UI.RawUI.WindowTitle = 'SmartFoodPop backend'; npm run build; if (`$LASTEXITCODE -eq 0) { npm start }"
    if (-not (Esperar 'el backend' 180 { [bool](Salud 'http://localhost:5000/api/health') })) { exit 1 }
} else {
    Write-Host '[OK] El backend ya estaba corriendo' -ForegroundColor Green
}
$almacen = (Salud 'http://localhost:5000/api/health').storage
if ($almacen -ne 'postgres') { Write-Host '[AVISO] El backend funciona EN MEMORIA: los datos se pierden al cerrarlo.' -ForegroundColor Yellow }

# 4. Frontend: build de producción que llama a /api en el mismo origen, servido por vite preview.
$frontend = Join-Path $raiz 'frontend'
Write-Host 'Compilando el frontend...' -ForegroundColor Yellow
$env:VITE_API_URL = '/api'
cmd /c "npm --prefix `"$frontend`" run build --silent"
Remove-Item Env:VITE_API_URL
if ($LASTEXITCODE -ne 0) { throw 'No se pudo compilar el frontend' }
if (-not (Salud 'http://localhost:4173/api/health')) {
    Start-Process powershell -WorkingDirectory $frontend -ArgumentList '-NoExit', '-Command',
        "`$Host.UI.RawUI.WindowTitle = 'SmartFoodPop frontend'; npm run preview"
    if (-not (Esperar 'el frontend' 60 { [bool](Salud 'http://localhost:4173/api/health') })) { exit 1 }
} else {
    Write-Host '[OK] El frontend ya estaba corriendo (sirve el build recién compilado)' -ForegroundColor Green
}

# 5. Túnel HTTPS, vigilado: si Cloudflare lo borra (el PC perdió la red), se abre otro solo.
if (Test-Path $archivoEnlace) { Remove-Item $archivoEnlace -Force }
$vigilante = Join-Path $raiz 'tunel-vigilante.ps1'
Start-Process powershell -ArgumentList '-NoExit', '-ExecutionPolicy', 'Bypass', '-File', "`"$vigilante`""
if (-not (Esperar 'el enlace del túnel' 90 { Test-Path $archivoEnlace })) { exit 1 }
$enlace = [System.IO.File]::ReadAllText($archivoEnlace)

Write-Host ''
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host "  Abre en el celular:  $enlace" -ForegroundColor White
Write-Host '  (también quedó en ENLACE_CELULAR.txt y llega por ntfy si está configurado)' -ForegroundColor Gray
Write-Host '  Si el túnel se cae, la ventana "SmartFoodPop tunel" abre otro y avisa del enlace nuevo.' -ForegroundColor Gray
Write-Host '============================================================' -ForegroundColor Cyan
