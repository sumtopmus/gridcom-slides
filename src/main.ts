import { presentations } from './registry'
import { FilterController } from './FilterController'
import type { PresentationMeta } from './types'

// ── Color mode ──────────────────────────────────────────────────────────────

type ColorMode = 'dark' | 'light' | 'system'

let colorMode: ColorMode = (() => {
  const stored = localStorage.getItem('colorMode')
  return stored === 'light' || stored === 'system' ? stored : 'dark'
})()

const themeSwitch = document.getElementById('theme-switch')!
const themeOpts = Array.from(document.querySelectorAll<HTMLButtonElement>('.theme-opt'))

function applyColorMode(): void {
  document.documentElement.classList.remove('theme-dark', 'theme-light', 'theme-system')
  document.documentElement.classList.add(`theme-${colorMode}`)
  const index = ['light', 'system', 'dark'].indexOf(colorMode)
  themeSwitch.style.setProperty('--theme-index', String(index))
  themeOpts.forEach((btn) => btn.classList.toggle('active', btn.dataset.mode === colorMode))
}

function setColorMode(mode: ColorMode): void {
  colorMode = mode
  localStorage.setItem('colorMode', colorMode)
  applyColorMode()
}

function toggleMode(): void {
  setColorMode(colorMode === 'dark' ? 'light' : 'dark')
}

function toggleSystem(): void {
  setColorMode(colorMode === 'system' ? 'light' : 'system')
}

themeOpts.forEach((btn) => btn.addEventListener('click', () => setColorMode(btn.dataset.mode as ColorMode)))
applyColorMode()

// ── Keyboard hint ──────────────────────────────────────────────────────────

const kbdHint = document.getElementById('kbd-hint')!
const btnHelp = document.getElementById('btn-help') as HTMLButtonElement
const devMenu = document.getElementById('dev-menu')!
const btnDev = document.getElementById('btn-dev') as HTMLButtonElement

function toggleKbdHint(): void {
  const visible = !kbdHint.classList.contains('hidden')
  kbdHint.classList.toggle('hidden', visible)
  btnHelp.classList.toggle('active', !visible)
  if (!visible) {
    devMenu.classList.add('hidden')
    btnDev.classList.remove('active')
  }
}

btnHelp.addEventListener('click', toggleKbdHint)

document.addEventListener('keydown', (e) => {
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
  switch (e.key) {
    case 'm': case 'M': toggleMode(); break
    case 's': case 'S': toggleSystem(); break
    case 'h': case 'H': case '?': toggleKbdHint(); break
  }
})

// ── Dev mode ────────────────────────────────────────────────────────────────

let isDevMode = localStorage.getItem('devMode') === '1'
const devOpts = Array.from(document.querySelectorAll<HTMLButtonElement>('.dev-opt'))

function applyDevMode(): void {
  document.documentElement.classList.toggle('gc-dev', isDevMode)
  btnDev.classList.toggle('dev-active', isDevMode)
  devOpts.forEach((btn) => btn.classList.toggle('active', (btn.dataset.mode === 'dev') === isDevMode))
}

function setDevMode(mode: 'present' | 'dev'): void {
  isDevMode = mode === 'dev'
  localStorage.setItem('devMode', isDevMode ? '1' : '0')
  applyDevMode()
}

devOpts.forEach((btn) => btn.addEventListener('click', () => setDevMode(btn.dataset.mode as 'present' | 'dev')))

function toggleDevMenu(): void {
  const visible = !devMenu.classList.contains('hidden')
  devMenu.classList.toggle('hidden', visible)
  btnDev.classList.toggle('active', !visible)
  if (!visible) {
    kbdHint.classList.add('hidden')
    btnHelp.classList.remove('active')
  }
}

btnDev.addEventListener('click', toggleDevMenu)
applyDevMode()

document.addEventListener('click', (e) => {
  if (devMenu.classList.contains('hidden')) return
  if (!devMenu.contains(e.target as Node) && e.target !== btnDev) {
    devMenu.classList.add('hidden')
    btnDev.classList.remove('active')
  }
})

function formatDate(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function icon(name: 'slides' | 'calendar' | 'user'): string {
  const icons: Record<string, string> = {
    slides: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
    calendar: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
    user: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  }
  return icons[name] ?? ''
}

function renderCard(p: PresentationMeta): string {
  const viewerUrl = `viewer.html#/${p.id}/0`
  const thumbnailSrc = `${import.meta.env.BASE_URL}presentations/${p.id}/${p.slides[0]?.file ?? ''}`

  const metaItems: string[] = []
  if (p.author) {
    const authorInner = p.authorUrl
      ? `<span class="card-author-link" role="link" tabindex="0" data-href="${p.authorUrl}">${p.author}</span>`
      : `<span>${p.author}</span>`
    metaItems.push(`<span class="card-meta-item">${icon('user')}${authorInner}</span>`)
  }
  if (p.date) {
    metaItems.push(`<span class="card-meta-item">${icon('calendar')}<span>${formatDate(p.date)}</span></span>`)
  }

  const tags = (p.tags ?? [])
    .map((t) => `<span class="tag">${t}</span>`)
    .join('')

  return `
    <a href="${viewerUrl}" class="card">
      <div class="card-thumbnail">
        <iframe src="${thumbnailSrc}" loading="lazy" title="${p.title} preview" sandbox="allow-scripts allow-same-origin"></iframe>
        <div class="card-thumbnail-overlay"></div>
      </div>
      <div class="card-body">
        <h2 class="card-title">${p.title}</h2>
        ${p.description ? `<p class="card-description">${p.description}</p>` : ''}
        ${metaItems.length ? `<div class="card-meta">${metaItems.join('')}</div>` : ''}
        ${tags ? `<div class="card-tags">${tags}</div>` : ''}
      </div>
      <div class="card-footer">
        <span class="slide-count">${icon('slides')} ${p.slides.length} slide${p.slides.length !== 1 ? 's' : ''}</span>
      </div>
    </a>
  `
}

function init() {
  const grid = document.getElementById('presentations-grid')!
  const countEl = document.getElementById('presentation-count')!

  countEl.innerHTML = `<span>${presentations.length}</span> presentation${presentations.length !== 1 ? 's' : ''}`

  if (presentations.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <p>No presentations yet.</p>
        <p>Add a folder to <code>presentations/</code> with a <code>presentation.json</code> manifest.</p>
      </div>
    `
    return
  }

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
}

init()
