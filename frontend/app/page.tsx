'use client'

import { useEffect, useState } from 'react'
import VegaChart from './components/VegaChart'
import Link from 'next/link'

interface Prediction {
  team_name: string
  team_abbr: string
  wins: number
  win_pct: number
  ppg: number
  point_diff: number
  championship_probability: number
}

interface SeasonsResponse {
  seasons: number[]
  latest: number
}

interface ActualChampion {
  season: number
  actual_champion: string | null
  predicted_champion: string
  correct: boolean | null
  actual_rank: number | null
  actual_probability: number
}

export default function Home() {
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [seasons, setSeasons] = useState<number[]>([])
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null)
  const [actualChampion, setActualChampion] = useState<ActualChampion | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSeasons()
  }, [])

  useEffect(() => {
    if (selectedSeason) {
      fetchPredictions(selectedSeason)
      fetchActualChampion(selectedSeason)
    }
  }, [selectedSeason])

  const fetchSeasons = async () => {
    try {
      const response = await fetch('http://localhost:8000/seasons')
      if (!response.ok) {
        throw new Error('Failed to fetch seasons')
      }
      const data: SeasonsResponse = await response.json()
      setSeasons(data.seasons)
      setSelectedSeason(data.latest)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setLoading(false)
    }
  }

  const fetchPredictions = async (season: number) => {
    try {
      setLoading(true)
      const response = await fetch(`http://localhost:8000/predictions/${season}`)
      if (!response.ok) {
        throw new Error('Failed to fetch predictions')
      }
      const data = await response.json()
      setPredictions(data)
      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setLoading(false)
    }
  }

  const fetchActualChampion = async (season: number) => {
    try {
      const response = await fetch(`http://localhost:8000/actual-champion/${season}`)
      if (!response.ok) {
        setActualChampion(null)
        return
      }
      const data: ActualChampion = await response.json()
      setActualChampion(data)
    } catch (err) {
      setActualChampion(null)
    }
  }

  const topContenders = predictions.slice(0, 10)
  const playoffContenders = predictions.filter(p => p.championship_probability > 0.001)
  const outsiders = predictions.filter(p => p.championship_probability <= 0.001)

  const probabilityChartSpec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    title: {
      text: `Top 10 Championship Contenders (${selectedSeason})`,
      fontSize: 18,
      font: '-apple-system',
      fontWeight: 600,
      color: '#000'
    },
    data: { values: topContenders },
    mark: { type: 'bar', tooltip: true, cornerRadiusEnd: 0, color: '#000' },
    encoding: {
      y: {
        field: 'team_abbr',
        type: 'nominal',
        title: null,
        sort: '-x',
        axis: { labelFontSize: 13, labelFont: '-apple-system', labelFontWeight: 400, labelColor: '#000' }
      },
      x: {
        field: 'championship_probability',
        type: 'quantitative',
        title: null,
        axis: { format: '.0%', grid: false, labelColor: '#6B7280', titleColor: '#000' }
      },
      color: { value: '#000' },
      tooltip: [
        { field: 'team_name', type: 'nominal', title: 'Team' },
        { field: 'championship_probability', type: 'quantitative', title: 'Probability', format: '.2%' },
        { field: 'wins', type: 'quantitative', title: 'Wins', format: '.0f' },
        { field: 'win_pct', type: 'quantitative', title: 'Win %', format: '.1%' }
      ]
    },
    width: 600,
    height: 400
  }

  const winPctVsProbSpec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    title: {
      text: 'Win Percentage vs Championship Probability',
      fontSize: 18,
      font: '-apple-system',
      fontWeight: 600,
      color: '#000'
    },
    data: { values: playoffContenders },
    layer: [
      {
        mark: { type: 'point', filled: true, size: 100, tooltip: true, color: '#000' },
        encoding: {
          x: {
            field: 'win_pct',
            type: 'quantitative',
            title: 'Win Percentage',
            axis: { format: '.0%', grid: true, gridColor: '#f3f4f6', labelColor: '#6B7280', titleColor: '#000' },
            scale: { domain: [0.3, 0.85] }
          },
          y: {
            field: 'championship_probability',
            type: 'quantitative',
            title: 'Championship Probability',
            axis: { format: '.0%', grid: true, gridColor: '#f3f4f6', labelColor: '#6B7280', titleColor: '#000' }
          },
          color: { value: '#000' },
          tooltip: [
            { field: 'team_name', type: 'nominal', title: 'Team' },
            { field: 'win_pct', type: 'quantitative', title: 'Win %', format: '.1%' },
            { field: 'championship_probability', type: 'quantitative', title: 'Probability', format: '.2%' }
          ]
        }
      },
      {
        mark: { type: 'text', align: 'left', dx: 7, dy: -7, fontSize: 10, fontWeight: 400 },
        encoding: {
          x: { field: 'win_pct', type: 'quantitative' },
          y: { field: 'championship_probability', type: 'quantitative' },
          text: { field: 'team_abbr', type: 'nominal' },
          color: { value: '#6B7280' },
          opacity: {
            condition: {
              test: 'datum.championship_probability > 0.05',
              value: 1
            },
            value: 0
          }
        }
      }
    ],
    width: 600,
    height: 400
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-black mx-auto"></div>
          <p className="mt-6 text-gray-500 text-sm">Loading predictions</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="bg-white border border-gray-200 rounded-lg p-8 max-w-md">
          <h2 className="text-black font-semibold text-lg mb-3">Connection Error</h2>
          <p className="text-gray-600 text-sm mb-6">{error}</p>
          <button
            onClick={() => selectedSeason && fetchPredictions(selectedSeason)}
            className="w-full px-6 py-3 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-900 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-semibold text-black mb-4 tracking-tight">
            NBA Championship Predictor
          </h1>
          <p className="text-lg text-gray-500">
            Elite Ensemble Model
          </p>
        </div>

        <div className="mb-12 flex flex-wrap justify-center items-center gap-4">
          <Link
            href="/"
            className="px-5 py-2 bg-black text-white text-sm font-medium rounded-full"
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

          <div className="flex items-center gap-3 ml-4">
            <label htmlFor="season-select" className="text-sm text-gray-600">
              Season
            </label>
            <select
              id="season-select"
              value={selectedSeason || ''}
              onChange={(e) => setSelectedSeason(Number(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-black bg-white"
            >
              {seasons.map((season) => (
                <option key={season} value={season}>
                  {season}-{String(season + 1).slice(-2)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {predictions.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
              <div className="bg-black text-white rounded-xl p-8">
                <div className="text-xs uppercase tracking-wide text-gray-400 mb-3">
                  Predicted Champion
                </div>
                <h3 className="text-2xl font-semibold mb-4">{predictions[0].team_name}</h3>
                <p className="text-5xl font-semibold mb-4">
                  {(predictions[0].championship_probability * 100).toFixed(1)}%
                </p>
                <div className="text-sm text-gray-400">
                  {predictions[0].wins.toFixed(0)}-{(82 - predictions[0].wins).toFixed(0)} record
                </div>
              </div>

              {actualChampion?.actual_champion && (
                <div className={`${actualChampion.correct ? 'bg-green-600 text-white' : 'bg-white border border-gray-200 text-black'} rounded-xl p-8`}>
                  <div className={`text-xs uppercase tracking-wide mb-3 ${actualChampion.correct ? 'text-gray-200' : 'text-gray-500'}`}>
                    Actual Champion
                  </div>
                  <h3 className={`text-2xl font-semibold mb-4 ${actualChampion.correct ? 'text-white' : 'text-black'}`}>{actualChampion.actual_champion}</h3>
                  <p className={`text-xl font-medium mb-2 ${actualChampion.correct ? 'text-gray-200' : 'text-gray-600'}`}>
                    Ranked #{actualChampion.actual_rank}
                  </p>
                  <p className={`text-sm ${actualChampion.correct ? 'text-gray-300' : 'text-gray-500'}`}>
                    {(actualChampion.actual_probability * 100).toFixed(1)}% probability
                  </p>
                </div>
              )}

              <div className="bg-white border border-gray-200 rounded-xl p-8">
                <div className="text-xs uppercase tracking-wide text-gray-500 mb-3">
                  Contenders
                </div>
                <p className="text-5xl font-semibold text-black mb-2">{playoffContenders.length}</p>
                <p className="text-sm text-gray-500">
                  teams with realistic chances
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
              <div className="bg-white border border-gray-200 rounded-xl p-8">
                <VegaChart spec={probabilityChartSpec} />
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-8">
                <VegaChart spec={winPctVsProbSpec} />
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-black">All Teams</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Team</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Record</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Win %</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PPG</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">+/-</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Probability</th>
                    </tr>
                  </thead>
                  <tbody>
                    {predictions.map((pred, idx) => {
                      const isActualChampion = actualChampion?.actual_champion === pred.team_name

                      return (
                        <tr
                          key={pred.team_abbr}
                          className={`border-b border-gray-100 hover:bg-gray-50 ${isActualChampion ? 'bg-gray-50' : ''}`}
                        >
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {idx + 1}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">{pred.team_name}</div>
                            <div className="text-xs text-gray-500">{pred.team_abbr}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {pred.wins.toFixed(0)}-{(82 - pred.wins).toFixed(0)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {(pred.win_pct * 100).toFixed(1)}%
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {pred.ppg.toFixed(1)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {pred.point_diff >= 0 ? '+' : ''}{pred.point_diff.toFixed(1)}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-black">
                            {(pred.championship_probability * 100).toFixed(2)}%
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        <div className="mt-16 text-center">
          <p className="text-xs text-gray-500">Elite Ensemble Model with 42 Features</p>
          <p className="text-xs text-gray-400 mt-1">XGBoost + LightGBM + CatBoost</p>
        </div>
      </div>
    </div>
  )
}
