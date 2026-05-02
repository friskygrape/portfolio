(function () {
  const nav = document.querySelector('nav');
  if (!nav) return;

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
