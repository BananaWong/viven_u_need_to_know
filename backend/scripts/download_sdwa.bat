@echo off
REM Fast SDWA data download using Windows built-in tools
REM Uses PowerShell with better performance

echo ========================================
echo Fast SDWA Data Downloader
echo ========================================
echo.

cd /d "%~dp0\.."

echo [1/3] Downloading SDWA data (this may take 10-30 minutes)...
echo File size: ~400 MB
echo Using PowerShell download (faster than Python urllib)...
echo.

powershell -Command "& { ^
    $ProgressPreference = 'SilentlyContinue'; ^
    $url = 'https://echo.epa.gov/files/echodownloads/SDWA_latest_downloads.zip'; ^
    $output = 'data\raw\sdwa_national.zip'; ^
    Write-Host 'Starting download...'; ^
    $start = Get-Date; ^
    try { ^
        Invoke-WebRequest -Uri $url -OutFile $output -TimeoutSec 3600; ^
        $end = Get-Date; ^
        $duration = ($end - $start).TotalMinutes; ^
        $sizeMB = (Get-Item $output).Length / 1MB; ^
        Write-Host ('Downloaded {0:N1} MB in {1:N1} minutes' -f $sizeMB, $duration); ^
        Write-Host 'Download successful!'; ^
    } catch { ^
        Write-Host 'Download failed:' $_.Exception.Message; ^
        exit 1; ^
    } ^
}"

if errorlevel 1 (
    echo.
    echo [ERROR] Download failed!
    echo.
    echo Alternative: Download manually from:
    echo https://echo.epa.gov/tools/data-downloads/sdwa-download-summary
    echo.
    echo Save as: data\raw\sdwa_national.zip
    pause
    exit /b 1
)

echo.
echo [2/3] Extracting data...
powershell -Command "Expand-Archive -Path 'data\raw\sdwa_national.zip' -DestinationPath 'data\raw\sdwa\' -Force"

echo.
echo [3/3] Ready to rebuild database!
echo.
echo Next step: Run this command to rebuild database:
echo     python scripts\build_database.py --force
echo.
pause
