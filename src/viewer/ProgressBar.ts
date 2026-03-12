export class ProgressBar {
  private fill: HTMLElement
  private counter: HTMLElement

  constructor() {
    this.fill = document.getElementById('progress-fill')!
    this.counter = document.getElementById('slide-counter')!
  }

  update(current: number, total: number): void {
    const pct = total > 1 ? (current / (total - 1)) * 100 : 100
    this.fill.style.width = `${pct}%`
    this.counter.textContent = `${current + 1} / ${total}`
  }
}
