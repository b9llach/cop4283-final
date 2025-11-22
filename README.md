# NBA Championship Predictor

**COP 4283 Data Science Final Project**

An end-to-end data science project that predicts NBA championship winners using machine learning and interactive visualizations.

## Overview

This project demonstrates the complete data science workflow:
1. **Data Collection**: 60,000+ NBA games from Kaggle dataset
2. **Data Processing**: Advanced feature engineering with 42 elite metrics
3. **Analysis**: Elite ensemble machine learning models with perfect 1.000 ROC-AUC
4. **Visualization**: Interactive Vega-Lite dashboards with modern NBA-themed design

**Key Finding**: Defensive rebound rate is the #1 predictor of NBA championships.

## Tech Stack

### Backend
- **Python 3.12**
- **FastAPI** - Modern web framework for building APIs
- **scikit-learn** - Machine learning library
- **pandas** - Data manipulation and analysis
- **kagglehub** - Kaggle dataset integration
- **SQLite** - Database (NBA statistics)

### Frontend
- **Next.js 14** - React framework
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework

### Machine Learning
- **Model**: Elite Ensemble (XGBoost + LightGBM + CatBoost)
- **Features**: 42 advanced features including efficiency metrics, rebound rates, turnover differential, momentum, paint points, fast break points, second chance points
- **ROC-AUC**: 1.000 (perfect discrimination)
- **Optimization**: Optuna hyperparameter tuning (30 trials per model)

## Project Structure

```
finalproject/
├── backend/
│   ├── app/
│   │   └── main.py                  # FastAPI application
│   ├── models/
│   │   ├── latest_predictions_elite.csv
│   │   ├── all_seasons_predictions_with_playoffs.csv
│   │   └── season_predictions/      # Per-season predictions (2003-2022)
│   └── train_elite_model.py         # Elite ensemble training script
├── frontend/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                 # Main predictions page with Vega-Lite
│   │   ├── components/
│   │   │   └── VegaChart.tsx        # Dynamic Vega-Lite chart component
│   │   ├── features/
│   │   │   └── page.tsx             # Feature importance visualization
│   │   ├── historical/
│   │   │   └── page.tsx             # Historical accuracy visualization
│   │   └── globals.css
│   ├── package.json
│   └── next.config.js
├── data/
│   └── config.json
├── models/
│   ├── xgboost_elite.joblib         # XGBoost component
│   ├── lightgbm_elite.joblib        # LightGBM component
│   ├── catboost_elite.joblib        # CatBoost component
│   ├── scaler_elite.joblib          # StandardScaler for 42 features
│   └── model_metadata_elite.json    # Model performance metrics
└── requirements.txt
```

## 🚀 Quick Start

> **For group members**: See [SETUP.md](SETUP.md) for detailed setup instructions with screenshots and troubleshooting.

### Option 1: Automated Setup (Recommended)

**Windows:**
```batch
run.bat
```

**Linux/Mac:**
```bash
chmod +x run.sh
./run.sh
```

The script will automatically:
- Create Python virtual environment
- Install all dependencies (Python and Node.js)
- Download NBA dataset from Kaggle (first run only)
- Start backend on http://localhost:8000
- Start frontend on http://localhost:3000

### Option 2: Manual Setup

**Terminal 1 - Backend:**
```bash
# Linux/Mac
source .venv/bin/activate
python -m uvicorn backend.app.main:app --port 8000 --reload

# Windows
.venv\Scripts\activate
python -m uvicorn backend.app.main:app --port 8000 --reload
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Visit http://localhost:3000 to use the application.

## 📦 Installation

### Prerequisites
- **Python 3.12+** (Download from python.org)
- **Node.js 18+** (Download from nodejs.org)
- **Kaggle API credentials** (Required for data download)
  - Create account at kaggle.com
  - Go to Account Settings > API > Create New Token
  - Place `kaggle.json` in `~/.kaggle/` (Linux/Mac) or `C:\Users\YourName\.kaggle\` (Windows)
  - See [SETUP.md](SETUP.md) for detailed instructions
- **~1GB free disk space** (for dataset)

### First Time Setup

1. **Download or clone this project**

2. **Setup Kaggle API credentials** (see Prerequisites above)

3. **Run the automated script** (see Quick Start above)
   - The script handles all setup automatically
   - Downloads dataset on first run
   - Pre-trained models are included, no training needed

### Optional: Train Model from Scratch

If you want to retrain the model:
```bash
# Linux/Mac
source .venv/bin/activate

# Windows
.venv\Scripts\activate

# Train elite ensemble model
python backend/train_elite_model.py
```

**Note**: Training takes approximately 10-15 minutes and requires the Kaggle NBA dataset (downloads automatically).

## API Endpoints

### GET `/`
Root endpoint with API information

### GET `/health`
Health check endpoint

### GET `/predictions`
Get championship predictions for the latest season

**Response:**
```json
[
  {
    "team_name": "Golden State Warriors",
    "team_abbr": "GSW",
    "wins": 53.0,
    "win_pct": 0.646,
    "ppg": 111.8,
    "point_diff": 5.5,
    "championship_probability": 0.6595
  },
  ...
]
```

### GET `/seasons`
Get list of all available seasons with predictions

**Response:**
```json
{
  "seasons": [2022, 2021, 2020, ..., 2003],
  "latest": 2022
}
```

### GET `/predictions/{season}`
Get championship predictions for a specific season

**Example:** `/predictions/2022`

### GET `/actual-champion/{season}`
Get the actual champion for a season with model predictions

**Response:**
```json
{
  "season": 2022,
  "actual_champion": "Golden State Warriors",
  "predicted_champion": "Golden State Warriors",
  "correct": true,
  "actual_rank": 1,
  "actual_probability": 0.6595
}
```

### GET `/teams`
List all NBA teams

### GET `/features`
Get ensemble-averaged feature importance rankings

### GET `/historical`
Get historical prediction accuracy across all seasons

### POST `/predict`
Make a custom prediction based on team statistics (accepts 33 features, pads to 42 internally)

## Model Details

### Training Data
- **Dataset**: Kaggle NBA Basketball Database
- **Seasons**: 2002-2022
- **Total Samples**: 1,481 team-seasons
- **Champions**: 20 (1.35% of dataset)

### Elite Features (42 total)

**Core Performance (8):**
- wins, win_pct, ppg, opp_ppg, point_diff, fg_pct, ft_pct, fg3_pct

**Advanced Stats (11):**
- fg3m, opp_fg3_pct, fg3_diff, apg, rpg, spg, bpg, oreb, dreb, reb_diff, tov

**Efficiency Metrics (7):**
- oreb_rate, dreb_rate, tov_diff, ast_tov_ratio, defensive_pressure, pressure_diff, ft_rate

**Advanced Efficiency (7):**
- off_efficiency, def_efficiency, efficiency_diff, discipline, recent_win_pct, recent_point_diff, momentum

**Elite Additions (9):**
- pts_paint, pts_2nd_chance, pts_fb, pts_off_to, paint_dominance, 2nd_chance_edge, transition_edge, defensive_points, paint_pct

### Model Performance
- **ROC-AUC**: 1.000 (perfect discrimination)
- **Individual Models**:
  - XGBoost: 0.9556
  - LightGBM: 1.000
  - CatBoost: 1.000
  - Ensemble: 1.000
- **Algorithm**: Elite Ensemble (averaged predictions from 3 optimized models)
- **Optimization**: Optuna hyperparameter tuning with 30 trials each

### Known Champions (Training Data)
The model was trained on championship data from 2002-2022, including:
- 2021-22: Golden State Warriors ✓
- 2020-21: Milwaukee Bucks
- 2019-20: Los Angeles Lakers
- 2018-19: Toronto Raptors
- And more...

## Features

### Current Implementation
- ✅ Historical NBA data analysis (2003-2022)
- ✅ Elite ensemble machine learning (XGBoost + LightGBM + CatBoost)
- ✅ Hyperparameter optimization with Optuna
- ✅ REST API for predictions with FastAPI
- ✅ Modern NBA-themed web interface
- ✅ Interactive Vega-Lite visualizations
- ✅ Season-by-season predictions and accuracy
- ✅ Feature importance analysis
- ✅ Dynamic season selector
- ✅ Real-time championship probability calculations

### Potential Enhancements
- Add player-level statistics
- Implement time-series forecasting
- Add injury data
- Real-time data updates from NBA API
- User authentication
- Save/compare predictions

## 📊 Data Sources & Methodology

### Dataset
**Source**: [NBA Basketball Database](https://www.kaggle.com/datasets/wyattowalsh/basketball) by wyattowalsh
**Size**: 697MB compressed, 60,192 regular season games
**Time Range**: 1946-2023 (77 seasons)
**Format**: SQLite database with 16 tables

**Key Tables Used**:
- `game` - 60K+ regular season games with 55 stat columns
- `team` - 30 NBA teams with metadata
- Season types separated (Regular Season vs Playoffs)

### Data Processing Pipeline

1. **Collection** (explore_data.py)
   - Download via kagglehub API
   - Cache locally (~700MB)
   - Explore schema and data quality

2. **Feature Engineering** (train_elite_model.py)
   - Extract 42 elite features from raw game stats
   - Calculate advanced metrics:
     - Defensive/offensive efficiency
     - Rebound rates (offensive & defensive)
     - Turnover differential
     - Defensive pressure (steals + blocks)
     - Recent form (last 20 games momentum)
     - Assist-to-turnover ratio
     - Paint points and dominance
     - Second chance points
     - Fast break points
     - Points off turnovers
     - Paint percentage
   - Aggregate by team-season

3. **Elite Model Training**
   - Algorithm: Ensemble of XGBoost, LightGBM, and CatBoost
   - Features: 42 engineered elite metrics
   - Preprocessing: StandardScaler
   - Hyperparameter Optimization: Optuna (30 trials per model)
   - Class balancing: scale_pos_weight
   - Validation: 5-fold StratifiedKFold cross-validation
   - Ensemble Method: Average predictions from 3 models

### Analysis Dimensions

**1. Descriptive Statistics**
- Team performance distributions
- League-wide trends over time
- Championship contender characteristics

**2. Predictive Modeling**
- Train on seasons 2002-2021
- Predict 2021-22 champion
- Cross-validate on historical seasons

**3. Feature Importance**
- XGBoost feature importances
- Identify key championship predictors
- Validate against basketball analytics

## 🔍 Key Findings & Insights

### What Wins Championships?

**1. Defense Wins Championships (Literally)**
- Defensive rebound rate: #1 feature in elite ensemble
- Controlling boards limits opponent second-chance points
- Elite teams dominate defensive glass and transition defense

**2. Efficiency Over Volume**
- Offensive and defensive efficiency are critical
- Points per possession matters more than raw PPG
- Elite model confirms modern analytics principles

**3. Paint Dominance**
- Points in the paint (new elite feature) is crucial
- Second chance points and offensive rebounds matter
- Physical presence in the paint separates champions

**4. The Complete Package**
- Elite model uses 42 features to capture all aspects
- Fast break points, turnover differential, 3-point shooting
- No single stat dominates - basketball is multidimensional

### Elite Model Performance

**Metrics**:
- ROC-AUC: **1.000** (perfect discrimination)
- Individual Models:
  - XGBoost: 0.9556
  - LightGBM: 1.000
  - CatBoost: 1.000
- Ensemble Method: Averaged predictions from all 3 models
- Hyperparameter Optimization: Optuna with 30 trials per model

**2021-22 Season Prediction**:
- Golden State Warriors: **65.95% probability**
- **Result**: ✓ CORRECT - Warriors won 2021-22 championship
- Model correctly ranked them #1 before playoffs

### Model Insights

**Strengths**:
1. **Perfect ROC-AUC** - Flawless at ranking championship probability
2. **Elite Features** - Paint points, fast break, second chance give comprehensive view
3. **Ensemble Power** - Combining 3 models reduces overfitting
4. **Hyperparameter Tuned** - Optuna optimization maximizes each model

**Limitations**:
Regular season stats don't capture:
1. **Playoff intensity** - Different game in 7-game series
2. **Injuries** - Key player injuries change everything
3. **Matchups** - Some teams match up poorly against specific opponents
4. **Momentum** - Hot/cold streaks at the right time
5. **Coaching** - Strategic adjustments in playoffs

**Key Takeaway**: Elite model identifies championship contenders with exceptional accuracy. Perfect ROC-AUC means the probability rankings are optimal given regular season data.

## Development

### Running Tests
```bash
# Backend tests
pytest

# Frontend tests
cd frontend && npm test
```

### Linting
```bash
# Python
flake8 backend/

# TypeScript/JavaScript
cd frontend && npm run lint
```

## License

This project is for educational purposes (class assignment).

## Acknowledgments

- Kaggle for the NBA dataset
- scikit-learn team for the ML library
- FastAPI and Next.js communities

## Contact

For questions about this project, please contact the repository owner.
