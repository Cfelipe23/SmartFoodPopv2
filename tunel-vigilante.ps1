# tunel-vigilante.ps1 — Mantiene vivo el túnel HTTPS de Cloudflare para probar SmartFoodPop desde el celular.
#
# Uso: lo abre compartir.ps1 en su propia ventana ("SmartFoodPop tunel"). Para apagarlo, cerrar esa ventana.
#
# Por qué existe: los túneles rápidos (trycloudflare.com, sin cuenta) mueren si el PC pierde la red un rato.
# Al volver, cloudflared repite "Unauthorized: Tunnel not found" para siempre y el enlace no vuelve.
# Este vigilante detecta eso, abre un túnel nuevo y deja el enlace nuevo en ENLACE_CELULAR.txt.
#
# - Usa HTTP/2 sobre TCP 443 en lugar de QUIC (UDP), que se corta más en redes caseras.
# - Solo cierra SU proceso de cloudflared: otro túnel (p. ej. el de RutaPopa) puede seguir abierto a la vez.
# - Mientras la ventana esté abierta, Windows no suspende el PC (si se suspende, el túnel muere).
# - Aviso al celular (opcional): aviso-celular.txt junto a este script (no se sube a git) con una o las dos líneas:
#     ntfy=NOMBRE-SECRETO-LARGO                       -> notificación en la app ntfy (suscribirse a ese nombre)
#     carpeta=C:\Users\jupiter\OneDrive\SmartFoodPop  -> copia ENLACE_CELULAR.txt ahí (se ve en la app de OneDrive)

param([string]$Url = 'http://localhost:4173')

$ErrorActionPreference = 'Continue'
$raiz = $PSScriptRoot
$cloudflared = Join-Path $env:LOCALAPPDATA 'cloudflared\cloudflared.exe'
$logTunel = Join-Path $raiz 'tunel.log'
$archivoEnlace = Join-Path $raiz 'ENLACE_CELULAR.txt'
$archivoAviso = Join-Path $raiz 'aviso-celular.txt'
$Host.UI.RawUI.WindowTitle = 'SmartFoodPop tunel'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 # PowerShell 5.1 no la usa por defecto

# Devuelve $true si el aviso quedó entregado (o no hay aviso configurado); $false si hay que reintentarlo.
function Avisar-Celular([string]$enlace) {
    if (-not (Test-Path $archivoAviso)) { return $true }
    $entregado = $true
    foreach ($linea in Get-Content $archivoAviso) {
        if ($linea -match '^\s*ntfy\s*=\s*(\S+)\s*$') {
            $tema = $Matches[1]
            try {
                Invoke-RestMethod -Method Post -Uri "https://ntfy.sh/$tema" -Body $enlace -TimeoutSec 15 `
                    -Headers @{ Title = 'SmartFoodPop: enlace nuevo'; Click = $enlace; Tags = 'shopping_cart' } | Out-Null
                Write-Host '  Aviso enviado al celular (ntfy).' -ForegroundColor Green
            } catch {
                Write-Host "  No se pudo enviar el aviso por ntfy (se reintenta en 15 s): $($_.Exception.Message)" -ForegroundColor Red
                $entregado = $false
            }
        } elseif ($linea -match '^\s*carpeta\s*=\s*(.+?)\s*$') {
            $carpeta = $Matches[1]
            try {
                New-Item -ItemType Directory -Force -Path $carpeta | Out-Null
                [System.IO.File]::WriteAllText((Join-Path $carpeta 'ENLACE_CELULAR.txt'), $enlace)
                Write-Host "  Enlace copiado en $carpeta" -ForegroundColor Green
            } catch {
                Write-Host "  No se pudo copiar el enlace en ${carpeta}: $($_.Exception.Message)" -ForegroundColor Red
            }
        }
    }
    return $entregado
}

# Enlace cuyo aviso al celular no se pudo entregar (p. ej. la red volvió a medias); se reintenta en el bucle.
$script:avisoPendiente = $null
$script:proceso = $null

if (-not (Test-Path $cloudflared)) { Write-Host "No se encontró $cloudflared" -ForegroundColor Red; exit 1 }

# Evitar que el PC se suspenda mientras esta ventana esté abierta (ES_CONTINUOUS | ES_SYSTEM_REQUIRED).
Add-Type -Namespace SmartFoodPop -Name Energia -MemberDefinition @'
[System.Runtime.InteropServices.DllImport("kernel32.dll")]
public static extern uint SetThreadExecutionState(uint esFlags);
'@
[void][SmartFoodPop.Energia]::SetThreadExecutionState([uint32]2147483649) # 0x80000001

function Iniciar-Tunel {
    if ($script:proceso -and -not $script:proceso.HasExited) {
        Stop-Process -Id $script:proceso.Id -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 1
    }
    if (Test-Path $logTunel) { Remove-Item $logTunel -Force -ErrorAction SilentlyContinue }
    if (Test-Path $archivoEnlace) { Remove-Item $archivoEnlace -Force -ErrorAction SilentlyContinue } # nunca dejar un enlace muerto
    $script:proceso = Start-Process $cloudflared -WindowStyle Hidden -PassThru -ArgumentList `
        'tunnel', '--no-autoupdate', '--protocol', 'http2', '--url', $Url, '--logfile', "`"$logTunel`""
    for ($i = 0; $i -lt 60; $i++) {
        Start-Sleep -Seconds 1
        if (Test-Path $logTunel) {
            $m = Select-String -Path $logTunel -Pattern 'https://[a-z0-9-]+\.trycloudflare\.com' | Select-Object -First 1
            if ($m) {
                $enlace = $m.Matches[0].Value
                [System.IO.File]::WriteAllText($archivoEnlace, $enlace) # sin BOM
                $script:avisoPendiente = if (Avisar-Celular $enlace) { $null } else { $enlace }
                Write-Host ''
                Write-Host '============================================================' -ForegroundColor Cyan
                Write-Host "  $(Get-Date -Format 'HH:mm:ss')  Abre en el celular:  $enlace" -ForegroundColor White
                Write-Host '  (también quedó en ENLACE_CELULAR.txt)' -ForegroundColor Gray
                Write-Host '============================================================' -ForegroundColor Cyan
                return
            }
        }
    }
    Write-Host "$(Get-Date -Format 'HH:mm:ss')  Cloudflare no entregó un enlace en 60 s; se reintentará." -ForegroundColor Red
}

# Al cerrar la ventana (o con Ctrl+C) se cierra también este túnel.
try {
    Iniciar-Tunel
    while ($true) {
        Start-Sleep -Seconds 15
        $muerto = $script:proceso.HasExited
        $borrado = (Test-Path $logTunel) -and (Select-String -Path $logTunel -Pattern 'Tunnel not found' -Quiet)
        $sinEnlace = -not (Test-Path $archivoEnlace)
        if ($muerto -or $borrado -or $sinEnlace) {
            $motivo = if ($borrado) { 'Cloudflare borró el túnel (se perdió la red)' } elseif ($muerto) { 'cloudflared se cerró' } else { 'no había enlace' }
            Write-Host "$(Get-Date -Format 'HH:mm:ss')  $motivo. Abriendo un túnel nuevo: el enlace cambia." -ForegroundColor Yellow
            try { [console]::Beep(880, 300) } catch { }
            Iniciar-Tunel
        } elseif ($script:avisoPendiente) {
            # El túnel está bien, pero el aviso al celular no llegó: reintentar hasta que llegue.
            if (Avisar-Celular $script:avisoPendiente) { $script:avisoPendiente = $null }
        }
    }
} finally {
    if ($script:proceso -and -not $script:proceso.HasExited) { Stop-Process -Id $script:proceso.Id -Force -ErrorAction SilentlyContinue }
}
