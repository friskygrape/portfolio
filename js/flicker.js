/* ── Flicker-in text ───────────────────────────────────────
   Shared by the homepage and the case studies.

   Walks text nodes rather than clearing innerHTML, so inline markup inside the
   element survives — the homepage bio carries four .hl spans with the drawn
   underline, and flattening the element would delete them.

   Exposed on window so js/script.js can drive the homepage bio and project
   titles with its own timings. */
(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  window.flickerIn = function (el, baseDelay = 0, step = 0.014) {
    if (!el || reduceMotion) return;

    /* Already split into characters — replay in place rather than rebuilding.
       Removing animation-name for a frame, with a forced reflow between, is
       what makes the browser treat it as a new animation. */
    if (el.dataset.flickered) {
      el.classList.add('flicker-reset');
      void el.offsetWidth;
      el.classList.remove('flicker-reset');
      return;
    }

    el.dataset.flickered = '1';
    el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());

    const texts = [];
    (function collect(node) {
      for (const child of node.childNodes) {
        if (child.nodeType === Node.TEXT_NODE) texts.push(child);
        else if (child.nodeType === Node.ELEMENT_NODE) collect(child);
      }
    })(el);

    let ci = 0;
    for (const tn of texts) {
      const frag = document.createDocumentFragment();
      for (const part of tn.textContent.split(/(\s+)/)) {
        if (!part) continue;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); continue; }
        const word = document.createElement('span');
        word.className = 'flicker-word';
        word.setAttribute('aria-hidden', 'true');
        for (const ch of part) {
          const s = document.createElement('span');
          s.className = 'flicker-char';
          s.textContent = ch;
          s.style.setProperty('--d', (baseDelay + ci * step + Math.random() * 0.14).toFixed(3) + 's');
          word.appendChild(s);
          ci++;
        }
        frag.appendChild(word);
      }
      tn.replaceWith(frag);
    }
  };

  if (reduceMotion) return;

  /* Case studies only — these selectors match nothing on the homepage, whose
     headline runs its own splash choreography and must not be touched. */

  // Hero title only. It reveals eagerly on load (cs-hero-eager), so flicker it
  // there. Section h2s are deliberately left to their own fade-up.
  document.querySelectorAll('.cs-hero > h1').forEach(el => window.flickerIn(el, 0.25));
})();
