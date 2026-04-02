@echo off
rem ─────────────────────────────────────────────────────────────────────────────
rem run_enrich.bat — Windows Task Scheduler launcher for enrich_moomoo.py
rem
rem Setup:
rem   1. Open Task Scheduler → Create Basic Task
rem   2. Trigger: Daily at 5:00 PM (after US market close)
rem   3. Action: Start a Program
rem      Program/script:  C:\path\to\invest-insight-innovator\pipeline\run_enrich.bat
rem   4. Ensure FutuOpenD is running before this task fires.
rem      (Schedule FutuOpenD to start at 9:00 AM via its own Task Scheduler entry.)
rem ─────────────────────────────────────────────────────────────────────────────

cd /d "%~dp0"

if not exist "logs" mkdir logs

echo [%date% %time%] Starting enrich_moomoo.py >> "logs\enrich_moomoo.log" 2>&1
python enrich_moomoo.py >> "logs\enrich_moomoo.log" 2>&1
echo [%date% %time%] enrich_moomoo.py exited with code %ERRORLEVEL% >> "logs\enrich_moomoo.log" 2>&1
