export interface NavCallbacks {
  next: () => void
  prev: () => void
  nextSlide: () => void
  prevSlide: () => void
  stepNext: () => void
  stepPrev: () => void
  toggleFullscreen: () => void
  toggleGrid: () => void
  toggleMode: () => void
  toggleSystem: () => void
  toggleHint: () => void
  toggleCanvas: () => void
  exit: () => void
  isStepSlide: () => boolean
  canStepForward: () => boolean
  canStepBackward: () => boolean
}

export class NavigationController {
  private callbacks: NavCallbacks
  private pointerStartX = 0
  private pointerStartY = 0
  private readonly SWIPE_THRESHOLD = 60
  private wheelCooldown = false
  private wheelBoundaryDir: 'forward' | 'backward' | null = null
  private wheelBoundaryServed: 'forward' | 'backward' | null = null
  private boundaryTimer: ReturnType<typeof setTimeout> | null = null
  private readonly BOUNDARY_PAUSE = 600

  constructor(callbacks: NavCallbacks) {
    this.callbacks = callbacks
  }

  attach(): void {
    document.addEventListener('keydown', this._onKeyDown)
    window.addEventListener('blur', this._onWindowBlur)
    document.getElementById('btn-prev')!.addEventListener('click', this.callbacks.prevSlide)
    document.getElementById('btn-next')!.addEventListener('click', this.callbacks.nextSlide)
    document.getElementById('btn-fullscreen')!.addEventListener('click', this.callbacks.toggleFullscreen)
    document.getElementById('btn-grid')!.addEventListener('click', this.callbacks.toggleGrid)
    document.getElementById('btn-close-grid')!.addEventListener('click', this.callbacks.toggleGrid)

    const slideContainer = document.getElementById('slide-container')!
    slideContainer.addEventListener('pointerdown', this._onPointerDown)
    slideContainer.addEventListener('pointerup', this._onPointerUp)
    document.addEventListener('wheel', this._onWheel, { passive: true })
  }

  detach(): void {
    document.removeEventListener('keydown', this._onKeyDown)
    window.removeEventListener('blur', this._onWindowBlur)
    document.removeEventListener('wheel', this._onWheel)
  }

  private _onWindowBlur = () => {
    // When an iframe steals focus, immediately reclaim it so keydown still fires
    setTimeout(() => window.focus(), 0)
  }

  private _onKeyDown = (e: KeyboardEvent) => {
    // Don't capture when typing in inputs
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault()
        this.callbacks.next()
        break
      case ' ':
        e.preventDefault()
        this.callbacks.next()
        break
      case 'ArrowLeft':
      case 'ArrowUp':
      case 'Backspace':
        e.preventDefault()
        this.callbacks.prev()
        break
      case ']':
        this.callbacks.stepNext()
        break
      case '[':
        this.callbacks.stepPrev()
        break
      case 'f':
      case 'F':
        this.callbacks.toggleFullscreen()
        break
      case 'g':
      case 'G':
        this.callbacks.toggleGrid()
        break
      case 'm':
      case 'M':
        this.callbacks.toggleMode()
        break
      case 's':
      case 'S':
        this.callbacks.toggleSystem()
        break
      case 'h':
      case 'H':
      case '?':
        this.callbacks.toggleHint()
        break
      case 'c':
      case 'C':
        this.callbacks.toggleCanvas()
        break
      case 'Escape':
        this.callbacks.exit()
        break
    }
  }

  handleWheel(e: WheelEvent): void {
    if (this.wheelCooldown) return

    const scale = e.deltaMode === WheelEvent.DOM_DELTA_PIXEL ? 1 : 40
    const dx = e.deltaX * scale
    const dy = e.deltaY * scale

    // Horizontal scroll → slide change only, no step interaction
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) >= 10) {
      this.wheelCooldown = true
      setTimeout(() => { this.wheelCooldown = false }, 1)
      if (dx > 0) this.callbacks.nextSlide()
      else this.callbacks.prevSlide()
      return
    }

    // For pixel-mode (touchpad): require a meaningful delta to filter drift
    const delta = dy
    if (Math.abs(delta) < 5) return

    this.wheelCooldown = true
    setTimeout(() => { this.wheelCooldown = false }, 1)

    const dir = delta > 0 ? 'forward' : 'backward'

    // Reset boundary state if direction reversed
    if (dir !== this.wheelBoundaryDir && dir !== this.wheelBoundaryServed) {
      this.wheelBoundaryDir = null
      this.wheelBoundaryServed = null
      if (this.boundaryTimer) { clearTimeout(this.boundaryTimer); this.boundaryTimer = null }
    }

    // If at a step boundary, block slide transition and wait for pause
    if (this.callbacks.isStepSlide() && this.wheelBoundaryServed !== dir) {
      const atBoundary = dir === 'forward'
        ? !this.callbacks.canStepForward()
        : !this.callbacks.canStepBackward()

      if (atBoundary) {
        this.wheelBoundaryDir = dir
        if (this.boundaryTimer) clearTimeout(this.boundaryTimer)
        this.boundaryTimer = setTimeout(() => {
          this.wheelBoundaryServed = this.wheelBoundaryDir
          this.wheelBoundaryDir = null
          this.boundaryTimer = null
        }, this.BOUNDARY_PAUSE)
        return
      }
    }

    // Consume the "served" pass-through token
    this.wheelBoundaryServed = null

    if (dir === 'forward') {
      this.callbacks.next()
    } else {
      this.callbacks.prev()
    }
  }

  private _onWheel = (e: WheelEvent) => this.handleWheel(e)

  private _onPointerDown = (e: PointerEvent) => {
    this.pointerStartX = e.clientX
    this.pointerStartY = e.clientY
  }

  private _onPointerUp = (e: PointerEvent) => {
    const dx = e.clientX - this.pointerStartX
    const dy = e.clientY - this.pointerStartY
    // Only trigger if horizontal swipe dominates
    if (Math.abs(dx) < this.SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy)) return
    if (dx < 0) {
      this.callbacks.next()
    } else {
      this.callbacks.prev()
    }
  }
}
