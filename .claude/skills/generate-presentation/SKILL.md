---
name: generate-presentation
description: Use when the user says "generate presentation <id>" or asks to generate, build, or continue a presentation that already has a PLAN.md. Dispatches a generation agent then does an interactive slide-by-slide review loop.
---

# Generate Presentation

Second half of the presentation creation workflow: read plan → dispatch generation agent → interactive review loop → final commit.

Requires `presentations/<id>/PLAN.md` to exist (created by the `add-presentation` skill).

---

## Phase 4 — Dispatch Generation Agent

Read `presentations/<id>/PLAN.md` in full. Then dispatch an Agent with the following prompt (fill in `<id>` and embed the full plan content):

---

**Agent prompt template:**

```
You are generating slides for a GRIDCOM presentation. Read the content plan below and implement it exactly.

## Plan

<full contents of presentations/<id>/PLAN.md>

## What to do

1. Copy the template folder (never copy from an existing presentation):
   cp -r presentations/_template presentations/<id>
   (If presentations/<id>/ already has files beyond PLAN.md, do not overwrite them — only create missing slide files.)

2. Write presentations/<id>/presentation.json with these fields from the plan
   (omit any field not present in the plan — no placeholder values):
   id, title, description, author, authorUrl, date, tags, theme, slides array

3. Write each slide HTML file listed in the plan.

## Slide generation rules

Every slide must be a complete <!DOCTYPE html> document.

STRUCTURE (required in every slide):
- <link rel="stylesheet" href="../../themes/<theme>.css" /> in <head>
- <div class="bg"></div> and <div class="grid-lines"></div> as the FIRST TWO children of <body>
- Every content wrapper: position: relative; z-index: 1
- Never hardcode colors — use CSS variables only

THEME TOKENS:
--theme-bg, --theme-color, --theme-color-secondary, --theme-color-muted,
--theme-accent, --theme-accent-alt, --theme-surface, --theme-border

TITLE SLIDE pattern (staggered fade-up):
- Elements start opacity:0; transform:translateY(Npx)
- .animate class applies: animation: up 0.55s ease forwards
- Stagger via animation-delay: i*0.11s per element
- Re-trigger on slideEnter by removing + re-adding .animate
- Eyebrow / h1 / subtitle / divider / meta row (author + GitHub icon + date)
- Copy GitHub SVG icon and calendar SVG icon verbatim from presentations/demo-aurora/slide-00.html

CONTENT SLIDE (enter animation only):
  window.addEventListener('message', e => {
    if (e.data?.type === 'slideEnter') animateIn()
    if (e.data?.type === 'slideExit') { /* stop timers, reset */ }
  })

STEP-BASED SLIDE:

JS pattern (use exactly):

  let step = 0
  const TOTAL = N   // replace N with the actual number of steps

  function sendStepState() {
    window.parent.postMessage(
      { type: 'stepState', canGoBack: step > 0, canGoForward: step < TOTAL }, '*'
    )
  }

  function renderStep(n) { /* show/hide/animate content for step n */ }

  window.addEventListener('message', e => {
    if (e.data?.type === 'slideEnter') { step = 0; renderStep(0); sendStepState() }
    if (e.data?.type === 'stepNext' && step < TOTAL) { step++; renderStep(step); sendStepState() }
    if (e.data?.type === 'stepPrev' && step > 0)    { step--; renderStep(step); sendStepState() }
    if (e.data?.type === 'slideExit') { step = 0 }
  })

ALWAYS add a nav hint element to every step-based slide (bottom-right corner) so users know
how to advance steps. Use exactly this HTML at the end of <body> (before </body>):

  <div class="nav-hint"><kbd>[</kbd> prev step &nbsp; next step <kbd>]</kbd></div>

And exactly this CSS:

  .nav-hint {
    position: fixed;
    bottom: 4.8rem;
    right: 2.8rem;
    font-size: 0.7rem;
    color: var(--theme-color-muted);
    opacity: 0.7;
    z-index: 100;
    letter-spacing: 0.03em;
  }
  .nav-hint kbd {
    font-family: inherit;
    background: var(--theme-surface);
    border: 1px solid var(--theme-border);
    border-radius: 4px;
    padding: 0.1rem 0.42rem;
    font-size: 0.64rem;
  }

The viewer handles the actual [ ] / arrow / scroll input and translates it into stepNext /
stepPrev postMessages — the slide never listens for keyboard events directly.
Step 0 is the initial state shown on slideEnter. sendStepState() must be called on every
state change including slideEnter.

Design for 1920×1080 effective canvas. Prefer px/rem over vw/vh.

MATHJAX (use whenever a slide contains mathematical formulas):
Add to <head> — config block MUST come before the script tag:

  <script>
    MathJax = {
      tex: { inlineMath: [['\\(', '\\)']], displayMath: [['\\[', '\\]']] },
      chtml: { scale: 1 }
    }
  </script>
  <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js"></script>

Use CHTML output (tex-chtml.js), not SVG — CHTML inherits the CSS `color` property, so
formulas automatically pick up --theme-color without extra configuration.

Syntax:
- Inline formula: \( E = mc^2 \)
- Display (block) formula: \[ \int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2} \]

On step-based slides, if a formula is inside an element that starts hidden (display:none or
opacity:0 before reveal), call MathJax.typesetPromise([el]) when revealing it so MathJax
has a chance to render it at visible size:
  el.style.display = 'block'
  MathJax.typesetPromise([el])
```

---

Wait for the agent to complete before continuing.

---

## Phase 5 — Slide-by-Slide Review Loop

Once generation is done, tell the user:

> "All slides are generated. Please run `npm run dev` and open `viewer.html#/<id>/0`. We'll go through each slide one by one."

For **each slide** in order:

1. Ask: "Please review **Slide N — \<title\>**. Describe any issues (layout, content, animation, colours) or say **OK** to move on."
2. If issues reported: apply fixes, then say "Fixed — please refresh and check Slide N again."
3. Repeat until the user says OK.
4. Move to the next slide.

For **step-based slides**: remind the user to use arrow keys to step through the beats, and verify each step individually.

After all slides confirmed:

> "All slides look good!"

---

## Phase 6 — Final Commit

```bash
git add presentations/<id>/
git commit -m "feat: add presentation '<title>'"
```
