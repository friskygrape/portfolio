# Portfolio — CLAUDE.md

Personal design portfolio. Vanilla HTML/CSS/JS. No build tools, no framework, no bundler.

## File structure

```
css/site.css          — shared stylesheet, single source of truth for all tokens
styleguide.html       — living design reference, must stay in sync with site.css
index.html            — homepage
about.html
ai-design.html        — "AI x Design" page, in active development (renamed from ai-fun-v3.html)
discounts.html
onboarding.html
optik.html
support.html
lottie/               — Lottie JSON animation files
images/
```

Old AI page versions (`ai-fun.html`, v2, the v3 layout prototypes) are archived outside the repo in `../Portfolio-archive/ai-page-old/`. The AI page art generators live in `Brand and Motion Design Agent/work/ai-page-art-generators/`.

## Design system

**Type classes** (apply to HTML elements — never hardcode font values):
`.h1` `.h2` `.h3` `.h4` `.h5` `.lead` `.body-lg` `.body` `.label` `.overline` `.caption` `.tag`

When the user says "body" in a paragraph context, they mean `body-lg` (18px desktop / 16px mobile).

**CSS variables** (use inside component rules when a class can't be applied):
- Fonts: `var(--font-heading)` (Geist), `var(--font-body)` (Open Sans)
- Sizes: `var(--text-h1)` through `var(--text-body)`, `var(--text-body-lg)`
- Weights: `var(--weight-regular/medium/semibold/bold/extrabold)`
- Leading: `var(--leading-tight/snug/normal/relaxed/loose)`
- Tracking: `var(--tracking-tight/snug/normal/wide/wider/widest)`

**Palette** (raw): `--purple` `--plum` `--charcoal` `--silver` `--ash` `--mist` `--white`
**Semantic**: `--color-primary` `--color-secondary` `--color-subtle` `--color-inverse`

**Token source of truth**: `css/site.css` and `styleguide.html` must always match. When tokens change in either file (palette, semantic mappings, type scale), update the other in the same session, including swatches and spec text. This project has no `design/brand.md` or `tokens.json`. These two files are the brand kit.

## CSS rules

- **Never hardcode** `font-size`, `font-family`, or `font-weight` — use type classes or CSS vars.
- **Minimum font size on desktop is 16px.** No exceptions for labels, captions, overlines, or helper text. Use weight, color, letter-spacing, or text-transform for hierarchy instead. Mobile overrides may go smaller.
- **No decorative shadows.** Don't add `box-shadow`, `drop-shadow`, or glow effects as a polish move. Use color, contrast, border treatments, or motion instead. Only add shadows if explicitly asked. Shadows already approved stay. Scoped exception: soft contact shading inside 3D assets (the Tactile Tiles process scenes and the 3D tools tiles) is part of their style.
- New component CSS goes in a page-level `<style>` block. Shared/reusable patterns go in `site.css`.
- Default to existing type and spacing classes before writing any new CSS rules.

## Copy rules

- **Never change user-written text** (sentences, punctuation, structure) without explicit permission. If a layout change requires touching copy, flag it first: "To do X I'd need to adjust this text — is that OK?"
- Use **Canadian spelling**: colour, behaviour, prioritise, analyse, centre.
- **No em dashes (—).** Rewrite the sentence.
- No semicolons. Use a comma or conjunction instead.
- No repetitive sentence structure across bullets.
- Keep it natural and human. No filler or over-explaining.

## Cross-page consistency

If a change applies to a shared element (navigation, a CSS class used across pages, a layout pattern), propagate it to all pages where it's relevant — don't leave sibling pages out of sync.

## Git and workflow

- **Never commit or push without being explicitly asked.** Just edit files and leave them in the working tree.
- **Never merge branches without explicit instruction.**
- Branch strategy:
  - `ai-page` — `ai-fun.html` only (new AI page, active work)
  - `fixes` — any fix or improvement to existing pages
  - Never mix work from both branches in a single commit.

## Permissions

Read and edit any portfolio file without asking. Confirm only two kinds of change: drastic changes to a page or the site architecture, and any change to user-written copy.

## AI x Design page (ai-design.html)

- **Shipping:** never merge `ai-page` into `main`. Release with `.claude/release-ai-design.sh` into the `ai-design-release` worktree (`../portfolio-release`), which copies only this page and its assets, plus the one-line `scrollbar-gutter: stable` fix in `css/site.css` (stops the nav shifting between short and long pages). That fix ships in the same update. Its nav item stays `hidden` on every page until Deron says the page is ready.

- **Widths:** the main content max width is 980px (`--nv-max`). The hero (`#overview`) is the exception: it's full screen (full width, `100svh`), and everything below it is capped at 980px. For comparison, case-study `.cs-body` is 1200px, its content column next to the TOC is 880px, and homepage featured work is 1120px.
- **Process scenes:** the "How I use AI in my work" scenes use the Tactile Tiles style (`Brand and Motion Design Agent/styles/tactile-tiles.md`). Status and handoff are in `Brand and Motion Design Agent/work/portfolio-process-scenes/STATUS.md`.
- **Reduced motion:** every looping video uses a poster of its finished state (e.g. the Kept promo on its end card). The `.js-loop-video` script only plays when motion is allowed and the video is in view.

## Preview and verification

- The `portfolio` preview server (`.claude/launch.json`, port 8080) serves `/tmp/portfolio-preview`, a copy of the repo. macOS privacy blocks it from reading `~/Documents`, so don't point it at the repo.
- After every edit, sync: `rsync -a --delete --exclude '.git' "/Users/deronli/Documents/Claude Code/Portfolio/" /tmp/portfolio-preview/`. Then load the page with a cache-busting query (`?fresh=<timestamp>`).
- Show work at http://localhost:8080/<page>. Don't open a new tab per revision (see `design-foundations/references/verification.md`).

## Things to never touch without an explicit ask

- User-written copy and content (see copy rules above)
- `index.html` structural changes
- Navigation across all pages (ripples everywhere — confirm first)
- Google Analytics tags and meta/SEO tags
- Lottie animation JSON files
