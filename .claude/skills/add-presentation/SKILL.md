---
name: add-presentation
description: Use when the user asks to add, create, or build a new presentation, talk, or slide deck in this repository. Runs a metadata questionnaire, writes a content plan for confirmation, generates files, then does a slide-by-slide review loop.
---

# Add Presentation

Full workflow for creating a new GRIDCOM presentation: questionnaire → content plan → plan commit → generation → review loop → final commit.

---

## Phase 1 — Metadata Questionnaire

Ask all of the following in **one message**. Do not touch any files until you have answers.

1. **Author** — Who is the presenter? (optional)
2. **Author's GitHub** — username or profile URL (optional)
3. **Title** — Human-readable title shown on the homepage card
4. **Description** — One or two sentences on what this is about
5. **Tags** — Suggest 3–4 tags based on the description; ask user to confirm or adjust
6. **Theme** — **Aurora** (always dark — deep background, indigo/violet) or **Eclipse** (always light — bright background, soft indigo/violet)?
7. **Presentation ID** — Derive a short lowercase slug from the title (letters, numbers, hyphens; 2–4 words). Propose it, ask for confirmation.
8. **Date** — Default to today's date from context. Confirm or let user override (ISO `YYYY-MM-DD`).
9. **Number of slides** — How many slides does the user want? (A rough number is fine; can adjust during planning.)

After collecting answers, **summarise the metadata as a confirmation block** before proceeding.

---

## Phase 2 — Content Plan (iterative)

Write a content plan for the presentation as a Markdown file and save it to:

```
presentations/<id>/PLAN.md
```

### Plan file format

```markdown
# <Title> — Content Plan

**ID:** `<id>`
**Theme:** aurora | eclipse
**Author:** <Name> ([GitHub](https://github.com/<username>))
**Date:** <YYYY-MM-DD>
**Tags:** tag1, tag2, tag3

---

## Slide 1 — Title
**File:** `slide-01.html`
**Transition:** fade
**Type:** title slide

- Eyebrow label: "Category · Subcategory"
- H1: "Presentation Title"
- Subtitle: one-line description
- Meta row: author + GitHub link + date

---

## Slide 2 — <Name>
**File:** `slide-02.html`
**Transition:** fade
**Type:** content (enter animation only)
**Layout:** centered, single column

- Heading: "…"
- Bullet list:
  - Point one
  - Point two
  - Point three

---

## Slide 3 — <Name>
**File:** `slide-03.html`
**Transition:** fade
**Type:** step-based (N steps)

- Step 0 (initial): Show question "…"
- Step 1: Reveal answer "…"
- Step 2: Reveal supporting detail
```

### What to include per slide

- **File** name (`slide-01.html`, etc.)
- **Transition** (`fade`, `slide-left`, `none`)
- **Type**: `title slide`, `content` (enter animation only), or `step-based (N steps)`
- **Layout hint** (centered, two-column, full-bleed chart, etc.)
- **Content**: headings, bullet text, chart description, code snippet, question/answer sequence — whatever the user described

For step-based slides, list each beat explicitly (Step 0 = initial state, Step 1 = first reveal, …).

### Confirmation loop

After saving `PLAN.md`, present a **summary of the slide structure** to the user (slide number, title, type, one-line content description per slide).

Then ask:

> "Does this plan look right? You can ask me to adjust any slides — add, remove, reorder, change content or type — and I'll update the plan. Reply **confirm** when ready to proceed."

Loop: apply requested edits → update `PLAN.md` → re-present summary → ask again. Repeat until user says **confirm**.

---

## Phase 3 — Commit the Plan

Once confirmed, commit `PLAN.md`:

```bash
git add presentations/<id>/PLAN.md
git commit -m "plan: add content plan for <id>"
```

---

## Phase 4 — Generate Slides

### Folder setup

Copy the template (never copy from an existing presentation):

```bash
cp -r presentations/_template presentations/<id>
```

### Write `presentation.json`

```json
{
  "id": "<id>",
  "title": "<Title>",
  "description": "<description>",
  "author": "<Author>",
  "authorUrl": "https://github.com/<username>",
  "date": "<YYYY-MM-DD>",
  "tags": ["tag1", "tag2"],
  "theme": "<aurora|eclipse>",
  "slides": [
    { "file": "slide-01.html", "title": "Title", "transition": "fade" }
  ]
}
```

Omit any field the user did not provide (no placeholder values).

### Generate slide HTML files

Follow the plan exactly. For each slide:

**Title slide** — use the staggered fade-up animation pattern from `demo-aurora/slide-00.html`:
- Elements start `opacity: 0; transform: translateY(Npx)`
- `.animate` class triggers `animation: up 0.55s ease forwards`
- Stagger via `animation-delay: ${i * 0.11}s` per element
- Re-trigger on `slideEnter` by removing + re-adding `.animate`
- Reuse GitHub icon SVG and calendar icon SVG verbatim from `demo-aurora/slide-00.html`

**Content slide (enter animation only):**
```js
window.addEventListener('message', e => {
  if (e.data?.type === 'slideEnter') animateIn()
  if (e.data?.type === 'slideExit') { /* stop timers, reset */ }
})
```

**Step-based slide:**
```js
let step = 0
const TOTAL = N  // number of steps

function sendStepState() {
  window.parent.postMessage(
    { type: 'stepState', canGoBack: step > 0, canGoForward: step < TOTAL },
    '*'
  )
}

function renderStep(n) {
  // Show/hide/animate content for step n
}

window.addEventListener('message', e => {
  if (e.data?.type === 'slideEnter') { step = 0; renderStep(0); sendStepState() }
  if (e.data?.type === 'stepNext' && step < TOTAL) { step++; renderStep(step); sendStepState() }
  if (e.data?.type === 'stepPrev' && step > 0) { step--; renderStep(step); sendStepState() }
  if (e.data?.type === 'slideExit') { step = 0 }
})
```

Arrow keys step through the sequence before the viewer advances to the next slide.

### Design rules (every slide)

- `<div class="bg"></div>` and `<div class="grid-lines"></div>` are the **first two children of `<body>`**
- Every content wrapper: `position: relative; z-index: 1`
- **All colors via CSS variables — never hardcode hex/rgb**
- Theme link: `../../themes/<theme>.css`
- Always wire `slideEnter` (replay animation / reset step) and `slideExit` (stop timers)

### Available theme tokens

| Token | Purpose |
|-------|---------|
| `--theme-bg` | Page background |
| `--theme-color` | Primary text |
| `--theme-color-secondary` | Secondary text |
| `--theme-color-muted` | Muted / hint text |
| `--theme-accent` | Accent color (indigo) |
| `--theme-accent-alt` | Accent variant |
| `--theme-surface` | Card / panel background |
| `--theme-border` | Border color |

---

## Phase 5 — Slide-by-Slide Review Loop

After all slides are generated, ask the user to run the dev server:

> "All slides are generated. Please run `npm run dev` and open the presentation in the viewer (`viewer.html#/<id>/0`). We'll review each slide one by one."

For **each slide** (slide 1 → slide N):

1. **Prompt:** "Please review **Slide N — \<title\>**. Does it look right? Describe any issues — layout, content, animation, colours — or say **OK** to continue."
2. If the user reports issues: apply the fixes, then say "Fixed — please refresh and check Slide N again."
3. Repeat until the user confirms the slide is OK.
4. Move to the next slide.

After all slides are confirmed:

> "All slides look good! Moving to the final commit."

---

## Phase 6 — Final Commit

Commit everything:

```bash
git add presentations/<id>/
git commit -m "feat: add presentation '<title>'"
```

---

## Quick Reference — Phase Sequence

```
Phase 1  Questionnaire (one message, wait for all answers)
Phase 2  Write PLAN.md → summary → confirm loop
Phase 3  git commit PLAN.md
Phase 4  Generate folder + json + all slide HTML files
Phase 5  Slide-by-slide review loop (fix → refresh → OK → next)
Phase 6  git commit everything
```
