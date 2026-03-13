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
clone → branch → Claude Code → PR → review → merge → auto-deploy
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

#### 3. Use Claude Code to build your presentation

Open the project in your terminal and run `claude`. Use one of the prompts below to get started.

#### 4. Preview locally

```bash
npm run dev
```

Open `localhost:5173` — your presentation card appears on the homepage automatically.

#### 5. Open a pull request

```bash
git add presentations/<your-id>/
git commit -m "Add presentation: <title>"
git push origin presentation/<your-name>-<topic>
```

Then open a PR on GitHub against `main`. Once merged, the site deploys automatically.

---

## Claude Code Prompts

Copy and paste these into Claude Code. Replace the placeholders in `< >`.

---

### Starter prompt — create a new presentation from scratch

```text
Create a new presentation for me in this GRIDCOM project.

Topic: <your topic, e.g. "Bubble Sort and why it's slow">
Author name: <your name>
Presentation ID: <a short slug, e.g. "bubble-sort">
Theme: <aurora (dark) or eclipse (light)>
Number of slides: <e.g. 6>

Read CLAUDE.md first for the project conventions. Then:
1. Copy presentations/_template/ to presentations/<id>/
2. Update presentation.json with the correct id, title, author, date, and a slides array
3. Write each slide as a full HTML document using the chosen theme
4. Make the slides visually engaging — use large text, clear section titles, code blocks if relevant, and subtle animations triggered by the slideEnter message
```

---

### Prompt — add more slides to an existing presentation

```text
Add <N> more slides to my presentation at presentations/<id>/.
Read the existing slides first so the new ones match the style.
Add the new slide files and register them in presentation.json.
Topic for the new slides: <describe what they should cover>
```

---

### Prompt — improve slide visuals

```text
Look at my presentation at presentations/<id>/ and improve the visual design.
Keep the content the same but make it more polished:
- Better typography hierarchy
- Improve spacing and layout
- Add enter animations triggered by the slideEnter postMessage event
- Make sure it works well with the fixed-canvas 1920x1080 scaling mode
Do not change the theme.
```

---

### Prompt — create a code-focused presentation

```text
Create a presentation at presentations/<id>/ on the topic: <topic>
Author: <name>
Theme: eclipse
Use <N> slides. At least half of the slides should feature a code example.
Format code in <pre><code> blocks styled to look like a terminal or editor.
Use the slideEnter event to animate code blocks appearing line by line if possible.
Read CLAUDE.md for project conventions before starting.
```

---

### Prompt — create a data/diagram-focused presentation

```text
Create a presentation at presentations/<id>/ on the topic: <topic>
Author: <name>
Theme: aurora
Use <N> slides. Use SVG diagrams or CSS-drawn visuals (no external images) to illustrate concepts.
Include at least one slide with an animated diagram that plays when the slide is entered.
Read CLAUDE.md for project conventions before starting.
```

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
