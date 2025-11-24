# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NBA Championship Predictor - A data science project that predicts NBA championship winners using an elite ensemble machine learning model (XGBoost + LightGBM + CatBoost) trained on 60,000+ NBA games. The system achieves 1.000 ROC-AUC through advanced feature engineering and hyperparameter optimization.

**Tech Stack:**
- Backend: FastAPI + Python 3.12
- Frontend: Next.js 14 + TypeScript + Tailwind CSS
- ML: XGBoost, LightGBM, CatBoost with Optuna optimization
- Data: Kaggle NBA dataset (SQLite, 697MB)

## Running the Application

### Development

**Windows:**
```bash
run.bat
```

**Linux/Mac:**
```bash
chmod +x run.sh
./run.sh
```

The scripts automatically:
- Create Python virtual environment
- Install all dependencies
- Download NBA dataset from Kaggle (first run only)
- Start backend on http://localhost:8000
- Start frontend on http://localhost:3000

### Manual Start

**Backend:**
```bash
# Windows
.venv\Scripts\activate
python -m uvicorn backend.app.main:app --port 8000 --reload

# Linux/Mac
source .venv/bin/activate
python -m uvicorn backend.app.main:app --port 8000 --reload
```

**Frontend:**
```bash
cd frontend
npm install  # First time only
npm run dev
```

### Model Training

Retrain the elite ensemble model (takes 10-15 minutes):
```bash
# Windows
.venv\Scripts\activate

# Linux/Mac
source .venv/bin/activate

# Train
python backend/train_elite_model.py
```

## Architecture

### Data Flow
1. **Data Layer**: Kaggle NBA dataset → SQLite database (downloaded via `setup_data.py`)
2. **Processing Layer**: `train_elite_model.py` extracts features and trains ensemble models
3. **API Layer**: FastAPI (`backend/app/main.py`) serves predictions via REST endpoints
4. **Frontend Layer**: Next.js fetches from API and renders Vega-Lite visualizations

### Machine Learning Pipeline

**Feature Engineering (42 features):**
- Core performance: wins, win_pct, ppg, opp_ppg, point_diff, fg_pct, ft_pct, fg3_pct
- Advanced stats: fg3m, opp_fg3_pct, fg3_diff, apg, rpg, spg, bpg, oreb, dreb, reb_diff, tov
- Efficiency metrics: oreb_rate, dreb_rate, tov_diff, ast_tov_ratio, defensive_pressure, pressure_diff, ft_rate
- Advanced efficiency: off_efficiency, def_efficiency, efficiency_diff, discipline, recent_win_pct, recent_point_diff, momentum
- Elite additions: pts_paint, pts_2nd_chance, pts_fb, pts_off_to, paint_dominance, 2nd_chance_edge, transition_edge, defensive_points, paint_pct

**Model Architecture:**
- Elite Ensemble: Average predictions from 3 optimized models
- XGBoost: Gradient boosting optimized via Optuna (30 trials)
- LightGBM: Fast gradient boosting optimized via Optuna (30 trials)
- CatBoost: Categorical boosting optimized via Optuna (30 trials)
- Preprocessing: StandardScaler for feature normalization
- Validation: 5-fold StratifiedKFold cross-validation

**Model Files:**
- `models/xgboost_elite.joblib` - XGBoost component
- `models/lightgbm_elite.joblib` - LightGBM component
- `models/catboost_elite.joblib` - CatBoost component
- `models/scaler_elite.joblib` - StandardScaler
- `models/model_metadata_elite.json` - Performance metrics and feature names

### Key Files

**Backend:**
- `backend/app/main.py` - FastAPI application with all REST endpoints
- `backend/train_elite_model.py` - Elite ensemble model training with Optuna optimization
- `backend/models/latest_predictions_elite.csv` - Latest season predictions
- `backend/models/all_seasons_predictions_with_playoffs.csv` - Historical accuracy data
- `backend/models/season_predictions/` - Per-season predictions (2003-2022)

**Frontend:**
- `frontend/app/page.tsx` - Main predictions page with Vega-Lite charts
- `frontend/app/components/VegaChart.tsx` - Dynamic Vega-Lite chart component
- `frontend/app/features/page.tsx` - Feature importance visualization
- `frontend/app/historical/page.tsx` - Historical accuracy visualization

**Data:**
- `data/config.json` - Database path configuration
- `setup_data.py` - Kaggle dataset download script

## API Endpoints

- `GET /` - API information
- `GET /health` - Health check
- `GET /predictions` - Latest season championship predictions
- `GET /predictions/{season}` - Season-specific predictions
- `GET /seasons` - Available seasons list
- `GET /actual-champion/{season}` - Actual champion vs prediction
- `GET /teams` - All NBA teams
- `GET /features` - Ensemble-averaged feature importance
- `GET /historical` - Historical prediction accuracy
- `POST /predict` - Custom prediction (accepts 33 features, pads to 42 internally)

## Database Schema

The Kaggle NBA dataset includes these key tables:
- `game` - 60K+ games with 55 stat columns (season_id, team_id_home, team_id_away, pts_home, pts_away, fg_pct_home, fg3_pct_away, etc.)
- `other_stats` - Advanced stats (pts_paint, pts_2nd_chance, pts_fb, pts_off_to)
- `team` - 30 teams with metadata (id, full_name, abbreviation)

**Important:** Data is filtered to `season_type = 'Regular Season'` and `season_id >= 22003` (2003 onwards).

## Prerequisites

- Python 3.12+
- Node.js 18+
- Kaggle API credentials (`~/.kaggle/kaggle.json` or `C:\Users\YourName\.kaggle\kaggle.json`)
- ~1GB free disk space for dataset

## User-Specific Requirements

When updating the ML models or database schema, provide the SQL for Neon DB. Do not use emojis in print statements.
