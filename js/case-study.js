/* Case studies v2: nav, table of contents, reveals, counts, videos. No libraries. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* the nav and its reading progress live in js/site-nav.js */
  const end = $('.more') || $('.foot');

  /* ── Table of contents: shows once the hero has gone, hides at the next/previous block ── */
  const toc = $('.toc');
  if (toc) {
    const links = $$('a', toc);
    const secs = links.map((a) => document.getElementById(a.hash.slice(1))).filter(Boolean);
    const hero = $('.cs-hero');
    const place = () => {
      const show = hero.getBoundingClientRect().bottom < innerHeight * 0.5 && (!end || end.getBoundingClientRect().top > innerHeight * 0.6);
      toc.classList.toggle('is-on', show);
      let on = secs[0];
      secs.forEach((s) => { if (s.getBoundingClientRect().top < innerHeight * 0.4) on = s; });
      links.forEach((a) => a.classList.toggle('is-on', a.hash === '#' + on.id));
    };
    let tq = false;
    addEventListener('scroll', () => { if (!tq) { tq = true; requestAnimationFrame(() => { tq = false; place(); }); } }, { passive: true });
    place();
  }

  /* ── Numbers that count to their value (homepage easing: ease-out quart) ── */
  const fmt = (v, dec) => v.toLocaleString('en-CA', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  const count = (el, delay, D = 1200) => {
    const from = +(el.dataset.from || 0), to = +el.dataset.to, dec = +(el.dataset.dec || 0);
    const pre = el.dataset.prefix || '', suf = el.dataset.suffix || '';
    const final = el.dataset.final || (el.dataset.final = el.textContent);
    /* homepage round 18: the box is always as wide as the final value (laid out invisibly underneath),
       so nothing beside or after the number moves while it counts */
    const f = document.createElement('span'); f.className = 'num-f'; f.textContent = final; f.setAttribute('aria-hidden', 'true');
    const out = document.createElement('span'); out.className = 'num-c';
    el.textContent = ''; el.classList.add('is-counting'); el.append(f, out);
    out.textContent = pre + fmt(from, dec) + suf;
    setTimeout(() => {
      const t0 = performance.now();
      const step = (now) => {
        const p = Math.min(1, (now - t0) / D);
        out.textContent = p < 1 ? pre + fmt(from + (to - from) * (1 - Math.pow(1 - p, 4)), dec) + suf : final;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, delay);
  };

  /* ── Reveals. Elements that arrive together are one wave, 70 ms apart, top to bottom. ── */
  if (!reduce) {
    const io = new IntersectionObserver((entries) => {
      const batch = entries.filter((e) => e.isIntersecting).map((e) => e.target)
        .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
      batch.forEach((el, i) => {
        io.unobserve(el);
        if (!el.style.getPropertyValue('--d')) el.style.setProperty('--d', Math.min(i, 5) * 70 + 'ms');
        const go = () => {
          el.classList.add('in');
          const d = parseFloat(el.style.getPropertyValue('--d')) || 0;
          $$('.num', el).forEach((n, k) => count(n, d + 380 + k * 120, 1200));
        };
        const img = $('img', el);
        if (img && !img.complete) (img.decode ? img.decode() : Promise.resolve()).then(go, go); else go();
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    /* the hero builds on load in two overlapping waves: words, then the work */
    const heroBits = $$('.cs-hero .rv-t, .board-hero .rv-t');
    const heroFig = $('.cs-hero .rv');
    heroBits.forEach((el, i) => el.style.setProperty('--d', i * 70 + 'ms'));
    if (heroFig) heroFig.style.setProperty('--d', '260ms');
    $$('.rv, .rv-t, .grow').forEach((el) => io.observe(el));
  }

  /* ── Before / after: drag, click or arrow keys move the handle. When it first arrives,
     the handle sweeps from the Before side to the middle so the change is seen once. ── */
  $$('.ba').forEach((ba) => {
    const media = $('.media', ba), range = $('.ba-range', ba);
    const set = (v) => media.style.setProperty('--pos', v + '%');
    let touched = false;
    range.addEventListener('input', () => { touched = true; set(range.value); });
    set(range.value);
    if (reduce) return;
    set(88);
    const watch = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      watch.disconnect();
      setTimeout(() => {
        const t0 = performance.now(), D = 1300, from = 88, to = +range.value;
        const ease = (q) => (q < 0.5 ? 4 * q * q * q : 1 - Math.pow(-2 * q + 2, 3) / 2);
        const step = (now) => { if (touched) return; const q = Math.min(1, (now - t0) / D); set((from + (to - from) * ease(q)).toFixed(2)); if (q < 1) requestAnimationFrame(step); };
        requestAnimationFrame(step);
      }, 1000);
    }, { threshold: 0.4 });
    watch.observe(ba);
  });

  /* ── Videos: play only while in view, never under reduced motion. One pause button each. ── */
  $$('video[data-src]').forEach((v) => {
    const btn = v.parentElement.parentElement.querySelector('.vbtn');
    let userPaused = false, loaded = false;
    const load = () => { if (!loaded) { loaded = true; v.src = v.dataset.src; } };
    if (reduce) {
      if (v.dataset.posterEnd) v.poster = v.dataset.posterEnd;   /* reduced motion sees the finished state */
      if (btn) { btn.setAttribute('aria-pressed', 'true'); btn.setAttribute('aria-label', 'Play video'); }
    }
    if (btn) btn.addEventListener('click', () => {
      const paused = btn.getAttribute('aria-pressed') === 'true';
      if (paused) { load(); v.play().catch(() => {}); userPaused = false; btn.setAttribute('aria-pressed', 'false'); btn.setAttribute('aria-label', 'Pause video'); }
      else { v.pause(); userPaused = true; btn.setAttribute('aria-pressed', 'true'); btn.setAttribute('aria-label', 'Play video'); }
    });
    if (reduce) return;
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { load(); if (!userPaused) v.play().catch(() => {}); }
      else v.pause();
    }, { threshold: 0.35 }).observe(v);
  });

  /* ── Full screen: an image opens large in a dialog on click, a looping video gets an expand button
        that takes it full screen with the browser's own control bar ── */
  const lb = document.createElement('dialog');
  lb.className = 'lb'; lb.setAttribute('aria-label', 'Image, full size');
  lb.innerHTML = '<button type="button" class="lb-x label" aria-label="Close">Close</button><img alt="" />';
  document.body.appendChild(lb);
  const lbImg = lb.querySelector('img');
  let opener = null;
  lb.addEventListener('click', () => { if (lb.open) lb.close(); });   /* a click anywhere closes it, and so does Escape */
  lb.addEventListener('close', () => { if (opener) opener.focus(); });
  if (lb.showModal) $$('.fig .media img').forEach((img) => {
    if (img.closest('.ba, a')) return;                        /* not the before/after slider, not linked tiles */
    const m = img.closest('.media');
    m.classList.add('is-zoom'); m.tabIndex = 0; m.setAttribute('role', 'button');
    m.setAttribute('aria-label', 'View full size' + (img.alt ? ': ' + img.alt : ''));
    const open = () => { opener = m; lbImg.src = img.currentSrc || img.src; lbImg.alt = img.alt; lb.showModal(); };
    m.addEventListener('click', open);
    m.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  });
  $$('.fig .media video').forEach((v) => {
    if (v.controls) return;                                   /* a video that already shows controls has its own full-screen button */
    const m = v.closest('.media');
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'vbtn vfs'; b.setAttribute('aria-label', 'Watch full screen');
    b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>';
    m.appendChild(b);
    b.addEventListener('click', () => {
      if (v.dataset.src && !v.src) v.src = v.dataset.src;
      v.controls = true;
      const go = v.requestFullscreen || v.webkitRequestFullscreen;
      if (go) { const r = go.call(v); if (r && r.catch) r.catch(() => { v.controls = false; }); }
      else if (v.webkitEnterFullscreen) v.webkitEnterFullscreen();     /* iPhone */
    });
    const back = () => { if (document.fullscreenElement !== v && document.webkitFullscreenElement !== v) v.controls = false; };
    document.addEventListener('fullscreenchange', back); document.addEventListener('webkitfullscreenchange', back);
    v.addEventListener('webkitendfullscreen', () => { v.controls = false; });
  });
})();
