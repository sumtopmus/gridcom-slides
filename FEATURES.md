# GRIDCOM — Feature Analysis & Proposals

> Analysis date: 2026-03-19

---

## Already Implemented in This Branch

### 1. Speaker Notes Panel (`n` key)

The `notes` field already existed in `SlideConfig` but had no viewer UI. This branch wires it up:

- Toggle with `n` key or the new document icon in the chrome bar.
- The panel appears above the progress bar (inside `#viewer-chrome`, so it hides with the chrome in fullscreen).
- Shows `notes` text from the current slide's `presentation.json` entry.
- Displays an italic placeholder when a slide has no notes.
- Respects light/dark interface mode.

**Usage in `presentation.json`:**
```json
{ "file": "slide-02.html", "title": "Architecture", "notes": "Explain the two-layer approach here. Ask the audience about their current setup." }
```

### 2. `slide-up` Transition Fix

`TransitionType` already declared `'slide-up'` but `viewer.ts` fell through to `'fade'` for it, and no CSS classes existed. This branch adds:

- `'slide-up'` → forward: slides exit upward / enter from below; backward: reversed (`slide-down`).
- Four new `@keyframes` in `viewer.css` (`slide-out-up`, `slide-in-bottom`, `slide-out-down`, `slide-in-top`).
- Two new transition CSS classes: `transition-slide-up`, `transition-slide-down`.

---

## Proposed Features

The items below are scoped proposals with enough detail to guide implementation. They are ordered roughly by value-to-effort ratio.

---

### P1 — Auto-Advance Timer

**Problem:** No way to run a presentation hands-free or set per-slide timing.

**Proposal:**
- Add optional `duration` (seconds) to `SlideConfig`:
  ```json
  { "file": "slide-03.html", "duration": 8 }
  ```
- Add an `autoAdvance` toggle button in the chrome bar (`a` key).
- When active, start a `setTimeout` per slide using `slide.duration` (or a configurable default, e.g. 5 s).
- On `loadSlide`, clear any pending timer and start the next one if auto-advance is on.
- Add a thin countdown ring or progress indicator on the counter to show time remaining.
- Pause auto-advance while grid overlay is open.

**Files:** `src/types.ts`, `src/viewer.ts`, `viewer.html`, `src/styles/viewer.css`, `src/viewer/NavigationController.ts`.

---

### P2 — Presenter View (Second Window)

**Problem:** Presenters have no way to see notes, a clock, and the next slide preview simultaneously.

**Proposal:**
- Add a `p` key shortcut that opens `presenter.html` in a new window via `window.open`.
- `presenter.html` displays:
  - Current slide thumbnail (scaled iframe)
  - Next slide thumbnail
  - Elapsed / remaining time timer
  - Current slide notes
  - Slide counter
- Sync via `BroadcastChannel` — the viewer broadcasts `{ type: 'presenterSync', index, totalSlides, notes, nextSlideFile }` on every slide change.
- The presenter window listens and updates its display.
- No additional server required — works with `file://` and `localhost`.

**Files:** new `presenter.html`, new `src/presenter.ts`, new `src/styles/presenter.css`, `src/viewer.ts` (broadcast on slide change), `vite.config.ts` (add `presenter.html` as entry point).

---

### P3 — PDF / Print Export

**Problem:** No way to share a presentation as a static document.

**Proposal:**
- Add a `?print` query parameter mode to the viewer.
- In print mode, render all slides sequentially in the DOM as scaled divs (not a carousel of iframes), one per page.
- Add `@media print` styles that page-break between slides and hide the chrome.
- Optionally add a print button (`⊞` icon) in the chrome that opens `viewer.html?print#/<id>/0`.
- For PDF quality: use fixed-canvas mode (1920×1080 scaled to A4/letter) to get consistent output from browser print-to-PDF.

**Files:** `src/viewer.ts`, `src/styles/viewer.css`, `viewer.html`.

---

### P4 — Quick Jump (Slide Number Input)

**Problem:** In long presentations, navigating to a specific slide requires multiple keypresses or the grid overlay.

**Proposal:**
- When the user types a digit while no input is focused, open a small HUD (`#jump-hud`) showing the typed number.
- Typing continues to append digits (e.g. typing `1`, `2` → "12").
- `Enter` navigates to that slide; `Escape` or 1 s of inactivity dismisses without navigating.
- Alternatively, clicking the slide counter (`1 / 24`) activates inline editing.

**Files:** `src/viewer/NavigationController.ts`, `src/viewer.ts`, `viewer.html`, `src/styles/viewer.css`.

---

### P5 — Additional Transitions: `zoom` and `crossfade`

**Problem:** Only `fade`, `slide-left`, `slide-up`, and `none` are available; there is no scale-based transition.

**Proposal:**
- Add `'zoom'` and `'crossfade'` to `TransitionType`.
- `zoom`: entering slide scales from 0.92 → 1 while fading in; leaving slide scales 1 → 1.08 while fading out. Gives a "punch through" feel.
- `crossfade`: both iframes are visible simultaneously with a CSS `z-index` crossfade (leaving fades while entering fades in at the same rate). Smoother than the current `fade` which sequences the two animations.
- Adjust the 350 ms transition delay for each type to match its feel.

**Files:** `src/types.ts`, `src/viewer.ts`, `src/styles/viewer.css`.

---

### P6 — Third Theme: `midnight`

**Problem:** Aurora and Eclipse cover dark/light; there is no mid-tone or high-contrast option.

**Proposal:**
- Add `themes/midnight.css` — a deep blue-gray palette (e.g. `#0d1117` background, cyan/teal accents) distinct from Aurora's purple focus.
- Follow the exact token structure of `aurora.css` so all existing slides work.
- Add the theme to the CLAUDE.md Themes table.

**Files:** new `themes/midnight.css`, `CLAUDE.md`.

---

### P7 — Slide Annotations / Drawing Overlay

**Problem:** During a live presentation there is no way to highlight or draw on a slide.

**Proposal:**
- Add a `d` key toggle that activates an SVG overlay canvas covering `#slide-container`.
- In drawing mode: pointer events draw freehand SVG `<path>` strokes on the overlay.
- Color selector (red, yellow, white) and eraser in a minimal floating toolbar.
- `Escape` or `d` again clears and dismisses.
- Annotations are ephemeral (not persisted); they clear on slide change.

**Files:** new `src/viewer/AnnotationController.ts`, `src/viewer.ts`, `viewer.html`, `src/styles/viewer.css`.

---

### P8 — Slide Timer / Stopwatch in Chrome

**Problem:** When practicing a talk, there is no way to track how long you spend on each slide.

**Proposal:**
- Show an elapsed timer in the chrome bar (e.g. next to the slide counter).
- Resets to 0:00 on each slide transition.
- Optionally log per-slide durations to `console.table` or a small overlay when `Escape` is pressed at the end.
- Toggle with a new button or always visible.

**Files:** `src/viewer.ts`, `viewer.html`, `src/styles/viewer.css`.

---

### P9 — Configurable Canvas Dimensions

**Problem:** The fixed-canvas mode is hardcoded to 1920×1080. Some presentations target other aspect ratios (4:3, 21:9, mobile portrait).

**Proposal:**
- Add optional `canvas` field to `PresentationMeta`:
  ```json
  { "canvas": { "width": 2560, "height": 1080 } }
  ```
- In `viewer.ts`, read `presentation.canvas` and set `CANVAS_DESIGN_WIDTH` and the `aspect-ratio` CSS accordingly.
- Default remains 1920×1080 for backward compatibility.

**Files:** `src/types.ts`, `src/viewer.ts`, `src/styles/viewer.css`.

---

### P10 — Homepage Improvements

**Problem:** The homepage card grid shows a live iframe thumbnail of slide 1, which triggers network requests, animations, and JS execution for every presentation on load. It also has no search/filter.

**Sub-proposals:**

#### a) Static thumbnail images
- Add optional `thumbnail` field in `PresentationMeta` pointing to a pre-rendered PNG/JPG.
- `src/main.ts` uses the image when available, falls back to the iframe.
- Build tooling (optional) could screenshot slide 1 via Playwright during `npm run build`.

#### b) Tag filtering
- Add tag buttons above the card grid.
- Clicking a tag filters the visible cards (CSS class toggle, no page reload).
- Selected tags persist in `?tags=` query params for shareability.

#### c) Search
- Add a text input that filters cards by title/description/author as you type.

**Files:** `src/main.ts`, `src/types.ts`, `src/styles/index.css`, `index.html`.

---

## Implementation Priority Summary

| # | Feature | Effort | Value |
|---|---------|--------|-------|
| 1 | Speaker notes panel | Done ✓ | High |
| 2 | `slide-up` transition fix | Done ✓ | Medium |
| P1 | Auto-advance timer | Small | High |
| P2 | Presenter view | Medium | High |
| P4 | Quick jump HUD | Small | Medium |
| P5 | `zoom`/`crossfade` transitions | Small | Medium |
| P3 | PDF/Print export | Medium | Medium |
| P8 | Per-slide timer | Small | Low–Medium |
| P6 | Midnight theme | Small | Medium |
| P7 | Annotation overlay | Large | Low–Medium |
| P9 | Configurable canvas | Small | Low–Medium |
| P10 | Homepage improvements | Medium | Medium |
