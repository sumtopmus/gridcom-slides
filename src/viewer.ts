import { presentations } from './registry'
import type { PresentationMeta, SlideMessage, SlideToViewerMessage, TransitionType } from './types'
import { readHash, writeHash } from './viewer/UrlState'
import { FullscreenController } from './viewer/FullscreenController'
import { ProgressBar } from './viewer/ProgressBar'
import { NavigationController } from './viewer/NavigationController'

// ── State ──────────────────────────────────────────────────────────────────

type ColorMode = 'dark' | 'light' | 'system'

let currentPresentation: PresentationMeta | null = null
let currentIndex = 0
let activeIframe: HTMLIFrameElement | null = null
let slideCanGoBack = false
let slideCanGoForward = false
let slideIsStepBased = false
let currentSlideStep = 0
const slideStepMemory = new Map<number, number>()
let gridVisible = false
let isFixedCanvas = localStorage.getItem('fixedCanvas') === '1'
let colorMode: ColorMode = (() => {
  const stored = localStorage.getItem('colorMode')
  return stored === 'light' || stored === 'system' ? stored : 'dark'
})()

// ── DOM refs ───────────────────────────────────────────────────────────────

const slideContainer = document.getElementById('slide-container')!
const canvasStage = document.getElementById('canvas-stage')!
const slideScaler = document.getElementById('slide-scaler')!
const viewerRoot = document.getElementById('viewer-root')!
const gridOverlay = document.getElementById('grid-overlay')!
const gridSlides = document.getElementById('grid-slides')!
const btnPrev = document.getElementById('btn-prev') as HTMLButtonElement
const btnNext = document.getElementById('btn-next') as HTMLButtonElement
const btnFullscreen = document.getElementById('btn-fullscreen') as HTMLButtonElement
const btnCanvas = document.getElementById('btn-canvas') as HTMLButtonElement
const themeSwitch = document.getElementById('theme-switch')!
const themeOpts = Array.from(document.querySelectorAll<HTMLButtonElement>('.theme-opt'))
const iconExpand = document.getElementById('icon-expand')!
const iconCompress = document.getElementById('icon-compress')!
const viewerChrome = document.getElementById('viewer-chrome')!
const kbdHint = document.getElementById('kbd-hint')!
const btnHelp = document.getElementById('btn-help') as HTMLButtonElement

// ── Utilities ──────────────────────────────────────────────────────────────

function getBasePath(id: string): string {
  return `${import.meta.env.BASE_URL}presentations/${id}/`
}

function sendSlideMessage(iframe: HTMLIFrameElement, msg: SlideMessage) {
  iframe.contentWindow?.postMessage(msg, '*')
}

function setCurrentSlideStep(step: number): void {
  currentSlideStep = Math.max(0, step)
  slideStepMemory.set(currentIndex, currentSlideStep)
}

function sendStepNextToActive(): void {
  if (!activeIframe) return
  sendSlideMessage(activeIframe, { type: 'stepNext' })
  setCurrentSlideStep(currentSlideStep + 1)
}

function sendStepPrevToActive(): void {
  if (!activeIframe) return
  sendSlideMessage(activeIframe, { type: 'stepPrev' })
  setCurrentSlideStep(currentSlideStep - 1)
}

// ── Slide loading ──────────────────────────────────────────────────────────

function loadSlide(index: number, direction: 'forward' | 'backward' | 'initial' = 'initial'): void {
  if (!currentPresentation) return
  const slide = currentPresentation.slides[index]
  if (!slide) return

  const previousIframe = activeIframe
  const previousIndex = currentIndex
  if (previousIframe) {
    slideStepMemory.set(previousIndex, currentSlideStep)
  }
  currentIndex = index
  slideCanGoBack = false
  slideCanGoForward = false
  slideIsStepBased = false
  currentSlideStep = slideStepMemory.get(index) ?? 0

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

  // Keep hidden while loading — prevents the white blank document from being
  // revealed by the fade-in animation before content is ready.
  iframe.style.opacity = '0'

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

  // Once loaded: start old exit + new enter simultaneously so transition
  // always plays over real content, never over a blank white document.
  iframe.addEventListener('load', () => {
    sendSlideMessage(iframe, {
      type: 'slideEnter',
      index,
      direction,
    })
    if (currentSlideStep > 0) {
      sendSlideMessage(iframe, {
        type: 'stepRestore',
        step: currentSlideStep,
      })
    }

    // Kick off old slide exit
    if (previousIframe) {
      previousIframe.classList.remove('entering')
      previousIframe.classList.add('leaving')
    }

    // Forward wheel events from inside the slide iframe to the parent navigator
    try {
      iframe.contentWindow?.addEventListener('wheel', (e) => nav.handleWheel(e), { passive: true })
    } catch { /* cross-origin guard */ }

    // Hand opacity back to CSS and start enter animation
    iframe.style.opacity = ''
    iframe.classList.add('entering')

    const delay = transition === 'none' ? 0 : 350
    setTimeout(() => {
      iframe.classList.remove('entering')
      previousIframe?.remove()
    }, delay)
  }, { once: true })

  slideScaler.appendChild(iframe)
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
  if (slideCanGoForward && activeIframe) {
    sendStepNextToActive()
    return
  }
  if (currentIndex < currentPresentation.slides.length - 1) {
    goTo(currentIndex + 1, 'forward')
  }
}

function prev(): void {
  if (slideCanGoBack && activeIframe) {
    sendStepPrevToActive()
    return
  }
  if (currentIndex > 0) {
    goTo(currentIndex - 1, 'backward')
  }
}

function nextSlide(): void {
  if (!currentPresentation) return
  if (currentIndex < currentPresentation.slides.length - 1) goTo(currentIndex + 1, 'forward')
}

function prevSlide(): void {
  if (currentIndex > 0) goTo(currentIndex - 1, 'backward')
}

function stepNext(): void {
  if (slideCanGoForward && activeIframe) sendStepNextToActive()
}

function stepPrev(): void {
  if (slideCanGoBack && activeIframe) sendStepPrevToActive()
}

function updateNavButtons(): void {
  if (!currentPresentation) return
  btnPrev.disabled = currentIndex === 0
  btnNext.disabled = currentIndex === currentPresentation.slides.length - 1
}

// ── Fullscreen ─────────────────────────────────────────────────────────────

const fullscreen = new FullscreenController(
  viewerRoot,
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

// ── Color mode ─────────────────────────────────────────────────────────────

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

// ── Fixed canvas ───────────────────────────────────────────────────────────

const CANVAS_DESIGN_WIDTH = 1920

function updateSlideScale(): void {
  if (isFixedCanvas) {
    const scale = canvasStage.clientWidth / CANVAS_DESIGN_WIDTH
    slideScaler.style.transform = `scale(${scale})`
  } else {
    slideScaler.style.transform = ''
  }
}

function applyFixedCanvas(): void {
  if (isFixedCanvas) {
    viewerRoot.classList.add('fixed-canvas')
    btnCanvas.classList.add('active')
  } else {
    viewerRoot.classList.remove('fixed-canvas')
    btnCanvas.classList.remove('active')
  }
  updateSlideScale()
}

function toggleFixedCanvas(): void {
  isFixedCanvas = !isFixedCanvas
  localStorage.setItem('fixedCanvas', isFixedCanvas ? '1' : '0')
  applyFixedCanvas()
}

new ResizeObserver(updateSlideScale).observe(canvasStage)

btnCanvas.addEventListener('click', toggleFixedCanvas)
applyFixedCanvas()

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
    const thumbIframe = thumb.querySelector('iframe')
    if (thumbIframe) {
      thumbIframe.addEventListener('load', () => {
        thumbIframe.classList.add('loaded')
      }, { once: true })
    }

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

let kbdHintTimer: ReturnType<typeof setTimeout> | null = null

function showKbdHint(autohide = false): void {
  if (kbdHintTimer) clearTimeout(kbdHintTimer)
  kbdHint.classList.remove('hidden')
  btnHelp.classList.add('active')
  if (autohide) {
    kbdHintTimer = setTimeout(() => {
      kbdHint.classList.add('hidden')
      btnHelp.classList.remove('active')
      kbdHintTimer = null
    }, 4000)
  }
}

function toggleKbdHint(): void {
  if (kbdHintTimer) {
    clearTimeout(kbdHintTimer)
    kbdHintTimer = null
  }
  const visible = !kbdHint.classList.contains('hidden')
  kbdHint.classList.toggle('hidden', visible)
  btnHelp.classList.toggle('active', !visible)
}

btnHelp.addEventListener('click', toggleKbdHint)

// ── Progress bar ───────────────────────────────────────────────────────────

const progress = new ProgressBar()

// ── Navigation controller ──────────────────────────────────────────────────

const nav = new NavigationController({
  next,
  prev,
  nextSlide,
  prevSlide,
  stepNext,
  stepPrev,
  toggleFullscreen: () => fullscreen.toggle(),
  toggleGrid,
  toggleMode,
  toggleSystem,
  toggleHint: toggleKbdHint,
  toggleCanvas: toggleFixedCanvas,
  exit,
  isStepSlide: () => slideIsStepBased,
  canStepForward: () => slideCanGoForward,
  canStepBackward: () => slideCanGoBack,
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
  slideStepMemory.clear()
  canvasStage.dataset.presentationTheme = presentation.theme ?? ''
  localStorage.setItem('lastPresentationId', presentation.id)
  localStorage.setItem('lastPresentationTheme', presentation.theme ?? '')
  const startIndex = Math.max(0, Math.min(parsed.slideIndex, presentation.slides.length - 1))
  loadSlide(startIndex, 'initial')
  showKbdHint(true)
}

// ── Step state messages from slide iframes ─────────────────────────────────

window.addEventListener('message', (e) => {
  if (!activeIframe || e.source !== activeIframe.contentWindow) return
  const msg = e.data as SlideToViewerMessage
  if (msg?.type === 'stepState') {
    slideCanGoBack = msg.canGoBack
    slideCanGoForward = msg.canGoForward
    slideIsStepBased = true
    if (typeof msg.currentStep === 'number') {
      setCurrentSlideStep(msg.currentStep)
    }
  }
})

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
