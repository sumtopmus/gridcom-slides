---
name: generate-presentation
description: Use when the user says "generate presentation <id>" or asks to generate, build, or continue a presentation that already has a PLAN.md. Dispatches a generation agent then does an interactive slide-by-slide review loop.
---

# Generate Presentation

Second half of the presentation creation workflow: read plan → dispatch generation agent → interactive review loop → final commit.

Requires `presentations/<id>/PLAN.md` to exist (created by the `add-presentation` skill).

---

## Phase 4 — Setup + Per-Slide Agent Dispatch

### Phase 4A — Setup (main session)

1. Read `presentations/<id>/PLAN.md` in full.
2. Run: `cp -r presentations/_template presentations/<id>` (skip if the folder already has slide files beyond PLAN.md).
3. Write `presentations/<id>/presentation.json` with the fields from the plan (omit any field not present — no placeholder values): `id`, `title`, `description`, `author`, `authorUrl`, `date`, `tags`, `theme`, `slides` array.

### Phase 4B — Shared files

Scan the plan for any data or asset files referenced by more than one slide (e.g. a JSON dataset, a shared CSV, a constants file).

For each such file:
1. If it already exists on disk — read it.
2. If it does not exist yet — generate it now in the main session (write it to its final path), then read it.

You will embed each shared file's path and full contents in the prompt of every agent that needs it.

> If no shared files are referenced, skip this step.

### Phase 4C — Dispatch one agent per slide (in parallel)

For **each slide** listed in the plan, dispatch a separate Agent using the template below. You may launch all agents in parallel — they write independent files and do not depend on each other.

Fill in the placeholders before sending:
- `<id>` — presentation ID
- `<theme>` — theme name from the plan
- `<SLIDE_FILE>` — filename for this slide (e.g. `slide-01.html`)
- `<SLIDE_TITLE>` — title of this slide from the plan
- `<SLIDE_SPEC>` — the full per-slide section from the plan describing this slide's content, layout, and beats
- `<SHARED_FILES>` — for each shared file: its path and full contents; omit this section entirely if there are no shared files
- `<PLAN_CONTENT>` — full verbatim contents of PLAN.md (for overall context)

---

**Per-slide agent prompt template:**

```
You are writing a single slide for an advanced level presentation.
Write ONLY the file listed under "Your task". Do not touch any other files.

## Full presentation plan (for context)

<PLAN_CONTENT>

## Shared files

<SHARED_FILES>
(Omit this section if there are no shared files.)

## Your task

Write `presentations/<id>/<SLIDE_FILE>` — "<SLIDE_TITLE>".

Slide spec from the plan:
<SLIDE_SPEC>

## Slide generation rules

Every slide must be a complete <!DOCTYPE html> document.

STRUCTURE (required in every slide):
- <link rel="stylesheet" href="../../themes/<theme>.css" /> in <head>
- <link rel="stylesheet" href="../../shared/styles/slide-grid.css" /> after the theme link
- <div class="bg"></div> and <div class="grid-lines"></div> as the FIRST TWO children of <body>
- Use .gc-grid for all content layout (see CLAUDE.md Slide Grid Layout section)
- Every content wrapper: position: relative; z-index: 1
- Never hardcode colors — use CSS variables only
- Always handle devMode in the slide script:
    if (e.data?.type === 'devMode') {
      document.documentElement.classList.toggle('gc-dev', !!e.data.enabled)
    }

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

SLIDE TITLE (non-title slides):
The `## Slide N — <Name>` section header in PLAN.md is the slide title. When rendering, use only the `<Name>` part — never "Slide N" or the "—" separator. When visible, render it as a heading **centered horizontally at the top of the slide**, above all main content. Include it when the plan's layout hint says the title should be visible; omit it for full-bleed layouts or when the plan's content already has a prominent heading that serves the same purpose.

CONTENT CENTERING:
Main slide content should be **centered vertically** within the available space (below the title if present). Use flexbox or grid alignment (`align-items: center`, `justify-content: center`) on the content wrapper. Avoid pushing content to the top or bottom unless the plan explicitly calls for it.

BLOCK COMPONENTS (prefer shared styles):
For content that fits a label / value / description pattern — definitions, formulas, key points, Q&A cards — prefer the shared block components from `../../shared/styles/blocks.css` over ad-hoc slide CSS:

  <link rel="stylesheet" href="../../shared/styles/blocks.css" />

Available components:
- `.gc-block` — single standalone block with accent left bar
- `.gc-block-stack` — stacked multi-block card (items separated by dividers); modifiers: `--formula` (fluid math font sizes), `--centered` (top-border layout)
- `.gc-block-stack--qa` — two-item question / answer reveal card; add `gc-block-stack--revealed` to show the answer

See the file header comment in `blocks.css` for full markup patterns.

CONTENT SLIDE (enter animation only):
  window.addEventListener('message', e => {
    if (e.data?.type === 'slideEnter') animateIn()
    if (e.data?.type === 'slideExit') { /* stop timers, reset */ }
    if (e.data?.type === 'devMode') {
      document.documentElement.classList.toggle('gc-dev', !!e.data.enabled)
    }
  })

STEP-BASED SLIDE:

JS pattern (use exactly):

  let step = 0
  const TOTAL = N   // replace N with the actual number of steps

  function sendStepState() {
    window.parent.postMessage(
      { type: 'stepState', canGoBack: step > 0, canGoForward: step < TOTAL, currentStep: step }, '*'
    )
  }

  function renderStep(n) { /* show/hide/animate content for step n */ }

  window.addEventListener('message', e => {
    if (e.data?.type === 'slideEnter') { step = 0; renderStep(0); sendStepState() }
    if (e.data?.type === 'stepRestore') { step = Math.max(0, Math.min(TOTAL, e.data.step ?? 0)); renderStep(step); sendStepState() }
    if (e.data?.type === 'stepNext' && step < TOTAL) { step++; renderStep(step); sendStepState() }
    if (e.data?.type === 'stepPrev' && step > 0)    { step--; renderStep(step); sendStepState() }
    if (e.data?.type === 'slideExit') { step = 0 }
    if (e.data?.type === 'devMode') {
      document.documentElement.classList.toggle('gc-dev', !!e.data.enabled)
    }
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

AUDIENCE QUESTION / Q&A BLOCKS (use when the plan includes a prompt-to-audience beat):
- Use shared component CSS:
  <link rel="stylesheet" href="../../shared/styles/audience-question.css" />

A slide may contain ONE or MORE QA blocks. Choose the placement pattern based on the plan:

PATTERN A — Opening question (QA block is the first thing the audience sees):
- The QA block is visible from step 0; the slide title and any subsequent content are
  revealed at later steps.
- Use the gc-audience-slide wrapper:
    <div class="gc-audience-slide" id="aq-slide">
      <h2 class="gc-audience-slide__title">...</h2>
      <div class="gc-audience" id="aq">...</div>
      <!-- main content area (if any) revealed at step 2+ -->
    </div>
- LAYOUT CONSTRAINTS (enforce at every step):
    1. Title is centered horizontally ABOVE the QA block and NEVER moves.
       .gc-audience-slide__title is the FIRST child of .gc-audience-slide.
       audience-question.css hides it with visibility:hidden at step 0 (not display:none),
       so layout space is reserved — the QA block never jumps.
    2. The QA block stays VISIBLE for the entire slide.
       Subsequent content is revealed BELOW it, never replacing it.
    3. Layout order at EVERY step: title → QA block → main content area.
- Step sequence:
    step 0: question visible; title space reserved (hidden); answer hidden
    step 1: reveal answer AND title together (gc-audience--revealed + gc-audience-slide--revealed)
    step 2+: reveal main content blocks below the QA block (if any)
    stepPrev / slideExit: reset to step 0

PATTERN B — Inline question (QA block appears partway through the slide):
- The QA block starts hidden and is revealed at a later step, alongside or after other content.
- No gc-audience-slide wrapper is needed; use gc-audience directly.
- The block reserves its layout space from step 0 (visibility:hidden) so nothing jumps when it
  appears.
- Multiple QA blocks are allowed — assign each a reveal step and toggle gc-audience--revealed
  on the correct block when that step is reached.
- Step sequence is defined by the plan; there is no fixed title-first constraint.

BLOCK-BASED REVEALS (general rule):
- Prefer shared reusable block styles (e.g. audience-question, step-reveal) over ad-hoc slide-specific reveal CSS.
- Hidden blocks should reserve final layout space whenever possible (no layout jump between steps).
- Do not attach direct keyboard listeners in slides; use viewer step postMessage flow only.

RESPONSIVE CONTAINMENT FOR DENSE SLIDES:
- Keep content horizontally centered.
- Preserve symmetric side gutters (left and right).
- If viewport width is tight, downscale content/typography proportionally so no block clips past left/right edges.

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

Wait for **all** per-slide agents to complete before continuing.

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
