export type TransitionType = 'fade' | 'slide-left' | 'slide-up' | 'none'

export interface SlideConfig {
  file: string
  title?: string
  notes?: string
  transition?: TransitionType
}

export interface PresentationMeta {
  id: string
  title: string
  description?: string
  author?: string
  date?: string
  tags?: string[]
  slides: SlideConfig[]
}

export interface ViewerState {
  presentationId: string
  currentSlide: number
  totalSlides: number
  isFullscreen: boolean
}

// postMessage payloads sent from viewer → slide iframe
export interface SlideMessage {
  type: 'slideEnter' | 'slideExit'
  index: number
  direction: 'forward' | 'backward' | 'initial'
}
