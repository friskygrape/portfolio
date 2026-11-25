/* SITE NAV: GLASS PILL behaviour (shared by every page; styles in css/nav-glass.css).
   Based on js/site-nav.js: .is-scrolled after 8px, slides away while you scroll down (past 80px, ignoring moves
   under 6px) and returns on the way up, and on phones a menu button that opens a full-screen sheet
   (inert while closed, Escape closes it). Plus the night state over dark backgrounds, below. */
(() => {
  const nav = document.querySelector('nav.pill-nav');
  if (!nav) return;
  let queued = false, lastY = scrollY;
  const update = () => {
    queued = false;
    nav.classList.toggle('is-scrolled', scrollY > 8);
    /* away on the way down (once past the top), back on the way up. Small moves are ignored. */
    const dy = scrollY - lastY;
    if (open) return;   /* the open phone menu holds the bar in place */
    if (scrollY < 80) nav.classList.remove('is-away');
    else if (dy > 6) nav.classList.add('is-away');
    else if (dy < -6) nav.classList.remove('is-away');
    if (Math.abs(dy) > 6 || scrollY < 80) lastY = scrollY;
  };
  /* ── phone menu (768px and below): the links fold into a hamburger that opens a full-screen sheet ── */
  const links = nav.querySelector('.pill-links');
  const phone = matchMedia('(max-width: 768px)');
  let open = false;
  if (links) {
    if (!links.id) links.id = 'site-menu';
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'nav-toggle';
    btn.setAttribute('aria-controls', links.id); btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-label', 'Menu');
    btn.innerHTML = '<i></i><i></i>';
    links.after(btn);
    nav.classList.add('has-menu');
    const set = (on) => {
      open = on && phone.matches;
      nav.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
      document.documentElement.style.overflow = open ? 'hidden' : '';
      if (open) nav.classList.remove('is-away');
    };
    btn.addEventListener('click', () => set(!open));
    links.addEventListener('click', (e) => { if (e.target.closest('a')) set(false); });
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) { set(false); btn.focus(); } });
    phone.addEventListener('change', () => set(false));
    /* hidden from screen readers and the tab order while it's closed on a phone */
    const sync = () => { if (phone.matches && !open) links.setAttribute('inert', ''); else links.removeAttribute('inert'); };
    new MutationObserver(sync).observe(nav, { attributes: true, attributeFilter: ['class'] });
    phone.addEventListener('change', sync); sync();
  }

  addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener('resize', update);
  update();
})();

/* Night state: every .pill (the nav, and the case studies' section pill) turns to dark glass with white text
   when the page under its centre is dark. Generic: it reads the element under the pill, honours
   [data-nav-dark] / [data-nav-light] on any ancestor (for photos and videos), and otherwise walks up to the
   first solid background colour and checks its luminance. Works on any page, with or without bands. */
(() => {
  const pills = [...document.querySelectorAll('.pill')];
  if (!pills.length) return;
  const lum = (c) => { const m = c.match(/[\d.]+/g); if (!m) return null; const [r, g, b, a = 1] = m.map(Number); if (a < 0.5) return null;
    const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const isDarkAt = (x, y) => {
    const el = document.elementsFromPoint(x, y).find((e) => !e.closest('.pill, .variant'));
    if (!el) return false;
    const forced = el.closest('[data-nav-dark], [data-nav-light]');
    if (forced) return forced.hasAttribute('data-nav-dark');
    for (let e = el; e && e !== document.documentElement; e = e.parentElement) {
      const L = lum(getComputedStyle(e).backgroundColor);
      if (L !== null) return L < 0.18;
    }
    const L = lum(getComputedStyle(document.body).backgroundColor);
    return L !== null && L < 0.18;
  };
  let queued = false;
  const check = () => {
    queued = false;
    pills.forEach((p) => {
      const r = p.getBoundingClientRect();
      if (r.width === 0) return;
      /* the pill's resting spot (offsetTop ignores the slide-away transform), so it's right the moment it returns */
      p.classList.toggle('is-night', isDarkAt(r.left + r.width / 2, p.offsetTop + p.offsetHeight / 2));
    });
  };
  const q = () => { if (!queued) { queued = true; requestAnimationFrame(check); } };
  addEventListener('scroll', q, { passive: true }); addEventListener('resize', q); addEventListener('load', q); check();
})();
