/* Case-study videos: load late, play only in view (2026-11-26).
   Each <video class="lazy-video" data-src="…"> ships with a poster and no src, so nothing downloads on page load.
   - About a screen and a half before the reader reaches it, the video gets its src and starts loading.
   - It plays while at least a quarter of it is on screen and pauses once it leaves, so off-screen videos don't keep streaming.
   - With reduced motion it loads but waits for the play button. With Data Saver on it stays a poster until the reader presses play. */
(function () {
  const vids = [...document.querySelectorAll('video.lazy-video[data-src]')];
  if (!vids.length) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saveData = navigator.connection && navigator.connection.saveData;

  const load = v => {
    if (!v.dataset.src) return;
    v.src = v.dataset.src;
    v.removeAttribute('data-src');
    v.preload = 'auto';
  };

  /* without IntersectionObserver, fall back to the old behaviour */
  if (!('IntersectionObserver' in window)) {
    vids.forEach(v => { load(v); if (!reduce) { v.autoplay = true; v.play().catch(() => {}); } });
    return;
  }

  /* someone pressing play always works, even before the video was near. Giving it a src cancels that play, so start it again. */
  vids.forEach(v => v.addEventListener('play', () => { if (v.dataset.src) { load(v); v.play().catch(() => {}); } }));
  if (saveData) return;

  const near = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { load(e.target); near.unobserve(e.target); }
  }), { rootMargin: '150% 0px' });

  const userPaused = new WeakSet();
  const seen = new IntersectionObserver(es => es.forEach(e => {
    const v = e.target;
    /* load first: on a refresh, Chrome restores the scroll and can report "in view" before "near" (2026-11-26 bug) */
    if (e.isIntersecting) { if (!reduce && !userPaused.has(v)) { load(v); v.play().catch(() => {}); } }
    else if (!v.paused) { v.dataset.autoPause = '1'; v.pause(); }
  }), { threshold: 0.25 });

  vids.forEach(v => {
    /* respect a reader who paused it with the controls: don't restart it on the next scroll */
    v.addEventListener('pause', () => { if (v.dataset.autoPause) delete v.dataset.autoPause; else if (!v.ended) userPaused.add(v); });
    v.addEventListener('play', () => userPaused.delete(v));
    near.observe(v);
    seen.observe(v);
  });
})();
