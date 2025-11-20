'use client'

import { useEffect, useRef, useState } from 'react'

interface VegaChartProps {
  spec: any
}

export default function VegaChart({ spec }: VegaChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (isClient && containerRef.current && spec) {
      import('vega-embed').then(({ default: embed }) => {
        embed(containerRef.current!, spec, {
          actions: false,
          renderer: 'svg'
        }).catch(console.error)
      })
    }
  }, [spec, isClient])

  if (!isClient) {
    return <div className="h-96 flex items-center justify-center">Loading chart...</div>
  }

  return <div ref={containerRef} />
}
