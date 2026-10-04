'use client'

import * as THREE from 'three'
import { useEffect, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { tierSettings, type Tier } from '@/lib/capabilities'
import { World } from './World'
import { STATIONS } from './shared'

type Props = {
  tier: Exclude<Tier, 'static'>
  colors: string[]
  running: boolean
  onFail: () => void
}

/**
 * Watches the frame rate and degrades gracefully: first lowers the pixel
 * ratio, then hands over to the static fallback if the device still struggles.
 */
function PerformanceGuard({ onFail }: { onFail: () => void }) {
  const { setDpr, gl } = useThree()
  const samples = useRef<number[]>([])
  const strikes = useRef(0)
  useFrame((_, dt) => {
    samples.current.push(dt)
    if (samples.current.length < 90) return
    const avg = samples.current.reduce((a, b) => a + b, 0) / samples.current.length
    samples.current = []
    if (avg > 1 / 28) {
      strikes.current++
      const dpr = gl.getPixelRatio()
      if (dpr > 1) setDpr(Math.max(1, dpr - 0.5))
      else if (strikes.current > 4) onFail()
    } else strikes.current = Math.max(0, strikes.current - 1)
  })
  return null
}

export default function Scene({ tier, colors, running, onFail }: Props) {
  const settings = tierSettings[tier]
  const canvas = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const el = canvas.current
    if (!el) return
    const lost = (e: Event) => {
      e.preventDefault()
      onFail()
    }
    el.addEventListener('webglcontextlost', lost)
    return () => el.removeEventListener('webglcontextlost', lost)
  }, [onFail])

  return (
    <Canvas
      ref={canvas}
      className="journey__canvas"
      dpr={settings.dpr}
      frameloop={running ? 'always' : 'never'}
      gl={{ antialias: settings.antialias, powerPreference: 'high-performance', alpha: false, stencil: false }}
      camera={{ fov: 42, near: 0.5, far: 700, position: STATIONS[0].pos }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.05
      }}
      aria-hidden="true"
    >
      <World colors={colors} density={settings.density} particles={settings.particles} />
      <PerformanceGuard onFail={onFail} />
    </Canvas>
  )
}
