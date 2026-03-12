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
  theme?: string
  slides: SlideConfig[]
}

export interface ViewerState {
  presentationId: string
  currentSlide: number
  totalSlides: number
  isFullscreen: boolean
}

// postMessage payloads sent from viewer → slide iframe
export type SlideMessage =
  | { type: 'slideEnter'; index: number; direction: 'forward' | 'backward' | 'initial' }
  | { type: 'slideExit'; index: number; direction: 'forward' | 'backward' | 'initial' }
