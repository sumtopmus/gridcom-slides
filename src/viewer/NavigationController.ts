export interface NavCallbacks {
  next: () => void
  prev: () => void
  toggleFullscreen: () => void
  toggleGrid: () => void
  exit: () => void
}

export class NavigationController {
  private callbacks: NavCallbacks
  private pointerStartX = 0
  private pointerStartY = 0
  private readonly SWIPE_THRESHOLD = 60

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
  }

  detach(): void {
    document.removeEventListener('keydown', this._onKeyDown)
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
      case 'Escape':
        this.callbacks.exit()
        break
    }
  }

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
