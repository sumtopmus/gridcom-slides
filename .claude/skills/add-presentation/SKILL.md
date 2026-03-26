---
name: add-presentation
description: Use when the user asks to add, create, or build a new presentation, talk, or slide deck in this repository. Runs a metadata questionnaire and writes a confirmed content plan, then hands off to a fresh session.
---

# Add Presentation

First half of the presentation creation workflow: questionnaire → content plan → plan commit → handoff.

---

## Phase 1 — Metadata Questionnaire

Ask questions conversationally in the following grouped order. Do not touch any files until all are answered.

**Turn 1 — Author**
Ask for author name and GitHub username/URL together. Both are optional.

**Turn 2 — Title + Description**
Based on the message that triggered this skill, propose a title and a 1–2 sentence description. Present them as suggestions:

> "Here's what I'm thinking: **Title**: [proposed title]. **Description**: [proposed 1–2 sentence description]. Does that work, or would you like to change either?"

If the trigger message didn't contain enough context to form a confident suggestion, ask normally instead.

**Turn 3 — Tags**
Based on the confirmed description, suggest 3–4 tags and ask the user to confirm or adjust.

**Turn 4 — Theme**
Ask: **Aurora** (always dark — deep background, indigo/violet) or **Eclipse** (always light — bright background, soft indigo/violet)?

**Turn 5 — Date**
Propose today's date from context (ISO `YYYY-MM-DD`). Ask to confirm or override.

**Turn 6 — Slide count**
Ask how many slides they want. A rough number is fine — adjustable during planning.

**Presentation ID** is auto-generated from the title: lowercase, strip punctuation, replace spaces with hyphens, 2–4 words. Do not ask — announce it in the summary.

After all turns, **summarise the collected metadata** (including the auto-generated ID) before proceeding.

---

## Phase 2 — Content Plan (iterative)

Create the folder and write `presentations/<id>/PLAN.md`.

```bash
mkdir -p presentations/<id>
```

### PLAN.md format

```markdown
# <Title> — Content Plan

> **Next step:** Start a new Claude Code session in this repo and say
> **"generate presentation <id>"** to generate slides and review them.

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
- **Content**: headings, bullet text, chart description, question/answer beats, etc.

For step-based slides, list each beat explicitly (Step 0 = initial state, Step 1 = first reveal, …).

### Confirmation loop

After saving `PLAN.md`, present a **slide-by-slide summary** (number · title · type · one-line content description).

Then ask:

> "Does this plan look right? Ask me to adjust any slides — add, remove, reorder, change content or type — and I'll update the plan. Reply **confirm** when ready."

Loop: apply edits → update `PLAN.md` → re-present summary → ask again. Repeat until user says **confirm**.

---

## Phase 3 — Commit the Plan

```bash
git add presentations/<id>/PLAN.md
git commit -m "plan: add content plan for <id>"
```

Then tell the user with a ready-to-use instruction block:

> "Plan committed. To generate the slides, **start a new Claude Code session** in this repo (this session's context stays clean for planning — generation needs a fresh start) and say exactly:
>
> **`generate presentation <id>`**
>
> That session will read the plan, generate all slides, then walk you through them one by one for review."
