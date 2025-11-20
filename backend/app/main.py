"""
FastAPI Backend for NBA Championship Prediction

Provides RESTful API endpoints for championship predictions,
team statistics, and historical analysis.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import joblib
import pandas as pd
import sqlite3
import json
from pathlib import Path

app = FastAPI(
    title="NBA Championship Predictor API",
    description="Predict NBA championship winners using machine learning",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PROJECT_ROOT = Path(__file__).parent.parent.parent
XGB_MODEL_PATH = PROJECT_ROOT / "models" / "xgboost_elite.joblib"
LGBM_MODEL_PATH = PROJECT_ROOT / "models" / "lightgbm_elite.joblib"
CATBOOST_MODEL_PATH = PROJECT_ROOT / "models" / "catboost_elite.joblib"
SCALER_PATH = PROJECT_ROOT / "models" / "scaler_elite.joblib"
METADATA_PATH = PROJECT_ROOT / "models" / "model_metadata_elite.json"
CONFIG_PATH = PROJECT_ROOT / "data" / "config.json"
PREDICTIONS_PATH = PROJECT_ROOT / "backend" / "models" / "latest_predictions_elite.csv"
HISTORICAL_PATH = PROJECT_ROOT / "backend" / "models" / "all_seasons_predictions_with_playoffs.csv"
SEASON_PREDICTIONS_DIR = PROJECT_ROOT / "backend" / "models" / "season_predictions"

xgb_model = None
lgbm_model = None
catboost_model = None
scaler = None
feature_names = []
db_path = None


def load_resources():
    """Load ensemble models, scaler, and configuration"""
    global xgb_model, lgbm_model, catboost_model, scaler, feature_names, db_path

    try:
        xgb_model = joblib.load(XGB_MODEL_PATH)
        lgbm_model = joblib.load(LGBM_MODEL_PATH)
        catboost_model = joblib.load(CATBOOST_MODEL_PATH)
        scaler = joblib.load(SCALER_PATH)

        with open(METADATA_PATH, 'r') as f:
            metadata = json.load(f)
            feature_names = metadata['feature_names']

        with open(CONFIG_PATH, 'r') as f:
            config = json.load(f)
            db_path = config['db_path']

        print(f"Elite ensemble models loaded successfully")
        print(f"ROC-AUC Scores:")
        print(f"  XGBoost:  {metadata['roc_auc_xgb']:.4f}")
        print(f"  LightGBM: {metadata['roc_auc_lgbm']:.4f}")
        print(f"  CatBoost: {metadata['roc_auc_catboost']:.4f}")
        print(f"  Ensemble: {metadata['roc_auc_ensemble']:.4f}")
    except Exception as e:
        print(f"Error loading resources: {e}")
        raise


load_resources()


class TeamStats(BaseModel):
    wins: float
    win_pct: float
    ppg: float
    opp_ppg: float
    point_diff: float
    fg_pct: float
    ft_pct: float
    fg3_pct: float
    fg3m: float
    opp_fg3_pct: float
    fg3_diff: float
    apg: float
    rpg: float
    spg: float
    bpg: float
    oreb: float
    dreb: float
    reb_diff: float
    oreb_rate: float
    dreb_rate: float
    tov: float
    tov_diff: float
    ast_tov_ratio: float
    defensive_pressure: float
    pressure_diff: float
    off_efficiency: float
    def_efficiency: float
    efficiency_diff: float
    ft_rate: float
    discipline: float
    recent_win_pct: float
    recent_point_diff: float
    momentum: float


class PredictionResponse(BaseModel):
    team_name: str
    team_abbr: str
    wins: float
    win_pct: float
    ppg: float
    point_diff: float
    championship_probability: float


class TeamInfo(BaseModel):
    id: int
    full_name: str
    abbreviation: str


class HistoricalPrediction(BaseModel):
    season: int
    actual_champion: str
    predicted_champion: str
    predicted_probability: float
    correct: bool
    actual_champion_rank: int
    actual_champion_probability: float


class FeatureImportance(BaseModel):
    feature: str
    importance: float


@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "NBA Championship Predictor API",
        "version": "1.0.0",
        "model": "XGBoost with 33 features",
        "endpoints": {
            "/predictions": "Get latest season championship predictions",
            "/predictions/{season}": "Get predictions for a specific season",
            "/seasons": "Get list of available seasons",
            "/historical": "Get historical prediction accuracy",
            "/features": "Get feature importance rankings",
            "/teams": "List all NBA teams",
            "/health": "Health check"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model_type": "Elite Ensemble (XGBoost + LightGBM + CatBoost)",
        "xgb_loaded": xgb_model is not None,
        "lgbm_loaded": lgbm_model is not None,
        "catboost_loaded": catboost_model is not None,
        "database_connected": db_path is not None,
        "num_features": len(feature_names)
    }


@app.get("/predictions", response_model=List[PredictionResponse])
async def get_predictions():
    """Get championship predictions for the current season"""
    try:
        if not PREDICTIONS_PATH.exists():
            raise HTTPException(
                status_code=404,
                detail="Predictions not found. Run training first."
            )

        df = pd.read_csv(PREDICTIONS_PATH)

        predictions = []
        for _, row in df.iterrows():
            predictions.append(PredictionResponse(
                team_name=row['full_name'],
                team_abbr=row['abbreviation'],
                wins=row['wins'],
                win_pct=row['win_pct'],
                ppg=row['ppg'],
                point_diff=row['point_diff'],
                championship_probability=row['championship_probability']
            ))

        return predictions

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/historical", response_model=List[HistoricalPrediction])
async def get_historical():
    """Get historical prediction accuracy across all seasons"""
    try:
        if not HISTORICAL_PATH.exists():
            raise HTTPException(
                status_code=404,
                detail="Historical data not found"
            )

        df = pd.read_csv(HISTORICAL_PATH)

        historical = []
        for _, row in df.iterrows():
            historical.append(HistoricalPrediction(
                season=int(row['season']),
                actual_champion=row['actual_champion'],
                predicted_champion=row['predicted_champion'],
                predicted_probability=row['predicted_probability'],
                correct=bool(row['correct']),
                actual_champion_rank=int(row['actual_champion_rank']),
                actual_champion_probability=row['actual_champion_probability']
            ))

        return historical

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/features", response_model=List[FeatureImportance])
async def get_feature_importance():
    """Get averaged feature importance rankings from ensemble"""
    try:
        xgb_importance = xgb_model.feature_importances_
        lgbm_importance = lgbm_model.feature_importances_
        catboost_importance = catboost_model.feature_importances_

        avg_importance = (xgb_importance + lgbm_importance + catboost_importance) / 3

        importance = []
        for feat, imp in zip(feature_names, avg_importance):
            importance.append(FeatureImportance(
                feature=feat,
                importance=float(imp)
            ))

        importance.sort(key=lambda x: x.importance, reverse=True)
        return importance

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/teams", response_model=List[TeamInfo])
async def get_teams():
    """Get list of all NBA teams"""
    try:
        conn = sqlite3.connect(db_path)
        query = "SELECT id, full_name, abbreviation FROM team ORDER BY full_name"
        df = pd.read_sql_query(query, conn)
        conn.close()

        teams = []
        for _, row in df.iterrows():
            teams.append(TeamInfo(
                id=int(row['id']),
                full_name=row['full_name'],
                abbreviation=row['abbreviation']
            ))

        return teams

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/seasons")
async def get_seasons():
    """Get list of available seasons"""
    try:
        if not SEASON_PREDICTIONS_DIR.exists():
            raise HTTPException(
                status_code=404,
                detail="Season predictions not found"
            )

        season_files = list(SEASON_PREDICTIONS_DIR.glob("predictions_*.csv"))
        seasons = []
        for f in season_files:
            season = int(f.stem.split('_')[1])
            seasons.append(season)

        seasons = sorted(seasons, reverse=True)

        return {
            "seasons": seasons,
            "latest": seasons[0] if seasons else None
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/predictions/{season}", response_model=List[PredictionResponse])
async def get_predictions_by_season(season: int):
    """Get championship predictions for a specific season"""
    try:
        season_file = SEASON_PREDICTIONS_DIR / f"predictions_{season}.csv"

        if not season_file.exists():
            raise HTTPException(
                status_code=404,
                detail=f"Predictions for season {season} not found"
            )

        df = pd.read_csv(season_file)

        predictions = []
        for _, row in df.iterrows():
            predictions.append(PredictionResponse(
                team_name=row['full_name'],
                team_abbr=row['abbreviation'],
                wins=row['won'],
                win_pct=row['win_pct'],
                ppg=row['pts'],
                point_diff=row['point_diff'],
                championship_probability=row['championship_probability']
            ))

        return predictions

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/actual-champion/{season}")
async def get_actual_champion(season: int):
    """Get the actual champion for a given season using elite model predictions"""
    try:
        champions = {
            2003: 'San Antonio Spurs', 2004: 'Detroit Pistons', 2005: 'San Antonio Spurs',
            2006: 'Miami Heat', 2007: 'San Antonio Spurs', 2008: 'Boston Celtics',
            2009: 'Los Angeles Lakers', 2010: 'Los Angeles Lakers', 2011: 'Dallas Mavericks',
            2012: 'Miami Heat', 2013: 'Miami Heat', 2014: 'San Antonio Spurs',
            2015: 'Golden State Warriors', 2016: 'Cleveland Cavaliers', 2017: 'Golden State Warriors',
            2018: 'Golden State Warriors', 2019: 'Toronto Raptors', 2020: 'Los Angeles Lakers',
            2021: 'Milwaukee Bucks', 2022: 'Golden State Warriors'
        }

        actual_champion = champions.get(season)
        if not actual_champion:
            return {
                "season": season,
                "actual_champion": None,
                "predicted_champion": None,
                "correct": None,
                "actual_rank": None
            }

        season_file = SEASON_PREDICTIONS_DIR / f"predictions_{season}.csv"
        if not season_file.exists():
            return {
                "season": season,
                "actual_champion": actual_champion,
                "predicted_champion": None,
                "correct": None,
                "actual_rank": None
            }

        df = pd.read_csv(season_file)
        predicted_champion = df.iloc[0]['full_name']

        actual_row = df[df['full_name'] == actual_champion]
        if len(actual_row) == 0:
            return {
                "season": season,
                "actual_champion": actual_champion,
                "predicted_champion": predicted_champion,
                "correct": False,
                "actual_rank": None,
                "actual_probability": 0.0
            }

        actual_rank = int(df[df['full_name'] == actual_champion].index[0] + 1)
        actual_probability = float(actual_row.iloc[0]['championship_probability'])
        correct = bool(predicted_champion == actual_champion)

        return {
            "season": int(season),
            "actual_champion": str(actual_champion),
            "predicted_champion": str(predicted_champion),
            "correct": correct,
            "actual_rank": actual_rank,
            "actual_probability": actual_probability
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/predict")
async def predict_custom(stats: TeamStats):
    """
    Make a championship prediction based on custom team statistics
    Note: Elite model uses 42 features but this endpoint only accepts 33
    """
    try:
        features = [[
            stats.wins, stats.win_pct, stats.ppg, stats.opp_ppg,
            stats.point_diff, stats.fg_pct, stats.ft_pct, stats.fg3_pct,
            stats.fg3m, stats.opp_fg3_pct, stats.fg3_diff, stats.apg,
            stats.rpg, stats.spg, stats.bpg, stats.oreb, stats.dreb,
            stats.reb_diff, stats.oreb_rate, stats.dreb_rate, stats.tov,
            stats.tov_diff, stats.ast_tov_ratio, stats.defensive_pressure,
            stats.pressure_diff, stats.off_efficiency, stats.def_efficiency,
            stats.efficiency_diff, stats.ft_rate, stats.discipline,
            stats.recent_win_pct, stats.recent_point_diff, stats.momentum,
            0, 0, 0, 0, 0, 0, 0, 0, 0
        ]]

        features_scaled = scaler.transform(features)

        pred_xgb = xgb_model.predict_proba(features_scaled)[0][1]
        pred_lgbm = lgbm_model.predict_proba(features_scaled)[0][1]
        pred_catboost = catboost_model.predict_proba(features_scaled)[0][1]

        probability = (pred_xgb + pred_lgbm + pred_catboost) / 3

        return {
            "championship_probability": float(probability),
            "prediction": "Elite Contender" if probability > 0.3 else "Unlikely Champion",
            "confidence": "High" if probability > 0.5 or probability < 0.1 else "Moderate",
            "model": "Elite Ensemble"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
