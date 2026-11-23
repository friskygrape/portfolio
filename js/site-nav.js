/* Site nav (redesign): transparent at the top, ground and a shadow once scrolled. Slides away on the way down, returns on the way up.
   If the nav has a .nav-progress bar, it fills with reading progress up to [data-read-end]
   (the case studies' More Projects block), or to the end of the page. */
(() => {
  const nav = document.querySelector('nav.nav');
  if (!nav) return;
  const prog = nav.querySelector('.nav-progress');
  const end = document.querySelector('[data-read-end]');
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
    if (prog) {
      const stop = end ? end.offsetTop - innerHeight : document.documentElement.scrollHeight - innerHeight;
      prog.style.setProperty('--read', Math.max(0, Math.min(1, scrollY / Math.max(1, stop))).toFixed(4));
    }
  };
  /* ── phone menu (768px and below): the links fold into a hamburger that opens a full-screen sheet ── */
  const links = nav.querySelector('.nav-links');
  const phone = matchMedia('(max-width: 768px)');
  let open = false;
  if (links) {
    if (!links.id) links.id = 'nav-menu';
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
