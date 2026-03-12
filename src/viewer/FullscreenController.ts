/**
 * Safari-compatible fullscreen controller.
 * Wraps both standard and webkit-prefixed APIs.
 */

// Augment Document for Safari webkit prefix
declare global {
  interface Document {
    webkitFullscreenEnabled?: boolean
    webkitFullscreenElement?: Element | null
    webkitExitFullscreen?: () => Promise<void>
  }
  interface HTMLElement {
    webkitRequestFullscreen?: (options?: FullscreenOptions) => Promise<void>
  }
}

export class FullscreenController {
  private el: HTMLElement
  private onChange: (isFullscreen: boolean) => void
  private _supported: boolean

  constructor(el: HTMLElement, onChange: (isFullscreen: boolean) => void) {
    this.el = el
    this.onChange = onChange
    this._supported = !!(
      document.fullscreenEnabled ??
      document.webkitFullscreenEnabled
    )
    document.addEventListener('fullscreenchange', this._handleChange)
    document.addEventListener('webkitfullscreenchange', this._handleChange)
  }

  get supported(): boolean {
    return this._supported
  }

  get isFullscreen(): boolean {
    return !!(document.fullscreenElement ?? document.webkitFullscreenElement)
  }

  async enter(): Promise<void> {
    try {
      if (this.el.requestFullscreen) {
        await this.el.requestFullscreen()
      } else if (this.el.webkitRequestFullscreen) {
        await this.el.webkitRequestFullscreen()
      }
    } catch {
      // Fullscreen may be blocked by browser policy; ignore
    }
  }

  async exit(): Promise<void> {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen()
      } else if (document.webkitExitFullscreen) {
        await document.webkitExitFullscreen()
      }
    } catch {
      // Already exited
    }
  }

  async toggle(): Promise<void> {
    if (this.isFullscreen) {
      await this.exit()
    } else {
      await this.enter()
    }
  }

  destroy(): void {
    document.removeEventListener('fullscreenchange', this._handleChange)
    document.removeEventListener('webkitfullscreenchange', this._handleChange)
  }

  private _handleChange = () => {
    this.onChange(this.isFullscreen)
  }
}
