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
    if (scrollY < 80) nav.classList.remove('is-away');
    else if (dy > 6) nav.classList.add('is-away');
    else if (dy < -6) nav.classList.remove('is-away');
    if (Math.abs(dy) > 6 || scrollY < 80) lastY = scrollY;
    if (prog) {
      const stop = end ? end.offsetTop - innerHeight : document.documentElement.scrollHeight - innerHeight;
      prog.style.setProperty('--read', Math.max(0, Math.min(1, scrollY / Math.max(1, stop))).toFixed(4));
    }
  };
  addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener('resize', update);
  update();
})();
