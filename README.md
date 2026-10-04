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
| Story | `/fr/notre-histoire` | `/en/our-story` |
| Expertise | `/fr/nos-expertises` | `/en/our-expertise` |
| Company | `/fr/nos-expertises/sofalim` | `/en/our-expertise/sofalim` |
| People | `/fr/nos-equipes` | `/en/our-people` |
| Careers | `/fr/carrieres` | `/en/careers` |
| Contact | `/fr/contact` | `/en/contact` |
| Newsroom | `/fr/actualites/<slug-fr>` | `/en/newsroom/<slug-en>` |

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

`detectTier()` chooses the experience once on load:

| Tier | When | Experience |
| --- | --- | --- |
| `high` | desktop, capable GPU | full scene, DPR up to 2 |
| `medium` | tablets, ≤4 cores / ≤4 GB, narrow desktops | reduced instance counts, DPR 1.25 |
| `low` | capable phones | simplified scene, DPR 1 |
| `static` | no WebGL, software rendering, save-data, weak phones, **reduced motion** | 2.5D illustrated fallback, no canvas |

At runtime a performance guard lowers the pixel ratio and, if the frame rate stays low, switches to
the static fallback; WebGL context loss does the same. Rendering pauses when the journey is off-screen.
All narrative content (stage names, companies, metrics, locations) is real DOM text, so the canvas is
decorative (`aria-hidden`) and the page reads the same without it.

Force a tier for testing with `?tier=high|medium|low|static`.

## Themes

Light and dark modes share one token system (`globals.css`): on the light theme ink and paper swap
roles, green brand sections stay green. The choice is stored in `localStorage` (`ffh-theme`),
defaults to the OS preference, and is applied by an inline script before first paint. The 3D world
follows the theme: Moroccan daylight on light, warm dusk with lit windows on dark.

## 3D realism

`components/three/Atmosphere.tsx` provides a sky dome, image-based lighting generated from it,
a shadow-casting sun that tracks the camera and distance fog. Surfaces use procedural PBR textures
(`textures.ts`: corrugated cladding, concrete, façades with windows, soil, asphalt, fields), and
`props.tsx` holds trucks, palms and trees. The SOFALIM zone is modelled on the aerial photograph of
the site (green mill tower, silo battery and gallery, orange block, offices, palms).

## Placeholder content — to replace before launch

Marked `placeholder: true` in `src/content/*`:

- **Key figures, capacities, sites and coordinates** — indicative values only.
- **Supply relationships** between companies (`suppliesTo`) — plausible defaults, to confirm.
- **Leadership** — names (`Prénom Nom`) and biographies.
- **Newsroom articles and job offers** — illustrative.
- **Headquarters address, phone, emails**.
- **Fenway Banner web fonts** — the licensed heading face isn't bundled; headings fall back to
  Newsreader (open source). Drop the `.woff2` files in `public/fonts/` and uncomment
  `src/app/brand-fonts.css`.
- **Vector logo** — `public/brand/` holds high-resolution transparent WebP exports of the supplied
  logos; replace with SVG masters when available (same file names).
- **Company logos** — extracted from the supplied logo sheet (`public/brand/companies/`); SONAVIC and
  GOLDAVI have none yet and show their name. Replace with vector originals when available.
- **ZITOUNWAZIT and NATURE LAIT** — added from the logo sheet; descriptions, figures and sites to provide.
- **Photography / video** — every image slot renders an art-directed placeholder until a `Media`
  object is provided in the CMS.

The contact form posts to `/api/contact`, which validates input; connect `deliver()` in
`src/app/api/contact/route.ts` to the group's mail service or CRM.
