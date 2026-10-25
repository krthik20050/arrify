param([int]$Port = 3001)
$ErrorActionPreference = 'Stop'
$taskRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$runtimePath = Join-Path $taskRoot 'artifacts/runtime'
$clientPath = Join-Path $runtimePath 'cloudflared.exe'
$configPath = Join-Path $runtimePath 'phone-preview.json'
if (!(Test-Path -LiteralPath $clientPath)) { throw 'Download the official cloudflared Windows executable to artifacts/runtime/cloudflared.exe first.' }
if (Test-Path -LiteralPath $configPath) {
  $previous = Get-Content -LiteralPath $configPath -Raw | ConvertFrom-Json
  $previousProcess = Get-Process -Id $previous.pid -ErrorAction SilentlyContinue
  if ($previousProcess -and $previousProcess.ProcessName -eq 'cloudflared') {
    Write-Output "Existing phone preview: $($previous.origin) (PID $($previous.pid))"
    exit 0
  }
}
$health = Invoke-RestMethod -Uri "http://127.0.0.1:$Port/api/health" -TimeoutSec 5
if (!$health.ok) { throw 'Start the local storefront before opening a phone preview.' }
$runId = [Guid]::NewGuid().ToString('N')
$outLog = Join-Path $runtimePath "phone-tunnel-$runId.out.log"
$errorLog = Join-Path $runtimePath "phone-tunnel-$runId.err.log"
$helper = Start-Process -FilePath $clientPath -ArgumentList @('--no-autoupdate','tunnel','--url',"http://127.0.0.1:$Port",'--protocol','http2') -WindowStyle Hidden -PassThru -RedirectStandardOutput $outLog -RedirectStandardError $errorLog
$deadline = [DateTime]::UtcNow.AddSeconds(45)
do {
  Start-Sleep -Milliseconds 500
  $helper.Refresh()
  if ($helper.HasExited) { throw "Phone tunnel exited. Inspect $errorLog" }
  $logText = if (Test-Path -LiteralPath $errorLog) { Get-Content -LiteralPath $errorLog -Raw } else { '' }
  $originMatch = [regex]::Match($logText,'https://[a-z0-9-]+\.trycloudflare\.com')
  if ($originMatch.Success) {
    $config = @{origin=$originMatch.Value;pid=$helper.Id;startedAt=[DateTime]::UtcNow.ToString('o');outLog=$outLog;errorLog=$errorLog}
    [System.IO.File]::WriteAllText($configPath,($config | ConvertTo-Json),[System.Text.UTF8Encoding]::new($false))
    Write-Output "Phone HTTPS preview: $($originMatch.Value)"
    Write-Output "Tunnel PID: $($helper.Id). Stop this process when the phone test is finished."
    exit 0
  }
} while ([DateTime]::UtcNow -lt $deadline)
throw "Tunnel startup did not return an address yet. Process $($helper.Id) may still be connecting; inspect $errorLog."
