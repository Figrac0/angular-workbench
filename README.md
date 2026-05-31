# FinScope — Investment & Markets Toolkit

> A modern, single-page **Angular 18** finance application that turns a simple
> compound-interest calculator into a portfolio-grade product: live
> projections, real-time currency conversion across 30+ fiat currencies, and a
> self-refreshing cryptocurrency market dashboard — all rendered with rich,
> theme-aware charts.

FinScope started life as a textbook "investment calculator" exercise and was
rebuilt from the ground up into a multi-feature SPA that demonstrates
production patterns: standalone components, Angular **signals**, reactive
forms, lazy-loaded routes, RxJS data streams, and a custom design system with
light/dark theming.

---

## Table of contents

- [Features](#features)
- [Screens](#screens)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [The projection engine](#the-projection-engine)
- [Live data sources](#live-data-sources)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Available scripts](#available-scripts)
- [Design system](#design-system)
- [Performance](#performance)
- [Accessibility & responsiveness](#accessibility--responsiveness)
- [Roadmap](#roadmap)
- [Disclaimer & credits](#disclaimer--credits)

---

## Features

### 📈 Investment Calculator
A full compound-interest projection engine, not just a single formula.

- **Inputs:** initial investment, annual contribution, **annual contribution
  growth** (e.g. rising salary), expected return, duration, expected inflation,
  **intra-year compounding** (annual / semi-annual / quarterly / monthly), and
  the base currency.
- **Live results:** the projection recalculates as you type (debounced) — no
  "Calculate" button required.
- **Headline KPIs:** final value, total invested, total interest (with ROI
  chip), and the **inflation-adjusted "real" value** in today's money.
  Derived metrics include **CAGR** and **ROI**.
- **Three charts** (Chart.js): an area chart of nominal vs invested vs real
  value over time, a **stacked bar** of yearly contribution vs interest, and a
  **doughnut** showing the final capital/interest split.
- **Live FX panel:** the final portfolio value converted into other major
  currencies at real European Central Bank rates.
- **Year-by-year schedule** table and **CSV export** of the full projection.

### 💱 Currency Converter
- Convert any amount between **30+ fiat currencies** using live ECB reference
  rates.
- One-click **swap**, popular-currency quick chips, and an instant rate readout.
- **Historical trend chart** for the selected pair (1M / 3M / 6M / 1Y) with
  period change %, high and low.

### 🪙 Crypto Market
- **Top 30 assets** by market capitalisation, priced in your chosen display
  currency.
- Per-row **1h / 24h / 7d** performance and an inline **SVG sparkline** (zero
  dependencies) for the 7-day trend.
- **Auto-refresh every 60 seconds** plus a manual refresh, with a "last
  updated" timestamp and aggregate market-cap / volume tiles.
- Click any asset to open a **detail panel** with a price chart
  (24H / 7D / 30D / 90D / 1Y) and key stats (market cap, volume, 24h range,
  all-time high, circulating supply).
- Client-side **search/filter** across the table.

### 🎨 Cross-cutting
- **Light/dark theme** with a system-preference default, persisted to
  `localStorage`; every chart re-themes instantly.
- **Global display-currency selector** in the header, shared across all
  features via a signal.
- Fully **responsive** layout with a collapsible mobile nav.

---

## Screens

| Route         | Description                                           |
| ------------- | ----------------------------------------------------- |
| `/calculator` | Investment projection (default route)                 |
| `/converter`  | Live currency converter + historical chart            |
| `/crypto`     | Real-time crypto market dashboard + asset detail      |

> _Tip: add your own screenshots to a `docs/` folder and embed them here for an
> even stronger portfolio presentation._

---

## Tech stack

| Area              | Choice                                                            |
| ----------------- | ----------------------------------------------------------------- |
| Framework         | **Angular 18** (standalone components, no NgModules)              |
| Reactivity        | **Angular Signals** + `computed` / `effect`, `rxjs-interop`       |
| Async data        | **RxJS** (`switchMap`, `combineLatest`, `debounceTime`, `timer`)  |
| Forms             | **Reactive Forms** (typed, non-nullable) + template `ngModel`     |
| Routing           | Angular Router with **lazy-loaded** standalone components         |
| HTTP              | `HttpClient` with the modern **Fetch** backend                    |
| Charts            | **Chart.js 4** via a thin reactive wrapper component              |
| Styling           | Hand-written **CSS design system** with custom properties         |
| Language          | **TypeScript** (strict mode, `strictTemplates`)                   |
| Tooling           | Angular CLI esbuild application builder                           |

No UI component library and no CSS framework — the entire interface is custom,
which keeps the bundle small and the styling fully under control.

---

## Architecture

The codebase follows a **feature-first, layered** structure that scales beyond
a demo:

```
core/      → framework-agnostic domain logic & singletons
  models/      pure TypeScript interfaces (no Angular)
  services/    investment engine, FX API, crypto API, theme
shared/    → reusable, presentational components (dumb)
  components/  chart wrapper, stat card, sparkline, loading
features/  → smart, lazy-loaded pages (one chunk each)
  calculator/  converter/  crypto/
layout/    → app chrome (header/nav, footer)
```

Key decisions:

- **Signals as the state model.** The `InvestmentService` exposes the
  projection as signals; components derive view-models with `computed`, so the
  UI updates without manual subscriptions or change-detection juggling.
- **Pure engine, reactive shell.** `InvestmentService.project()` is a static,
  side-effect-free function — easy to test and reuse — while the instance
  methods handle state.
- **RxJS only at the I/O edges.** Network streams are bridged into signals with
  `toSignal` / `toObservable`, combining RxJS's operator power (debounce,
  cancel-in-flight via `switchMap`, polling via `timer`) with signal ergonomics.
- **Lazy routes.** Each feature ships as its own chunk; Chart.js lives in a
  shared lazy chunk and never touches the initial bundle.
- **Thin chart wrapper.** A single `<app-chart>` component owns the Chart.js
  lifecycle (create once, patch on change, destroy on teardown), so feature
  components only ever produce a declarative `ChartConfiguration`.

---

## The projection engine

The calculator models each year with configurable intra-year compounding. For a
year with `m` compounding periods, a periodic rate `r = annualReturn / m`, and a
per-period contribution `c = annualContribution / m`, the portfolio value
evolves period by period:

```
valueₙ = valueₙ₋₁ · (1 + r) + c          // repeated m times per year
```

After each year the contribution grows by the configured growth rate, and the
nominal value is discounted to a **real value** using compound inflation:

```
realValue(year) = nominalValue(year) / (1 + inflation)^year
```

Headline metrics:

```
ROI  = totalInterest / totalContributions × 100
CAGR = (finalValue / initialInvestment)^(1 / years) − 1 × 100
```

See [`investment.service.ts`](src/app/core/services/investment.service.ts) for
the implementation.

---

## Live data sources

Both providers are **free, key-less and CORS-enabled**, so the app runs purely
client-side with no backend or secrets.

| Provider                                              | Used for                                  | Endpoints |
| ----------------------------------------------------- | ----------------------------------------- | --------- |
| [**Frankfurter**](https://www.frankfurter.app) (ECB)  | Fiat rates, conversion, historical series | `/v1/latest`, `/v1/currencies`, `/v1/{start}..{end}` |
| [**CoinGecko**](https://www.coingecko.com/en/api)     | Crypto markets, sparklines, price history | `/coins/markets`, `/coins/{id}/market_chart` |

> **Note:** Frankfurter's canonical host is `api.frankfurter.dev`. CoinGecko's
> free tier is rate-limited (~10–30 requests/min); the app keeps requests
> modest and degrades gracefully (`catchError`) if a call fails.

---

## Project structure

```
src/
├─ app/
│  ├─ core/
│  │  ├─ models/        investment.model.ts · currency.model.ts · crypto.model.ts
│  │  └─ services/      investment · currency · crypto · theme
│  ├─ shared/components/  chart · stat-card · sparkline · loading
│  ├─ features/
│  │  ├─ calculator/    .ts · .html · .css
│  │  ├─ converter/     .ts · .html · .css
│  │  └─ crypto/        .ts · .html · .css
│  ├─ layout/           header/ · footer/
│  ├─ app.component.ts  app shell (nav + outlet + footer)
│  ├─ app.config.ts     providers (router, http, zone)
│  └─ app.routes.ts     lazy route table
├─ styles.css           global design system & tokens
├─ index.html
└─ main.ts              bootstrapApplication(...)
```

---

## Getting started

### Prerequisites

- **Node.js 18.19+** (Node 20+ recommended)
- **npm 9+**

### Install & run

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server (http://localhost:4200)
npm start

# 3. Open the app — it redirects to /calculator
```

### Production build

```bash
npm run build:prod
# Output: dist/essentials-practice/
```

The production bundle is fully static and can be hosted on any static host
(GitHub Pages, Netlify, Vercel, Cloudflare Pages, S3, …). Because the app uses
the Angular Router with HTML5 paths, configure your host to **fall back to
`index.html`** for unknown routes.

---

## Available scripts

| Script               | Description                                  |
| -------------------- | -------------------------------------------- |
| `npm start`          | Dev server with HMR at `localhost:4200`      |
| `npm run build`      | Production build (default configuration)     |
| `npm run build:prod` | Explicit production build                    |
| `npm run watch`      | Development build in watch mode              |
| `npm test`           | Unit tests via Karma + Jasmine               |

---

## Design system

All visuals are driven by CSS **custom properties** declared in
[`styles.css`](src/styles.css). The active palette is selected by a
`data-theme="dark|light"` attribute on `<html>` (toggled by `ThemeService`),
which means **theming is a single attribute swap** — no rebuild, no flash.

Representative tokens:

```css
--brand:          #2dd4bf;   /* teal accent            */
--brand-gradient: linear-gradient(135deg, #2dd4bf, #38bdf8);
--surface:        #121821;   /* card background (dark)  */
--text-muted:     #8a97a8;
--success / --danger;        /* gains / losses          */
--radius / --shadow-sm / --shadow-lg;
```

Reusable primitives (`.panel`, `.btn`, `.badge`, `.data-table`, form controls,
`.chart`) live globally; each feature stylesheet only adds its own layout.
Charts read theme colours at render time and re-draw when the theme changes.

---

## Performance

Production bundle (gzipped transfer sizes):

| Asset                         | Transfer |
| ----------------------------- | -------- |
| Initial JS + CSS              | **≈ 97 kB** |
| Chart.js (shared lazy chunk)  | ≈ 62 kB (loaded on first feature) |
| `calculator` chunk            | ≈ 6 kB   |
| `crypto` chunk                | ≈ 5 kB   |
| `converter` chunk             | ≈ 3 kB   |

- **Lazy routes** keep the initial payload tiny; Chart.js is never in the
  initial bundle.
- **`switchMap`** cancels superseded in-flight requests when inputs change
  rapidly.
- **`shareReplay`** caches the currency list for the session.
- **`debounceTime`** throttles live recalculation and API calls while typing.

---

## Accessibility & responsiveness

- Semantic landmarks (`<header>`, `<main>`, `<nav>`, `<footer>`), `aria-label`s
  on icon buttons, and `role="status"` live regions for loading states.
- Visible focus rings on all interactive controls.
- Fluid grids collapse cleanly from desktop → tablet → mobile, including a
  hamburger nav and progressively hidden table columns on narrow screens.
- Respects the OS `prefers-color-scheme` on first visit.

---

## Roadmap

Ideas to extend the project further:

- Persist calculator scenarios and compare them side by side.
- A crypto **watchlist** saved to `localStorage` (the service already supports
  fetching by id).
- Monte-Carlo / variable-return simulations with confidence bands.
- Unit tests for the projection engine and an E2E happy-path (Playwright).
- PWA support for offline-first usage and installability.

---

## Disclaimer & credits

This application is for **educational and demonstration purposes only** and is
**not financial advice**. Projections are estimates based on the inputs you
provide and do not account for taxes, fees, or market volatility.

- FX data © [Frankfurter](https://www.frankfurter.app) / European Central Bank
- Market data © [CoinGecko](https://www.coingecko.com)
- Charts by [Chart.js](https://www.chartjs.org)
- Built with [Angular](https://angular.dev)
