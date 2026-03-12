/**
 * Manages URL hash ↔ viewer state synchronisation.
 * Format: #/<presentationId>/<slideIndex>
 * Example: #/demo/2
 */

export interface ParsedHash {
  presentationId: string
  slideIndex: number
}

export function parseHash(hash: string): ParsedHash | null {
  const match = hash.replace(/^#/, '').match(/^\/([^/]+)\/(\d+)$/)
  if (!match) return null
  return {
    presentationId: match[1],
    slideIndex: parseInt(match[2], 10),
  }
}

export function buildHash(presentationId: string, slideIndex: number): string {
  return `#/${presentationId}/${slideIndex}`
}

export function readHash(): ParsedHash | null {
  return parseHash(location.hash)
}

export function writeHash(presentationId: string, slideIndex: number): void {
  const hash = buildHash(presentationId, slideIndex)
  if (location.hash !== hash) {
    history.replaceState(null, '', hash)
  }
}
