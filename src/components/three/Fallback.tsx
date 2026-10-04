/**
 * 2.5D fallback for devices without (capable) WebGL or with reduced motion.
 * Each stage is an architectural line drawing; the active one cross-fades in
 * and its layers drift slightly with scroll (disabled under reduced motion).
 */

type Props = { colors: string[]; active: number }

const W = 1600
const H = 1000
const HORIZON = 560

function Ground() {
  const lines = []
  for (let i = -12; i <= 12; i++) lines.push(<line key={`v${i}`} x1={W / 2 + i * 30} y1={HORIZON} x2={W / 2 + i * 260} y2={H} />)
  for (let j = 1; j < 9; j++) {
    const y = HORIZON + Math.pow(j / 9, 1.8) * (H - HORIZON)
    lines.push(<line key={`h${j}`} x1={0} y1={y} x2={W} y2={y} />)
  }
  return (
    <g className="fb-ground" stroke="currentColor" strokeOpacity="0.12" strokeWidth="1">
      <line x1={0} y1={HORIZON} x2={W} y2={HORIZON} strokeOpacity="0.3" />
      {lines}
    </g>
  )
}

function Silo({ x, w, h, c }: { x: number; w: number; h: number; c: string }) {
  const y = HORIZON + 80
  return (
    <g>
      <rect x={x} y={y - h} width={w} height={h} className="fb-solid" stroke="currentColor" strokeOpacity="0.55" />
      <path d={`M${x} ${y - h} L${x + w / 2} ${y - h - w * 0.35} L${x + w} ${y - h}`} className="fb-solid" stroke="currentColor" strokeOpacity="0.55" />
      {[0.25, 0.5, 0.75].map((k) => (
        <line key={k} x1={x} x2={x + w} y1={y - h * k} y2={y - h * k} stroke={c} strokeOpacity="0.5" />
      ))}
    </g>
  )
}

function Nutrition({ c }: { c: string }) {
  return (
    <g>
      <g className="fb-layer" style={{ '--d': 0.4 } as React.CSSProperties}>
        {[0, 1, 2, 3, 4].map((i) => (
          <Silo key={i} x={330 + i * 120} w={96} h={360 - (i % 2) * 40} c={c} />
        ))}
        <rect x={960} y={HORIZON - 380} width={130} height={460} className="fb-solid" stroke="currentColor" strokeOpacity="0.55" />
        <rect x={1090} y={HORIZON - 120} width={240} height={200} className="fb-solid" stroke="currentColor" strokeOpacity="0.55" />
        <rect x={975} y={HORIZON - 300} width={100} height={6} fill={c} />
        <line x1={330} y1={HORIZON - 330} x2={1025} y2={HORIZON - 330} stroke="currentColor" strokeOpacity="0.6" strokeWidth="10" />
      </g>
      <g className="fb-layer fb-grain" style={{ '--d': 1 } as React.CSSProperties} fill={c}>
        {Array.from({ length: 60 }, (_, i) => (
          <circle key={i} cx={1200 + ((i * 37) % 90) - 45} cy={HORIZON - 300 + ((i * 53) % 330)} r={1.5 + (i % 3)} opacity={0.4 + (i % 5) * 0.12} />
        ))}
      </g>
    </g>
  )
}

function Hatchery({ c }: { c: string }) {
  const eggs = []
  for (let r = 0; r < 4; r++)
    for (let col = 0; col < 7; col++)
      for (let l = 0; l < 5; l++) {
        const x = 260 + col * 160 + r * 30 + (l % 2) * 6
        const y = HORIZON - 260 + l * 62 + r * 40
        for (let e = 0; e < 4; e++)
          eggs.push(<ellipse key={`${r}-${col}-${l}-${e}`} cx={x + e * 24} cy={y} rx={8} ry={11} fill={e % 2 ? '#efe2cc' : '#e2c9a4'} opacity={0.35 + r * 0.18} />)
      }
  return (
    <g>
      <g className="fb-layer" style={{ '--d': 0.3 } as React.CSSProperties} stroke={c} strokeOpacity="0.35" fill="none">
        <path d={`M140 ${HORIZON - 360} L1460 ${HORIZON - 360} L1460 ${HORIZON + 150} L140 ${HORIZON + 150} Z`} />
        {[0, 1, 2].map((i) => (
          <rect key={i} x={300 + i * 380} y={HORIZON - 340} width={300} height={6} fill="#ffd9a0" stroke="none" opacity="0.9" />
        ))}
      </g>
      <g className="fb-layer" style={{ '--d': 0.8 } as React.CSSProperties}>{eggs}</g>
    </g>
  )
}

function Farming({ c }: { c: string }) {
  return (
    <g>
      <g className="fb-layer" style={{ '--d': 0.2 } as React.CSSProperties}>
        <path d={`M0 ${HORIZON} C 300 ${HORIZON - 90}, 600 ${HORIZON - 40}, 900 ${HORIZON - 70} S 1400 ${HORIZON - 30}, 1600 ${HORIZON - 80} L1600 ${HORIZON + 20} L0 ${HORIZON + 20} Z`} fill="#20261a" />
      </g>
      <g className="fb-layer" style={{ '--d': 0.7 } as React.CSSProperties}>
        {[0, 1, 2, 3, 4].map((i) => {
          const y = HORIZON + 20 + i * 70
          const x = 200 - i * 40
          const w = 900 + i * 60
          return (
            <g key={i}>
              <rect x={x} y={y} width={w} height={34} fill={i === 2 ? 'none' : '#d8d2c6'} stroke={i === 2 ? c : 'none'} opacity={0.75 + i * 0.05} />
              <path d={`M${x - 6} ${y} L${x + w / 2} ${y - 26} L${x + w + 6} ${y} Z`} fill={i === 2 ? 'none' : '#2b2b28'} stroke={i === 2 ? c : '#3a3a36'} />
              {i === 2 &&
                Array.from({ length: 70 }, (_, k) => <circle key={k} cx={x + 14 + ((k * 61) % (w - 28))} cy={y + 10 + ((k * 7) % 18)} r={3} fill="#f1ece2" />)}
              <rect x={x + w + 20} y={y - 30} width={14} height={60} fill="#8f9796" />
            </g>
          )
        })}
      </g>
    </g>
  )
}

function Transformation({ c }: { c: string }) {
  return (
    <g>
      <g className="fb-layer" style={{ '--d': 0.35 } as React.CSSProperties}>
        <rect x={760} y={HORIZON - 220} width={620} height={330} fill="#cfd8db" opacity="0.9" />
        <rect x={760} y={HORIZON - 160} width={620} height={8} fill="#e9f6ff" />
        <rect x={760} y={HORIZON - 60} width={620} height={8} fill="#e9f6ff" />
        <rect x={220} y={HORIZON - 160} width={360} height={260} fill="#d8d2c6" opacity="0.85" />
        <rect x={240} y={HORIZON - 30} width={320} height={6} fill={c} />
      </g>
      <g className="fb-layer" style={{ '--d': 0.9 } as React.CSSProperties}>
        <rect x={120} y={HORIZON + 200} width={1360} height={14} fill="#2b2b28" />
        <rect x={700} y={HORIZON + 110} width={110} height={110} fill="none" stroke={c} strokeWidth="2" />
        <line className="fb-scan" x1={700} x2={810} y1={HORIZON + 160} y2={HORIZON + 160} stroke={c} strokeWidth="3" />
        {Array.from({ length: 14 }, (_, i) => (
          <rect key={i} x={150 + i * 95} y={HORIZON + 176} width={i > 6 ? 62 : 50} height={i > 6 ? 24 : 18} fill="#eef3f4" opacity={0.9} />
        ))}
      </g>
    </g>
  )
}

function Food({ c }: { c: string }) {
  const trays = Array.from({ length: 64 }, (_, i) => {
    const k = i / 64
    const a = k * Math.PI * 2 * 3.2
    const r = 260 - k * 170
    const x = 800 + Math.cos(a) * r
    const y = HORIZON + 140 - k * 420 + Math.sin(a) * r * 0.25
    const tones = [c, '#efe6d6', '#c9a26b']
    return <rect key={i} x={x - 30} y={y - 8} width={60 - k * 18} height={16 - k * 4} fill={tones[i % 3]} opacity={0.55 + Math.sin(a) * 0.35 + 0.1} />
  })
  return (
    <g>
      <g className="fb-layer" style={{ '--d': 0.3 } as React.CSSProperties}>
        <ellipse cx={800} cy={HORIZON + 170} rx={320} ry={60} fill="#1f1712" />
      </g>
      <g className="fb-layer" style={{ '--d': 0.8 } as React.CSSProperties}>{trays}</g>
    </g>
  )
}

function Overview({ colors }: { colors: string[] }) {
  const pts = [
    [220, 700],
    [500, 560],
    [800, 640],
    [1100, 520],
    [1380, 600],
  ]
  return (
    <g className="fb-layer" style={{ '--d': 0.5 } as React.CSSProperties}>
      <polyline points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke="currentColor" strokeOpacity="0.5" strokeWidth="2" />
      {pts.map(([x, y], i) => (
        <g key={i}>
          <ellipse cx={x} cy={y} rx={120} ry={32} fill="none" stroke={colors[i]} strokeOpacity="0.6" />
          <circle cx={x} cy={y} r={9} fill={colors[i]} />
        </g>
      ))}
    </g>
  )
}

export function Fallback({ colors, active }: Props) {
  const stageFor = (station: number) => (station <= 1 ? 0 : station >= 7 ? -1 : station - 2)
  const current = stageFor(active)
  const scenes = [Nutrition, Hatchery, Farming, Transformation, Food]
  return (
    <div className="journey__fallback" aria-hidden="true">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice">
        <Ground />
        {scenes.map((Scene, i) => (
          <g key={i} className="fb-scene" data-active={current === i || undefined}>
            <Scene c={colors[i]} />
          </g>
        ))}
        <g className="fb-scene" data-active={current === -1 || undefined}>
          <Overview colors={colors} />
        </g>
      </svg>
    </div>
  )
}
