import { presentations } from './registry'
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

function toggleKbdHint(): void {
  const visible = !kbdHint.classList.contains('hidden')
  kbdHint.classList.toggle('hidden', visible)
  btnHelp.classList.toggle('active', !visible)
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
}

init()
