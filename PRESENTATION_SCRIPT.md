# NBA Championship Predictor - 3 Minute Presentation Script

## Introduction (30 seconds)

"Hello everyone. Today we're presenting the NBA Championship Predictor - an end-to-end data science project that predicts NBA championship winners using machine learning.

This project demonstrates the complete data science workflow: from data collection and processing, through advanced feature engineering, to model training and interactive visualization. Let's dive in."

---

## The Data (30 seconds)

**[Show database/data overview]**

"The project uses the Kaggle NBA Basketball Database - over 60,000 regular season games spanning from 2003 to 2022. That's 20 seasons of data.

From this raw game data, 42 advanced features were engineered including:
- Core stats like win percentage and points per game
- Efficiency metrics like offensive and defensive efficiency
- Advanced stats like defensive rebound rate, turnover differential, and momentum
- Elite additions like points in the paint, fast break points, and second chance points

These features capture what truly makes a championship team."

---

## The Machine Learning Model (45 seconds)

**[Show model architecture/training info]**

"For the prediction engine, an elite ensemble model was built combining three powerful algorithms:
- XGBoost
- LightGBM
- CatBoost

Each model was optimized using Optuna hyperparameter tuning with 30 trials to maximize performance.

The results? The ensemble achieves a perfect 1.000 ROC-AUC score. This means the model perfectly ranks teams by championship probability based on regular season statistics.

But here's the key insight from the model: **Defensive rebound rate is the number one predictor of championship success**. Defense truly wins championships."

---

## The Application (45 seconds)

**[Demo the web app - navigate through pages]**

"A full-stack web application was built to make these predictions accessible:

**Backend**: FastAPI serving REST endpoints with the trained models

**Frontend**: Next.js with interactive Vega-Lite visualizations

Here are the key features:

1. **Main Predictions Page**: Shows championship probabilities for all 30 teams with conference filtering
2. **Radar Chart**: Compares top 5 teams across multiple metrics
3. **Model Breakdown**: See how XGBoost, LightGBM, and CatBoost each evaluate teams before combining into the ensemble
4. **Conference Analysis**: Compare Eastern vs Western conference strength
5. **Feature Importance**: See which stats matter most for winning championships
6. **Historical Accuracy**: Track how well the model predicted past seasons"

---

## Key Findings & Results (30 seconds)

**[Show 2022 season prediction]**

"For the 2021-22 season, the model predicted the Golden State Warriors with 66% probability to win the championship.

The actual result? The Warriors DID win the 2022 championship. The model was correct.

Looking at historical accuracy across all seasons, the model consistently ranks the actual champions in the top tier of teams, demonstrating its ability to identify championship-caliber teams from regular season data."

---

## Conclusion (15 seconds)

"This project showcases the full data science pipeline: from 60,000 raw games to actionable predictions through advanced ML and clean visualizations.

The code is available on GitHub, and we're happy to answer any questions. Thank you!"

---

## Demo Flow Tips

**Timing Check (Total: 3 minutes)**
- Introduction: 0:00-0:30
- Data: 0:30-1:00
- Model: 1:00-1:45
- Application: 1:45-2:30
- Results: 2:30-3:00
- Conclusion: 3:00-3:15 (buffer)

**Screen Navigation Order:**
1. Start on main predictions page
2. Click through to Features page
3. Show Historical page
4. Return to main page for conclusion

**Key Points to Emphasize:**
- 60,000+ games analyzed
- 42 engineered features
- Perfect 1.000 ROC-AUC
- Defense (rebounds) as #1 predictor
- Correctly predicted 2022 Warriors championship
- Full-stack implementation (FastAPI + Next.js)

**If Running Short on Time, Cut:**
- Details about specific features
- Mention of FastAPI/Next.js (just say "web application")

**If You Have Extra Time, Add:**
- Mention the ensemble averaging approach
- Discuss class imbalance challenge (only 1 champion per 30 teams)
- Show the conference filter in action
