# Embedding Learning — Content Plan

> **Next step:** Start a new Claude Code session in this repo and say
> **"generate presentation embedding-learning"** to generate slides and review them.

**ID:** `embedding-learning`
**Theme:** aurora
**Author:** Oleksandr ([GitHub](https://github.com/sumtopmus))
**Date:** 2026-04-09
**Tags:** machine-learning, embeddings, deep-learning, NLP

**SVG assets** (copy into `presentations/embedding-learning/assets/`):
- `fig1.svg` — Embedding history / evolution timeline diagram → use on Slide 4 (A Brief History)
- `fig2.svg` — Word vectors in embedding space (bike example) → use on Slide 2 (What Is an Embedding)
- `fig3.svg` — Embedding tasks diagram → use on Slide 3 (Embedding Toolkit)
- `fig4.svg` — Two-tower inference flow (1 forward pass at request time) → use on Slide 8 (Two-Tower Architecture)
- `fig5.svg` — Contrastive learning push/pull diagram → use on Slide 5 (Contrastive Learning)

Source files: `.context/attachments/fig1.svg` through `fig5.svg`

---

## Slide 1 — Embedding Learning
**File:** `slide-01.html`
**Transition:** fade
**Type:** title slide

- Eyebrow label: "Machine Learning · Representation Learning"
- H1: "Embedding Learning"
- Subtitle: "From co-occurrence counts to multimodal shared spaces"
- Meta row: Oleksandr + GitHub link + 2026-04-09

---

## Slide 2 — A Brief History of Embeddings
**File:** `slide-02.html`
**Transition:** fade
**Type:** step-based (4 steps)
**Layout:** full-width, title visible at top. **fig1.svg** displayed as a large centered diagram with step-based era highlights.

An animated timeline showing the evolution of embedding methods, anchored by the fig1.svg Excalidraw diagram.

- Step 0 (initial): Show **fig1.svg** with the first era highlighted: **The Sparse Era (pre-2013)** — LSA (1990), PMI matrices, TF-IDF. One-hot vectors, no notion of similarity. Caption below the diagram summarizing this era. Remaining eras dimmed/faded.
- Step 1: Highlight **Word2Vec Revolution (2013)** on the diagram. Caption: Mikolov et al. Skip-gram & CBOW. "Train a shallow net to predict context → weight matrix IS the embedding." king−man+woman≈queen. GloVe (2014), FastText (2017).
- Step 2: Highlight **The Contextual Turn (2018)**. Caption: ELMo, then BERT. "Same word, different vector depending on context." Bank(river) ≠ Bank(money). Powered by deep Transformers.
- Step 3: Highlight **Multimodal Era (2021+)**. Caption: CLIP, ImageBind, CLAP. "Images, text, audio in ONE shared vector space." Cross-modal search, zero-shot classification.

Each step highlights the relevant portion of fig1.svg (via CSS opacity/filter on surrounding elements) and updates the caption below.

---

## Slide 3 — What Is an Embedding?
**File:** `slide-03.html`
**Transition:** fade
**Type:** step-based (3 steps)
**Layout:** two-column, title visible at top

The core concept: a mapping f: X → R^d that converts discrete inputs into dense continuous vectors where geometry encodes semantics.

- Step 0 (initial): Left column shows a one-hot sparse vector visualization — a tall column of mostly-zero cells with a single highlighted 1. Label: "One-hot: dim = |V|, no similarity". Right column is empty/reserved.
- Step 1: Right column reveals a dense vector visualization — a short, colorful bar of continuous values. Label: "Embedding: dim = d, geometry = meaning". An arrow connects the sparse to the dense with "learned projection" label.
- Step 2: Below both columns, reveal the **fig2.svg** diagram showing word vectors in a 2D embedding space (the bike example), illustrating that nearby vectors = similar meaning. Caption: "Similar items cluster together in embedding space."

---

## Slide 4 — The Embedding Toolkit
**File:** `slide-04.html`
**Transition:** fade
**Type:** step-based (4 steps)
**Layout:** centered single column, title visible at top

What you can do once data lives in a vector space.

- Step 0 (initial): Heading "Once you have embeddings, you unlock..." with an empty grid of 6 capability cards (reserved space, not yet visible).
- Step 1: Reveal first row of 3 cards — **Similarity & Retrieval** (cosine similarity icon, "Find semantically similar items"), **Clustering** (cluster icon, "Discover natural groupings"), **Classification** (label icon, "Transfer learned structure to new tasks").
- Step 2: Reveal second row of 3 cards — **Recommendation** (user-item icon, "Embed users and items in the same space"), **Anomaly Detection** (outlier icon, "Points far from any cluster are outliers"), **Analogical Reasoning** (king−man+woman≈queen formula).
- Step 3: Reveal the **fig3.svg** diagram below the cards as a summary visualization of embedding tasks.

Each card should use `--theme-surface` background with `--theme-border`, accent-colored icon area, and concise 1-line description.

---

## Slide 5 — Contrastive Learning
**File:** `slide-05.html`
**Transition:** fade
**Type:** step-based (3 steps)
**Layout:** two-column (left: concept, right: visualization), title visible at top

The modern workhorse for learning embeddings: pull similar items together, push dissimilar items apart.

- Step 0 (initial): Left shows the **Triplet Loss** formulation: L = max(0, d(a,p) − d(a,n) + margin). A simple diagram: anchor point with arrows to a positive (short, green) and negative (long, red). Right column shows **fig5.svg** (push non-matching pairs apart).
- Step 1: Left transitions to **InfoNCE / NT-Xent Loss**: L = −log(exp(sim(a,p)/τ) / Σ exp(sim(a,nᵢ)/τ)). Right shows an interactive batch matrix visualization — an N×N grid where diagonal cells glow green (positives) and off-diagonal cells are red (negatives). Label: "Every other item in the batch is a negative → O(N²) signal from N items."
- Step 2: Reveal a bottom panel highlighting **key insight**: "Temperature τ controls sharpness. Batch size matters enormously — SimCLR used 4096–8192. Hard negative mining is the single largest factor in quality." Show a small τ slider visualization (conceptual, not interactive) with "sharp" vs "soft" distribution curves.

---

## Slide 6 — Encoder Architectures
**File:** `slide-06.html`
**Transition:** fade
**Type:** step-based (3 steps)
**Layout:** centered, title visible at top

The encoder determines what kind of input you can handle. Show architecture evolution.

- Step 0 (initial): A styled table/grid showing the mapping: Text → Transformer (BERT, S-BERT), Images → CNN/ViT, Audio → wav2vec/CNN on spectrograms, Graphs → GNN, Code → CodeBERT/UniXcoder. Each row has a modality icon and encoder name.
- Step 1: Reveal a diagram showing the **pooling bottleneck** — variable-length input → encoder layers → pooling (mean pool, [CLS] token, attention pool) → fixed d-dimensional vector. Label: "The final pooling layer compresses variable-length representations into a single vector."
- Step 2: Reveal a comparison panel: **Shallow (Word2Vec)** — single projection, no nonlinearities, billions of words in hours. **Recurrent (ELMo)** — bidirectional LSTM, sequential processing, limited long-range. **Transformer (BERT+)** — self-attention, full parallelization, O(1) path length between any tokens. Visual: three columns with increasing depth/complexity, each with a small architecture sketch.

---

## Slide 7 — Component vs. Standalone Embeddings
**File:** `slide-07.html`
**Transition:** fade
**Type:** step-based (2 steps)
**Layout:** two-column, title visible at top

An important architectural distinction that affects how you think about embeddings in practice.

- Step 0 (initial): Left column — **Embeddings as a Component**. Diagram: an `nn.Embedding` lookup table as the first layer feeding into a deeper network (e.g., recommendation model). Labels: "Trained jointly with downstream task", "Specialized but not reusable", "Examples: token embeddings in GPT, user/item IDs in rec systems." The embedding layer is highlighted within a larger model outline.
- Step 1: Right column reveals — **Embeddings as the Product**. Diagram: an encoder model that outputs a vector, which then feeds into multiple downstream tasks (search, clustering, classification) via simple distance operations. Labels: "Trained with contrastive loss to optimize embedding quality directly", "Versatile and reusable", "Examples: Sentence-BERT, CLIP encoders, text-embedding-3-large." Arrow from single model to multiple use cases. Bottom: a tradeoff bar — left end "Task-specific (higher accuracy)" → right end "General-purpose (more versatile)".

---

## Slide 8 — The Two-Tower Architecture
**File:** `slide-08.html`
**Transition:** fade
**Type:** step-based (3 steps)
**Layout:** centered with large diagram, title visible at top

The workhorse of industrial retrieval: two separate encoders, one shared embedding space.

- Step 0 (initial): Show **fig4.svg** (two-tower inference diagram with "1 forward pass at request time"). Two towers side by side: Query Tower (encodes query/user) and Document Tower (encodes document/item), each producing a vector, joined by a dot-product similarity at the top.
- Step 1: Reveal the **key advantage** panel below: "Documents encoded offline → stored in vector index (FAISS, Milvus). At query time: encode query once → ANN lookup in milliseconds. O(1) vs O(N) forward passes." Show a comparison: Cross-encoder = O(N) passes per query vs Two-tower = 1 pass + ANN lookup. Use contrasting accent colors.
- Step 2: Reveal the **quality-speed tradeoff** panel: "No cross-attention between inputs = less accurate than cross-encoders. Solution: retrieve top-k with two-tower, rerank with cross-encoder." Show the retrieve-then-rerank pipeline as a funnel: Millions → Two-tower ANN (top 100) → Cross-encoder rerank (top 10). Side note: "Siamese (shared weights) when same-type inputs. Asymmetric (separate weights) when heterogeneous."

---

## Slide 9 — Multimodal Shared Spaces
**File:** `slide-09.html`
**Transition:** fade
**Type:** step-based (3 steps)
**Layout:** centered with large visualization, title visible at top

Embedding different data types into a single vector space.

- Step 0 (initial): A 2D scatter visualization representing a shared embedding space. Two isolated clusters labeled "Text embeddings" and "Image embeddings" with a gap between them. Label: "Single-modality: separate spaces, no cross-modal comparison."
- Step 1: The clusters merge/align into one unified space. Matching pairs (a dog photo near "golden retriever running in park") are connected with dashed lines. Label: "CLIP: 400M image-text pairs, contrastive loss aligns both modalities." Show the symmetric InfoNCE idea: N×N matrix with image rows and text columns.
- Step 2: Expand to **six modalities** converging on the shared space — Images, Text, Audio, Depth, Thermal, IMU — referencing ImageBind. Label: "ImageBind: only image-paired data needed. Emergent cross-modal retrieval — audio→text works despite never seeing audio-text pairs." Below: practical examples — "text-to-image search, audio-to-text retrieval, image-to-audio matching — no task-specific training."

---

## Slide 10 — Applications in Production
**File:** `slide-10.html`
**Transition:** fade
**Type:** step-based (4 steps)
**Layout:** grid of application cards, title visible at top

Where everything comes together — real-world, production-grade uses.

- Step 0 (initial): Heading visible. Grid of 6 application cards with reserved space, none revealed yet.
- Step 1: Reveal first row — **Semantic Search & RAG** (embed corpus → vector DB → query → retrieve → LLM generates grounded response; the #1 application right now), **Recommendation Systems** (YouTube, Spotify, Amazon — two-tower candidate generation, ANN over item embeddings).
- Step 2: Reveal second row — **Face Recognition** (FaceNet: CNN + triplet loss, same person = close embeddings regardless of angle/lighting/age), **Anomaly & Fraud Detection** (normal behavior clusters tightly; anomalies are distant points; adapts without explicit rules).
- Step 3: Reveal third row — **Drug Discovery** (molecular embeddings via GNNs, similarity search over billions of compounds), **Code Intelligence** (GitHub Copilot retrieval, semantic code search, duplicate detection — syntactically different but semantically equivalent functions map nearby).

Each card: accent-colored top bar, bold title, 2-line description, subtle icon. Cards use `--theme-surface` with `--theme-border`.

---

## Slide 11 — Key Takeaways
**File:** `slide-11.html`
**Transition:** fade
**Type:** content (enter animation only)
**Layout:** centered single column, title visible at top

Summary of the core principles.

- 4 key takeaway cards staggered with enter animation (CSS animation delays, not step-based):
  1. **Geometry = Meaning** — An embedding is a learned mapping where geometric relationships encode semantic relationships. The loss function shapes the geometry.
  2. **Contrastive Learning Wins** — InfoNCE with hard negatives is the standard. Batch size and negative mining quality matter more than model size.
  3. **Two-Tower for Scale** — Decouple encoding from comparison. Pre-compute, index, retrieve in milliseconds. Rerank for precision.
  4. **The Frontier Is Multimodal** — Shared vector spaces across modalities unlock cross-modal reasoning without task-specific training.
- Bottom quote in muted text: "The quality of your negative mining strategy often matters more than your model architecture."
