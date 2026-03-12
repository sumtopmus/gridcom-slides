import { presentations } from './registry'
import type { PresentationMeta, SlideMessage, TransitionType } from './types'
import { readHash, writeHash } from './viewer/UrlState'
import { FullscreenController } from './viewer/FullscreenController'
import { ProgressBar } from './viewer/ProgressBar'
import { NavigationController } from './viewer/NavigationController'

// ── State ──────────────────────────────────────────────────────────────────

let currentPresentation: PresentationMeta | null = null
let currentIndex = 0
let activeIframe: HTMLIFrameElement | null = null
let gridVisible = false

// ── DOM refs ───────────────────────────────────────────────────────────────

const slideContainer = document.getElementById('slide-container')!
const gridOverlay = document.getElementById('grid-overlay')!
const gridSlides = document.getElementById('grid-slides')!
const btnPrev = document.getElementById('btn-prev') as HTMLButtonElement
const btnNext = document.getElementById('btn-next') as HTMLButtonElement
const btnFullscreen = document.getElementById('btn-fullscreen') as HTMLButtonElement
const iconExpand = document.getElementById('icon-expand')!
const iconCompress = document.getElementById('icon-compress')!
const viewerChrome = document.getElementById('viewer-chrome')!
const kbdHint = document.getElementById('kbd-hint')!

// ── Utilities ──────────────────────────────────────────────────────────────

function getBasePath(id: string): string {
  return `${import.meta.env.BASE_URL}presentations/${id}/`
}

function sendSlideMessage(iframe: HTMLIFrameElement, msg: SlideMessage) {
  iframe.contentWindow?.postMessage(msg, '*')
}

// ── Slide loading ──────────────────────────────────────────────────────────

function loadSlide(index: number, direction: 'forward' | 'backward' | 'initial' = 'initial'): void {
  if (!currentPresentation) return
  const slide = currentPresentation.slides[index]
  if (!slide) return

  const previousIframe = activeIframe
  const previousIndex = currentIndex
  currentIndex = index

  writeHash(currentPresentation.id, index)
  progress.update(index, currentPresentation.slides.length)
  updateNavButtons()
  updateGridActive()

  // Send exit to old slide
  if (previousIframe) {
    sendSlideMessage(previousIframe, {
      type: 'slideExit',
      index: previousIndex,
      direction,
    })
  }

  const src = getBasePath(currentPresentation.id) + slide.file
  const iframe = document.createElement('iframe')
  iframe.src = src
  iframe.title = slide.title ?? `Slide ${index + 1}`
  iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-modals')
  iframe.classList.add('entering')

  // Choose transition
  const transition: TransitionType = slide.transition ?? 'fade'
  const transitionClass =
    transition === 'slide-left'
      ? direction === 'forward' ? 'transition-slide-left' : 'transition-slide-right'
      : transition === 'none'
        ? ''
        : 'transition-fade'

  if (transitionClass) {
    slideContainer.className = transitionClass
  } else {
    slideContainer.className = ''
  }

  // Mark previous as leaving
  if (previousIframe) {
    previousIframe.classList.remove('entering')
    previousIframe.classList.add('leaving')
  }

  // Send enter once loaded
  iframe.addEventListener('load', () => {
    sendSlideMessage(iframe, {
      type: 'slideEnter',
      index,
      direction,
    })
    iframe.classList.remove('entering')
    // Remove old iframe after transition
    if (previousIframe) {
      const delay = transition === 'none' ? 0 : 350
      setTimeout(() => {
        previousIframe.remove()
      }, delay)
    }
  }, { once: true })

  slideContainer.appendChild(iframe)
  activeIframe = iframe
  document.title = `${currentPresentation.title} — ${slide.title ?? index + 1}`
}

// ── Navigation ─────────────────────────────────────────────────────────────

function goTo(index: number, direction: 'forward' | 'backward' = 'forward'): void {
  if (!currentPresentation) return
  const clamped = Math.max(0, Math.min(index, currentPresentation.slides.length - 1))
  if (clamped === currentIndex && activeIframe) return
  loadSlide(clamped, direction)
}

function next(): void {
  if (!currentPresentation) return
  if (currentIndex < currentPresentation.slides.length - 1) {
    goTo(currentIndex + 1, 'forward')
  }
}

function prev(): void {
  if (currentIndex > 0) {
    goTo(currentIndex - 1, 'backward')
  }
}

function updateNavButtons(): void {
  if (!currentPresentation) return
  btnPrev.disabled = currentIndex === 0
  btnNext.disabled = currentIndex === currentPresentation.slides.length - 1
}

// ── Fullscreen ─────────────────────────────────────────────────────────────

const fullscreen = new FullscreenController(
  document.getElementById('viewer-root')!,
  (isFs) => {
    iconExpand.style.display = isFs ? 'none' : ''
    iconCompress.style.display = isFs ? '' : 'none'
    if (isFs) startChromeAutoHide()
    else showChrome()
  }
)

if (!fullscreen.supported) {
  btnFullscreen.style.display = 'none'
}

// ── Chrome auto-hide ───────────────────────────────────────────────────────

let hideTimer: ReturnType<typeof setTimeout> | null = null

function showChrome(): void {
  viewerChrome.classList.remove('hidden')
  if (hideTimer) clearTimeout(hideTimer)
  hideTimer = null
}

function startChromeAutoHide(): void {
  showChrome()
  hideTimer = setTimeout(() => {
    viewerChrome.classList.add('hidden')
  }, 3000)
}

document.addEventListener('mousemove', () => {
  if (fullscreen.isFullscreen) {
    startChromeAutoHide()
  }
})

// ── Grid overlay ───────────────────────────────────────────────────────────

function buildGrid(): void {
  if (!currentPresentation) return
  gridSlides.innerHTML = ''
  currentPresentation.slides.forEach((slide, i) => {
    const src = getBasePath(currentPresentation!.id) + slide.file
    const thumb = document.createElement('div')
    thumb.className = `grid-thumb${i === currentIndex ? ' active' : ''}`
    thumb.dataset.index = String(i)
    thumb.innerHTML = `
      <iframe src="${src}" loading="lazy" title="${slide.title ?? `Slide ${i + 1}`}" sandbox="allow-scripts allow-same-origin"></iframe>
      <span class="grid-thumb-num">${i + 1}</span>
      ${slide.title ? `<span class="grid-thumb-label">${slide.title}</span>` : ''}
    `
    thumb.addEventListener('click', () => {
      const dir = i > currentIndex ? 'forward' : 'backward'
      goTo(i, dir)
      toggleGrid()
    })
    gridSlides.appendChild(thumb)
  })
}

function updateGridActive(): void {
  gridSlides.querySelectorAll<HTMLElement>('.grid-thumb').forEach((el) => {
    const i = parseInt(el.dataset.index ?? '-1', 10)
    el.classList.toggle('active', i === currentIndex)
  })
}

function toggleGrid(): void {
  gridVisible = !gridVisible
  if (gridVisible) {
    buildGrid()
    gridOverlay.classList.add('visible')
  } else {
    gridOverlay.classList.remove('visible')
  }
}

// ── Exit ───────────────────────────────────────────────────────────────────

function exit(): void {
  if (gridVisible) {
    toggleGrid()
    return
  }
  if (fullscreen.isFullscreen) {
    fullscreen.exit()
    return
  }
  window.location.href = 'index.html'
}

// ── Keyboard hint ──────────────────────────────────────────────────────────

setTimeout(() => kbdHint.classList.add('hidden'), 4000)

// ── Progress bar ───────────────────────────────────────────────────────────

const progress = new ProgressBar()

// ── Navigation controller ──────────────────────────────────────────────────

const nav = new NavigationController({
  next,
  prev,
  toggleFullscreen: () => fullscreen.toggle(),
  toggleGrid,
  exit,
})
nav.attach()

// ── Init ───────────────────────────────────────────────────────────────────

function init(): void {
  const parsed = readHash()

  if (!parsed) {
    document.title = 'Viewer — No presentation selected'
    slideContainer.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;height:100%;color:#71717a;font-family:monospace;font-size:0.9rem">
        No presentation selected. <a href="index.html" style="margin-left:0.5rem;color:#6366f1">← Go back</a>
      </div>
    `
    return
  }

  const presentation = presentations.find((p) => p.id === parsed.presentationId)
  if (!presentation) {
    document.title = 'Viewer — Presentation not found'
    slideContainer.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;height:100%;color:#71717a;font-family:monospace;font-size:0.9rem">
        Presentation "${parsed.presentationId}" not found. <a href="index.html" style="margin-left:0.5rem;color:#6366f1">← Go back</a>
      </div>
    `
    return
  }

  currentPresentation = presentation
  const startIndex = Math.max(0, Math.min(parsed.slideIndex, presentation.slides.length - 1))
  loadSlide(startIndex, 'initial')
}

// Handle external hash changes (browser back/forward)
window.addEventListener('hashchange', () => {
  const parsed = readHash()
  if (parsed && currentPresentation && parsed.presentationId === currentPresentation.id) {
    const dir = parsed.slideIndex > currentIndex ? 'forward' : 'backward'
    goTo(parsed.slideIndex, dir)
  } else {
    init()
  }
})

init()
