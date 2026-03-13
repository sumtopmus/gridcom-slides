export interface NavCallbacks {
  next: () => void
  prev: () => void
  toggleFullscreen: () => void
  toggleGrid: () => void
  toggleMode: () => void
  toggleSystem: () => void
  toggleHint: () => void
  toggleCanvas: () => void
  exit: () => void
}

export class NavigationController {
  private callbacks: NavCallbacks
  private pointerStartX = 0
  private pointerStartY = 0
  private readonly SWIPE_THRESHOLD = 60
  private wheelCooldown = false

  constructor(callbacks: NavCallbacks) {
    this.callbacks = callbacks
  }

  attach(): void {
    document.addEventListener('keydown', this._onKeyDown)
    document.getElementById('btn-prev')!.addEventListener('click', this.callbacks.prev)
    document.getElementById('btn-next')!.addEventListener('click', this.callbacks.next)
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
    document.removeEventListener('wheel', this._onWheel)
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
    // For pixel-mode (touchpad): require a meaningful delta to filter drift
    const delta = e.deltaMode === WheelEvent.DOM_DELTA_PIXEL ? e.deltaY : e.deltaY * 40
    if (Math.abs(delta) < 5) return

    this.wheelCooldown = true
    setTimeout(() => { this.wheelCooldown = false }, 100)

    if (delta > 0) {
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
