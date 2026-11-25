/* CASE STUDY TEMPLATE v2: nav, side TOC (dash), section pill, carousel, variant toggle, looping videos.
   Pair with css/case-study-v2.css. */
/* TOC items over a dark band: light text (the pills' own night state is in js/nav-glass.js) */
(function () {
  const dark = [...document.querySelectorAll('.band--night, .more')];
  const over = y => dark.some(d => { const r = d.getBoundingClientRect(); return r.top <= y && r.bottom >= y; });
  const items = [...document.querySelectorAll('.toc-list a, .toc-link, .toc-back')];
  const check = () => {
    items.forEach(a => { const r = a.getBoundingClientRect(); a.classList.toggle('on-night', r.height > 0 && over(r.top + r.height / 2)); });
  };
  addEventListener('scroll', check, { passive: true }); addEventListener('resize', check); check();
})();

/* TOC: shows after the hero, underlines the current section, phone list opens on tap */
(function () {
  const toc = document.querySelector('.toc');
  const hero = document.getElementById('summary');
  const links = [...toc.querySelectorAll('.toc-list a')];
  const secs = links.map(a => document.querySelector(a.getAttribute('href')));
  const toggle = toc.querySelector('.toc-toggle');
  const current = toc.querySelector('[data-toc-current]');
  const update = () => {
    const line = 180;   /* just under the nav (and the pill, when it's used) */
    let i = -1; secs.forEach((s, k) => { if (s.getBoundingClientRect().top <= line) i = k; });   /* none marked while you're in the hero */
    links.forEach((a, k) => k === i ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current'));
    current.innerHTML = links[Math.max(i, 0)].innerHTML;
  };
  const close = () => { toc.classList.remove('is-open'); toggle.setAttribute('aria-expanded', 'false'); };
  toggle.addEventListener('click', () => { const o = !toc.classList.contains('is-open'); toc.classList.toggle('is-open', o); toggle.setAttribute('aria-expanded', String(o)); });
  links.forEach(a => a.addEventListener('click', close));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  document.addEventListener('click', e => { if (!toc.contains(e.target)) close(); });
  addEventListener('scroll', update, { passive: true }); addEventListener('resize', update); update();
})();

/* Side TOC: marks the section you're in (its dash grows into a line and pushes the text inward). Clicks use the browser's smooth scroll,
   which turns off under reduced motion. */
(function () {
  const links = [...document.querySelectorAll('.toc-link')];
  if (!links.length) return;
  const secs = links.map(a => document.getElementById(a.getAttribute('href').slice(1)));
  const update = () => {
    const line = 180;   /* just under the nav */
    let i = 0; secs.forEach((s, k) => { if (s && s.getBoundingClientRect().top <= line) i = k; });
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) i = secs.length - 1;
    links.forEach((a, k) => { a.classList.toggle('is-on', k === i); if (k === i) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
  };
  addEventListener('scroll', update, { passive: true }); addEventListener('resize', update); update();
})();


/* The nav's behaviour lives in js/nav-glass.js. */


/* The page width without the scrollbar, so the column and variant B's bleed line up exactly. */
(function () {
  const set = () => document.documentElement.style.setProperty('--vw', document.body.getBoundingClientRect().width + 'px');
  set(); addEventListener('resize', set);
})();

/* Variant toggle: A (contained) or B (carousel extends). Kept in the URL (?v=b). */
(function () {
  const root = document.documentElement;
  const btns = document.querySelectorAll('.variant button');
  function set(v, push) {
    root.classList.toggle('is-b', v === 'b');
    btns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === v)));
    if (push) { const u = new URL(location.href); u.searchParams.set('v', v); history.replaceState(null, '', u); }
    document.querySelectorAll('[data-carousel]').forEach(c => c._sync && c._sync(true));
  }
  btns.forEach(b => b.addEventListener('click', () => set(b.dataset.v, true)));
  set(new URLSearchParams(location.search).get('v') === 'b' ? 'b' : 'a', false);
})();

/* Carousel: scroll-snap track, arrows and a count. */
document.querySelectorAll('[data-carousel]').forEach(c => {
  const track = c.querySelector('.carousel-track');
  const slides = [...track.children];
  const prev = c.querySelector('[data-prev]'), next = c.querySelector('[data-next]');
  const cur = c.querySelector('[data-cur]');
  c.querySelector('[data-total]').textContent = slides.length;
  const index = () => {
    const x = track.scrollLeft; let best = 0, d = Infinity;
    slides.forEach((s, i) => { const dd = Math.abs(s.offsetLeft - track.offsetLeft - x); if (dd < d) { d = dd; best = i; } });
    return best;
  };
  const update = () => { const i = index(); cur.textContent = i + 1; prev.disabled = i === 0; next.disabled = i === slides.length - 1; };
  const go = i => { const s = slides[Math.max(0, Math.min(slides.length - 1, i))]; track.scrollTo({ left: s.offsetLeft - track.offsetLeft }); };
  prev.addEventListener('click', () => go(index() - 1));
  next.addEventListener('click', () => go(index() + 1));
  track.addEventListener('keydown', e => { if (e.key === 'ArrowRight') { e.preventDefault(); go(index() + 1); } if (e.key === 'ArrowLeft') { e.preventDefault(); go(index() - 1); } });
  let t; track.addEventListener('scroll', () => { clearTimeout(t); t = setTimeout(update, 60); }, { passive: true });
  c._sync = reset => { if (reset) track.scrollTo({ left: 0, behavior: 'instant' }); update(); };
  update();
});

/* Videos autoplay, muted and looping, only while in view (the site's rule). */
(function () {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const io = new IntersectionObserver(es => es.forEach(e => { e.isIntersecting ? e.target.play().catch(() => {}) : e.target.pause(); }), { threshold: 0.25 });
  document.querySelectorAll('.js-loop').forEach(v => io.observe(v));
})();
