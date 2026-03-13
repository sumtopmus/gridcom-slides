// Shared dataset for all AUROC slides.
// 50 samples, 25 positive (label 1) / 25 negative (label 0).
// IDs are assigned in score-descending order (id 1 = highest score).

export const N_POS = 25
export const N_NEG = 25

export const dataset = [
  { id: 1, label: 1, score: 0.99 },
  { id: 2, label: 1, score: 0.97 },
  { id: 3, label: 1, score: 0.95 },
  { id: 4, label: 0, score: 0.93 },
  { id: 5, label: 1, score: 0.91 },
  { id: 6, label: 1, score: 0.89 },
  { id: 7, label: 0, score: 0.87 },
  { id: 8, label: 1, score: 0.85 },
  { id: 9, label: 1, score: 0.83 },
  { id: 10, label: 1, score: 0.81 },
  { id: 11, label: 0, score: 0.79 },
  { id: 12, label: 1, score: 0.77 },
  { id: 13, label: 1, score: 0.75 },
  { id: 14, label: 0, score: 0.73 },
  { id: 15, label: 1, score: 0.71 },
  { id: 16, label: 0, score: 0.69 },
  { id: 17, label: 1, score: 0.67 },
  { id: 18, label: 0, score: 0.65 },
  { id: 19, label: 1, score: 0.63 },
  { id: 20, label: 0, score: 0.61 },
  { id: 21, label: 1, score: 0.59 },
  { id: 22, label: 1, score: 0.57 },
  { id: 23, label: 0, score: 0.55 },
  { id: 24, label: 1, score: 0.53 },
  { id: 25, label: 0, score: 0.51 },
  { id: 26, label: 1, score: 0.49 },
  { id: 27, label: 0, score: 0.47 },
  { id: 28, label: 0, score: 0.45 },
  { id: 29, label: 1, score: 0.43 },
  { id: 30, label: 0, score: 0.41 },
  { id: 31, label: 0, score: 0.39 },
  { id: 32, label: 1, score: 0.37 },
  { id: 33, label: 0, score: 0.35 },
  { id: 34, label: 0, score: 0.33 },
  { id: 35, label: 1, score: 0.31 },
  { id: 36, label: 0, score: 0.29 },
  { id: 37, label: 0, score: 0.27 },
  { id: 38, label: 1, score: 0.25 },
  { id: 39, label: 0, score: 0.23 },
  { id: 40, label: 1, score: 0.21 },
  { id: 41, label: 0, score: 0.19 },
  { id: 42, label: 0, score: 0.17 },
  { id: 43, label: 1, score: 0.15 },
  { id: 44, label: 0, score: 0.13 },
  { id: 45, label: 0, score: 0.11 },
  { id: 46, label: 1, score: 0.09 },
  { id: 47, label: 0, score: 0.07 },
  { id: 48, label: 0, score: 0.05 },
  { id: 49, label: 1, score: 0.03 },
  { id: 50, label: 0, score: 0.01 },
]

// Sorted by score descending — the threshold-sweep order used for ROC construction.
export const sorted = [...dataset].sort((a, b) => b.score - a.score)

// Scrambled display order for the dataset grid (slide-01).
// Uses the linear congruential permutation (p*13+7)%50 — gcd(13,50)=1 guarantees
// all 50 indices appear exactly once in a visually mixed arrangement.
export const displayOrder = Array.from({ length: 50 }, (_, p) => (p * 13 + 7) % 50)
