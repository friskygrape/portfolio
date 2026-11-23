/* ════════ TOOL STICKERS (shared: AI x Design and Motion Design) ════════
   Flat logos at rest. The hovered one becomes a die-cut 3D sticker (three.js), and on scroll each one
   spins in and lands on its flat mark. Moved here from ai-design.html on 2026-11-22 so every page's tool
   row behaves the same.
   Markup: <div data-stickers="<asset dir>/"> holding .tt-stage > .tt-item > .tt-slot > img.tt-mark, + .tt-name.
   The asset dir holds the baked set, one sticker per .tt-item in the same order. Build a set with
   Brand and Motion Design Agent/work/ai-page-tools-tiles/sticker/run-set.sh (STICKER_IDS picks the logos).
   Styles: css/tool-stickers.css. */
function mount(sec) {
  const stage = sec && sec.querySelector('.tt-stage');
  if (!stage) return;
  const items = [...stage.querySelectorAll('.tt-item')];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const glOK = (() => { try { return !!document.createElement('canvas').getContext('webgl2'); } catch (e) { return false; } })();
  if (reduce || !glOK || new URLSearchParams(location.search).has('ttstatic')) return; // flat logos only

  const ASSETS = sec.dataset.stickers;   // the page's baked set: outlines.json, sticker-logos.webp, sticker-shadows.webp
  const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js';
  // Shared with the Blender build (work/ai-page-tools-tiles/sticker/build_stickers.py). 1 unit = slot width.
  const T = 0.10;                                   // sticker thickness: ~5px edge at 48px
  const BF = 0.036, SF = 6, BB = 0.010, SB = 2;     // front round bevel (~2px rim highlight), back bevel
  const BORDER = 0.08;                              // white die-cut border beyond the mark (outlines.py)
  const COLS = 4, ROWS = 2;                          // print atlas grid (7 cells used)
  const HIT_PAD = 8;                                 // css px around the slot: a 68px hover target for a 48px mark
  const H_MID = 0.085, H_LIFT = 0.26, H_HOVER = 0.24; // gap under the sticker; masks baked at 0, H_MID, H_LIFT
  const MASK = 2.2;                                  // shadow mask extent (slot widths)
  const KEY = [-0.42, 0.78, 1.0];                    // direction to the key light (top-left, front)
  const VIEW = 14 * Math.PI / 180;                   // a lifted sticker is seen from a little below: its bottom edge reads
  const DIST = 6;                                    // camera distance in slot widths (gentle perspective)
  // Calibrated against the brand colours: a lit face renders paper white, marks within a few levels of their official values
  const KEY_I = 2.25, HEMI_I = 1.0, ENV_I = 0.12, BOUNCE_I = 1.6, SPEC = 0.4;
  const BLEED = 150;                                 // canvas bleed (css px): room for stickers dropping in from above
  const VIEWN = 6;                                   // each sticker's viewport, in slot widths (fits the fly-in path)
  const TILT_HOVER = 0.30;                           // max tilt (rad, ~17°) toward the pointer
  const TAP_MS = 650;                                // touch: a tap turns the mark into a sticker this long, then it settles
  // The transformation, driven by one spring m (0 = flat logo, 1 = lifted sticker):
  //   0 to 0.10   the 3D print fades in over the flat logo (same mark, same pixels), then the logo hides
  //   0 to 0.55   the white border grows out from behind the mark to its full die-cut line
  //   0.12 to 1   depth arrives as it rises: thickness, bevel, lift, the camera's low angle, shadow, tilt
  const SWAP = 0.10, GROW = 0.55, RISE = 0.12;

  // Entrance, anchored to scroll and repeatable. Strip progress p runs from 0 (the strip's centre at the
  // bottom of the viewport) to 1 (its centre at the middle of the viewport), so every sticker has fully
  // landed by mid-viewport, however fast the page moves. Each sticker plays across its own long slice of p
  // (45% of the range, offset left to right), so neighbours overlap and the row moves like a wave.
  // A light per-frame follow (~0.12) smooths wheel steps; scrolling up rewinds against the same mapping.
  //   q 0 to 0.15   fades in, a little above its slot
  //   q 0 to 0.8    settles down ~45px (30px on mobile) with a gentle 135° turn about Y and a slight tip,
  //                 ease-in-out, coming down to the page
  //   q 0.8 to 1    border and depth settle into the bare mark; its name fades in
  const IN = { slice: 0.45, fade: 0.15, land: 0.8, drop: 45, dropM: 30, fan: 0.1, lift: 0.45,
               turn: 0.75 * Math.PI, tip: 0.3, follow: 0.12 };  // max progress per second · follow gain · neighbour lag (~125ms)

  // The flat marks stay hidden until their sticker lands on them
  // (if WebGL fails they are shown at once).
  sec.classList.add('tt-live');
  const showMarks = () => items.forEach((li) => li.classList.add('is-in'));
  const fail = (e) => { console.warn('[tools stickers] flat logos only', e); showMarks(); };
  const lazy = new IntersectionObserver((es) => {
    if (es.some((e) => e.isIntersecting)) { lazy.disconnect(); init().catch(fail); }
  }, { rootMargin: '600px 0px' });
  lazy.observe(stage);

  const clamp01 = (x) => Math.min(1, Math.max(0, x));
  const smooth = (x) => { x = clamp01(x); return x * x * (3 - 2 * x); };
  const easeOutCubic = (x) => { x = clamp01(x); return 1 - (1 - x) ** 3; };

  // A sticker whose border and depth can grow. Same rings as build_stickers.py at full growth; at
  // grow 0 / depth 0 it is a zero-thickness plate hugging the mark (the outline pulled in by BORDER).
  function sticker(THREE, P) {
    const n = P.length, N = [];
    for (let i = 0; i < n; i++) {
      const a = P[(i + n - 1) % n], b = P[i], c = P[(i + 1) % n];
      const e1x = b[1] - a[1], e1y = a[0] - b[0], e2x = c[1] - b[1], e2y = b[0] - c[0];
      const l1 = Math.hypot(e1x, e1y), l2 = Math.hypot(e2x, e2y);
      const nx = e1x / l1 + e2x / l2, ny = e1y / l1 + e2y / l2, l = Math.hypot(nx, ny);
      N.push([nx / l, ny / l]);
    }
    const phis = [];
    for (let k = 0; k <= SB; k++) phis.push([0, -Math.PI / 2 + (Math.PI / 2) * k / SB]);
    for (let k = 0; k <= SF; k++) phis.push([1, (Math.PI / 2) * k / SF]);
    const R = phis.length, V = R * n + 2 * n;
    const pos = new Float32Array(V * 3), nor = new Float32Array(V * 3), uv = new Float32Array(V * 2), idx = [];
    for (let r = 0; r < R - 1; r++) for (let i = 0; i < n; i++) {
      const j = (i + 1) % n, a = r * n + i, b = r * n + j, c = (r + 1) * n + j, d = (r + 1) * n + i;
      idx.push(a, b, c, a, c, d);
    }
    // caps: triangulated once on the full cut line, reused at every growth stage
    const tri = THREE.ShapeUtils.triangulateShape(P.map((p) => new THREE.Vector2(p[0], p[1])), []);
    const back = R * n, front = R * n + n;
    for (const f of tri) { idx.push(front + f[0], front + f[1], front + f[2]); idx.push(back + f[0], back + f[2], back + f[1]); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    g.setIndex(idx);
    let last = '';
    // grow: border 0..1, depth: thickness/bevel 0..1
    g.shape = (grow, depth) => {
      const key = grow.toFixed(4) + depth.toFixed(4);
      if (key === last) return; last = key;
      const pull = BORDER * (1 - grow) * 0.97;            // stop just short of the cusp at sharp mark tips
      const t = T * depth, bf = BF * depth, bb = BB * depth, half = t / 2;
      const set = (v, x, y, z, nx, ny, nz) => {
        pos[v * 3] = x; pos[v * 3 + 1] = y; pos[v * 3 + 2] = z - half;
        // flat plate: normals lean to +Z, so a thin sticker never shades like a thick one
        const mx = nx * depth, my = ny * depth, mz = nz * depth + (1 - depth), ml = Math.hypot(mx, my, mz) || 1;
        nor[v * 3] = mx / ml; nor[v * 3 + 1] = my / ml; nor[v * 3 + 2] = mz / ml;
        uv[v * 2] = x + 0.5; uv[v * 2 + 1] = 0.5 - y;
      };
      for (let r = 0; r < R; r++) {
        const [front, p] = phis[r];
        const ins = pull + (front ? bf * (1 - Math.cos(p)) : bb * (1 - Math.cos(p)));
        const z = front ? t - bf + bf * Math.sin(p) : bb * (1 + Math.sin(p));
        const c = Math.cos(p), s = Math.sin(p);
        for (let i = 0; i < n; i++) set(r * n + i, P[i][0] - N[i][0] * ins, P[i][1] - N[i][1] * ins, z, N[i][0] * c, N[i][1] * c, s);
      }
      for (let i = 0; i < n; i++) {
        const b0 = i * 3, f0 = ((R - 1) * n + i) * 3;
        set(back + i, pos[b0], pos[b0 + 1], pos[b0 + 2] + half, 0, 0, -1);
        uv[(back + i) * 2] = uv[(back + i) * 2 + 1] = 0.02;   // the back is plain white backing (a white corner of the cell)
        set(front + i, pos[f0], pos[f0 + 1], pos[f0 + 2] + half, 0, 0, 1);
      }
      g.attributes.position.needsUpdate = g.attributes.normal.needsUpdate = g.attributes.uv.needsUpdate = true;
    };
    return g;
  }
  const loadTex = (THREE, url) => new Promise((res, rej) => new THREE.TextureLoader().load(url, res, undefined, rej));

  async function init() {
    const THREE = await import(THREE_URL);
    const [cut, logos, masks] = await Promise.all([
      fetch(ASSETS + 'outlines.json').then((r) => r.json()),
      loadTex(THREE, ASSETS + 'sticker-logos.webp'),
      loadTex(THREE, ASSETS + 'sticker-shadows.webp'),
    ]);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;     // a filmic curve turns the marks pastel
    renderer.autoClear = false;
    const canvas = renderer.domElement;
    canvas.className = 'tt-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.left = canvas.style.top = -BLEED + 'px';
    stage.appendChild(canvas);

    // Soft studio environment for the satin highlight that slides along the bevel as the sticker tilts
    const pm = new THREE.PMREMGenerator(renderer);
    const envScene = new THREE.Scene();
    envScene.add(new THREE.Mesh(new THREE.BoxGeometry(20, 20, 20), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.55, 0.54, 0.53), side: THREE.BackSide })));
    const kd = new THREE.Vector3(...KEY).normalize();
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(7, 7), new THREE.MeshBasicMaterial({ color: new THREE.Color(5, 4.9, 4.7) }));
    panel.position.copy(kd).multiplyScalar(8); panel.lookAt(0, 0, 0); envScene.add(panel);
    const envMap = pm.fromScene(envScene, 0.04).texture;
    pm.dispose();

    logos.colorSpace = THREE.SRGBColorSpace;
    logos.flipY = false;
    logos.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    masks.colorSpace = THREE.NoColorSpace;

    const shadowMat = (i) => new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      uniforms: { map: { value: masks }, w: { value: new THREE.Vector3(1, 0, 0) }, k: { value: 0.3 }, fade: { value: 0 }, row: { value: i } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `uniform sampler2D map; uniform vec3 w; uniform float k; uniform float fade; uniform float row; varying vec2 vUv;
        void main(){
          // atlas: one row per sticker (top = first), columns flat / mid / lift
          vec2 u = vec2(vUv.x / 3.0, 1.0 - (row + 1.0 - vUv.y) / ${cut.tiles.length}.0);
          float a = texture2D(map, u).r * w.x + texture2D(map, u + vec2(1.0/3.0, 0.0)).r * w.y + texture2D(map, u + vec2(2.0/3.0, 0.0)).r * w.z;
          vec2 e = min(vUv, 1.0 - vUv);
          a *= smoothstep(0.0, 0.16, min(e.x, e.y));
          gl_FragColor = vec4(0.110, 0.098, 0.090, clamp(a * k * fade, 0.0, 1.0));   // warm ink #1C1917
        }`,
    });
    const shadowGeo = new THREE.PlaneGeometry(MASK, MASK);

    const tiles = items.map((li, i) => {
      const f = cut.tiles[i].p, P = [];
      for (let k = 0; k < f.length; k += 2) P.push([f[k] / 1000, f[k + 1] / 1000]);   // thousandths of the slot
      const geo = sticker(THREE, P);
      const map = logos.clone();
      map.repeat.set(1 / COLS, 1 / ROWS);
      map.offset.set((i % COLS) / COLS, Math.floor(i / COLS) / ROWS);
      map.needsUpdate = true;
      const mat = new THREE.MeshPhysicalMaterial({ map, roughness: 0.55, metalness: 0, specularIntensity: SPEC, envMap, envMapIntensity: ENV_I, transparent: true });
      const mesh = new THREE.Mesh(geo, mat);
      const sh = new THREE.Mesh(shadowGeo, shadowMat(i));
      // each sticker has its own little scene and camera, drawn into its own scissored viewport
      const scene = new THREE.Scene();
      const key = new THREE.DirectionalLight(0xffffff, KEY_I); key.position.copy(kd);
      const bounce = new THREE.DirectionalLight(0xfaf6f0, BOUNCE_I); bounce.position.set(0, -1, 0.15);
      scene.add(key, bounce, new THREE.HemisphereLight(0xffffff, 0xf6f3ee, HEMI_I), mesh, sh);
      const camera = new THREE.PerspectiveCamera(20, 1, 1, 10000);
      const spring = () => ({ x: 0, v: 0, t: 0 });
      return { li, slot: li.querySelector('.tt-slot'), flatEls: [...li.querySelectorAll('.tt-mark')], name: li.querySelector('.tt-name'), mesh, sh, mat, scene, camera,
        cx: 0, cy: 0, s: 1, m: spring(), rx: spring(), ry: spring(), press: spring(), flat: true, q: 1, qt: 1, col: 0, mid: 0 };
    });

    // ── layout: stickers mirror the DOM slots (CSS owns the responsive row) ──
    let cw = 0, ch = 0, mobile = false;
    let auto = 0;                                        // the auto play's progress (0 unless the row opened on screen)
    const AUTO_MS = 1800, AUTO_DELAY = 300;

    const order = [];                                  // stickers left to right, row by row
    const mq = matchMedia('(max-width: 760px)');
    function layout() {
      mobile = mq.matches;
      const sr = stage.getBoundingClientRect();
      cw = sr.width + BLEED * 2; ch = sr.height + BLEED * 2;
      // cap the drawing buffer by pixels as well as DPR
      const dpr = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(2.4e6 / (cw * ch)));
      renderer.setPixelRatio(dpr);
      renderer.setSize(cw, ch, false);
      canvas.style.width = cw + 'px'; canvas.style.height = ch + 'px';
      for (const t of tiles) {
        const r = t.slot.getBoundingClientRect();
        t.s = r.width;
        t.cx = r.left + r.width / 2 - sr.left;
        t.cy = r.top + r.height / 2 - sr.top;
      }
      // rows (4 + 3 on mobile): each sticker's column in its row and its offset from the row's centre
      const rows = new Map();
      for (const t of tiles) { const k = Math.round(t.cy); rows.set(k, [...(rows.get(k) || []), t]); }
      order.length = 0;
      for (const row of [...rows.entries()].sort((a, b) => a[0] - b[0]).map((e) => e[1]))
        row.sort((a, b) => a.cx - b.cx).forEach((t, c, r) => { t.col = c; t.mid = c - (r.length - 1) / 2; t.rowLen = r.length; order.push(t); });
      progress(true);
      draw();
    }

    // ── state → scene (per sticker: slot centre at the origin, page at z = 0, css px units) ──
    let clock = 0;
    function place(t) {
      const s = t.s, m = Math.max(0, t.m.x), press = clamp01(t.press.x);
      let op = clamp01(m / SWAP);
      let grow = easeOutCubic(m / GROW);
      const rise = Math.max(0, (m - RISE) / (1 - RISE));       // may overshoot above 1: the springy top of the lift
      let depth = smooth(rise);
      let h = H_HOVER * rise;
      h -= h * press;                                         // press pushes it back down flat
      let free = clamp01(h / H_HOVER);                        // tilt only as far as it has risen
      let spin = 0;
      let ox = 0, oy = 0, tip = 0;
      if (t.q < 1) {
        // scroll-scrubbed entrance (see IN): override the hover state completely
        const q = t.q;
        if (q <= 0) return false;                              // not arrived: nothing drawn, flat mark hidden
        const f = clamp01(q / IN.land), away = 1 - smooth(f);   // ease-in-out
        const r = clamp01((q - IN.land) / (1 - IN.land));     // settle phase
        op = smooth(q / IN.fade) * (1 - smooth((r - 0.8) / 0.2));   // fades off over the bare mark at the very end
        oy = (mobile ? IN.dropM : IN.drop) / s * away;         // settling down from just above (slot units, up)
        ox = t.mid * IN.fan * away;                            // the faintest fan from the row's centre
        h = IN.lift * away * away;
        spin = -IN.turn * away;                                // a soft 135° turn, unwinding as it lands
        tip = IN.tip * away;                                   // tipped back a little, levels as it lands
        depth = 1 - smooth(r);
        grow = 1 - smooth(r);
        free = 0;
      }
      t.mesh.geometry.shape(grow, depth);
      const scale = s * (1 + 0.06 * depth - 0.03 * press);
      t.mesh.position.set(ox * s, oy * s, (h + T * depth / 2) * s);
      t.mesh.scale.setScalar(scale);
      t.mesh.rotation.set(t.rx.x * free + tip, t.ry.x * free + spin, 0, 'YXZ');
      // the shadow lies on the page under the sticker, offset down-right by the key light as it rises
      t.sh.position.set((ox - t.ry.x * free * 0.05 + h * 0.25) * s, (oy + t.rx.x * free * 0.05 - h * 0.35) * s, 0);
      t.sh.scale.setScalar(scale);
      t.sh.scale.x = scale * Math.max(0.12, Math.abs(Math.cos(spin)));   // the shadow narrows as the sticker turns edge-on
      const w = t.sh.material.uniforms.w.value;
      if (h <= H_MID) { const k = Math.max(0, h / H_MID); w.set(1 - k, k, 0); }
      else { const k = Math.min(1, (h - H_MID) / (H_LIFT - H_MID)); w.set(0, 1 - k, k); }
      t.sh.material.uniforms.fade.value = depth * grow * op * op * op * (1 - 0.6 * clamp01((h - H_LIFT) / 0.6));   // no shadow while flat; it lags the fade-in, softens when high
      t.mat.opacity = op;
      // camera: straight on while flat (the 3D print lands exactly on the flat logo), easing to a low
      // three-quarter view as depth arrives so the edge band reads under the lifted sticker
      const v = VIEW * Math.min(1, depth), d = DIST * s, zf = T * Math.min(1, depth) * s;
      t.camera.position.set(0, -Math.sin(v) * d, zf + Math.cos(v) * d);
      t.camera.lookAt(0, 0, zf);
      t.camera.fov = 2 * Math.atan((VIEWN * s / 2) / d) * 180 / Math.PI;
      t.camera.updateProjectionMatrix();
      // the flat logo hides once the print fully covers it, and returns before the print fades out
      const flat = op < 1;
      if (flat !== t.flat) { t.flat = flat; for (const el of t.flatEls) el.style.visibility = flat ? '' : 'hidden'; }
      // the bare mark shows once the sticker has landed (and under its last fade), hides while airborne
      const r = clamp01((t.q - IN.land) / (1 - IN.land));
      const shown = t.q >= 1 || (t.q > IN.land && op < 1 && r > 0.8);
      if (shown !== t.li.classList.contains('is-in')) t.li.classList.toggle('is-in', shown);
      // the name fades in over the sticker's last 20%, in step with scroll
      const nameOp = t.q >= 1 ? '' : String(smooth(r));
      if (t.name.style.opacity !== nameOp) t.name.style.opacity = nameOp;
      return t.q < 1 ? op > 0 : m > 1e-4;
    }
    function view(t) {
      const n = VIEWN * t.s;
      renderer.setViewport(t.cx + BLEED - n / 2, ch - (t.cy + BLEED) - n / 2, n, n);
      renderer.setScissor(t.cx + BLEED - n / 2, ch - (t.cy + BLEED) - n / 2, n, n);
    }
    function draw() {
      renderer.setScissorTest(false);
      renderer.clear();
      renderer.setScissorTest(true);
      clock = performance.now();
      const live = tiles.filter(place);                      // only stickers that are not flat logos are drawn
      for (const t of live) { t.mesh.visible = false; t.sh.visible = true; view(t); renderer.render(t.scene, t.camera); }
      for (const t of live) { t.mesh.visible = true; t.sh.visible = false; view(t); renderer.clearDepth(); renderer.render(t.scene, t.camera); }
    }

    // ── input ──
    let pointer = null, down = -1, tap = -1, tapTimer = 0;
    const over = (t, px, py) => Math.abs(px - t.cx) <= t.s / 2 + HIT_PAD && Math.abs(py - t.cy) <= t.s / 2 + HIT_PAD;
    const hit = (px, py) => tiles.findIndex((t) => over(t, px, py));
    function aim() {
      for (const [i, t] of tiles.entries()) {
        const on = pointer && !pointer.touch && t.q >= 1 && over(t, pointer.x, pointer.y);   // airborne stickers ignore hover
        if (on) {
          // the lifted face turns toward the pointer: the near edge dips, the far edge catches the light
          const dx = Math.max(-0.5, Math.min(0.5, (pointer.x - t.cx) / t.s)), dy = Math.max(-0.5, Math.min(0.5, (pointer.y - t.cy) / t.s));
          t.ry.t = dx * 2 * TILT_HOVER;
          t.rx.t = dy * 2 * TILT_HOVER;
        } else { t.rx.t = 0; t.ry.t = 0; }
        t.m.t = on || tap === i ? 1 : 0;
        t.press.t = down === i && !(pointer && pointer.touch) ? 1 : 0;
      }
      kick();
    }
    const local = (e) => { const r = stage.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top, touch: e.pointerType === 'touch' }; };
    stage.addEventListener('pointermove', (e) => { pointer = local(e); aim(); });
    stage.addEventListener('pointerleave', () => { if (pointer && pointer.touch) return; pointer = null; down = -1; aim(); });
    stage.addEventListener('pointerdown', (e) => { pointer = local(e); down = hit(pointer.x, pointer.y); aim(); });
    const up = () => {
      if (down < 0) return;
      if (pointer && pointer.touch) {
        // touch: a tap turns the mark into a sticker for a moment, then it lies back down flat
        tap = down; clearTimeout(tapTimer);
        tapTimer = setTimeout(() => { tap = -1; aim(); }, TAP_MS);
        pointer = null;
      }
      down = -1; aim();
    };
    stage.addEventListener('pointerup', up);
    stage.addEventListener('pointercancel', up);

    // ── loop: renders only while something moves and the strip is on screen (0 frames idle) ──
    // m: springy (damping ratio ~0.6, one soft overshoot at the top of the lift); tilt: smooth follow
    const SPR = { m: [150, 15], rx: [140, 18], ry: [140, 18], press: [700, 44] };
    let running = false, visible = false, last = 0;
    const stats = { frames: 0, ms: 0 };
    function step(now) {
      const dt = Math.min(1 / 30, Math.max(0, (now - last) / 1000)); last = now;
      let busy = false;
      for (const t of tiles) for (const k in SPR) {
        const s = t[k], [K, C] = SPR[k];
        s.v += (K * (s.t - s.x) - C * s.v) * dt; s.x += s.v * dt;
        if (k === 'm' && s.x < 0) { s.x = 0; s.v = 0; }       // a flat logo can't sink into the page
        if (Math.abs(s.v) > 1e-4 || Math.abs(s.t - s.x) > 1e-4) busy = true; else { s.x = s.t; s.v = 0; }
      }
      // the entrance follows its scroll-anchored target with a light per-frame follow (smooths wheel steps,
      // never caps the rate), then stops: no frames once every sticker has reached its target
      const k = 1 - Math.pow(1 - IN.follow, dt * 60);
      for (const t of tiles) {
        if (t.q === t.qt) continue;
        t.q += (t.qt - t.q) * k;
        if (Math.abs(t.qt - t.q) < 2e-3) t.q = t.qt; else busy = true;
      }
      const t0 = performance.now(); draw(); stats.ms += performance.now() - t0; stats.frames++;
      if (busy && visible) requestAnimationFrame(step); else running = false;
    }
    function kick() { if (running || !visible) return; running = true; last = performance.now(); requestAnimationFrame(step); }
    new IntersectionObserver((es) => {
      visible = es.some((e) => e.isIntersecting);
      // off screen nothing needs to animate: jump every sticker to where scroll puts it, so it never
      // comes back frozen mid-flight
      if (!visible) { for (const t of tiles) t.q = t.qt; draw(); }
      if (visible) kick();
    }, { rootMargin: '80px 0px' }).observe(stage);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) kick(); });
    new ResizeObserver(layout).observe(stage);
    layout();

    // ── entrance target from scroll: strip centre from the bottom of the viewport to its middle, each sticker
    // on its own overlapping slice. Plays once: a sticker that has landed stays put when scrolling back up. ──
    const progressAt = () => { const r = stage.getBoundingClientRect(); return (window.innerHeight - (r.top + r.height / 2)) / (window.innerHeight / 2); };
    function progress(snap) {
      const vh = window.innerHeight;
      let moved = false;
      const sr = stage.getBoundingClientRect(), mid = sr.top + sr.height / 2;
      const p = Math.max(auto, (vh - mid) / (vh / 2));    // 0: strip centre at the bottom · 1: at mid-viewport (or the auto play below)
      for (const t of tiles) {
        const o = t.rowLen > 1 ? (t.col / (t.rowLen - 1)) * (1 - IN.slice) : 0;
        const qt = t.qMax = Math.max(t.qMax || 0, clamp01((p - o) / IN.slice));   // the furthest it has got: never moves backwards
        if (qt !== t.qt) { t.qt = qt; moved = true; }
        if (snap || t.q === undefined) t.q = qt;
      }
      if (moved) kick();
    }
    addEventListener('scroll', () => progress(false), { passive: true });
    addEventListener('resize', () => progress(false));
    progress(true);
    // A row that is already on screen when the page opens (Motion Design's sits in the hero) can't wait for a
    // scroll to bring it to mid-viewport: it plays the same entrance on its own, as if scrolled there in AUTO_MS.
    const sr0 = stage.getBoundingClientRect();
    if (sr0.top < window.innerHeight && sr0.bottom > 0 && progressAt() < 1) {
      const t0 = performance.now() + AUTO_DELAY;
      const tick = (now) => { auto = clamp01((now - t0) / AUTO_MS); progress(false); if (auto < 1) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    }

    // verification hooks
    window.__tt = { stats, tiles, renderer, draw,
      // pose one sticker at a given morph and tilt without springs (for frame strips)
      // freeze the entrance at a given scroll progress (for frame strips)
      scrub(q) { for (const t of tiles) { t.qt = t.q = q; } draw(); },
      pose(i, m, rx = 0, ry = 0) { for (const [j, t] of tiles.entries()) { const v = j === i ? m : 0; t.m.x = t.m.t = v; t.m.v = 0; t.rx.x = t.rx.t = j === i ? rx : 0; t.ry.x = t.ry.t = j === i ? ry : 0; } draw(); },
    };
  }
}
document.querySelectorAll('[data-stickers]').forEach(mount);
