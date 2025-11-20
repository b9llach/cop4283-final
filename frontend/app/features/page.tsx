'use client'

import { useEffect, useState } from 'react'
import VegaChart from '../components/VegaChart'
import Link from 'next/link'

interface FeatureImportance {
  feature: string
  importance: number
}

export default function FeaturesPage() {
  const [features, setFeatures] = useState<FeatureImportance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchFeatures()
  }, [])

  const fetchFeatures = async () => {
    try {
      const response = await fetch('http://localhost:8000/features')
      if (!response.ok) {
        throw new Error('Failed to fetch feature importance')
      }
      const data = await response.json()
      setFeatures(data)
      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setLoading(false)
    }
  }

  const barChartSpec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    title: {
      text: 'Model Feature Importance (Top 20)',
      fontSize: 18,
      fontWeight: 600,
      color: '#000',
      font: '-apple-system'
    },
    data: { values: features.slice(0, 20) },
    mark: { type: 'bar', tooltip: true, color: '#000' },
    encoding: {
      x: {
        field: 'importance',
        type: 'quantitative',
        title: null,
        axis: { format: '.2%', grid: false, labelColor: '#6B7280' }
      },
      y: {
        field: 'feature',
        type: 'nominal',
        title: null,
        sort: '-x',
        axis: { labelColor: '#000', labelFont: '-apple-system' }
      },
      color: { value: '#000' },
      tooltip: [
        { field: 'feature', type: 'nominal', title: 'Feature' },
        { field: 'importance', type: 'quantitative', title: 'Importance', format: '.3%' }
      ]
    },
    width: 700,
    height: 600
  }

  const treemapSpec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    title: {
      text: 'Feature Importance Distribution',
      fontSize: 18,
      fontWeight: 600,
      color: '#000',
      font: '-apple-system'
    },
    data: { values: features.slice(0, 15) },
    mark: { type: 'rect', tooltip: true },
    encoding: {
      x: {
        field: 'feature',
        type: 'nominal',
        title: null,
        axis: { labelAngle: -45, labelColor: '#000', labelFont: '-apple-system' }
      },
      y: {
        field: 'importance',
        type: 'quantitative',
        title: null,
        axis: { format: '.1%', labelColor: '#6B7280' }
      },
      color: {
        field: 'importance',
        type: 'quantitative',
        scale: { scheme: 'greys' },
        legend: null
      },
      tooltip: [
        { field: 'feature', type: 'nominal', title: 'Feature' },
        { field: 'importance', type: 'quantitative', title: 'Importance', format: '.3%' }
      ]
    },
    width: 700,
    height: 400
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-black mx-auto"></div>
          <p className="mt-6 text-gray-500 text-sm">Loading feature importance</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="bg-white border border-gray-200 rounded-lg p-8 max-w-md">
          <h2 className="text-black font-semibold text-lg mb-3">Error</h2>
          <p className="text-gray-600 text-sm mb-6">{error}</p>
          <button
            onClick={fetchFeatures}
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
            Feature Importance
          </h1>
          <p className="text-lg text-gray-500">
            Key Predictors for Championship Success
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
            className="px-5 py-2 bg-black text-white text-sm font-medium rounded-full"
          >
            Feature Importance
          </Link>
          <Link
            href="/historical"
            className="px-5 py-2 bg-white text-black text-sm font-medium rounded-full border border-gray-300 hover:border-black transition-colors"
          >
            Historical Accuracy
          </Link>
        </div>

        {features.length > 0 && (
          <div className="mb-16 bg-black text-white rounded-xl p-8">
            <div className="text-xs uppercase tracking-wide text-gray-400 mb-3">
              Top Feature
            </div>
            <h3 className="text-3xl font-semibold mb-4">{features[0].feature}</h3>
            <p className="text-5xl font-semibold">
              {(features[0].importance * 100).toFixed(2)}%
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 mb-16">
          <div className="bg-white border border-gray-200 rounded-xl p-8">
            <VegaChart spec={barChartSpec} />
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-8">
            <VegaChart spec={treemapSpec} />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-16">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-black">All Features Ranked</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Feature</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Importance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {features.map((feat, idx) => (
                  <tr key={feat.feature} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {idx + 1}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {feat.feature}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {feat.importance.toFixed(6)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-full bg-gray-100 rounded-full h-2 mr-3" style={{width: '150px'}}>
                          <div
                            className="bg-black h-2 rounded-full"
                            style={{width: `${(feat.importance / features[0].importance) * 100}%`}}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-black">
                          {(feat.importance * 100).toFixed(2)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-8">
          <h3 className="text-lg font-semibold text-black mb-4">Key Insights</h3>
          <ul className="space-y-3 text-sm text-gray-600">
            <li>Defensive rebound rate is the strongest predictor of championship success</li>
            <li>Efficiency metrics (offensive and defensive) play a crucial role</li>
            <li>Three-point shooting differential has become increasingly important</li>
            <li>Recent momentum and win streaks contribute to championship probability</li>
            <li>Turnover management and assist-to-turnover ratio separate champions from contenders</li>
          </ul>
        </div>

        <div className="mt-16 text-center">
          <p className="text-xs text-gray-500">Feature importance calculated using ensemble averaging</p>
          <p className="text-xs text-gray-400 mt-1">XGBoost + LightGBM + CatBoost</p>
        </div>
      </div>
    </div>
  )
}
