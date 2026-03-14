// datasets.js — Shared distributions and sampled datasets for all AUROC slides.
// All generated datasets are sorted by score descending (id 1 = highest score = rank 1).

// ---------------------------------------------------------------------------
// Seeded PRNG (mulberry32)
// ---------------------------------------------------------------------------

export function mulberry32(seed) {
  let s = seed >>> 0
  return function () {
    s = (s + 0x6D2B79F5) >>> 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ---------------------------------------------------------------------------
// PDF helpers
// ---------------------------------------------------------------------------

export function gaussianPDF(x, mu, sigma) {
  const z = (x - mu) / sigma
  return Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI))
}

export function bimodalPDF(x, mu1, s1, mu2, s2, w = 0.5) {
  return w * gaussianPDF(x, mu1, s1) + (1 - w) * gaussianPDF(x, mu2, s2)
}

// ---------------------------------------------------------------------------
// Sampling helpers
// ---------------------------------------------------------------------------

// Box-Muller — raw, no clamping
function sampleNormal(rand, mu, sigma) {
  const u1 = Math.max(1e-12, rand()), u2 = rand()
  return mu + sigma * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
}

// Sample from Gaussian truncated to [0, 1] via rejection
function sampleTruncGauss(rand, mu, sigma) {
  for (let i = 0; i < 500; i++) {
    const v = sampleNormal(rand, mu, sigma)
    if (v >= 0 && v <= 1) return v
  }
  return Math.max(0, Math.min(1, sampleNormal(rand, mu, sigma)))
}

// ---------------------------------------------------------------------------
// Distribution descriptors
// Each entry defines the PDF curves (for slide-01) and how to sample data.
//
// Dataset A — N(0.75, 0.12) pos vs N(0.30, 0.12) neg
//   • Well-separated; PDF intersection at 0.525; AUROC ≈ 0.87
//
// Dataset B — N(0.72, 0.18) pos vs N(0.48, 0.18) neg
//   • Moderate overlap; PDF intersection exactly at (0.72+0.48)/2 = 0.60
//
// Dataset C — bimodal(0.3, 0.8) pos vs N(0, 1) neg
//   • Camel-shaped positives at 0.3 and 0.8; monotone-decreasing negatives
//   • Imbalanced: 20 positives, 80 negatives
// ---------------------------------------------------------------------------

export const distributions = [
  {
    key: 'A', name: 'High score',
    posCount: 50, negCount: 50,
    posPDF: x => gaussianPDF(x, 0.75, 0.12),
    negPDF: x => gaussianPDF(x, 0.30, 0.12),
    samplePos: rand => sampleTruncGauss(rand, 0.75, 0.12),
    sampleNeg: rand => sampleTruncGauss(rand, 0.30, 0.12),
  },
  {
    key: 'B', name: 'Regular score',
    posCount: 50, negCount: 50,
    posPDF: x => gaussianPDF(x, 0.72, 0.18),
    negPDF: x => gaussianPDF(x, 0.48, 0.18),
    samplePos: rand => sampleTruncGauss(rand, 0.72, 0.18),
    sampleNeg: rand => sampleTruncGauss(rand, 0.48, 0.18),
  },
  {
    key: 'C', name: 'Low score',
    posCount: 20, negCount: 80,
    posPDF: x => bimodalPDF(x, 0.3, 0.1, 0.8, 0.1),
    negPDF: x => gaussianPDF(x, 0, 1),
    samplePos: rand => rand() < 0.5
      ? sampleTruncGauss(rand, 0.3, 0.1)
      : sampleTruncGauss(rand, 0.8, 0.1),
    sampleNeg: rand => sampleTruncGauss(rand, 0, 1),
  },
]

// ---------------------------------------------------------------------------
// Dataset generation — fixed seeds for reproducibility
// ---------------------------------------------------------------------------

function generateDataset(dist, seed) {
  const rand = mulberry32(seed)
  const items = []
  for (let i = 0; i < dist.posCount; i++) items.push({ label: 1, score: +dist.samplePos(rand).toFixed(2) })
  for (let i = 0; i < dist.negCount; i++) items.push({ label: 0, score: +dist.sampleNeg(rand).toFixed(2) })
  items.sort((a, b) => b.score - a.score || a.label - b.label)
  items.forEach((it, i) => { it.id = i + 1 })
  return items
}

export const datasets = distributions.map((dist, i) => ({
  key: dist.key,
  name: dist.name,
  data: generateDataset(dist, 0xDEAD0000 + i),
}))

// ---------------------------------------------------------------------------
// Scrambled display order for 100-item grids (slide-02).
// (p*17+3)%100 — gcd(17,100)=1 guarantees all 100 indices appear exactly once.
// ---------------------------------------------------------------------------

export const displayOrder100 = Array.from({ length: 100 }, (_, p) => (p * 17 + 3) % 100)
