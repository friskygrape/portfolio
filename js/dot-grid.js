/* ── Interactive dot grid (ported from previous portfolio) ── */
(function () {
  const canvas = document.getElementById('dot-grid');
  if (!canvas) return;
  const ctx  = canvas.getContext('2d');
  const hero = canvas.closest('.hero');

  const SPACING      = 22;
  const REPEL_RADIUS = 90;
  const REPEL_STR    = 4.5;
  const DAMPING      = 0.82;
  const SPRING       = 0.08;
  const DOT_RADIUS   = 1.5;
  const COLOR        = '#4D00C0';

  const mouse = { x: -9999, y: -9999, inside: false };
  let dots = [], W = 0, H = 0;

  function buildDots() {
    dots = [];
    const cols = Math.ceil(W / SPACING) + 1;
    const rows = Math.ceil(H / SPACING) + 1;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const ox = col * SPACING;
        const oy = row * SPACING;
        dots.push({ ox, oy, x: ox, y: oy, vx: 0, vy: 0 });
      }
    }
  }

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    W = hero.offsetWidth;
    H = hero.offsetHeight;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildDots();
  }

  hero.addEventListener('mousemove', e => {
    const rect = hero.getBoundingClientRect();
    mouse.x      = e.clientX - rect.left;
    mouse.y      = e.clientY - rect.top;
    mouse.inside = true;
  });

  hero.addEventListener('mouseleave', () => {
    mouse.x      = -9999;
    mouse.y      = -9999;
    mouse.inside = false;
  });

  function tick() {
    ctx.clearRect(0, 0, W, H);

    for (let i = 0; i < dots.length; i++) {
      const d = dots[i];

      if (mouse.inside) {
        const dx   = d.x - mouse.x;
        const dy   = d.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < REPEL_RADIUS && dist > 0.5) {
          const f = ((REPEL_RADIUS - dist) / REPEL_RADIUS) * REPEL_STR;
          d.vx += (dx / dist) * f;
          d.vy += (dy / dist) * f;
        }
      }

      d.vx += (d.ox - d.x) * SPRING;
      d.vy += (d.oy - d.y) * SPRING;
      d.vx *= DAMPING;
      d.vy *= DAMPING;
      d.x  += d.vx;
      d.y  += d.vy;

      const base = 0.07;
      const displacement = Math.hypot(d.x - d.ox, d.y - d.oy);
      const boost = Math.min(0.55, displacement / 8);

      ctx.globalAlpha = Math.min(1, base + boost);
      ctx.fillStyle   = COLOR;
      ctx.beginPath();
      ctx.arc(d.x, d.y, DOT_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    requestAnimationFrame(tick);
  }

  const ro = new ResizeObserver(resize);
  ro.observe(hero);
  resize();
  tick();
})();
