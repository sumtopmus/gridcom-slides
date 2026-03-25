# GRIDCOM

A shared slide presentation platform for study groups. Presentations are standalone HTML+CSS pages rendered in a 16:9 viewer — no frameworks, no build complexity per slide.

**Live demo:** each group's site lives at `https://<org-or-username>.github.io/<repo-name>/`

---

## For Study Group Owners — Initial Setup

### 1. Fork the repository

Click **Fork** on GitHub. Give the fork a name that reflects your group (e.g. `cs101-slides`).

### 2. Set the deployment base path

Open `vite.config.ts` and update `base` to match your repository name:

```ts
base: '/<your-repo-name>/',
```

> Use `base: '/'` only if you have a custom domain configured in GitHub Pages.

Commit and push the change to `main`.

### 3. Enable GitHub Pages

1. Go to your repository → **Settings** → **Pages**
2. Under **Build and deployment**, set **Source** to **GitHub Actions**
3. Save

The deployment workflow (`.github/workflows/deploy.yml`) triggers automatically on every push to `main`. After the first successful run, your site is live.

### 4. Add students as collaborators

Go to **Settings** → **Collaborators** → **Add people** and invite each student by their GitHub username. They need at least **Write** access to open pull requests from branches (or you can accept forks — both workflows work).

---

## For Students — Adding Your Presentation

### Prerequisites

- [Claude Code](https://claude.ai/code) installed (`npm install -g @anthropic-ai/claude-code`)
- Git and Node.js (v18+)

### Workflow

```text
clone → branch → plan (Session 1) → generate & review (Session 2) → PR → merge → auto-deploy
```

#### 1. Clone the repository

```bash
git clone https://github.com/<org>/<repo>.git
cd <repo>
npm install
npm run dev      # preview at localhost:5173
```

#### 2. Create a branch for your presentation

```bash
git checkout -b presentation/<your-name>-<topic>
# e.g. git checkout -b presentation/alex-sorting-algorithms
```

#### 3. Install the Claude Code skills (one-time)

Copy the presentation skills to your Claude Code skills directory:

```bash
cp -r .claude/skills/add-presentation ~/.claude/skills/
cp -r .claude/skills/generate-presentation ~/.claude/skills/
```

#### 4. Use Claude Code to build your presentation

Open the project in your terminal and run `claude`, then say:

```
add a presentation
```

Claude will walk you through a short questionnaire, propose a slide-by-slide content plan for your confirmation, commit the plan, and tell you to start a new session. In the new session say:

```
generate presentation <id>
```

Claude will generate all the slides and guide you through a review loop.

#### 5. Preview locally

```bash
npm run dev
```

Open `localhost:5173` — your presentation card appears on the homepage automatically.

#### 6. Open a pull request

```bash
git add presentations/<your-id>/
git commit -m "Add presentation: <title>"
git push origin presentation/<your-name>-<topic>
```

Then open a PR on GitHub against `main`. Once merged, the site deploys automatically.

---

## Claude Code Skills

This repo ships with two Claude Code skills that guide you through the full creation workflow.

### Install (one-time)

```bash
cp -r .claude/skills/add-presentation ~/.claude/skills/
cp -r .claude/skills/generate-presentation ~/.claude/skills/
```

Requires [Claude Code](https://claude.ai/code) — `npm install -g @anthropic-ai/claude-code`.

### Session 1 — Plan

Open the project in your terminal, run `claude`, and say:

```
add a presentation
```

Claude will ask about your presentation in a short conversational flow (author, title, description, tags, theme, date, slide count), then propose a slide-by-slide content plan for your review. You can ask for edits until you're happy, then confirm. Claude commits `PLAN.md` and tells you to start a new session.

### Session 2 — Generate & Review

Start a new `claude` session in the same repo and say:

```
generate presentation <id>
```

Claude dispatches a fresh agent to generate all the slide HTML files from the plan, then walks you through a slide-by-slide review loop — describe any issues and Claude fixes them in place, until every slide looks right. Then it commits everything.

---

## Project Structure Reference

```text
presentations/
  _template/          ← starter — copy this for every new presentation
  <your-id>/
    presentation.json ← metadata + slide list
    slide-01.html     ← each slide is a full HTML document
    slide-02.html
    ...

themes/
  aurora.css          ← dark theme (deep background, indigo/violet)
  eclipse.css         ← light theme (bright background, soft indigo/violet)
```

### presentation.json fields

| Field | Required | Example |
| --- | --- | --- |
| `id` | yes | `"bubble-sort"` — must match the folder name |
| `title` | yes | `"Bubble Sort"` |
| `description` | no | `"Why O(n²) hurts"` |
| `author` | no | `"Alex"` |
| `date` | no | `"2026-03-13"` — used for sort order on homepage |
| `theme` | no | `"aurora"` or `"eclipse"` |
| `slides` | yes | array of `{ file, title?, transition? }` |

Transitions: `"fade"` (default), `"slide-left"`, `"none"`

## Viewer Hotkeys

| Key | Action |
| --- | --- |
| `→` / `↓` / `Space` | Next slide |
| `←` / `↑` / `⌫` | Previous slide |
| `f` | Toggle fullscreen |
| `g` | Slide grid overview |
| `c` | Toggle fixed 16:9 canvas (scales all content) |
| `m` | Toggle dark / light mode |
| `s` | Toggle system color mode |
| `h` / `?` | Toggle keyboard shortcuts hint |
| `Esc` | Exit grid / exit fullscreen / back to homepage |

Swipe left/right and scroll also navigate between slides.

---

Built by [HIMARS](https://github.com/sumtopmus) · MIT License
