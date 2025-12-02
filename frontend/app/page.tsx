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
  xgboost_probability?: number
  lightgbm_probability?: number
  catboost_probability?: number
  conference?: string
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
  const [conferenceFilter, setConferenceFilter] = useState<string>('All')

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

  const filteredPredictions = conferenceFilter === 'All'
    ? predictions
    : predictions.filter(p => p.conference === conferenceFilter)

  const topContenders = filteredPredictions.slice(0, 10)
  const playoffContenders = filteredPredictions.filter(p => p.championship_probability > 0.001)
  const outsiders = filteredPredictions.filter(p => p.championship_probability <= 0.001)

  const top5Teams = predictions.slice(0, 5)

  const probabilityChartSpec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    title: {
      text: `Top 10 Contenders (${selectedSeason})`,
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
    width: 'container',
    height: 400
  }

  const winPctVsProbSpec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    title: {
      text: 'Win % vs Championship Probability',
      fontSize: 18,
      font: '-apple-system',
      fontWeight: 600,
      color: '#000'
    },
    data: { values: playoffContenders },
    mark: { type: 'point', filled: true, size: 100, tooltip: true, color: '#000' },
    encoding: {
      x: {
        field: 'win_pct',
        type: 'quantitative',
        title: 'Win Percentage',
        axis: { format: '.0%', grid: true, gridColor: '#f3f4f6', labelColor: '#6B7280', titleColor: '#000' }
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
        { field: 'championship_probability', type: 'quantitative', title: 'Probability', format: '.2%' },
        { field: 'wins', type: 'quantitative', title: 'Wins', format: '.0f' }
      ]
    },
    width: 'container',
    height: 400
  }

  // Radar Chart for Top 5 Team Comparison
  const radarData = top5Teams.flatMap(team => [
    { team: team.team_abbr, metric: 'Win %', value: team.win_pct },
    { team: team.team_abbr, metric: 'PPG (scaled)', value: team.ppg / 120 },
    { team: team.team_abbr, metric: 'Point Diff (scaled)', value: (team.point_diff + 10) / 20 },
    { team: team.team_abbr, metric: 'Championship Prob', value: team.championship_probability }
  ])

  const radarChartSpec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    title: {
      text: 'Top 5 Teams Comparison (Click Legend)',
      fontSize: 18,
      font: '-apple-system',
      fontWeight: 600,
      color: '#000'
    },
    data: { values: radarData },
    params: [{
      name: 'team_selection',
      select: { type: 'point', fields: ['team'] },
      bind: 'legend'
    }],
    mark: { type: 'line', point: true },
    encoding: {
      x: { field: 'metric', type: 'nominal', title: null, axis: { labelAngle: -45, labelColor: '#000' } },
      y: { field: 'value', type: 'quantitative', title: null, scale: { domain: [0, 1] }, axis: { format: '.0%', labelColor: '#6B7280' } },
      color: { field: 'team', type: 'nominal', legend: { title: 'Team (Click to Filter)' } },
      opacity: {
        condition: { param: 'team_selection', value: 1 },
        value: 0.2
      },
      strokeWidth: {
        condition: { param: 'team_selection', value: 3 },
        value: 1
      },
      tooltip: [
        { field: 'team', type: 'nominal', title: 'Team' },
        { field: 'metric', type: 'nominal', title: 'Metric' },
        { field: 'value', type: 'quantitative', title: 'Value', format: '.2%' }
      ]
    },
    width: 'container',
    height: 400
  }

  // Model Breakdown - XGBoost vs LightGBM vs CatBoost
  const modelBreakdownData = top5Teams.flatMap(team => [
    { team: team.team_abbr, model: 'XGBoost', probability: team.xgboost_probability || 0 },
    { team: team.team_abbr, model: 'LightGBM', probability: team.lightgbm_probability || 0 },
    { team: team.team_abbr, model: 'CatBoost', probability: team.catboost_probability || 0 },
    { team: team.team_abbr, model: 'Ensemble', probability: team.championship_probability }
  ])

  const statsComparisonData = top5Teams.flatMap(team => [
    { team: team.team_abbr, metric: 'Championship %', value: team.championship_probability },
    { team: team.team_abbr, metric: 'Win %', value: team.win_pct },
    { team: team.team_abbr, metric: 'Point Diff (scaled)', value: Math.max(0, (team.point_diff + 10) / 20) }
  ])

  const statsComparisonSpec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    title: {
      text: 'Top 5 Stats Comparison (Click Legend)',
      fontSize: 18,
      font: '-apple-system',
      fontWeight: 600,
      color: '#000'
    },
    data: { values: statsComparisonData },
    params: [{
      name: 'metric_select',
      select: { type: 'point', fields: ['metric'] },
      bind: 'legend'
    }],
    mark: { type: 'bar', tooltip: true },
    encoding: {
      x: { field: 'team', type: 'nominal', title: null, axis: { labelColor: '#000' } },
      y: { field: 'value', type: 'quantitative', title: null, axis: { format: '.0%', labelColor: '#6B7280' } },
      color: {
        field: 'metric',
        type: 'nominal',
        scale: { range: ['#000', '#4B5563', '#9CA3AF'] },
        legend: { title: 'Metric (Click to Filter)' }
      },
      opacity: {
        condition: { param: 'metric_select', value: 1 },
        value: 0.2
      },
      xOffset: { field: 'metric' },
      tooltip: [
        { field: 'team', type: 'nominal', title: 'Team' },
        { field: 'metric', type: 'nominal', title: 'Metric' },
        { field: 'value', type: 'quantitative', title: 'Value', format: '.2%' }
      ]
    },
    width: 'container',
    height: 400
  }

  // Conference Breakdown
  const eastTeams = predictions.filter(p => p.conference === 'East')
  const westTeams = predictions.filter(p => p.conference === 'West')
  const eastTopProb = eastTeams.length > 0 ? eastTeams[0].championship_probability : 0
  const westTopProb = westTeams.length > 0 ? westTeams[0].championship_probability : 0

  const eastAvg = eastTeams.length > 0
    ? eastTeams.slice(0, 5).reduce((sum, t) => sum + t.championship_probability, 0) / Math.min(5, eastTeams.length)
    : 0
  const westAvg = westTeams.length > 0
    ? westTeams.slice(0, 5).reduce((sum, t) => sum + t.championship_probability, 0) / Math.min(5, westTeams.length)
    : 0

  const conferenceData = [
    { conference: 'Eastern', metric: 'Top Team', value: eastTopProb },
    { conference: 'Western', metric: 'Top Team', value: westTopProb },
    { conference: 'Eastern', metric: 'Avg Top 5', value: eastAvg },
    { conference: 'Western', metric: 'Avg Top 5', value: westAvg }
  ]

  const conferenceSpec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    title: {
      text: 'East vs West Analysis (Click Legend)',
      fontSize: 18,
      font: '-apple-system',
      fontWeight: 600,
      color: '#000'
    },
    data: { values: conferenceData.filter(d => !isNaN(d.value) && d.value !== null) },
    params: [
      {
        name: 'metric_selection',
        select: { type: 'point', fields: ['metric'] },
        bind: 'legend'
      }
    ],
    mark: { type: 'bar', tooltip: true },
    encoding: {
      x: {
        field: 'conference',
        type: 'nominal',
        title: null,
        axis: { labelColor: '#000' }
      },
      y: {
        field: 'value',
        type: 'quantitative',
        title: 'Championship Probability',
        axis: { format: '.1%', labelColor: '#6B7280', titleColor: '#000' }
      },
      color: {
        field: 'metric',
        type: 'nominal',
        scale: { range: ['#000', '#6B7280'] },
        legend: { title: 'Metric (Click to Filter)' }
      },
      opacity: {
        condition: {
          param: 'metric_selection',
          value: 1
        },
        value: 0.2
      },
      xOffset: { field: 'metric' },
      tooltip: [
        { field: 'conference', type: 'nominal', title: 'Conference' },
        { field: 'metric', type: 'nominal', title: 'Metric' },
        { field: 'value', type: 'quantitative', title: 'Probability', format: '.2%' }
      ]
    },
    width: 'container',
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
          <Link
            href="/about"
            className="px-5 py-2 bg-white text-black text-sm font-medium rounded-full border border-gray-300 hover:border-black transition-colors"
          >
            About
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

          <div className="flex items-center gap-2 ml-4 border border-gray-300 rounded-full p-1">
            <button
              onClick={() => setConferenceFilter('All')}
              className={`px-4 py-1 text-sm font-medium rounded-full transition-colors ${conferenceFilter === 'All' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'}`}
            >
              All
            </button>
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

            <div className="mb-8 text-center">
              <h2 className="text-2xl font-semibold text-black mb-2">Advanced Analytics</h2>
              <p className="text-gray-500 text-sm">Deep dive into model predictions and team comparisons</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
              <div className="bg-white border border-gray-200 rounded-xl p-8">
                <VegaChart spec={radarChartSpec} />
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-8">
                <VegaChart spec={statsComparisonSpec} />
              </div>
            </div>

            {conferenceData.some(d => d.value > 0) && (
              <div className="bg-white border border-gray-200 rounded-xl p-8 mb-16">
                <VegaChart spec={conferenceSpec} />
              </div>
            )}


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
                    {filteredPredictions.map((pred, idx) => {
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
