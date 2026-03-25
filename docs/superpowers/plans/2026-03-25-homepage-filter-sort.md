# Homepage Filter & Sort Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add pill-based sort/filter controls to the presentation homepage, where clicking a pill opens a slide-in drawer with richer options (sort by date/title, filter by author, filter by tags).

**Architecture:** A new `FilterController` class owns all filter state, drawer DOM, and event wiring. `main.ts` instantiates it after rendering the initial grid; the controller calls an `onApply` callback when filters change, which `main.ts` uses to re-render the grid. The controller triggers the initial render in its constructor, so `main.ts`'s manual sort+render loop is removed.

**Tech Stack:** Vanilla TypeScript, Vite, custom CSS (no new dependencies)

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/FilterController.ts` | Create | All filter/sort state, drawer DOM, event wiring |
| `src/main.ts` | Modify | Remove manual sort, add `attachIframeHandlers` helper, instantiate FilterController |
| `index.html` | Modify | Add 5 mount-point elements (`#filter-bar`, `#active-filters` inside `<main>`; `#overlay`, `#drawer` outside) |
| `src/styles/index.css` | Modify | Append styles for filter bar, pills, active badges, overlay, drawer |

---

## Task 1: Add HTML mount points

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add mount points inside `<main>` and at the end of `<body>`**

In `index.html`, replace:
```html
  <main>
    <div class="presentations-grid" id="presentations-grid"></div>
  </main>
```
with:
```html
  <main>
    <div id="filter-bar"></div>
    <div id="active-filters"></div>
    <div class="presentations-grid" id="presentations-grid"></div>
  </main>
  <div id="overlay"></div>
  <div id="drawer"></div>
```

`#overlay` and `#drawer` are outside `<main>` so their `position: fixed` has no stacking-context interference.

- [ ] **Step 2: Verify the page still loads**

```bash
npm run dev
```
Open `http://localhost:5173`. The page should look identical to before — the new divs are empty.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add filter/drawer mount points to index.html"
```

---

## Task 2: Add CSS styles

**Files:**
- Modify: `src/styles/index.css` (append only — no changes to existing rules)

- [ ] **Step 1: Append the filter-bar and pill styles**

Append to `src/styles/index.css`:

```css
/* ── Filter bar ──────────────────────────────────────────────────────────── */

#filter-bar {
  margin-bottom: 1.25rem;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filter-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  height: 36px;
  padding: 0 1rem;
  border-radius: var(--radius-pill);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  font-size: 0.82rem;
  font-weight: 500;
  cursor: pointer;
  transition:
    border-color var(--transition-fast),
    background var(--transition-fast),
    color var(--transition-fast);
  user-select: none;
  white-space: nowrap;
}

.filter-pill:hover {
  border-color: var(--color-accent);
  color: var(--color-text-primary);
}

.filter-pill.active {
  border-color: var(--color-accent);
  color: var(--color-accent-hover);
}

.filter-pill.has-selection {
  border-color: var(--color-accent);
  background: var(--color-accent-dim);
  color: var(--color-accent-hover);
}

.filter-pill svg {
  flex-shrink: 0;
}

.filter-pill .chevron {
  transition: transform var(--transition-fast);
}

.filter-pill.active .chevron {
  transform: rotate(180deg);
}

.filter-bar-sep {
  width: 1px;
  height: 20px;
  background: var(--color-border);
  flex-shrink: 0;
  margin: 0 0.1rem;
}

/* ── Active filter badges ─────────────────────────────────────────────────── */

#active-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 1rem;
}

#active-filters:empty {
  display: none;
}

.filter-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.2rem 0.5rem 0.2rem 0.75rem;
  border-radius: var(--radius-pill);
  background: var(--color-accent-dim);
  border: 1px solid rgba(99, 102, 241, 0.3);
  font-size: 0.75rem;
  color: var(--color-accent-hover);
}

.filter-badge svg {
  flex-shrink: 0;
  opacity: 0.8;
}

.filter-badge button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  color: var(--color-accent-hover);
  opacity: 0.7;
  cursor: pointer;
  background: none;
  border: none;
  font-size: 0.8rem;
  line-height: 1;
  padding: 0;
  transition: opacity var(--transition-fast);
}

.filter-badge button:hover {
  opacity: 1;
}

/* ── Overlay ─────────────────────────────────────────────────────────────── */

#overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 90;
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--transition-base);
}

#overlay.visible {
  opacity: 1;
  pointer-events: auto;
}

html.theme-light #overlay {
  background: rgba(0, 0, 0, 0.3);
}

@media (prefers-color-scheme: light) {
  html.theme-system #overlay {
    background: rgba(0, 0, 0, 0.3);
  }
}

/* ── Drawer ──────────────────────────────────────────────────────────────── */

#drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 340px;
  background: var(--color-bg);
  border-left: 1px solid var(--color-border);
  z-index: 100;
  display: flex;
  flex-direction: column;
  transform: translateX(100%);
  transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

#drawer.open {
  transform: translateX(0);
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.drawer-header h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.drawer-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.06);
  color: var(--color-text-muted);
  cursor: pointer;
  border: none;
  font-size: 1rem;
  line-height: 1;
  transition:
    background var(--transition-fast),
    color var(--transition-fast);
}

html.theme-light .drawer-close {
  background: rgba(0, 0, 0, 0.06);
}

@media (prefers-color-scheme: light) {
  html.theme-system .drawer-close { background: rgba(0, 0, 0, 0.06); }
}

.drawer-close:hover {
  background: rgba(255, 255, 255, 0.12);
  color: var(--color-text-primary);
}

html.theme-light .drawer-close:hover {
  background: rgba(0, 0, 0, 0.1);
}

@media (prefers-color-scheme: light) {
  html.theme-system .drawer-close:hover { background: rgba(0, 0, 0, 0.1); }
}

.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.drawer-body::-webkit-scrollbar {
  width: 4px;
}

.drawer-body::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: var(--radius-pill);
}

.drawer-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--color-border);
  display: flex;
  gap: 0.75rem;
  flex-shrink: 0;
}

.drawer-section h4 {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-muted);
  margin-bottom: 0.75rem;
}

/* Sort options */
.sort-options {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.sort-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0.85rem;
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  cursor: pointer;
  transition:
    background var(--transition-fast),
    border-color var(--transition-fast);
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  user-select: none;
}

.sort-option:hover {
  background: var(--color-surface-hover);
}

.sort-option.selected {
  background: var(--color-accent-dim);
  border-color: rgba(99, 102, 241, 0.25);
  color: var(--color-accent-hover);
}

.sort-radio {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid var(--color-border);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color var(--transition-fast);
}

.sort-option.selected .sort-radio {
  border-color: var(--color-accent);
  background: var(--color-accent);
}

.sort-option.selected .sort-radio::after {
  content: '';
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #fff;
}

/* Chip grid (author / tags) */
.chip-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.chip {
  padding: 0.35rem 0.85rem;
  border-radius: var(--radius-pill);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  cursor: pointer;
  user-select: none;
  transition:
    border-color var(--transition-fast),
    background var(--transition-fast),
    color var(--transition-fast);
}

.chip:hover {
  border-color: var(--color-accent);
  color: var(--color-text-primary);
}

.chip.selected {
  border-color: var(--color-accent);
  background: var(--color-accent-dim);
  color: var(--color-accent-hover);
  font-weight: 500;
}

/* Drawer footer buttons */
.btn-apply {
  flex: 1;
  height: 38px;
  border-radius: var(--radius-md);
  background: var(--color-accent);
  color: #fff;
  font-size: 0.875rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: background var(--transition-fast);
}

.btn-apply:hover {
  background: #4f52d4;
}

.btn-clear {
  height: 38px;
  padding: 0 1rem;
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.06);
  color: var(--color-text-muted);
  font-size: 0.875rem;
  border: none;
  cursor: pointer;
  transition:
    background var(--transition-fast),
    color var(--transition-fast);
}

html.theme-light .btn-clear {
  background: rgba(0, 0, 0, 0.06);
}

@media (prefers-color-scheme: light) {
  html.theme-system .btn-clear { background: rgba(0, 0, 0, 0.06); }
}

.btn-clear:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--color-text-primary);
}

html.theme-light .btn-clear:hover {
  background: rgba(0, 0, 0, 0.1);
}

@media (prefers-color-scheme: light) {
  html.theme-system .btn-clear:hover { background: rgba(0, 0, 0, 0.1); }
}
```

- [ ] **Step 2: Verify visually**

```bash
npm run dev
```
The page should still look identical to before (no filter UI yet — FilterController hasn't been wired up).

- [ ] **Step 3: Commit**

```bash
git add src/styles/index.css
git commit -m "feat: add filter bar, drawer, and chip CSS styles"
```

---

## Task 3: Create FilterController

**Files:**
- Create: `src/FilterController.ts`

- [ ] **Step 1: Create `src/FilterController.ts` with the full implementation**

```typescript
import type { PresentationMeta } from './types'

type SortKey = 'date-desc' | 'date-asc' | 'title-asc' | 'title-desc'
type Panel = 'sort' | 'author' | 'tags'

interface FilterState {
  sort: SortKey
  authors: Set<string>
  tags: Set<string>
}

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'date-desc', label: 'Newest first' },
  { value: 'date-asc',  label: 'Oldest first' },
  { value: 'title-asc', label: 'Title A → Z' },
  { value: 'title-desc', label: 'Title Z → A' },
]

function cloneState(s: FilterState): FilterState {
  return { sort: s.sort, authors: new Set(s.authors), tags: new Set(s.tags) }
}

function svgIcon(name: 'sort' | 'user' | 'tag' | 'chevron'): string {
  const icons: Record<string, string> = {
    sort: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="14" y2="12"/><line x1="4" y1="18" x2="9" y2="18"/></svg>`,
    user: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    tag: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`,
    chevron: `<svg class="chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`,
  }
  return icons[name] ?? ''
}

export class FilterController {
  private state: FilterState = { sort: 'date-desc', authors: new Set(), tags: new Set() }
  private pending: FilterState = { sort: 'date-desc', authors: new Set(), tags: new Set() }
  private currentPanel: Panel | null = null
  private escHandler: ((e: KeyboardEvent) => void) | null = null
  private readonly allAuthors: string[]
  private readonly allTags: string[]

  constructor(
    private readonly presentations: PresentationMeta[],
    private readonly mounts: {
      filterBar: HTMLElement
      activeFilters: HTMLElement
      overlay: HTMLElement
      drawer: HTMLElement
    },
    private readonly onApply: (filtered: PresentationMeta[]) => void
  ) {
    this.allAuthors = [
      ...new Set(presentations.map((p) => p.author).filter((a): a is string => !!a)),
    ]
    this.allTags = [...new Set(presentations.flatMap((p) => p.tags ?? []))]

    this.renderFilterBar()
    this.renderDrawerShell()
    mounts.overlay.addEventListener('click', () => this.close())

    // Trigger the initial render via the callback
    this.onApply(this.applyFilters())
  }

  // ── Filter bar ──────────────────────────────────────────────────────────

  private renderFilterBar(): void {
    const bar = document.createElement('div')
    bar.className = 'filter-bar'
    bar.innerHTML = `
      <button class="filter-pill" id="pill-sort">
        ${svgIcon('sort')} <span class="pill-label">Newest first</span> ${svgIcon('chevron')}
      </button>
      <div class="filter-bar-sep"></div>
      <button class="filter-pill" id="pill-author">
        ${svgIcon('user')} Author ${svgIcon('chevron')}
      </button>
      <button class="filter-pill" id="pill-tags">
        ${svgIcon('tag')} Tags ${svgIcon('chevron')}
      </button>
    `
    this.mounts.filterBar.appendChild(bar)
    bar.querySelector('#pill-sort')!.addEventListener('click', () => this.open('sort'))
    bar.querySelector('#pill-author')!.addEventListener('click', () => this.open('author'))
    bar.querySelector('#pill-tags')!.addEventListener('click', () => this.open('tags'))
  }

  private renderPillStates(): void {
    const sortPill = document.getElementById('pill-sort')
    if (sortPill) {
      sortPill.classList.toggle('has-selection', this.state.sort !== 'date-desc')
      const label = sortPill.querySelector('.pill-label')
      if (label) label.textContent = SORT_OPTIONS.find((o) => o.value === this.state.sort)!.label
    }
    document.getElementById('pill-author')?.classList.toggle('has-selection', this.state.authors.size > 0)
    document.getElementById('pill-tags')?.classList.toggle('has-selection', this.state.tags.size > 0)
  }

  // ── Drawer ──────────────────────────────────────────────────────────────

  private renderDrawerShell(): void {
    this.mounts.drawer.innerHTML = `
      <div class="drawer-header">
        <h3 id="drawer-title"></h3>
        <button class="drawer-close" id="drawer-close">&#x2715;</button>
      </div>
      <div class="drawer-body" id="drawer-body"></div>
      <div class="drawer-footer">
        <button class="btn-clear" id="drawer-clear">Clear</button>
        <button class="btn-apply" id="drawer-apply">Apply</button>
      </div>
    `
    this.mounts.drawer.querySelector('#drawer-close')!.addEventListener('click', () => this.close())
    this.mounts.drawer.querySelector('#drawer-clear')!.addEventListener('click', () => this.clearPanel())
    this.mounts.drawer.querySelector('#drawer-apply')!.addEventListener('click', () => this.applyAndClose())
  }

  open(panel: Panel): void {
    this.currentPanel = panel
    this.pending = cloneState(this.state)

    const titles: Record<Panel, string> = {
      sort: 'Sort',
      author: 'Filter by Author',
      tags: 'Filter by Tags',
    }
    this.mounts.drawer.querySelector('#drawer-title')!.textContent = titles[panel]
    this.renderDrawerBody()

    this.mounts.drawer.classList.add('open')
    this.mounts.overlay.classList.add('visible')
    document.getElementById(`pill-${panel}`)?.classList.add('active')

    this.escHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') this.close()
    }
    document.addEventListener('keydown', this.escHandler)
  }

  close(): void {
    this.currentPanel = null
    this.mounts.drawer.classList.remove('open')
    this.mounts.overlay.classList.remove('visible')
    document.querySelectorAll('.filter-pill').forEach((p) => p.classList.remove('active'))
    if (this.escHandler) {
      document.removeEventListener('keydown', this.escHandler)
      this.escHandler = null
    }
  }

  private renderDrawerBody(): void {
    const body = this.mounts.drawer.querySelector<HTMLElement>('#drawer-body')!

    if (this.currentPanel === 'sort') {
      body.innerHTML = `
        <div class="drawer-section">
          <h4>Sort by</h4>
          <div class="sort-options">
            ${SORT_OPTIONS.map(
              (o) => `
              <div class="sort-option ${this.pending.sort === o.value ? 'selected' : ''}" data-sort="${o.value}">
                <div class="sort-radio"></div>
                <span>${o.label}</span>
              </div>
            `
            ).join('')}
          </div>
        </div>
      `
      body.querySelectorAll<HTMLElement>('.sort-option').forEach((opt) => {
        opt.addEventListener('click', () => {
          this.pending.sort = opt.dataset.sort as SortKey
          this.renderDrawerBody()
        })
      })
    } else if (this.currentPanel === 'author') {
      body.innerHTML = `
        <div class="drawer-section">
          <h4>Author</h4>
          <div class="chip-grid">
            ${this.allAuthors
              .map(
                (a) => `
              <div class="chip ${this.pending.authors.has(a) ? 'selected' : ''}" data-value="${a}">${a}</div>
            `
              )
              .join('')}
          </div>
        </div>
      `
      body.querySelectorAll<HTMLElement>('.chip').forEach((chip) => {
        chip.addEventListener('click', () => {
          const v = chip.dataset.value!
          if (this.pending.authors.has(v)) this.pending.authors.delete(v)
          else this.pending.authors.add(v)
          chip.classList.toggle('selected', this.pending.authors.has(v))
        })
      })
    } else if (this.currentPanel === 'tags') {
      body.innerHTML = `
        <div class="drawer-section">
          <h4>Tags</h4>
          <div class="chip-grid">
            ${this.allTags
              .map(
                (t) => `
              <div class="chip ${this.pending.tags.has(t) ? 'selected' : ''}" data-value="${t}">${t}</div>
            `
              )
              .join('')}
          </div>
        </div>
      `
      body.querySelectorAll<HTMLElement>('.chip').forEach((chip) => {
        chip.addEventListener('click', () => {
          const v = chip.dataset.value!
          if (this.pending.tags.has(v)) this.pending.tags.delete(v)
          else this.pending.tags.add(v)
          chip.classList.toggle('selected', this.pending.tags.has(v))
        })
      })
    }
  }

  private clearPanel(): void {
    if (this.currentPanel === 'sort') this.pending.sort = 'date-desc'
    else if (this.currentPanel === 'author') this.pending.authors.clear()
    else if (this.currentPanel === 'tags') this.pending.tags.clear()
    this.renderDrawerBody()
  }

  private applyAndClose(): void {
    this.state = cloneState(this.pending)
    this.close()
    this.onApply(this.applyFilters())
    this.renderActiveBadges()
    this.renderPillStates()
  }

  // ── Filtering & sorting ─────────────────────────────────────────────────

  private applyFilters(): PresentationMeta[] {
    const filtered = this.presentations.filter((p) => {
      const authorOk =
        this.state.authors.size === 0 || (!!p.author && this.state.authors.has(p.author))
      const tagsOk =
        this.state.tags.size === 0 || [...this.state.tags].every((t) => p.tags?.includes(t))
      return authorOk && tagsOk
    })

    return filtered.sort((a, b) => {
      switch (this.state.sort) {
        case 'date-asc': {
          if (!a.date && !b.date) return 0
          if (!a.date) return 1
          if (!b.date) return -1
          return a.date.localeCompare(b.date)
        }
        case 'date-desc': {
          if (!a.date && !b.date) return 0
          if (!a.date) return 1
          if (!b.date) return -1
          return b.date.localeCompare(a.date)
        }
        case 'title-asc':
          return a.title.localeCompare(b.title)
        case 'title-desc':
          return b.title.localeCompare(a.title)
      }
    })
  }

  // ── Active filter badges ────────────────────────────────────────────────

  private renderActiveBadges(): void {
    const badges: string[] = []
    this.state.authors.forEach((a) =>
      badges.push(`
        <div class="filter-badge" data-type="author" data-value="${a}">
          ${svgIcon('user')} ${a}
          <button aria-label="Remove author filter">&#x00D7;</button>
        </div>
      `)
    )
    this.state.tags.forEach((t) =>
      badges.push(`
        <div class="filter-badge" data-type="tags" data-value="${t}">
          ${svgIcon('tag')} ${t}
          <button aria-label="Remove tag filter">&#x00D7;</button>
        </div>
      `)
    )
    this.mounts.activeFilters.innerHTML = badges.join('')
    this.mounts.activeFilters.querySelectorAll<HTMLElement>('.filter-badge').forEach((badge) => {
      badge.querySelector('button')!.addEventListener('click', () => {
        const type = badge.dataset.type as 'author' | 'tags'
        const value = badge.dataset.value!
        this.removeFilter(type, value)
      })
    })
  }

  private removeFilter(type: 'author' | 'tags', value: string): void {
    if (type === 'author') this.state.authors.delete(value)
    else this.state.tags.delete(value)
    this.onApply(this.applyFilters())
    this.renderActiveBadges()
    this.renderPillStates()
  }
}
```

- [ ] **Step 2: Type-check**

```bash
npm run build
```
Expected: no TypeScript errors. (Vite build may warn about unused imports in other files — only `FilterController.ts` errors matter here.)

- [ ] **Step 3: Commit**

```bash
git add src/FilterController.ts
git commit -m "feat: add FilterController with sort, author, and tag filtering"
```

---

## Task 4: Wire FilterController into main.ts

**Files:**
- Modify: `src/main.ts`

- [ ] **Step 1: Add import at top of `src/main.ts`**

After line 1 (`import { presentations } from './registry'`), add:

```typescript
import { FilterController } from './FilterController'
```

- [ ] **Step 2: Replace the sort+render block inside `init()`**

In `src/main.ts`, the current `init()` function (lines 116–159) contains this block — **including the zero-presentations early return above it**, which must be kept:

```typescript
  // KEEP THIS BLOCK — it handles the empty registry case before FilterController is instantiated
  if (presentations.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <p>No presentations yet.</p>
        <p>Add a folder to <code>presentations/</code> with a <code>presentation.json</code> manifest.</p>
      </div>
    `
    return
  }
```

The block immediately below it (sort + grid render + author delegation + iframe handlers) should be replaced. The existing code to replace:

```typescript
  const sorted = [...presentations].sort((a, b) => {
    if (!a.date && !b.date) return 0
    if (!a.date) return 1
    if (!b.date) return -1
    return b.date.localeCompare(a.date)
  })
  grid.innerHTML = sorted.map(renderCard).join('')

  // Author links inside cards — open in a new tab without triggering card navigation.
  grid.addEventListener('click', (e) => {
    const el = (e.target as Element).closest<HTMLElement>('[data-href]')
    if (el?.dataset.href) {
      e.preventDefault()
      e.stopPropagation()
      window.open(el.dataset.href, '_blank', 'noopener')
    }
  })

  // Fade each thumbnail iframe in once its content is ready, so the card
  // placeholder background shows instead of a blank white document flash.
  grid.querySelectorAll<HTMLIFrameElement>('.card-thumbnail iframe').forEach((iframe) => {
    iframe.addEventListener('load', () => {
      iframe.classList.add('loaded')
    }, { once: true })
  })
```

Replace with:

```typescript
  // Author links — event delegation on the static grid element; survives innerHTML re-renders.
  grid.addEventListener('click', (e) => {
    const el = (e.target as Element).closest<HTMLElement>('[data-href]')
    if (el?.dataset.href) {
      e.preventDefault()
      e.stopPropagation()
      window.open(el.dataset.href, '_blank', 'noopener')
    }
  })

  // Extracted as a nested function so it closes over `grid` and can be
  // called again after each FilterController re-render.
  function attachIframeHandlers(): void {
    grid.querySelectorAll<HTMLIFrameElement>('.card-thumbnail iframe').forEach((iframe) => {
      iframe.addEventListener('load', () => iframe.classList.add('loaded'), { once: true })
    })
  }

  new FilterController(
    presentations,
    {
      filterBar:    document.getElementById('filter-bar')!,
      activeFilters: document.getElementById('active-filters')!,
      overlay:      document.getElementById('overlay')!,
      drawer:       document.getElementById('drawer')!,
    },
    (filtered) => {
      grid.innerHTML =
        filtered.length > 0
          ? filtered.map(renderCard).join('')
          : `<div class="empty-state"><p>No presentations match the selected filters.</p></div>`
      attachIframeHandlers()
      countEl.innerHTML = `<span>${filtered.length}</span> presentation${filtered.length !== 1 ? 's' : ''}`
    }
  )
```

Note: `countEl` and `grid` are already declared at the top of `init()` — they are in scope here as closures. Line 120 (`countEl.innerHTML = ...`) runs before the zero-presentations guard and before `FilterController`, so it sets the initial count for the empty-registry case. `FilterController`'s `onApply` callback then takes over updating `countEl` on every filter change (and also on initial render, where the values will match since no filters are active yet).

- [ ] **Step 3: Type-check and build**

```bash
npm run build
```
Expected: exits 0 with no TypeScript errors.

- [ ] **Step 4: Smoke test in dev server**

```bash
npm run dev
```

Open `http://localhost:5173` and verify:
- Filter bar appears above the grid with Sort / Author / Tags pills
- Click Sort → drawer slides in from the right with 4 radio options
- Select "Title A → Z" → click Apply → grid re-sorts, Sort pill gets indigo highlight
- Click Author → select an author → Apply → only that author's cards show; badge appears
- Click ✕ on the badge → filter removed, all cards return
- Click Tags → select a tag → Apply → grid filters; tag badge appears
- Press Esc with drawer open → drawer closes, selection discarded
- Click overlay behind open drawer → drawer closes
- Click "Clear" inside a panel → selection resets within the panel (not applied until Apply)
- With zero matching cards → "No presentations match the selected filters." appears

- [ ] **Step 5: Commit**

```bash
git add src/main.ts
git commit -m "feat: wire FilterController into homepage"
```

---

## Task 5: Final build verification

- [ ] **Step 1: Full build and type check**

```bash
npm run build
```
Expected: exits 0.

- [ ] **Step 2: Preview the production build**

```bash
npm run preview
```
Open `http://localhost:4173`. Repeat the smoke-test checklist from Task 4 Step 4 to confirm the production bundle behaves identically to dev.

- [ ] **Step 3: Final commit (if any loose files)**

```bash
git status
```
If clean, no commit needed. If `.gitignore` was updated (`.superpowers/` entry added during brainstorming), stage and commit it:

```bash
git add .gitignore
git commit -m "chore: ignore .superpowers brainstorm directory"
```
