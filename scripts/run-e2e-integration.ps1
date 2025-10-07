param(
    [int]$Port = 3001,
    [int]$WaitSeconds = 60
)

Write-Host "Starting backend server (node server/index.js)..."
$proc = Start-Process -FilePath "node" -ArgumentList "server/index.js" -NoNewWindow -PassThru
$backendPid = $proc.Id
Write-Host "Backend started with PID $backendPid"

Write-Host "Waiting for backend to be reachable on 127.0.0.1:$Port (timeout ${WaitSeconds}s)"
$attempts = 0
$maxAttempts = $WaitSeconds
while ($attempts -lt $maxAttempts) {
    $attempts++
    try {
        $ok = Test-NetConnection -ComputerName 127.0.0.1 -Port $Port -InformationLevel Quiet
    } catch {
        $ok = $false
    }
    if ($ok) {
        Write-Host "Backend is reachable (after $attempts s)"
        break
    }
    Start-Sleep -Seconds 1
}

if (-not $ok) {
    Write-Host "Backend did not become reachable after $WaitSeconds seconds. Stopping backend (PID $backendPid) and exiting with error." -ForegroundColor Red
    try { Stop-Process -Id $backendPid -Force -ErrorAction SilentlyContinue } catch {}
    exit 1
}

Write-Host "Running Playwright integration tests..."
try {
    # Run Playwright tests (will use playwright.config.ts)
    npx playwright test --grep "integration" --reporter=list
    $exitCode = $LASTEXITCODE
} catch {
    $exitCode = $LASTEXITCODE
}

Write-Host "Playwright finished with exit code $exitCode"

Write-Host "Stopping backend (PID $backendPid)"
try { Stop-Process -Id $backendPid -Force -ErrorAction SilentlyContinue } catch {}

exit $exitCode
