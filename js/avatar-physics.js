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
  const EXPLODE_DELAY  = 1250; // longer hang time before returning
  const SPACE_GRAVITY  = 0.025; // near-weightless drift while suspended
  const SPACE_DAMPING  = 0.955; // heavy drag so blocks coast to a stop
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
  let prevMode    = 'idle'; // tracks 'falling' vs 'exploding' during 'returning' wait
  let returnTimer = null;
  let rafId       = null;
  let floorY      = 0;

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

  /* Resolve entry direction from the closest avatar edge the cursor crossed */
  function getDirection(clientX, clientY) {
    const ar = avatar.getBoundingClientRect();
    const distTop    = clientY - ar.top;
    const distBottom = ar.bottom - clientY;
    const distLeft   = clientX - ar.left;
    const distRight  = ar.right - clientX;

    const min = Math.min(distTop, distBottom, distLeft, distRight);
    if (min === distTop)    return 'down';
    if (min === distBottom) return 'up';
    if (min === distLeft)   return 'right'; // entered from left → tip right
    return 'left';                          // entered from right → tip left
  }

  function knock(clientX, clientY) {
    clearTimeout(returnTimer);
    if (mode === 'idle') freeze();

    const dir = getDirection(clientX, clientY);
    mode = dir === 'up' ? 'exploding' : 'falling';

    particles.forEach((p, i) => {
      setTimeout(() => {
        if (mode !== 'falling' && mode !== 'exploding') return;
        p.onFloor   = false;
        p.returning = false;

        if (dir === 'down') {
          /* Crushed straight down */
          p.vy = 2.5 + i * 0.9 + Math.random() * 0.8;
          p.vx = rand(2);
          p.av = rand(5);
        } else if (dir === 'up') {
          /* Explode upward — fully random per block, coast to a suspended stop */
          p.vy = -(4 + Math.random() * 5);
          p.vx = rand(8);
          p.av = rand(10);
        } else {
          /* Side swipe */
          const tip = dir === 'right' ? 1 : -1;
          p.vy = 0.5 + i * 0.5  + Math.random() * 0.5;
          p.vx = tip * (2.5 + i * 3.0 + Math.random() * 5);
          p.av = tip * (4   + i * 4   + rand(8));
        }
      }, i * 110);
    });

    const delay = dir === 'up' ? EXPLODE_DELAY : RETURN_DELAY;
    returnTimer = setTimeout(() => {
      prevMode = mode;
      mode = 'returning';
      particles.forEach((p) => {
        const stagger = Math.random() * 210;
        setTimeout(() => { p.returning = true; }, stagger);
      });
    }, delay);

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

      } else if (mode === 'exploding') {
        /* Near-zero gravity + heavy drag — blocks shoot up, decelerate, and hang */
        p.vy += SPACE_GRAVITY;
        p.vx *= SPACE_DAMPING;
        p.vy *= SPACE_DAMPING;
        p.av *= SPACE_DAMPING;
        p.x     += p.vx;
        p.y     += p.vy;
        p.angle += p.av;
        /* No floor collision — blocks float freely */

      } else if (mode === 'returning') {
        if (!p.returning) {
          if (prevMode === 'falling') {
            /* Continue floor physics while waiting for spring timer */
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
          } else {
            /* Continue space drift while waiting for spring timer */
            p.vy += SPACE_GRAVITY;
            p.vx *= SPACE_DAMPING;
            p.vy *= SPACE_DAMPING;
            p.av *= SPACE_DAMPING;
            p.x     += p.vx;
            p.y     += p.vy;
            p.angle += p.av;
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
    if (mode === 'idle') knock(e.clientX, e.clientY);
  });

  /* Touch — preventDefault stops the browser firing synthetic mouseenter/click
     after the touchstart so we don't double-trigger */
  avatar.addEventListener('touchstart', (e) => {
    if (mode === 'idle') {
      e.preventDefault();
      knock(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: false });
})();
