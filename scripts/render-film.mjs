// Renders the homepage journey offline, from the real-time desktop scene, into the
// scroll-scrubbed frame sequences used on phones and tablets (src/components/three/Film.tsx).
//
//   npm run build && npx next start -p 3100 &
//   node scripts/render-film.mjs [--base http://localhost:3100] [--variants portrait,landscape]
//        [--themes light,dark] [--frames 113] [--quality 0.5] [--from 0] [--to 112]
//
// Each frame is drawn deterministically through the ?capture hook
// (window.__journey.render) at an evenly spaced curve parameter, read back from
// the canvas as WebP and written to public/media/journey/<variant>-<theme>/NNN.webp.
// Headless Chromium uses SwiftShader, so expect several seconds per frame.
import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'
const { chromium } = createRequire(import.meta.url)('playwright')

const args = process.argv.slice(2)
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : fallback
}
const base = opt('base', 'http://localhost:3100')
const SIZES = { portrait: [720, 1200], landscape: [1280, 800] }
const variants = opt('variants', 'portrait,landscape').split(',')
const themes = opt('themes', 'light,dark').split(',')
const frames = Number(opt('frames', '113'))
const quality = Number(opt('quality', '0.5'))
const from = Number(opt('from', '0'))
const to = Number(opt('to', String(frames - 1)))
const out = opt('out', 'public/media/journey')

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--use-gl=angle', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
for (const variant of variants) {
  const [width, height] = SIZES[variant]
  for (const theme of themes) {
    const dir = `${out}/${variant}-${theme}`
    await mkdir(dir, { recursive: true })
    const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 })
    await ctx.addInitScript((t) => localStorage.setItem('ffh-theme', t), theme)
    const page = await ctx.newPage()
    page.on('pageerror', (e) => console.error('pageerror:', e.message))
    await page.goto(`${base}/fr?capture&tier=high`, { waitUntil: 'networkidle' })
    await page.waitForFunction(() => !!window.__journey?.render, null, { timeout: 180000 })
    const t0 = Date.now()
    for (let i = from; i <= to; i++) {
      const data = await page.evaluate(
        ({ u, warm, quality }) => {
          const j = window.__journey
          j.param = u
          // Time advances with the camera, so animated elements move as the visitor scrolls.
          for (let k = warm; k >= 0; k--) j.render(u, 20 + u * 60 - k / 30)
          return document.querySelector('.journey__visual canvas').toDataURL('image/webp', quality)
        },
        { u: i / (frames - 1), warm: i === from ? 3 : 0, quality },
      )
      await writeFile(`${dir}/${String(i).padStart(3, '0')}.webp`, Buffer.from(data.split(',')[1], 'base64'))
      if (i % 10 === 0) console.log(`${variant}-${theme} ${i}/${frames - 1} ${((Date.now() - t0) / 1000).toFixed(0)}s`)
    }
    await ctx.close()
  }
}
await browser.close()
await writeFile(
  `${out}/manifest.json`,
  JSON.stringify({ frames, variants: Object.fromEntries(Object.entries(SIZES).map(([k, [width, height]]) => [k, { width, height }])) }),
)
