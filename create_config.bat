@echo off
echo Creating data/config.json...

if not exist "data" mkdir data

echo {> data\config.json
echo   "db_path": "data/nba.sqlite">> data\config.json
echo }>> data\config.json

echo Done!
pause
