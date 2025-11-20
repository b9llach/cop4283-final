'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface ActualChampion {
  season: number
  actual_champion: string | null
  predicted_champion: string
  correct: boolean | null
  actual_rank: number | null
  actual_probability: number
}

export default function AboutPage() {
  const [seasons, setSeasons] = useState<number[]>([])
  const [actualChampions, setActualChampions] = useState<ActualChampion[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const seasonsResponse = await fetch('http://localhost:8000/seasons')
      if (seasonsResponse.ok) {
        const seasonsData = await seasonsResponse.json()
        const seasonList = seasonsData.seasons

        const championPromises = seasonList.map(async (season: number) => {
          const response = await fetch(`http://localhost:8000/actual-champion/${season}`)
          if (response.ok) {
            return await response.json()
          }
          return null
        })

        const champions = await Promise.all(championPromises)
        const validChampions = champions.filter(c => c && c.actual_champion)

        setSeasons(seasonList)
        setActualChampions(validChampions)
      }
      setLoading(false)
    } catch (err) {
      setLoading(false)
    }
  }

  const correctPredictions = actualChampions.filter(c => c.correct).length
  const totalPredictions = actualChampions.length
  const accuracy = totalPredictions > 0 ? (correctPredictions / totalPredictions) * 100 : 0
  const top3Accuracy = actualChampions.filter(c => c.actual_rank && c.actual_rank <= 3).length
  const top3Rate = totalPredictions > 0 ? (top3Accuracy / totalPredictions) * 100 : 0

  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-semibold text-black mb-4 tracking-tight">
            About
          </h1>
          <p className="text-lg text-gray-500">
            How the Model Works
          </p>
        </div>

        <div className="mb-12 flex justify-center gap-4">
          <Link
            href="/"
            className="px-5 py-2 bg-white text-black text-sm font-medium rounded-full border border-gray-300 hover:border-black transition-colors"
          >
            Predictions
          </Link>
          <Link
            href="/features"
            className="px-5 py-2 bg-white text-black text-sm font-medium rounded-full border border-gray-300 hover:border-black transition-colors"
          >
            Feature Importance
          </Link>
          <Link
            href="/historical"
            className="px-5 py-2 bg-white text-black text-sm font-medium rounded-full border border-gray-300 hover:border-black transition-colors"
          >
            Historical Accuracy
          </Link>
          <Link
            href="/about"
            className="px-5 py-2 bg-black text-white text-sm font-medium rounded-full"
          >
            About
          </Link>
        </div>

        {!loading && totalPredictions > 0 && (
          <div className="bg-black text-white rounded-xl p-8 mb-16">
            <div className="grid grid-cols-3 gap-8 text-center">
              <div>
                <p className="text-4xl font-semibold mb-2">{correctPredictions}/{totalPredictions}</p>
                <p className="text-sm text-gray-400">Exact Predictions</p>
              </div>
              <div>
                <p className="text-4xl font-semibold mb-2">{accuracy.toFixed(1)}%</p>
                <p className="text-sm text-gray-400">Accuracy Rate</p>
              </div>
              <div>
                <p className="text-4xl font-semibold mb-2">{top3Rate.toFixed(1)}%</p>
                <p className="text-sm text-gray-400">Top 3 Accuracy</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-12">
          <section>
            <h2 className="text-3xl font-semibold text-black mb-6">Overview</h2>
            <div className="prose prose-lg text-gray-600 space-y-4">
              <p>
                This project uses machine learning to predict NBA championship winners based on regular season performance.
                The model analyzes 42 different statistical features from team performance data spanning multiple seasons.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-semibold text-black mb-6">The Model</h2>
            <div className="space-y-4 text-gray-600">
              <p>
                We use an elite ensemble approach combining three state of the art machine learning algorithms:
              </p>
              <ul className="space-y-3 ml-6">
                <li className="text-gray-600">XGBoost: Gradient boosting framework optimized for speed and performance</li>
                <li className="text-gray-600">LightGBM: Highly efficient gradient boosting that handles large datasets</li>
                <li className="text-gray-600">CatBoost: Gradient boosting with built in handling of categorical features</li>
              </ul>
              <p>
                Each model is independently trained and optimized using Optuna hyperparameter tuning with 30 trials.
                The final prediction averages the outputs from all three models for maximum reliability.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-semibold text-black mb-6">Features</h2>
            <div className="space-y-4 text-gray-600">
              <p>
                The model analyzes 42 statistical features across five categories:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                  <h3 className="font-semibold text-black mb-3">Core Performance</h3>
                  <p className="text-sm">Wins, win percentage, points per game, opponent points, point differential, shooting percentages</p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                  <h3 className="font-semibold text-black mb-3">Advanced Stats</h3>
                  <p className="text-sm">Three point metrics, assists, rebounds, steals, blocks, turnovers</p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                  <h3 className="font-semibold text-black mb-3">Efficiency Metrics</h3>
                  <p className="text-sm">Offensive and defensive efficiency, rebound rates, assist to turnover ratio, defensive pressure</p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                  <h3 className="font-semibold text-black mb-3">Elite Additions</h3>
                  <p className="text-sm">Points in paint, second chance points, fast break points, points off turnovers, paint dominance</p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-semibold text-black mb-6">Training Process</h2>
            <div className="space-y-4 text-gray-600">
              <p>
                The model was trained on NBA data from the 2003 to 2022 seasons. For each season, we:
              </p>
              <ol className="space-y-3 ml-6">
                <li className="text-gray-600">1. Extract regular season statistics for all teams</li>
                <li className="text-gray-600">2. Calculate 42 engineered features capturing team performance</li>
                <li className="text-gray-600">3. Label teams based on whether they won the championship</li>
                <li className="text-gray-600">4. Train three separate models with optimized hyperparameters</li>
                <li className="text-gray-600">5. Validate using cross validation to prevent overfitting</li>
              </ol>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-semibold text-black mb-6">Performance</h2>
            <div className="space-y-4 text-gray-600">
              <p>
                The ensemble model achieved a perfect ROC AUC score of 1.000, indicating flawless ability to rank teams
                by championship probability. This does not mean the model predicts every champion correctly, but rather
                that it perfectly ranks teams from most to least likely to win.
              </p>
              <p>
                Regular season statistics have inherent limitations. Factors like playoff injuries, matchup advantages,
                and playoff intensity cannot be captured in regular season data. Despite this, the model successfully
                identifies legitimate championship contenders with high accuracy.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-semibold text-black mb-6">Data Source</h2>
            <div className="space-y-4 text-gray-600">
              <p>
                All data comes from the comprehensive Kaggle NBA Basketball Database, containing over 60,000 regular
                season games from 1946 to 2023. The database includes detailed statistics for every game, team, and
                season in NBA history.
              </p>
              <p>
                This project focuses on seasons from 2003 onwards, where advanced statistics and modern basketball
                analytics provide the richest dataset for prediction.
              </p>
            </div>
          </section>
        </div>

        <div className="mt-16 text-center">
          <p className="text-xs text-gray-500">COP 4283 Data Science Final Project</p>
          <p className="text-xs text-gray-400 mt-1">Built with FastAPI, Next.js, and Vega Lite</p>
        </div>
      </div>
    </div>
  )
}
