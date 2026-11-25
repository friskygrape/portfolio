/* CASE-STUDY TOC (hotfix, 2026-11-25): marks the section you're in and scrolls to a section on click.
   Shared by support, discounts, optik, onboarding and motion-design. Styles: css/cs-hotfix.css.
   Replaces the diamond indicator (each case study's inline script, and js/toc.js on Motion Design). */
(function () {
  const links = [...document.querySelectorAll('.cs-toc .toc-link')];
  if (!links.length) return;
  const secs = links.map(a => document.getElementById(a.getAttribute('href').slice(1)));
  const OFFSET = 80;            /* where a section lands under the nav, as before */
  const LINE = OFFSET + 80;     /* a section counts as current once its top passes this line */
  let pinUntil = 0;             /* after a click, hold the clicked item while the page scrolls there */
  const setOn = i => links.forEach((a, k) => {
    a.classList.toggle('is-on', k === i);
    if (k === i) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
  });
  const update = () => {
    if (Date.now() < pinUntil) return;
    let i = 0;
    secs.forEach((s, k) => { if (s && s.getBoundingClientRect().top <= LINE) i = k; });
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) i = secs.length - 1;
    setOn(i);
  };
  links.forEach((a, k) => a.addEventListener('click', e => {
    const s = secs[k];
    if (!s) return;
    e.preventDefault();
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    scrollTo({ top: s.getBoundingClientRect().top + scrollY - OFFSET, behavior: reduce ? 'auto' : 'smooth' });
    setOn(k); pinUntil = Date.now() + 1500;
    history.replaceState(null, '', a.getAttribute('href'));
  }));
  addEventListener('scrollend', () => { pinUntil = 0; update(); });
  addEventListener('scroll', update, { passive: true });
  addEventListener('resize', update);
  update();
})();
