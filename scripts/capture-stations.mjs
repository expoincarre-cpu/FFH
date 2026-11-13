// Captures every camera station of the homepage journey, in both themes and at
// desktop + phone sizes. Usage:
//   node scripts/capture-stations.mjs <outDir> [--base http://localhost:3000] [--tier high] [--sizes 1440x900,390x844]
//     [--themes light,dark] [--stations 0,1,2] [--panels] [--extra "mobile=baked"]
// Headless Chromium renders WebGL on SwiftShader, so each frame takes seconds.
import { createRequire } from 'node:module'
// Playwright is expected globally (or as a dev dependency); it is not a runtime dependency.
const { chromium } = createRequire(import.meta.url)('playwright')
import { mkdir, writeFile } from 'node:fs/promises'

const args = process.argv.slice(2)
const out = args[0] ?? 'captures'
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : fallback
}
const base = opt('base', 'http://localhost:3000')
const tier = opt('tier', '')
const extra = opt('extra', '')
const sizes = opt('sizes', '1440x900,390x844').split(',').map((s) => s.split('x').map(Number))
const themes = opt('themes', 'light,dark').split(',')
const stations = opt('stations', '0,1,2,3,4,5,6,7').split(',').map(Number)
const hidePanels = !args.includes('--panels')
const fullPage = args.includes('--page')
const settle = Number(opt('settle', '4'))

await mkdir(out, { recursive: true })
const browser = await chromium.launch({
  args: ['--use-angle=swiftshader', '--use-gl=angle', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
})

for (const [width, height] of sizes) {
  for (const theme of themes) {
    const mobile = width < 768
    const ctx = await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor: 1,
      hasTouch: mobile,
      isMobile: mobile,
    })
    await ctx.addInitScript((t) => localStorage.setItem('ffh-theme', t), theme)
    const page = await ctx.newPage()
    page.on('pageerror', (e) => console.error('pageerror:', e.message))
    const seen = new Set()
    page.on('console', (m) => {
      const text = m.text().slice(0, 600)
      if (m.type() === 'error' && !seen.has(text.slice(0, 80))) {
        seen.add(text.slice(0, 80))
        console.error('console:', text)
      }
    })
    // ?capture switches the scene to a manual frame loop: __journey.render(progress, time) draws one frame.
    const q = ['capture', tier && `tier=${tier}`, extra].filter(Boolean).join('&')
    await page.goto(`${base}/fr?${q}`, { waitUntil: 'networkidle' })
    await page.waitForFunction(() => document.querySelector('.journey')?.dataset.tier !== 'pending')
    if (hidePanels)
      await page.addStyleTag({
        content: '.journey__panels,.journey__scrim,.journey__cue,.site-header,header{visibility:hidden!important}',
      })
    await page.waitForFunction(() => !!window.__journey?.render || !document.querySelector('.journey__visual canvas'), null, { timeout: 120000 })
    for (const s of stations) {
      const t0 = Date.now()
      const file = `${out}/${width}x${height}-${theme}-s${s}.png`
      const data = await page.evaluate(
        ({ station, settle, fullPage }) => {
          const j = window.__journey
          const el = document.querySelector('.journey')
          const total = el.offsetHeight - window.innerHeight
          const top = el.getBoundingClientRect().top + window.scrollY
          if (fullPage) window.scrollTo(0, top + j.anchors[station] * total)
          if (!j.render) return null
          for (let i = 0; i < settle; i++) j.render(j.anchors[station], 20 + station * 7 + i / 30)
          return fullPage ? null : document.querySelector('.journey__visual canvas').toDataURL('image/png')
        },
        { station: s, settle, fullPage },
      )
      if (data) await writeFile(file, Buffer.from(data.split(',')[1], 'base64'))
      else await page.screenshot({ path: file, timeout: 180000 })
      console.log(file, `${((Date.now() - t0) / 1000).toFixed(1)}s`)
    }
    await ctx.close()
  }
}
await browser.close()
