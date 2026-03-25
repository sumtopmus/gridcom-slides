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
