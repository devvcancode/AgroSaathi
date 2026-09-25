'use client'

import React, { useEffect, useState } from 'react'

class SceneErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { failed: false }
  }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

export default function SpatialFieldSceneClient({ stressScore = 0 }) {
  const [Scene, setScene] = useState(null)

  useEffect(() => {
    import('./SpatialFieldScene').then((module) => setScene(() => module.default)).catch(() => setScene(() => null))
  }, [])

  const fallback = <div className="h-full w-full rounded-[20px] bg-[radial-gradient(circle_at_50%_35%,rgba(52,211,153,0.4),transparent_32%),linear-gradient(145deg,#082f2a,#0f172a)]" aria-label="Interactive field scene" />
  if (!Scene) return fallback

  return (
    <SceneErrorBoundary fallback={fallback}>
      <Scene stressScore={stressScore} />
    </SceneErrorBoundary>
  )
}
