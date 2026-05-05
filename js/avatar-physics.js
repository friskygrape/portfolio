/* ── Hero avatar topple physics ─────────────────────────── */
(function () {
  const avatar = document.getElementById('hero-avatar');
  const heroH1 = document.getElementById('hero-h1');
  if (!avatar || !heroH1) return;

  /* Must match --layer-offset values in CSS */
  const HOME = [0, 16, 32, 48];

  const GRAVITY        = 0.55;
  const DAMPING        = 0.88;
  const ANG_DAMPING    = 0.88;
  const SPRING_K       = 0.07;
  const SPRING_AK      = 0.09;
  const RESTITUTION    = 0.32;
  const LAND_FRICTION  = 0.65;
  const SLIDE_FRICTION = 0.95;
  const BOUNCE_CUTOFF  = 1.8;
  const RETURN_DELAY   = 1500;
  const HALF           = 36;

  const particles = [
    avatar.querySelector('.hero-avatar-img'),
    avatar.querySelector('.hero-avatar-layer--1'),
    avatar.querySelector('.hero-avatar-layer--2'),
    avatar.querySelector('.hero-avatar-layer--3'),
  ].map((el, i) => ({
    el, home: HOME[i],
    y: HOME[i], x: 0, angle: 0,
    vy: 0, vx: 0, av: 0,
    onFloor: false,
    returning: false,
  }));

  let mode        = 'idle';
  let returnTimer = null;
  let rafId       = null;
  let floorY      = 0;
  let tip         = 1;

  function rand(spread) { return (Math.random() - 0.5) * spread; }

  function getFloor() {
    const ar = avatar.getBoundingClientRect();
    const hr = heroH1.getBoundingClientRect();
    return hr.top - ar.top;
  }

  function applyTransform(p) {
    if (p.el) p.el.style.transform =
      `translateX(${p.x}px) translateY(${p.y}px) rotate(${45 + p.angle}deg)`;
  }

  function freeze() {
    floorY = getFloor();
    particles.forEach(p => {
      if (!p.el) return;
      p.y = p.home; p.x = 0; p.angle = 0;
      p.vy = 0; p.vx = 0; p.av = 0;
      p.onFloor = false; p.returning = false;
      p.el.style.animation = 'none';
      applyTransform(p);
    });
  }

  function restore() {
    /* Re-enable CSS animation first (backwards fill holds home position during delays),
       then drop inline transform so the animation fully takes over. */
    particles.forEach(p => {
      if (!p.el) return;
      p.el.style.transform = `translateY(${p.home}px) rotate(45deg)`;
      p.el.style.animation = '';
    });
    void avatar.offsetHeight;
    particles.forEach(p => {
      if (!p.el) return;
      p.el.style.transform = '';
    });
    mode = 'idle';
    rafId = null;
  }

  function knock(clientX) {
    clearTimeout(returnTimer);
    if (mode === 'idle') freeze();
    mode = 'falling';

    const ar = avatar.getBoundingClientRect();
    tip = clientX < ar.left + ar.width / 2 ? 1 : -1;

    /* Each block gets an independent random scatter on top of the cascade base */
    particles.forEach((p, i) => {
      setTimeout(() => {
        if (mode !== 'falling') return;
        p.vy     = 0.5 + i * 0.5  + Math.random() * 0.5;
        p.vx     = tip * (2.5 + i * 3.0 + Math.random() * 5);
        p.av     = tip * (4   + i * 4   + rand(8));
        p.onFloor  = false;
        p.returning = false;
      }, i * 110);
    });

    /* All blocks start returning at roughly the same time; small random offset
       creates staggered arrivals without the 1-by-1 sequential feel */
    returnTimer = setTimeout(() => {
      mode = 'returning';
      particles.forEach((p) => {
        const delay = Math.random() * 210;
        setTimeout(() => { p.returning = true; }, delay);
      });
    }, RETURN_DELAY);

    if (!rafId) rafId = requestAnimationFrame(tick);
  }

  function tick() {
    let settled = true;

    particles.forEach((p) => {
      if (!p.el) return;

      if (mode === 'falling') {
        p.vy += GRAVITY;
        if (p.onFloor) {
          p.vx *= SLIDE_FRICTION;
          p.av *= SLIDE_FRICTION;
        } else {
          p.vx *= 0.98;
        }
        p.x     += p.vx;
        p.y     += p.vy;
        p.angle += p.av;

        if (p.y + HALF + 15 > floorY) {
          p.y = floorY - HALF - 15;
          if (Math.abs(p.vy) > BOUNCE_CUTOFF) {
            p.vy      = -Math.abs(p.vy) * RESTITUTION;
            p.vx     *= LAND_FRICTION;
            p.av     *= LAND_FRICTION;
            p.onFloor = false;
          } else {
            p.vy      = 0;
            p.onFloor = true;
          }
        } else {
          p.onFloor = false;
        }

      } else if (mode === 'returning') {
        if (!p.returning) {
          /* Waiting for this block's personal return timer — keep floor physics */
          p.vy += GRAVITY;
          p.vx *= SLIDE_FRICTION;
          p.av *= SLIDE_FRICTION;
          p.x     += p.vx;
          p.y     += p.vy;
          p.angle += p.av;
          if (p.y + HALF + 15 > floorY) {
            p.y  = floorY - HALF - 15;
            p.vy = 0;
          }
          settled = false;
        } else {
          /* Spring home */
          p.vy  += (p.home - p.y)    * SPRING_K;
          p.vx  += (0      - p.x)    * SPRING_K;
          p.av  += (0      - p.angle) * SPRING_AK;
          p.vy  *= DAMPING;
          p.vx  *= DAMPING;
          p.av  *= DAMPING;
          p.y   += p.vy;
          p.x   += p.vx;
          p.angle += p.av;
          p.onFloor = false;

          if (
            Math.abs(p.y - p.home) > 0.5 ||
            Math.abs(p.x)          > 0.5 ||
            Math.abs(p.angle)      > 0.5 ||
            Math.abs(p.vy)         > 0.1
          ) settled = false;
        }
      }

      applyTransform(p);
    });

    if (mode === 'returning' && settled) { restore(); return; }
    rafId = requestAnimationFrame(tick);
  }

  avatar.addEventListener('mouseenter', (e) => {
    if (mode === 'idle') knock(e.clientX);
  });

  /* Touch — preventDefault stops the browser firing synthetic mouseenter/click
     after the touchstart so we don't double-trigger */
  avatar.addEventListener('touchstart', (e) => {
    if (mode === 'idle') {
      e.preventDefault();
      knock(e.touches[0].clientX);
    }
  }, { passive: false });
})();
