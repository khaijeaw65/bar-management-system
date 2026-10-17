# DR-015 — Chart library for the dashboard: Recharts

| | |
|---|---|
| **Status** | Approved |
| **Raised by** | Cowork · 2026-10-17 |
| **Brief** | Dashboard brief (not written yet) · CD-05 R2 |
| **Category** | Dependency |

## Context
CD-05 (owner dashboard) draws bar and line charts (revenue by day, payment split, top / bottom items). HeroUI v3 has no chart components, so the web app needs a chart library — a new dependency in `app/frontend/package.json`. Chart colours come from DS tokens `--chart-1` / `--chart-2` (CD-05 R2), so the library must accept CSS variables and follow the dark / light theme without extra code. The dashboard is after the 8 Nov gate (S1 if time).

## Options
**A) Recharts** — SVG; colours accept `var(--chart-1)` directly, so theme switching is free; the most-used React chart library; v3 supports React 19 / Next 16 / cons: SVG gets slow with tens of thousands of points (not our scale — a bar has days × items).
**B) Chart.js + react-chartjs-2** — canvas, fast with large data / cons: CSS variables must be read in JS and re-applied on theme change; two packages.
**C) visx** — low-level D3 primitives, full control / cons: much more code per chart; slower to build.

## Recommendation
A. Our charts are small (days, a handful of series), so SVG performance doesn't matter, and token-based colours with free theme switching keep the DS the single source of colour. Least code to build CD-05.

---

## Decision — Field only
**Decision:** Approved: A — `recharts` `^3.9.0` in `app/frontend` (+ its peer `react-is` `^19.0.0` if the install requires it). Colours only via DS tokens `--chart-1` / `--chart-2`; no hex in chart code.
**Why:** Small datasets, SVG works with CSS-variable tokens and theme switching, least code for the dashboard.
**Date:** 2026-10-17 · recorded by Cowork on Field's explicit instruction (planning session); Field signs off by merging the PR
