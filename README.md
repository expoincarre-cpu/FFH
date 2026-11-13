# FFH — Fettah Financial Holding · corporate website

**From feed to food.** A Next.js site with a scroll-driven WebGL journey through the FFH value chain:
nutrition → hatchery → farming → transformation → food.

```bash
npm install
npm run dev        # http://localhost:3000 → redirects to /fr or /en
npm run build      # static generation of every page in both languages
npm run typecheck
```

## Stack

- **Next.js 16** (App Router, static generation) · React 19 · TypeScript
- **Three.js + React Three Fiber** for the 3D ecosystem
- **GSAP + ScrollTrigger** for scroll-driven motion, **Lenis** for smooth scrolling
- **Brand identity** (FERGUS guidelines): palette `#0F3525` deep green · `#D1B572` gold ·
  `#F6F2E1` cream · `#3D6D55` green · `#1B1E1F` charcoal; headings in **Fenway Banner**, text in
  **Inter** (self-hosted via `@fontsource-variable/inter`). Logo files are in `public/brand/`.

## Architecture

```
src/
  app/[locale]/[[...slug]]/page.tsx   one catch-all route → resolves localized URLs to a page
  i18n/
    config.ts                         locales (fr default, en), Localized<T>
    routes.ts                         route keys ↔ localized URL segments (single source of truth)
    dictionaries.ts                   interface copy (labels, buttons, headings)
  content/                            CMS seed data, typed by content/types.ts
  lib/cms.ts                          data-access layer — the only module that knows the data source
  lib/capabilities.ts                 device tier detection for the 3D experience
  components/
    home/Journey.tsx                  sticky viewport + narrative panels, scroll → camera
    home/Ecosystem.tsx                interactive company/value-chain diagram
    three/                            WebGL world (World.tsx, zones/*), Scene.tsx, Fallback.tsx
    pages/                            one component per page template
    ui/, motion/, layout/             shared building blocks
```

### Localized URLs

| Page | FR | EN |
| --- | --- | --- |
| Home | `/fr` | `/en` |
| The Group (Chairman & CEO's word) | `/fr/le-groupe` | `/en/the-group` |
| Governance | `/fr/le-groupe/gouvernance` | `/en/the-group/governance` |
| Mission & Vision | `/fr/le-groupe/mission-vision` | `/en/the-group/mission-vision` |
| History | `/fr/le-groupe/histoire` | `/en/the-group/history` |
| Ecosystem (activity workflow) | `/fr/ecosysteme` | `/en/ecosystem` |
| Activity | `/fr/ecosysteme/accouvage` | `/en/ecosystem/hatchery` |
| Company | `/fr/ecosysteme/sofalim` | `/en/ecosystem/sofalim` |
| Careers (CV submission) | `/fr/carrieres` | `/en/careers` |
| Contact | `/fr/contact` | `/en/contact` |
| Newsroom | `/fr/actualites/<slug-fr>` | `/en/newsroom/<slug-en>` |

Activities (verticals) and companies share the `/ecosysteme/<slug>` space; activity slugs are
localized in `content/businesses.ts`. Activity tile images in `public/media/activities/` are stills
rendered from the site's own 3D world (SOFALIM uses the real aerial photograph).

Components never hard-code paths — they call `href(locale, key, params)`. The language switcher maps
the current page to its counterpart (including per-language article slugs). Every page emits
`hreflang` alternates and a canonical URL; `sitemap.xml` lists both languages.

### CMS readiness

`src/content/types.ts` defines the content model (Group, Stage, Domain → Vertical → Business, Article,
Person, Job). Every visible string is `Localized` (`{ fr, en }`). To connect a headless CMS
(Sanity, Strapi, Payload, Contentful…), re-implement the async functions in `src/lib/cms.ts`;
signatures stay the same, so no component changes.

The expertise section is data-driven: adding a business, a vertical or a whole new domain is a
content change, not a code change. Business pages share one template (`BusinessPage.tsx`) covering
hero, about, expertise, key figures, industrial capacity, products, locations (map), certifications,
commitments and contact.

### 3D experience and fallbacks

`detectTier()` (`src/lib/capabilities.ts`) chooses the experience once on load:

| Tier | When | Experience |
| --- | --- | --- |
| `high` | desktop, fine pointer, discrete / Apple-silicon GPU | real-time WebGL, full post-processing, 4096² shadows, DPR ≤ 1.5 (≤ 4.2 MP) |
| `medium` | integrated GPUs, ≤ 4 cores / ≤ 4 GB, narrow desktops | real-time WebGL, half-res AO, SMAA only, no depth of field, 2048² shadows, DPR ≤ 1.25 |
| `low` | phones and tablets (coarse pointer), desktops without WebGL 2 float targets, and any desktop that misses its frame budget | **pre-rendered journey**: the desktop scene rendered offline to a scroll-scrubbed frame sequence (`Film.tsx`) |
| `static` | no WebGL, software rendering, save-data, **reduced motion** | 2.5D illustrated fallback, no canvas |

The performance guard degrades in this order: post-processing first (depth of field + half-res AO →
AO and bloom off → composer off), then the pixel ratio in steps down to 0.75, then it falls back to
the pre-rendered journey, which itself falls back to the illustration if its frames cannot load.
WebGL context loss takes the same route. Rendering pauses when the journey is off-screen. All
narrative content is real DOM text, so the visual is decorative (`aria-hidden`).

Testing hooks: `?tier=high|medium|low|static` forces a tier; `?debug` exposes `window.__journey`;
`?capture` switches the scene to a manual frame loop (`__journey.render(progress, time)`) for
deterministic offline rendering; `?off=ao,bloom,fog,env` disables individual passes;
`?mobile=baked` shows the rejected baked-WebGL mobile prototype.

## Typography

All font sizes come from one modular scale (ratio 1.25) defined as `--fs-*` tokens at the end of
`globals.css` (caption 0.64rem → hero 4.768rem); large steps shrink fluidly on small screens.

## Themes

Light and dark modes share one token system (`globals.css`): on the light theme ink and paper swap
roles, green brand sections stay green. The choice is stored in `localStorage` (`ffh-theme`),
defaults to the OS preference, and is applied by an inline script before first paint. The 3D world
follows the theme: Moroccan daylight on light, warm dusk with lit windows on dark.

## 3D rendering

Everything is procedural and self-hosted: no model, texture or HDRI files are downloaded at runtime.

- **Sky and light** (`Atmosphere.tsx`): three's analytic `Sky` with cloud cover; a PMREM environment
  generated from that sky plus a ground bounce (regenerated while the theme blends); one sun whose
  shadow frustum is fitted to each camera station and snapped to shadow texels; exponential height
  fog with sun forward-scattering, installed for every material by overriding the fog shader chunks
  (`fog.ts`). Light theme = high Moroccan sun; dark theme = low dusk sun, lit windows, lamps, LEDs.
- **Post-processing** (`Effects.tsx`, `postprocessing` + `n8ao`): HDR half-float buffers (MSAA ×4 on
  `high`) → N8AO ambient occlusion (radius per station) → depth of field on close shots (`high`) →
  luminance-selective bloom + exposure + AgX tone mapping + day/dusk grade → SMAA + vignette + grain.
  Tone mapping happens once, inside the composer.
- **Materials** (`textures.ts`, `materials.ts`): generated PBR sets (colour, normal, roughness /
  metalness) for concrete, render, asphalt, soil, gravel, litter, profiled and galvanised steel,
  sandwich panels, stainless steel and windowed façades, with streaks, lap seams, stains and cracks;
  a world-space weathering patch (tone variation that hides tiling, splash-zone grime); bevelled
  boxes; Fresnel glass.
- **Geometry and vegetation** (`props.tsx`, `zones/`): modelled silo corrugation, lattice towers,
  trusses and handrails with real section thickness (instanced); date palms with alpha-tested frond
  cards; Mediterranean trees from foliage cards with a rounded canopy normal and vertex-shader wind;
  instanced grass; blob contact shadows. The SOFALIM site follows `public/media/sofalim-aerial.webp`.
- **Portrait framing**: `STATIONS_PORTRAIT` plus an upward lens shift keep each subject above the
  text card on phones.

### Pre-rendered journey (mobile / tablet)

`public/media/journey/<portrait|landscape>-<light|dark>/NNN.webp` (113 frames each, evenly spaced
along the camera path) are produced from the real-time scene by a scripted offline step:

```bash
npm run build && npx next start -p 3100 &
npm run render:film          # all four sets; see the header of scripts/render-film.mjs for options
npm run capture -- out/ --tier high   # station stills, both themes and sizes
```

`Film.tsx` scrubs them with the existing scroll progress: coarse-to-fine loading (every 16th frame
first), a ≈3.2 MB budget before the first interaction, a small decoded window, cross-faded
neighbours and a cross-fade between themes. Re-run the script whenever the scene changes.
`public/media/activities/*.webp` are stills from the same scene.

### Assets and licences

| Asset | Source | Licence |
| --- | --- | --- |
| All 3D geometry, textures, sky, vegetation | generated in code in this repository | project-owned |
| Pre-rendered journey frames, activity stills | rendered from this repository's scene | project-owned |
| `three` (incl. `Sky`, `RoundedBoxGeometry`), `@react-three/fiber` | npm | MIT |
| `postprocessing` | npm | Zlib |
| `n8ao` | npm | ISC |
| SOFALIM logo on the rooftop sign, `sofalim-aerial.webp` | supplied by the client | client-owned |

No third-party models, scanned textures or HDRIs are used.

## Placeholder content — to replace before launch

Marked `placeholder: true` in `src/content/*`:

- **Key figures, capacities, sites and coordinates** — indicative values only.
- **Supply relationships** between companies (`suppliesTo`) — plausible defaults, to confirm.
- **Leadership** — names (`Prénom Nom`) and biographies.
- **Newsroom articles** — illustrative.
- **Chairman & CEO's word** (`content/group.ts`) — draft for validation; add his portrait as `chairman.portrait`.
- **Careers** — `/api/careers` validates the application and résumé; connect `deliver()` to the HR mailbox or ATS.
- **Headquarters address, phone, emails**.
- **Fenway Banner web fonts** — the licensed heading face isn't bundled; headings fall back to
  Newsreader (open source). Drop the `.woff2` files in `public/fonts/` and uncomment
  `src/app/brand-fonts.css`.
- **Vector logo** — `public/brand/` holds high-resolution transparent WebP exports of the supplied
  logos; replace with SVG masters when available (same file names).
- **Company logos** — extracted from the supplied logo sheet (`public/brand/companies/`); SONAVIC and
  GOLDAVI have none yet and show their name. Replace with vector originals when available.
- **Photography / video** — every image slot renders an art-directed placeholder until a `Media`
  object is provided in the CMS.

The contact form posts to `/api/contact`, which validates input; connect `deliver()` in
`src/app/api/contact/route.ts` to the group's mail service or CRM.
