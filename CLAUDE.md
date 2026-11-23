# Portfolio — CLAUDE.md

Personal design portfolio. Vanilla HTML/CSS/JS. No build tools, no framework, no bundler.

## File structure

```
css/site.css          — shared stylesheet, single source of truth for all tokens
styleguide.html       — living design reference, must stay in sync with site.css
index.html            — homepage
about.html
ai-design.html        — "AI x Design" page, live but not in the nav yet
discounts.html
onboarding.html
optik.html
support.html
lottie/               — Lottie JSON animation files
images/
```

On the `redesign` branch (not on `main` yet), the new style adds: `css/nav.css` + `js/site-nav.js` (the shared nav on every page), `css/case-study.css` + `js/case-study.js` (now used by `motion-design.html` and the redesign style guide; the four case studies were reverted to their live `main` versions on 2026-11-22 and then reskinned with `css/brand.css` + `css/case-study-brand.css` (loaded after `site.css`: redesign typeface and colours only, live layout and text styles kept). `css/brand.css` is the shared brand layer for any page still on `site.css` (Radio Canada, the redesign palette, old palette names mapped onto it). AI x Design loads it too, and on 2026-11-22 its `--nv-*` tokens were pointed at the brand tokens, its text classes took the redesign weights, leading and tracking, and its buttons became the redesign button plus the shared nav, and the redesigned case studies plus the colourful Support pilot are archived in `../Portfolio-archive/case-study-v3-pilot-2026-11-22/`), and `fonts/` (Radio Canada Big and Radio Canada). `js/ribbon.js` is the homepage's silk ribbon background as a reusable WebGL piece (`Ribbon.mount(canvas, {...})`), used behind About (2026-11-22). The homepage still runs its own copy of the shader in `index.html`. `js/tool-stickers.js` + `css/tool-stickers.css` are the shared tool row (flat logos that spin in as 3D stickers on scroll and lift on hover), used by AI x Design and Motion Design (2026-11-23). Each row points at its own baked set with `data-stickers` (`images/ai/tools/sticker/`, `images/motion/tool-stickers/`), built with `Brand and Motion Design Agent/work/ai-page-tools-tiles/sticker/run-set.sh` (`STICKER_IDS` picks the logos, in row order). Its TOC is the case-study one (diamond marker), shared as `js/toc.js` + `css/toc.css`. The four case studies still run their own inline copy of that script. The new tokens live in those files and inline in `index.html`, not in `site.css`, until they're merged into one shared file and the styleguide is updated.

**Redesign: build reusable styles (Deron, 2026-11-21).** A new or updated styleguide is coming for the redesign. It will list the colours and text styles in use and say how each is used, and the same styles will apply on every page (homepage Selected Work, About, the case studies, AI x Design). So while building:
- Use the colour tokens (`--ink`, `--body`, `--line`, `--accent`, `--accent-night`, `--night-body`...) and the type tokens (`--t-label` to `--t-display`). Don't add one-off hex values or sizes. If a new value is needed, add it as a named token.
- Reuse an existing text style before making a new one, and name any new one for its role so it can go in the styleguide.
- Text colours so far: `--ink` `#121212` for headings and card titles (the whole Selected Work title is ink at one weight, no bold metrics: Deron, 2026-11-22. The final numbers still count up), `--body` `#55554F` for labels and body text. Where else the softer grey goes is decided case by case.
- **Spacing must be reusable too (Deron, 2026-11-22).** About defines the spacing tokens, first: a base scale `--space-1` to `--space-8` (4, 8, 12, 16, 24, 32, 48, 64) and role tokens that rules use, `--gap-label` (title to meta, 12), `--gap-text` (title or meta to first paragraph, 16), `--gap-heading` (item title to its description, 8), `--gap-item` (between items, and before actions, 24), `--gap-group` (between groups in a section, 32), `--gap-section` (between sections, 64, 48 on phones). Screen sizes change the role tokens, not the rules. Use these for new spacing on other pages, move them into the shared token file with the colours and type, and list them in the new styleguide.

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
- **Always review copy with the `copywriter` skill** before it goes on a page (Deron, 2026-11-21). It must be professional and grammatically correct. The old `ux-writer` skill is gone, its rules now live in `copywriter`.
- Use **Canadian spelling**: colour, behaviour, prioritise, analyse, centre.
- **No em dashes (—).** Rewrite the sentence.
- No semicolons. Use a comma or conjunction instead.
- No repetitive sentence structure across bullets.
- Keep it natural and human. No filler or over-explaining.
- **Titles and headings use Title Case** (Deron said "camel case", 2026-11-18): capitalise every major word, keep short articles, conjunctions and prepositions lowercase unless first (a, an, the, and, but, or, in, on, of, to, for, with, at, by). Examples: "I Ship in Code", "I Prototype with AI", "Selected Work". Applies to page titles, section headings, card and case-study titles, and the homepage role line. Body copy stays sentence case.

## Cross-page consistency

If a change applies to a shared element (navigation, a CSS class used across pages, a layout pattern), propagate it to all pages where it's relevant — don't leave sibling pages out of sync.

**Always keep links current (Deron, 2026-11-22).** Whenever a page is added, renamed, replaced or removed, update the nav and every link to it across the site in the same change: nav links, homepage tiles, More Projects cards, footer links, "back" links and in-page references. Then check that no internal link points at a missing or superseded page. Build new versions in the real page where possible, not in a separate `-v2` file (Deron: "don't make a new page... just correct the existing one").

## Git and workflow

- **Never commit or push without being explicitly asked.** Just edit files and leave them in the working tree.
- **Never merge branches without explicit instruction.**
- **`main` is the live site.** Two hosts publish `main`, so merging to `main` and pushing is going live on both:
  - **https://deronli.me** (Netlify) is the real public site. Test this one.
  - **https://friskygrape.github.io/portfolio/** (GitHub Pages) is a mirror.
  - Netlify ignores upper and lower case in file names and GitHub Pages doesn't, so a case slip (like `pos_` for `POS_`) breaks only the mirror. File paths in HTML must match the real file names exactly.
- **Work from `main`.** Start every change on a short branch off an up-to-date `main` (`git checkout main && git pull`, then `git checkout -b <topic>`). Keep one topic per branch (e.g. `ai-design-process-titles`, `fix-about-spacing`). Merge it back into `main` when Deron approves, push, then delete the branch.
- `ai-page` is retired. It's kept on GitHub as an archive of the AI page history and still carries old changes to index, about, `js/script.js` and the styleguide. Never merge it.

## Permissions

Read and edit any portfolio file without asking. Confirm only two kinds of change: drastic changes to a page or the site architecture, and any change to user-written copy.

## AI x Design page (ai-design.html)

- **Live and in the nav:** the page is on `main` (since 2026-11-15) and its "AI x Design" nav link shows on all 7 pages (since 2026-11-16).
- **View it locally** at http://localhost:8080/ai-design.html.
- **Widths:** the main content max width is 980px (`--nv-max`). The hero (`#overview`) is the exception: it's full screen (full width, `100svh`), and everything below it is capped at 980px. For comparison, case-study `.cs-body` is 1200px, its content column next to the TOC is 880px, and homepage featured work is 1120px.
- **Process scenes:** the "My AI Workflow" scenes use the Tactile Tiles style (`Brand and Motion Design Agent/styles/tactile-tiles.md`). Status and handoff are in `Brand and Motion Design Agent/work/portfolio-process-scenes/STATUS.md`.
- **Reduced motion:** every looping video uses a poster of its finished state (e.g. the Kept promo on its end card). The `.js-loop-video` script only plays when motion is allowed and the video is in view.

## Preview and verification

- The `portfolio` preview server (`.claude/launch.json`, port 8080) serves `/tmp/portfolio-preview`, a copy of the repo. macOS privacy blocks it from reading `~/Documents`, so don't point it at the repo.
- After every edit, sync: `rsync -a --delete --exclude '.git' --exclude '_boards' --exclude '_qa' "/Users/deronli/Documents/Claude Code/Portfolio/" /tmp/portfolio-preview/`. Then load the page with a cache-busting query (`?fresh=<timestamp>`).
- **QA:** the `site-qa` skill tests the live site (https://deronli.me by default, or the local preview before a merge) in Chromium and Safari at every screen size and serves its report at http://localhost:8080/_qa/report.html. Run it before merging to `main`.
- Show work at http://localhost:8080/<page>. Don't open a new tab per revision (see `design-foundations/references/verification.md`).

## Case study videos

Videos on case studies autoplay, muted and looping, while they are in view (Deron, 2026-11-21: "the point of having videos is to have autoplay and autoloop to get people interested"). No click-to-play posters. Under reduced motion they show their finished-state poster and wait. The motion design page is the exception: its four films have sound and wait for the visitor to press play, as Deron asked for that page.

## Things to never touch without an explicit ask

- User-written copy and content (see copy rules above)
- `index.html` structural changes
- Navigation across all pages (ripples everywhere — confirm first)
- Google Analytics tags and meta/SEO tags
- Lottie animation JSON files
