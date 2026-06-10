# Portfolio — CLAUDE.md

Personal design portfolio. Vanilla HTML/CSS/JS. No build tools, no framework, no bundler.

## File structure

```
css/site.css          — shared stylesheet, single source of truth for all tokens
styleguide.html       — living design reference, must stay in sync with site.css
index.html            — homepage
about.html
ai-fun.html           — AI in my design process page (active development)
discounts.html
onboarding.html
optik.html
support.html
lottie/               — Lottie JSON animation files
images/
```

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

**Token source of truth**: `css/site.css` and `styleguide.html` must always match. When tokens change in either file, update the other in the same session.

## CSS rules

- **Never hardcode** `font-size`, `font-family`, or `font-weight` — use type classes or CSS vars.
- **Minimum font size on desktop is 16px.** No exceptions for labels, captions, overlines, or helper text. Use weight, color, letter-spacing, or text-transform for hierarchy instead.
- **No decorative shadows.** Don't add `box-shadow`, `drop-shadow`, or glow effects as a polish move. Use color, contrast, border treatments, or motion instead. Only add shadows if explicitly asked.
- New component CSS goes in a page-level `<style>` block. Shared/reusable patterns go in `site.css`.
- Default to existing type and spacing classes before writing any new CSS rules.

## Copy rules

- **Never change user-written text** (sentences, punctuation, structure) without explicit permission. If a layout change requires touching copy, flag it first: "To do X I'd need to adjust this text — is that OK?"
- Use **Canadian spelling**: colour, behaviour, prioritise, analyse, centre.
- **No em dashes (—).** Rewrite the sentence.
- No semicolons. Use a comma or conjunction instead.
- No repetitive sentence structure across bullets.

## Cross-page consistency

If a change applies to a shared element (navigation, a CSS class used across pages, a layout pattern), propagate it to all pages where it's relevant — don't leave sibling pages out of sync.

## Git and workflow

- **Never commit or push without being explicitly asked.** Just edit files and leave them in the working tree.
- **Never merge branches without explicit instruction.**
- Branch strategy:
  - `ai-page` — `ai-fun.html` only (new AI page, active work)
  - `fixes` — any fix or improvement to existing pages
  - Never mix work from both branches in a single commit.

## Things to never touch without an explicit ask

- User-written copy and content (see copy rules above)
- `index.html` structural changes
- Navigation across all pages (ripples everywhere — confirm first)
- Google Analytics tags and meta/SEO tags
- Lottie animation JSON files
