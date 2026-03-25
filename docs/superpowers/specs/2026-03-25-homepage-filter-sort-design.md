# Homepage Filter & Sort — Design Spec

**Date:** 2026-03-25
**Status:** Approved

---

## Overview

Add sort and filter controls to the presentation homepage. The UI pattern is a pill-based toolbar above the card grid; clicking any pill opens a slide-in drawer panel with richer options. Active filters are shown as dismissible badge chips between the toolbar and the grid.

The interaction was validated against a live interactive mockup during brainstorming.

---

## UI Pattern

### Filter bar

A single row of pill buttons directly above the grid:

```
[ ↕ Sort ]  |  [ 👤 Author ▾ ]  [ 🏷 Tags ▾ ]       4 presentations
```

- **Sort** — icon + label showing the current sort (defaults to "Newest first")
- **Author** — filter by one or more authors; highlighted when a selection is active
- **Tags** — filter by one or more tags; multi-select; highlighted when a selection is active
- Separator (`|`) between Sort and the filter pills
- Result count aligned to the right

### Active filter badges

Row below the filter bar (hidden when empty). Each badge shows the filter type icon + value + ✕ button to remove that single filter immediately.

### Drawer

A panel that slides in from the right when a pill is clicked. Overlay behind it closes it on click. Esc also closes.

Structure:
- **Header** — title ("Sort" / "Filter by Author" / "Filter by Tags") + ✕ close button
- **Body** — panel-specific content (see below)
- **Footer** — "Clear" (clears this panel only) + "Apply" (commits and closes)

Changes inside the drawer are **staged** — not applied until the user hits Apply.

**Sort panel** — radio-style list:
- Newest first *(default)*
- Oldest first
- Title A → Z
- Title Z → A

**Author panel** — clickable pill chips, one per distinct author found in the presentations array. Multi-select.

**Tags panel** — clickable pill chips, one per distinct tag across all presentations. Multi-select. When multiple tags are selected, a card must match **all** of them (AND logic).

---

## Architecture

### New file: `src/FilterController.ts`

Owns all filter/sort state and drawer DOM. Keeps `main.ts` uncluttered.

```ts
interface FilterState {
  sort: 'date-desc' | 'date-asc' | 'title-asc' | 'title-desc'
  authors: Set<string>
  tags: Set<string>
}

class FilterController {
  constructor(
    presentations: PresentationMeta[],
    mounts: {
      filterBar: HTMLElement
      activeFilters: HTMLElement
      overlay: HTMLElement
      drawer: HTMLElement
    },
    onApply: (filtered: PresentationMeta[]) => void
  )
}
```

**Init:** reads all distinct authors and tags from the presentations array; renders the pill bar HTML into `mounts.filterBar`; renders the empty drawer shell into `mounts.drawer`; wires overlay click and keyboard (Esc).

**open(panel):** clones live state into `pending`, renders panel-specific body, opens drawer + overlay.

**close():** hides drawer + overlay, discards pending.

**applyAndClose():** commits `pending → state`, calls `onApply(applyFilters())`, re-renders active badges and pill highlight states.

**applyFilters():** filters and sorts the presentations array:
- Author filter: card passes if `state.authors` is empty OR card's author is in the set
- Tag filter: card passes if `state.tags` is empty OR card's tags include **all** tags in the set
- Cards with no date sort to the end when sorting by date

**removeFilter(type, value):** removes a single value from live state, immediately calls `onApply` and re-renders badges.

### Changes to `src/main.ts`

1. Extract iframe-load handler attachment into `attachIframeHandlers(grid)` helper so it can be called after re-renders.
2. After the initial `grid.innerHTML` render, instantiate `FilterController`:

```ts
const filterController = new FilterController(
  sorted,           // initial sorted presentations (same array used for first render)
  {
    filterBar:    document.getElementById('filter-bar')!,
    activeFilters: document.getElementById('active-filters')!,
    overlay:      document.getElementById('overlay')!,
    drawer:       document.getElementById('drawer')!,
  },
  (filtered) => {
    grid.innerHTML = filtered.map(renderCard).join('')
    attachIframeHandlers(grid)
    countEl.innerHTML = `<span>${filtered.length}</span> presentation${filtered.length !== 1 ? 's' : ''}`
  }
)
```

The existing author-link click delegation on `grid` is re-attached inside `attachIframeHandlers` (or kept on the static grid element so it survives innerHTML replacement via event delegation — no change needed since it's already delegated).

### Changes to `index.html`

Add four mount-point divs inside `<main>`, before the grid:

```html
<main>
  <div id="filter-bar"></div>
  <div id="active-filters"></div>
  <div id="presentations-grid"></div>
</main>
<div id="overlay"></div>
<div id="drawer"></div>
```

`#overlay` and `#drawer` are placed outside `<main>` so they can be `position: fixed` and cover the full viewport without stacking context issues.

### Changes to `src/styles/index.css`

New style blocks (appended, no changes to existing rules):

- `.filter-bar` — flex row, gap, margin-bottom
- `.filter-pill` — pill shape, border, hover/active/has-selection states
- `.filter-bar-sep` — 1px vertical divider
- `.result-count` — muted, margin-left: auto
- `.active-filters` — flex wrap row; hidden when empty via `:empty { display: none }`
- `.filter-badge` — pill chip with icon + value + ✕ button
- `#overlay` — fixed inset-0, dark + blur, z-index 90; hidden by default
- `#drawer` — fixed right-0, width 340px, translateX(100%) by default; transitions; z-index 100
- `.drawer-header`, `.drawer-body`, `.drawer-footer` — layout within drawer
- `.sort-option` — radio-style row with custom radio dot
- `.chip` — author/tag chip with selected state
- `.btn-apply`, `.btn-clear` — drawer footer buttons

All new styles use existing design tokens (`--color-*`, `--radius-*`, `--transition-*`).

---

## Behaviour Details

| Scenario | Behaviour |
|---|---|
| No filters active | All presentations shown; active-filters row hidden |
| Filter pill with selection | Pill gets `has-selection` highlight (indigo tint) |
| Sort changed from default | Sort pill label updates to reflect current sort |
| Multiple tags selected | AND logic — card must carry all selected tags |
| Presentation has no author | Hidden when any author filter is active |
| Presentation has no tags | Hidden when any tag filter is active |
| Presentation has no date | Sorted to the end for date sorts |
| All cards filtered out | Empty-state message shown in grid area |
| Esc key | Closes drawer (discards pending) |
| Overlay click | Closes drawer (discards pending) |

---

## Out of Scope

- URL persistence of filter state
- Search / text input
- Filter state preserved across page reloads
