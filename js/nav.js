(function () {
  const nav = document.querySelector('nav');
  if (!nav) return;

  // ── Hamburger menu ────────────────────────────────────
  const hamburger = nav.querySelector('.nav-hamburger');
  if (hamburger) {
    hamburger.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      hamburger.setAttribute('aria-expanded', open);
    });

    nav.querySelectorAll('.nav-links a').forEach(a => {
      a.addEventListener('click', () => {
        nav.classList.remove('is-open');
        hamburger.setAttribute('aria-expanded', 'false');
      });
    });

    document.addEventListener('click', e => {
      if (!nav.contains(e.target)) {
        nav.classList.remove('is-open');
        hamburger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // ── Auto-hide on scroll ───────────────────────────────
  let lastY = window.scrollY;
  let ticking = false;
  const TOP_THRESHOLD = 10;
  const DELTA_THRESHOLD = 6;

  function update() {
    const y = window.scrollY;
    const delta = y - lastY;

    if (y <= TOP_THRESHOLD) {
      nav.classList.remove('is-hidden');
    } else if (delta > DELTA_THRESHOLD) {
      nav.classList.remove('is-open');
      hamburger && hamburger.setAttribute('aria-expanded', 'false');
      nav.classList.add('is-hidden');
    } else if (delta < -DELTA_THRESHOLD) {
      nav.classList.remove('is-hidden');
    }

    lastY = y;
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });
})();
