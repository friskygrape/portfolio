/* ════════ CASE-STUDY TABLE OF CONTENTS (shared) ════════
   The TOC from the four case studies (support.html and its siblings run the same code inline):
   a back link, the section links, and a five-layer diamond that trails to the active section.
   Clicking a link scrolls there with the diamond in step. Moved into its own file for Motion Design
   on 2026-11-23. Markup: aside.cs-toc > a.toc-back + .toc-track > .toc-indicator (5 layers) + ul > a.toc-link.
   Styles: css/toc.css. */
(function () {
  const links = document.querySelectorAll('.toc-link');
  if (!links.length) return;
  // the sections are whatever the links point at, so any page can use it
  const targets = [...links].map(a => document.getElementById(a.getAttribute('href').slice(1))).filter(Boolean);

  const indicator = document.querySelector('.toc-indicator');
  const layers = [...document.querySelectorAll('.toc-indicator-layer')];
  let currentIndicatorId = null;
  let lastClickedId = null;
  let lastClickedAt = 0;
  const PIN_DURATION = 1200;

  const INDICATOR_SIZE = 12;
  const REST_OFFSETS  = [0, 0, 0, 0, 0];
  const LERP_RATE       = 0.18;
  const SCROLL_DURATION = 500;
  const MAX_EXTRA_SEP = 5;
  const layerState = layers.map(() => ({ y: 0 }));
  let targetY = 0;
  let maxExtraSep = 0;
  let animating = false;
  let firstPlacement = true;
  let syncActive = false;

  const trackEl = document.querySelector('.toc-track');
  let inactiveLinkH = 0, activeLinkH = 0, baseLinkTop = 0;
  function measureLinkHeights() {
    const ref = links[0];
    const clone = ref.cloneNode(true);
    clone.classList.remove('active');
    clone.style.transition = 'none';
    clone.style.position = 'absolute';
    clone.style.visibility = 'hidden';
    clone.style.pointerEvents = 'none';
    ref.parentNode.appendChild(clone);
    inactiveLinkH = clone.getBoundingClientRect().height;
    clone.classList.add('active');
    activeLinkH = clone.getBoundingClientRect().height;
    clone.remove();
    baseLinkTop = ref.getBoundingClientRect().top - trackEl.getBoundingClientRect().top;
  }
  measureLinkHeights();

  function targetForLink(a) {
    const idx = [...links].indexOf(a);
    return baseLinkTop + idx * inactiveLinkH + (activeLinkH - INDICATOR_SIZE) / 2;
  }

  function layerTargetFor(i) {
    if (i === 0) return targetY + REST_OFFSETS[0];
    return layerState[i - 1].y + (REST_OFFSETS[i] - REST_OFFSETS[i - 1]);
  }

  function tick() {
    let stillMoving = false;
    for (let i = 0; i < layerState.length; i++) {
      const s = layerState[i];

      if (i === 0 && syncActive) {
        layers[0].style.setProperty('--toc-layer-y', `${s.y}px`);
        stillMoving = true;
        continue;
      }

      const lt = layerTargetFor(i);
      const dy = lt - s.y;
      s.y += dy * LERP_RATE;

      if (i > 0) {
        const restGap = REST_OFFSETS[i] - REST_OFFSETS[i - 1];
        const maxAbsGap = Math.abs(restGap) + maxExtraSep;
        const gap = s.y - layerState[i - 1].y;
        if (Math.abs(gap) > maxAbsGap) {
          s.y = layerState[i - 1].y + Math.sign(gap) * maxAbsGap;
        }
      }

      layers[i].style.setProperty('--toc-layer-y', `${s.y}px`);
      if (Math.abs(dy) > 0.1) stillMoving = true;
    }
    if (stillMoving) {
      requestAnimationFrame(tick);
    } else {
      layerState[0].y = targetY + REST_OFFSETS[0];
      for (let i = 1; i < layerState.length; i++) {
        layerState[i].y = layerState[i - 1].y + (REST_OFFSETS[i] - REST_OFFSETS[i - 1]);
      }
      for (let i = 0; i < layerState.length; i++) {
        layers[i].style.setProperty('--toc-layer-y', `${layerState[i].y}px`);
      }
      animating = false;
    }
  }

  function moveIndicator(id) {
    if (lastClickedId && id !== lastClickedId) return;
    if (id === currentIndicatorId) return;
    currentIndicatorId = id;
    const active = document.querySelector(`.toc-link[href="#${id}"]`);
    if (!active) return;
    const newTarget = targetForLink(active);
    if (firstPlacement) {
      targetY = newTarget;
      layerState[0].y = newTarget + REST_OFFSETS[0];
      for (let i = 1; i < layerState.length; i++) {
        layerState[i].y = layerState[i - 1].y + (REST_OFFSETS[i] - REST_OFFSETS[i - 1]);
      }
      for (let i = 0; i < layerState.length; i++) {
        layers[i].style.setProperty('--toc-layer-y', `${layerState[i].y}px`);
      }
      firstPlacement = false;
      layers.forEach(l => l.style.animationPlayState = 'running');
    } else {
      const D = Math.abs(newTarget - layerState[0].y);
      maxExtraSep = Math.min(MAX_EXTRA_SEP, Math.max(0.3, D / 22));
      targetY = newTarget;
      if (!animating) {
        animating = true;
        requestAnimationFrame(tick);
      }
    }
  }

  function setActive(id) {
    links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + id));
    moveIndicator(id);
  }

  const tocEl = document.querySelector('.cs-toc');
  function findActive() {
    const cut = tocEl ? tocEl.getBoundingClientRect().bottom : 88;
    let id = targets[0]?.id;
    for (const t of targets) {
      if (t.getBoundingClientRect().top <= cut) id = t.id;
    }

    if (lastClickedId) {
      if (Date.now() - lastClickedAt < PIN_DURATION) {
        return lastClickedId;
      }
      lastClickedId = null;
    }

    if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4) {
      return targets[targets.length - 1].id;
    }

    return id;
  }

  const io = new IntersectionObserver(
    () => setActive(findActive()),
    { rootMargin: '-88px 0px 0px 0px', threshold: Array.from({ length: 21 }, (_, i) => i / 20) }
  );
  targets.forEach(t => io.observe(t));

  const SCROLL_OFFSET = 80;

  function syncScrollAndIndicator(yScrollTarget, yIndicatorTarget, duration) {
    const startScroll = window.scrollY;
    const startLead = layerState[0].y;
    const dScroll = yScrollTarget - startScroll;
    const dLead = yIndicatorTarget - startLead;
    const startTime = performance.now();
    syncActive = true;

    function step(now) {
      const t = Math.min((now - startTime) / duration, 1);
      const eased = t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
      window.scrollTo({ top: startScroll + dScroll * eased, behavior: 'instant' });
      layerState[0].y = startLead + dLead * eased;
      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        layerState[0].y = yIndicatorTarget;
        syncActive = false;
      }
    }
    requestAnimationFrame(step);

    if (!animating) {
      animating = true;
      requestAnimationFrame(tick);
    }
  }

  links.forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      const id = a.getAttribute('href').slice(1);
      const sec = document.getElementById(id);
      if (!sec) return;

      lastClickedId = id;
      lastClickedAt = Date.now();
      currentIndicatorId = id;

      const yIndicator = targetForLink(a);
      let _el = sec, _top = 0;
      while (_el) { _top += _el.offsetTop; _el = _el.offsetParent; }
      const yScroll = _top - SCROLL_OFFSET;

      links.forEach(l => l.classList.toggle('active', l === a));

      targetY = yIndicator;
      const D = Math.abs(yIndicator - layerState[0].y);
      maxExtraSep = Math.min(MAX_EXTRA_SEP, Math.max(0.3, D / 22));

      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduced) {
        window.scrollTo({ top: yScroll, behavior: 'instant' });
        for (let i = 0; i < layerState.length; i++) {
          layerState[i].y = yIndicator;
          layers[i].style.transform = `translateY(${yIndicator}px) rotate(45deg)`;
        }
        return;
      }

      syncScrollAndIndicator(yScroll, yIndicator, SCROLL_DURATION);
    });
  });

  setActive(findActive());
})();
