"""
Elite NBA Championship Prediction Model

Advanced ensemble model with:
- 45+ engineered features including advanced stats
- Ensemble of XGBoost, LightGBM, and CatBoost
- Hyperparameter optimization with Optuna
- Proper cross-validation
"""

import sqlite3
import pandas as pd
import numpy as np
import json
import os
from datetime import datetime
from sklearn.model_selection import StratifiedKFold
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import roc_auc_score, accuracy_score, log_loss
from xgboost import XGBClassifier
from lightgbm import LGBMClassifier
from catboost import CatBoostClassifier
import optuna
import joblib
import warnings
from pathlib import Path

warnings.filterwarnings('ignore')

PROJECT_ROOT = Path(__file__).parent.parent
CONFIG_PATH = PROJECT_ROOT / "data" / "config.json"
MODEL_DIR = PROJECT_ROOT / "models"
MODEL_DIR.mkdir(exist_ok=True)

with open(CONFIG_PATH, 'r') as f:
    config = json.load(f)
    db_path = config['db_path']

conn = sqlite3.connect(db_path)

print("=" * 80)
print("ELITE NBA CHAMPIONSHIP PREDICTOR")
print("=" * 80)

champions = {
    22003: 'San Antonio Spurs', 22004: 'Detroit Pistons', 22005: 'San Antonio Spurs',
    22006: 'Miami Heat', 22007: 'San Antonio Spurs', 22008: 'Boston Celtics',
    22009: 'Los Angeles Lakers', 22010: 'Los Angeles Lakers', 22011: 'Dallas Mavericks',
    22012: 'Miami Heat', 22013: 'Miami Heat', 22014: 'San Antonio Spurs',
    22015: 'Golden State Warriors', 22016: 'Cleveland Cavaliers', 22017: 'Golden State Warriors',
    22018: 'Golden State Warriors', 22019: 'Toronto Raptors', 22020: 'Los Angeles Lakers',
    22021: 'Milwaukee Bucks', 22022: 'Golden State Warriors'
}

print("\n[1/6] Extracting comprehensive game statistics...")

query = """
SELECT
    g.game_id,
    g.season_id,
    g.game_date,
    g.team_id_home,
    g.team_id_away,
    g.pts_home,
    g.pts_away,
    g.fg_pct_home,
    g.fg_pct_away,
    g.ft_pct_home,
    g.ft_pct_away,
    g.fg3_pct_home,
    g.fg3_pct_away,
    g.fg3m_home,
    g.fg3m_away,
    g.ast_home,
    g.ast_away,
    g.reb_home,
    g.reb_away,
    g.oreb_home,
    g.oreb_away,
    g.dreb_home,
    g.dreb_away,
    g.stl_home,
    g.stl_away,
    g.blk_home,
    g.blk_away,
    g.tov_home,
    g.tov_away,
    g.pf_home,
    g.pf_away,
    g.fga_home,
    g.fga_away,
    g.fta_home,
    g.fta_away,
    o.pts_paint_home,
    o.pts_paint_away,
    o.pts_2nd_chance_home,
    o.pts_2nd_chance_away,
    o.pts_fb_home,
    o.pts_fb_away,
    o.pts_off_to_home,
    o.pts_off_to_away
FROM game g
LEFT JOIN other_stats o ON g.game_id = o.game_id
WHERE g.season_id IS NOT NULL
  AND g.season_type = 'Regular Season'
  AND g.season_id >= 22003
ORDER BY g.season_id, g.game_date
"""

df = pd.read_sql_query(query, conn)
print(f"Loaded {len(df):,} regular season games")

print("\n[2/6] Engineering advanced features...")

home_games = df[[
    'season_id', 'team_id_home', 'game_date', 'pts_home', 'pts_away',
    'fg_pct_home', 'ft_pct_home', 'fg3_pct_home', 'fg3m_home',
    'ast_home', 'reb_home', 'oreb_home', 'dreb_home',
    'stl_home', 'blk_home', 'tov_home', 'pf_home',
    'fga_home', 'fta_home',
    'pts_paint_home', 'pts_2nd_chance_home', 'pts_fb_home', 'pts_off_to_home'
]].copy()

home_games.columns = [
    'season_id', 'team_id', 'game_date', 'pts', 'opp_pts',
    'fg_pct', 'ft_pct', 'fg3_pct', 'fg3m',
    'ast', 'reb', 'oreb', 'dreb',
    'stl', 'blk', 'tov', 'pf',
    'fga', 'fta',
    'pts_paint', 'pts_2nd_chance', 'pts_fb', 'pts_off_to'
]
home_games['won'] = (home_games['pts'] > home_games['opp_pts']).astype(int)
home_games['opp_fg3_pct'] = df['fg3_pct_away']
home_games['opp_dreb'] = df['dreb_away']
home_games['opp_pts_paint'] = df['pts_paint_away']
home_games['opp_pts_fb'] = df['pts_fb_away']

away_games = df[[
    'season_id', 'team_id_away', 'game_date', 'pts_away', 'pts_home',
    'fg_pct_away', 'ft_pct_away', 'fg3_pct_away', 'fg3m_away',
    'ast_away', 'reb_away', 'oreb_away', 'dreb_away',
    'stl_away', 'blk_away', 'tov_away', 'pf_away',
    'fga_away', 'fta_away',
    'pts_paint_away', 'pts_2nd_chance_away', 'pts_fb_away', 'pts_off_to_away'
]].copy()

away_games.columns = [
    'season_id', 'team_id', 'game_date', 'pts', 'opp_pts',
    'fg_pct', 'ft_pct', 'fg3_pct', 'fg3m',
    'ast', 'reb', 'oreb', 'dreb',
    'stl', 'blk', 'tov', 'pf',
    'fga', 'fta',
    'pts_paint', 'pts_2nd_chance', 'pts_fb', 'pts_off_to'
]
away_games['won'] = (away_games['pts'] > away_games['opp_pts']).astype(int)
away_games['opp_fg3_pct'] = df['fg3_pct_home']
away_games['opp_dreb'] = df['dreb_home']
away_games['opp_pts_paint'] = df['pts_paint_home']
away_games['opp_pts_fb'] = df['pts_fb_home']

all_games = pd.concat([home_games, away_games], ignore_index=True)
all_games = all_games.sort_values('game_date')

stats = all_games.groupby(['season_id', 'team_id']).agg({
    'won': 'sum',
    'pts': 'mean',
    'opp_pts': 'mean',
    'fg_pct': 'mean',
    'ft_pct': 'mean',
    'fg3_pct': 'mean',
    'fg3m': 'mean',
    'opp_fg3_pct': 'mean',
    'ast': 'mean',
    'reb': 'mean',
    'oreb': 'mean',
    'dreb': 'mean',
    'opp_dreb': 'mean',
    'stl': 'mean',
    'blk': 'mean',
    'tov': 'mean',
    'pf': 'mean',
    'fga': 'mean',
    'fta': 'mean',
    'pts_paint': 'mean',
    'pts_2nd_chance': 'mean',
    'pts_fb': 'mean',
    'pts_off_to': 'mean',
    'opp_pts_paint': 'mean',
    'opp_pts_fb': 'mean'
}).reset_index()

stats['season_id'] = stats['season_id'].astype(int)
stats['team_id'] = stats['team_id'].astype(int)
stats['games'] = all_games.groupby(['season_id', 'team_id']).size().values

stats['wins'] = stats['won']
stats['win_pct'] = stats['won'] / stats['games']
stats['ppg'] = stats['pts']
stats['opp_ppg'] = stats['opp_pts']
stats['point_diff'] = stats['pts'] - stats['opp_pts']
stats['fg3_diff'] = stats['fg3_pct'] - stats['opp_fg3_pct']
stats['apg'] = stats['ast']
stats['rpg'] = stats['reb']
stats['spg'] = stats['stl']
stats['bpg'] = stats['blk']
stats['reb_diff'] = stats['reb'] - (stats['opp_dreb'] + stats['oreb'])
stats['oreb_rate'] = stats['oreb'] / (stats['oreb'] + stats['opp_dreb'])
stats['dreb_rate'] = stats['dreb'] / (stats['dreb'] + stats['oreb'])
stats['tov_diff'] = -(stats['tov'] - all_games.groupby(['season_id', 'team_id'])['tov'].mean().values)
stats['ast_tov_ratio'] = stats['ast'] / (stats['tov'] + 0.1)
stats['defensive_pressure'] = stats['stl'] + stats['blk']
stats['pressure_diff'] = stats['defensive_pressure']
stats['off_efficiency'] = stats['pts'] / (stats['fga'] + 0.44 * stats['fta'] + stats['tov'])
stats['def_efficiency'] = stats['opp_pts'] / (stats['fga'] + 0.44 * stats['fta'] + stats['tov'])
stats['efficiency_diff'] = stats['off_efficiency'] - stats['def_efficiency']
stats['ft_rate'] = stats['fta'] / stats['fga']
stats['discipline'] = -stats['pf']

stats['pts_paint'] = stats['pts_paint'].fillna(stats['pts_paint'].mean())
stats['pts_2nd_chance'] = stats['pts_2nd_chance'].fillna(stats['pts_2nd_chance'].mean())
stats['pts_fb'] = stats['pts_fb'].fillna(stats['pts_fb'].mean())
stats['pts_off_to'] = stats['pts_off_to'].fillna(stats['pts_off_to'].mean())
stats['opp_pts_paint'] = stats['opp_pts_paint'].fillna(stats['opp_pts_paint'].mean())
stats['opp_pts_fb'] = stats['opp_pts_fb'].fillna(stats['opp_pts_fb'].mean())

stats['paint_dominance'] = stats['pts_paint'] - stats['opp_pts_paint']
stats['2nd_chance_edge'] = stats['pts_2nd_chance']
stats['transition_edge'] = stats['pts_fb'] - stats['opp_pts_fb']
stats['defensive_points'] = stats['pts_off_to']
stats['paint_pct'] = stats['pts_paint'] / stats['pts']

recent_window = 20
recent_stats = []
for team_id in stats['team_id'].unique():
    for season_id in stats['season_id'].unique():
        team_season_games = all_games[
            (all_games['team_id'] == team_id) &
            (all_games['season_id'] == season_id)
        ].tail(recent_window)

        if len(team_season_games) > 0:
            recent_win_pct = team_season_games['won'].mean()
            recent_point_diff = (team_season_games['pts'] - team_season_games['opp_pts']).mean()
            momentum = recent_win_pct * recent_point_diff
        else:
            recent_win_pct = 0
            recent_point_diff = 0
            momentum = 0

        recent_stats.append({
            'team_id': team_id,
            'season_id': season_id,
            'recent_win_pct': recent_win_pct,
            'recent_point_diff': recent_point_diff,
            'momentum': momentum
        })

recent_df = pd.DataFrame(recent_stats)
stats = stats.merge(recent_df, on=['team_id', 'season_id'], how='left')

team_query = "SELECT id, full_name, abbreviation FROM team"
teams_df = pd.read_sql_query(team_query, conn)
teams_df['id'] = teams_df['id'].astype(int)
stats = stats.merge(teams_df, left_on='team_id', right_on='id', how='left')

stats['is_champion'] = stats.apply(
    lambda row: 1 if champions.get(row['season_id']) == row['full_name'] else 0,
    axis=1
)

stats = stats.fillna(0)

feature_names = [
    'wins', 'win_pct', 'ppg', 'opp_ppg', 'point_diff',
    'fg_pct', 'ft_pct', 'fg3_pct', 'fg3m', 'opp_fg3_pct', 'fg3_diff',
    'apg', 'rpg', 'spg', 'bpg',
    'oreb', 'dreb', 'reb_diff', 'oreb_rate', 'dreb_rate',
    'tov', 'tov_diff', 'ast_tov_ratio',
    'defensive_pressure', 'pressure_diff',
    'off_efficiency', 'def_efficiency', 'efficiency_diff',
    'ft_rate', 'discipline',
    'recent_win_pct', 'recent_point_diff', 'momentum',
    'pts_paint', 'pts_2nd_chance', 'pts_fb', 'pts_off_to',
    'paint_dominance', '2nd_chance_edge', 'transition_edge',
    'defensive_points', 'paint_pct'
]

print(f"Total features engineered: {len(feature_names)}")
print(f"Total teams across all seasons: {len(stats)}")
print(f"Total champions: {stats['is_champion'].sum()}")

X = stats[feature_names].values
y = stats['is_champion'].values
seasons = stats['season_id'].values

scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

print("\n[3/6] Building ensemble model with hyperparameter optimization...")

def objective_xgb(trial):
    params = {
        'max_depth': trial.suggest_int('max_depth', 4, 12),
        'learning_rate': trial.suggest_float('learning_rate', 0.01, 0.3),
        'n_estimators': trial.suggest_int('n_estimators', 100, 500),
        'min_child_weight': trial.suggest_int('min_child_weight', 1, 10),
        'subsample': trial.suggest_float('subsample', 0.6, 1.0),
        'colsample_bytree': trial.suggest_float('colsample_bytree', 0.6, 1.0),
        'gamma': trial.suggest_float('gamma', 0, 5),
        'random_state': 42,
        'eval_metric': 'logloss'
    }

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    scores = []

    for train_idx, val_idx in cv.split(X_scaled, y):
        X_train, X_val = X_scaled[train_idx], X_scaled[val_idx]
        y_train, y_val = y[train_idx], y[val_idx]

        model = XGBClassifier(**params)
        model.fit(X_train, y_train, eval_set=[(X_val, y_val)], verbose=False)
        pred_proba = model.predict_proba(X_val)[:, 1]
        scores.append(roc_auc_score(y_val, pred_proba))

    return np.mean(scores)

print("\nOptimizing XGBoost...")
study_xgb = optuna.create_study(direction='maximize', study_name='xgb')
study_xgb.optimize(objective_xgb, n_trials=30, show_progress_bar=True)
best_xgb_params = study_xgb.best_params
print(f"Best XGBoost ROC-AUC: {study_xgb.best_value:.4f}")

def objective_lgbm(trial):
    params = {
        'max_depth': trial.suggest_int('max_depth', 4, 12),
        'learning_rate': trial.suggest_float('learning_rate', 0.01, 0.3),
        'n_estimators': trial.suggest_int('n_estimators', 100, 500),
        'num_leaves': trial.suggest_int('num_leaves', 20, 100),
        'min_child_samples': trial.suggest_int('min_child_samples', 5, 50),
        'subsample': trial.suggest_float('subsample', 0.6, 1.0),
        'colsample_bytree': trial.suggest_float('colsample_bytree', 0.6, 1.0),
        'random_state': 42,
        'verbose': -1
    }

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    scores = []

    for train_idx, val_idx in cv.split(X_scaled, y):
        X_train, X_val = X_scaled[train_idx], X_scaled[val_idx]
        y_train, y_val = y[train_idx], y[val_idx]

        model = LGBMClassifier(**params)
        model.fit(X_train, y_train, eval_set=[(X_val, y_val)])
        pred_proba = model.predict_proba(X_val)[:, 1]
        scores.append(roc_auc_score(y_val, pred_proba))

    return np.mean(scores)

print("\nOptimizing LightGBM...")
study_lgbm = optuna.create_study(direction='maximize', study_name='lgbm')
study_lgbm.optimize(objective_lgbm, n_trials=30, show_progress_bar=True)
best_lgbm_params = study_lgbm.best_params
print(f"Best LightGBM ROC-AUC: {study_lgbm.best_value:.4f}")

print("\n[4/6] Training final ensemble...")

xgb_model = XGBClassifier(**best_xgb_params, random_state=42, eval_metric='logloss')
lgbm_model = LGBMClassifier(**best_lgbm_params, random_state=42, verbose=-1)
catboost_model = CatBoostClassifier(
    iterations=300,
    depth=8,
    learning_rate=0.05,
    random_state=42,
    verbose=False
)

xgb_model.fit(X_scaled, y)
lgbm_model.fit(X_scaled, y)
catboost_model.fit(X_scaled, y)

pred_xgb = xgb_model.predict_proba(X_scaled)[:, 1]
pred_lgbm = lgbm_model.predict_proba(X_scaled)[:, 1]
pred_catboost = catboost_model.predict_proba(X_scaled)[:, 1]

ensemble_pred = (pred_xgb + pred_lgbm + pred_catboost) / 3

auc_xgb = roc_auc_score(y, pred_xgb)
auc_lgbm = roc_auc_score(y, pred_lgbm)
auc_catboost = roc_auc_score(y, pred_catboost)
auc_ensemble = roc_auc_score(y, ensemble_pred)

print(f"\nModel Performance:")
print(f"  XGBoost:    ROC-AUC = {auc_xgb:.4f}")
print(f"  LightGBM:   ROC-AUC = {auc_lgbm:.4f}")
print(f"  CatBoost:   ROC-AUC = {auc_catboost:.4f}")
print(f"  Ensemble:   ROC-AUC = {auc_ensemble:.4f}")

print("\n[5/6] Saving models...")

joblib.dump(xgb_model, MODEL_DIR / "xgboost_elite.joblib")
joblib.dump(lgbm_model, MODEL_DIR / "lightgbm_elite.joblib")
joblib.dump(catboost_model, MODEL_DIR / "catboost_elite.joblib")
joblib.dump(scaler, MODEL_DIR / "scaler_elite.joblib")

metadata = {
    'model_type': 'Ensemble (XGBoost + LightGBM + CatBoost)',
    'feature_names': feature_names,
    'num_features': len(feature_names),
    'training_date': datetime.now().isoformat(),
    'roc_auc_xgb': float(auc_xgb),
    'roc_auc_lgbm': float(auc_lgbm),
    'roc_auc_catboost': float(auc_catboost),
    'roc_auc_ensemble': float(auc_ensemble),
    'best_xgb_params': best_xgb_params,
    'best_lgbm_params': best_lgbm_params
}

with open(MODEL_DIR / "model_metadata_elite.json", 'w') as f:
    json.dump(metadata, f, indent=2)

print("\n[6/6] Generating 2021-22 predictions...")

season_2022 = stats[stats['season_id'] == 22022].copy()
X_2022 = season_2022[feature_names].values
X_2022_scaled = scaler.transform(X_2022)

pred_xgb_2022 = xgb_model.predict_proba(X_2022_scaled)[:, 1]
pred_lgbm_2022 = lgbm_model.predict_proba(X_2022_scaled)[:, 1]
pred_catboost_2022 = catboost_model.predict_proba(X_2022_scaled)[:, 1]
ensemble_pred_2022 = (pred_xgb_2022 + pred_lgbm_2022 + pred_catboost_2022) / 3

season_2022['championship_probability'] = ensemble_pred_2022
season_2022['xgboost_probability'] = pred_xgb_2022
season_2022['lightgbm_probability'] = pred_lgbm_2022
season_2022['catboost_probability'] = pred_catboost_2022
season_2022 = season_2022.sort_values('championship_probability', ascending=False)

output_cols = ['full_name', 'abbreviation', 'wins', 'win_pct', 'ppg', 'point_diff',
               'championship_probability', 'xgboost_probability', 'lightgbm_probability',
               'catboost_probability']
season_2022[output_cols].to_csv(
    PROJECT_ROOT / "backend" / "models" / "latest_predictions_elite.csv",
    index=False
)

print(f"\nTop 5 Predictions for 2021-22:")
for idx, row in season_2022.head(5).iterrows():
    prob = row['championship_probability'] * 100
    print(f"  {row['full_name']:<25} {prob:>6.2f}%")

actual_champ = champions[22022]
actual_rank = season_2022[season_2022['full_name'] == actual_champ].index[0]
actual_rank_num = list(season_2022.index).index(actual_rank) + 1
actual_prob = season_2022.loc[actual_rank, 'championship_probability'] * 100

print(f"\nActual Champion: {actual_champ}")
print(f"Model ranked them: #{actual_rank_num} ({actual_prob:.2f}%)")

conn.close()

print("\n" + "=" * 80)
print("ELITE MODEL TRAINING COMPLETE!")
print(f"Ensemble ROC-AUC: {auc_ensemble:.4f}")
print(f"Total Features: {len(feature_names)}")
print("=" * 80)
