// this file was needed to make charts responsive and not have them be too wide where
// they would take up entire widths of page or go outside of their container
'use client'

import { useEffect, useRef, useState } from 'react'

// props for the vega chart
interface VegaChartProps {
  spec: any // any type for the spec
}

// vega chart component
// this bascially renders the chart and makes it responsive, without it the charts would be too wide and not responsive
export default function VegaChart({ spec }: VegaChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isClient, setIsClient] = useState(false)

  // set is client to true
  useEffect(() => {
    setIsClient(true)
  }, [])

  // use effect to set the container width and responsive spec
  useEffect(() => {
    if (isClient && containerRef.current && spec) {
      const containerWidth = containerRef.current.offsetWidth

      // create responsive spec
      // this is the spec that is used to render the chart
      // it is the same as the spec passed in, but with the width set to the container width
      // and the autosize set to fit the padding
      // this is so the chart is responsive and not too wide
      const responsiveSpec = {
        ...spec,
        width: spec.width === 'container' ? containerWidth - 40 : spec.width,
        autosize: {
          type: 'fit',
          contains: 'padding'
        }
      }

      // import vega embed and embed the chart
      // default as embed is the default export of the vega-embed module
      // and the containerRef.current is the container for the chart
      // and the renderer is svg so the chart is rendered as an svg
      import('vega-embed').then(({ default: embed }) => {
        embed(containerRef.current!, responsiveSpec, {
          actions: false,
          renderer: 'svg'
        }).catch(console.error)
      })
    }
  }, [spec, isClient])

  // loading state
  if (!isClient) {
    return <div className="h-96 flex items-center justify-center">Loading chart...</div>
  }

  // return the vega chart
  return <div ref={containerRef} className="w-full" />
}
