# Setup Guide for Group Members

This guide will help you set up the NBA Championship Predictor on your computer.

## Prerequisites

Before you start, install these programs:

1. **Python 3.12 or higher**
   - Download: https://www.python.org/downloads/
   - During installation, check "Add Python to PATH"

2. **Node.js 18 or higher**
   - Download: https://nodejs.org/
   - Use the LTS (Long Term Support) version

3. **Kaggle API Credentials** (required for data download)
   - Create account at https://www.kaggle.com/
   - Go to Account Settings > API > Create New Token
   - This downloads a file called kaggle.json

## Kaggle API Setup

### Windows
1. Create folder: `C:\Users\YourUsername\.kaggle`
2. Move `kaggle.json` to that folder
3. File should be at: `C:\Users\YourUsername\.kaggle\kaggle.json`

### Mac/Linux
1. Create folder: `~/.kaggle`
2. Move `kaggle.json` to that folder
3. Set permissions: `chmod 600 ~/.kaggle/kaggle.json`

## Running the Application

### Windows
1. Open the project folder
2. Double-click `run.bat`
3. Wait for setup to complete
4. Open browser to http://localhost:3000

### Mac/Linux
1. Open Terminal
2. Navigate to project folder: `cd path/to/finalproject`
3. Run: `chmod +x run.sh && ./run.sh`
4. Open browser to http://localhost:3000

## First Run

The first time you run the application:
- It will download the NBA dataset (697MB, takes 2-5 minutes)
- It will install all dependencies (takes 1-2 minutes)
- Future runs will be much faster

## Troubleshooting

### "kaggle.json not found"
- Make sure you completed the Kaggle API Setup above
- Check the file is in the correct location

### "Python not found"
- Reinstall Python and check "Add Python to PATH"
- Restart your computer after installing

### "Node/npm not found"
- Reinstall Node.js
- Restart your computer after installing

### Port already in use
- Close any other applications using ports 3000 or 8000
- Or change the ports in the run script

### Database errors
- Delete the `data` folder
- Run the script again to re-download

## What the Script Does

1. Creates Python virtual environment (`.venv` folder)
2. Installs Python packages from `requirements.txt`
3. Downloads NBA dataset from Kaggle (first run only)
4. Starts FastAPI backend on port 8000
5. Installs Node.js packages (first run only)
6. Starts Next.js frontend on port 3000

## Stopping the Application

### Windows
- Close both command windows (Backend and Frontend)

### Mac/Linux
- Press Ctrl+C in the terminal

## Project Structure

After setup, you should see:
```
finalproject/
├── .venv/                  # Python virtual environment
├── data/                   # NBA database (auto-downloaded)
├── models/                 # Pre-trained models (included)
├── backend/                # FastAPI server
├── frontend/               # Next.js app
│   └── node_modules/       # Node packages (auto-installed)
├── run.bat                 # Windows launcher
├── run.sh                  # Mac/Linux launcher
└── setup_data.py          # Data download script
```

## Need Help?

Contact the team or check:
- README.md for technical details
- Backend logs in the Backend window
- Frontend logs in the Frontend window
