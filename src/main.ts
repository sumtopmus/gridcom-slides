import { presentations } from './registry'
import type { PresentationMeta } from './types'

function formatDate(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function icon(name: 'slides' | 'calendar' | 'user' | 'arrow'): string {
  const icons: Record<string, string> = {
    slides: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
    calendar: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
    user: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    arrow: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`,
  }
  return icons[name] ?? ''
}

function renderCard(p: PresentationMeta): string {
  const viewerUrl = `viewer.html#/${p.id}/0`
  const thumbnailSrc = `${import.meta.env.BASE_URL}presentations/${p.id}/${p.slides[0]?.file ?? ''}`

  const metaItems: string[] = []
  if (p.author) {
    metaItems.push(`<span class="card-meta-item">${icon('user')}<span>${p.author}</span></span>`)
  }
  if (p.date) {
    metaItems.push(`<span class="card-meta-item">${icon('calendar')}<span>${formatDate(p.date)}</span></span>`)
  }

  const tags = (p.tags ?? [])
    .map((t) => `<span class="tag">${t}</span>`)
    .join('')

  return `
    <article class="card">
      <a href="${viewerUrl}" class="card-thumbnail" tabindex="-1" aria-hidden="true">
        <iframe src="${thumbnailSrc}" loading="lazy" title="${p.title} preview" sandbox="allow-scripts allow-same-origin"></iframe>
        <div class="card-thumbnail-overlay"></div>
      </a>
      <div class="card-body">
        <h2 class="card-title">${p.title}</h2>
        ${p.description ? `<p class="card-description">${p.description}</p>` : ''}
        ${metaItems.length ? `<div class="card-meta">${metaItems.join('')}</div>` : ''}
        ${tags ? `<div class="card-tags">${tags}</div>` : ''}
      </div>
      <div class="card-footer">
        <span class="slide-count">${icon('slides')} ${p.slides.length} slide${p.slides.length !== 1 ? 's' : ''}</span>
        <a href="${viewerUrl}" class="btn-open">
          Open ${icon('arrow')}
        </a>
      </div>
    </article>
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

  grid.innerHTML = presentations.map(renderCard).join('')

  // Fade each thumbnail iframe in once its content is ready, so the card
  // placeholder background shows instead of a blank white document flash.
  grid.querySelectorAll<HTMLIFrameElement>('.card-thumbnail iframe').forEach((iframe) => {
    iframe.addEventListener('load', () => {
      iframe.classList.add('loaded')
    }, { once: true })
  })
}

init()
