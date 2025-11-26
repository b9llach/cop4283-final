# NBA Championship Predictor

## Project Overview

This is a full-stack data science project that predicts NBA championship winners. It uses a machine learning model trained on a large dataset of NBA games from Kaggle. The project has a Python/FastAPI backend that serves the ML model's predictions and a Next.js/React frontend that displays the predictions and other insights using interactive Vega-Lite charts.

**Key Technologies:**

*   **Backend:** Python 3.12, FastAPI, scikit-learn, pandas, XGBoost, LightGBM, CatBoost
*   **Frontend:** Next.js 14, TypeScript, React, Tailwind CSS, Vega-Lite
*   **Database:** SQLite
*   **ML Model:** An ensemble of XGBoost, LightGBM, and CatBoost models.

**Architecture:**

The project is structured as a monorepo with two main components:

*   `backend/`: A Python application that provides a REST API for accessing the ML model's predictions.
*   `frontend/`: A Next.js web application that consumes the backend API and visualizes the data.

The project also includes scripts for training the ML model (`train_elite_model.py`) and for setting up the required data (`setup_data.py`).

## Building and Running

The project includes convenient scripts for setting up and running the application.

**Automated Setup (Recommended):**

*   **Windows:**
    ```batch
    run.bat
    ```
*   **Linux/Mac:**
    ```bash
    chmod +x run.sh
    ./run.sh
    ```

These scripts will:
1.  Create a Python virtual environment.
2.  Install all Python and Node.js dependencies.
3.  Download the NBA dataset from Kaggle (requires Kaggle API credentials).
4.  Start the backend server on `http://localhost:8000`.
5.  Start the frontend server on `http://localhost:3000`.

**Manual Setup:**

**Terminal 1 - Backend:**
```bash
# Activate virtual environment (Linux/Mac)
source .venv/bin/activate

# Activate virtual environment (Windows)
.venv\Scripts\activate

# Start backend server
python -m uvicorn backend.app.main:app --port 8000 --reload
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install
npm run dev
```

The application will be available at `http://localhost:3000`.

## Development Conventions

*   **Code Style:** The project uses `flake8` for Python linting and `next lint` for TypeScript/JavaScript linting.
*   **Testing:** The `README.md` mentions `pytest` for backend tests and `npm test` for frontend tests, although no test files are visible in the provided file structure.
*   **Dependencies:** Python dependencies are managed with `pip` and `requirements.txt`. Frontend dependencies are managed with `npm` and `package.json`.
*   **Data:** The project uses a Kaggle dataset. The `setup_data.py` script handles the download and setup of this data. This requires Kaggle API credentials to be set up on the user's machine.
