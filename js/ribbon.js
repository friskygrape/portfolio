/* ════════════════════════════════════════════════════════
   RIBBON: the homepage's silk scarves (Option 4, "alternating depth": two soft scarves that slowly
   trade places), as a reusable background. The shader is a copy of the homepage field in index.html
   (the homepage still runs its own copy, with its review options).
   Usage: Ribbon.mount(canvas, { host, nav, phone, place }). host is the element whose visibility starts and
   stops the loop. phone() says when to use the phone composition (default: 768px and under). place() runs
   before each resize, for a page that moves or sizes the canvas itself. Colours come from the page's CSS tokens: --ground and --g1 to --g4.
   It draws only while the host is on screen and the tab is visible, caps its buffer by pixel count,
   draws one still frame under reduced motion, and does nothing without WebGL (the ground shows).
   ════════════════════════════════════════════════════════ */
(() => {
  const vs = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }';
  const fs = `precision highp float;
      uniform vec2 r; uniform float t, mob, nv, opt, tex, dbg, ctr, nbl; uniform vec3 g, c1, c2, c3, c4; uniform vec4 na, nb;
      float n2(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      float hash(float p){ p = fract(p * 0.1031); p *= p + 33.33; p *= p + p; return fract(p); }   /* no sin: cheap on any GPU */
      float vn(vec2 p){                                                    /* smooth value noise */
        vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        float a = hash(i.x + i.y * 57.0), b = hash(i.x + 1.0 + i.y * 57.0), c = hash(i.x + (i.y + 1.0) * 57.0), d = hash(i.x + 1.0 + (i.y + 1.0) * 57.0);
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }
      vec3 pal(float x){                                                   /* light, orchid, violet, deep */
        x = clamp(x, 0.0, 1.0) * 3.0;
        vec3 c = mix(c4, c3, smoothstep(0.0, 1.0, x));
        c = mix(c, c2, smoothstep(1.0, 2.0, x));
        return mix(c, c1, smoothstep(2.0, 3.0, x));
      }
      /* the band is wide where it enters, narrower through the middle, wide again at its foot,
         and never the same width twice */
      float gMir = 0.0;
      /* Options 3 and 4: a band of full colour travels slowly down each scarf, so part of it is always rich.
         gBand switches it on for a call, gBandOut hands back how much of the band covers this pixel */
      float gBand = 0.0, gBandOut = 0.0, gCov = 0.0, gCov2 = 0.0;                     /* gCov: the silhouette, for the corner check (debug view) */                                                    /* 1 while drawing a mirrored scarf on desktop: its copy side is its right side */
      /* round 16: no hard corners anywhere in the geometry. A soft clamp (it eases into its limits instead of
         stopping dead) and a smooth max (it never switches on with a kink) replace clamp and max */
      float sclamp(float s){ return clamp(s - 0.12 * log(1.0 + exp((s - 1.0) / 0.12)) + 0.12 * log(1.0 + exp(-s / 0.12)), 0.0001, 1.0); }
      float smax0(float d){ return 0.5 * (d + sqrt(d * d + 0.0025)); }
      float wid0(float s){ float k = sclamp(s); return mix(1.0, 0.86, k) * (1.0 - 0.52 * pow(sin(3.14159 * pow(k, 0.85)), 1.3)); }   /* up to round 13: a tight waist */
      /* round 14: the waist only narrows a little, so the middle reads as a scarf lifting, not a cinch */
      float wid(float s){ float k = sclamp(s); return mix(1.0, 0.86, k) * (1.0 - 0.22 * pow(sin(3.14159 * pow(k, 0.85)), 1.3)); }

      /* ── Option 1: one textured form on the right ── */
      vec3 formOne(vec2 uv, float yd, float bl, float tt, out float cov){   /* bl: edge softness (0 for Option 1), tt: its own clock, cov: how much it covers */
        float s = mix(yd, (yd - 0.34) / 0.66, mob);                       /* round 10, phones: starts below the intro */
        /* the centre of the path, sweeping inward. Round 10: the wider, more open layers need a little
           more room from the copy on narrower desktops and on phones */
        float xc = mix(0.95 - 0.5 * s + 0.19 * s * s + 0.07 * smoothstep(1.6, 1.3, r.x / r.y), 1.56 - 1.6 * s + 0.75 * s * s, mob);
        /* round 12, Option 2 only (k = 1): the blur hides 1A's fine motion, so the soft form moves at the
           scale of the whole form. It sways as one, a slow wave running down its length, and only ever
           out to the right of 1A's line, so it never comes closer to the copy */
        float k = step(0.5, opt);                                        /* Options 2 and 3: the soft field's larger motion */
        xc += k * mix(0.032, 0.05, mob) * (0.5 + 0.5 * sin(tt * 0.3 - s * 2.2));   /* ~21 s per sway */
        float W = mix(0.2, 0.34, mob), hw = wid(s) * W;
        /* the four layers cross where the band enters, lie closer through the middle, and part again at the foot */
        float m0 = smoothstep(0.12, 0.5, s) * (1.0 - 0.7 * smoothstep(0.62, 0.95, s));
        /* round 14: the middle breathes. How closely the layers lie together eases between 0.7 and 0.2
           about every 21 s, a wave travelling down the band, so the middle opens and closes too */
        float breath = 0.5 + 0.5 * sin(tt * 0.3 + s * 1.4);
        float merge = m0 * mix(0.7, 0.2, breath);
        /* round 10: the layers open. They spread wider apart, cross in long, gentle sweeps instead of
           tight weaves, and slowly part and settle again, like a scarf lifting in the wind */
        float open = 0.5 + 0.5 * sin(tt * mix(0.07, 0.29, k) + s * 1.4);   /* Option 2: the layers part and close every ~22 s */
        /* the middle is the part nearest the copy, so it may only open outward: wherever the layers now reach
           further left than round 13's widest moment did, the whole band moves right by exactly that much */
        float amp = mix(0.2, 0.28, k), spMax = mix(1.15, 1.3, k * (1.0 - mob));
        float sp = mix(mix(0.85, 0.75, k * (1.0 - mob)), spMax, open);
        float left0 = wid0(s) * W * ((1.0 - 0.8 * m0) * spMax * (0.5 + amp) + 0.78 + 0.22 * m0);
        float left1 = hw * ((1.0 - 0.8 * merge) * sp * (0.5 + amp) + 0.78 + 0.22 * merge);
        float right0 = wid0(s) * W * ((1.0 - 0.8 * m0) * spMax * (0.49 + amp) + 0.78 + 0.22 * m0);
        float right1 = hw * ((1.0 - 0.8 * merge) * sp * (0.49 + amp) + 0.78 + 0.22 * merge);
        /* plus a small margin through the middle, because the copy's nearest point is diagonal to the band, not level with it */
        xc += mix(smax0(left1 - left0), -smax0(right1 - right0), gMir) + mix(1.0, -1.0, gMir) * 0.008 * m0 + 0.04 * mob;   /* phones: the copy sits above the band's entry, so the whole band steps right a little */
        /* where the band runs up behind the nav, its colours climb toward the light end of the range,
           so the links stay readable without a pale patch: the top of the scarf is simply the lit part */
        float crown = smoothstep(nv * 3.4, nv * 0.4, yd) * (1.0 - mob);
        /* the edge softness is measured across the band, not along the row, so a slanted edge blurs as much as an upright one */
        float tn = mix(-0.5 + 0.38 * s, (-1.6 + 1.5 * s) / 0.66, mob) * r.x / r.y, perp = inversesqrt(1.0 + tn * tn);
        float px = max(1.5 / r.x, bl), focus = 1.0 - smoothstep(0.002, 0.02, bl);   /* out of focus, fine detail goes first */
        /* the band's centre runs from above the top to below the foot about every 31 s; it wraps while off screen */
        float bc = mod(tt * 0.07, 2.2) - 0.7, bnd = gBand * exp(-(s - bc) * (s - bc) / 0.05);
        vec3 col = g; float cover = 0.0, tv = 0.0, tf = 0.0, tl = 0.5;
        for (int i = 0; i < 4; i++) {
          float fi = float(i), dir = mod(fi, 2.0) < 0.5 ? 1.0 : -1.0;
          float c = xc + hw * (1.0 - 0.8 * merge) * sp * (-0.5 + fi * 0.33 + amp * sin(s * (2.2 + fi * 0.5) + fi * 2.1 + tt * mix(0.11, 0.24, k) * dir));
          float h = max(hw * (0.78 + 0.22 * merge), 0.0001);                /* wide, flat faces */
          float v = (uv.x - c) / h, edge = (1.0 - abs(v)) * h, vv = clamp(v, -1.0, 1.0);
          /* no hem and no top edge: the band runs on past the bottom of the landing, and on phones it
             comes in from beyond the right edge instead of starting at a line */
          float a = smoothstep(-px, px, edge * perp);
          col = mix(col, col * c2, 0.3 * (1.0 - 0.7 * crown) * smoothstep(-0.03, 0.0, edge) * (1.0 - a) * cover);   /* a layer shades the layer beneath it, never the ground */
          {
            /* light falls across the face where the cloth lifts toward it, in bands that run across the width
               and travel slowly down the layer (a round tube would carry its highlight along its length instead) */
            float lift = sin(s * (3.0 + fi * 0.7) + fi * 1.3 - tt * mix(0.09, 0.42, k) * dir);   /* Option 2: colour travels down each layer, ~15 s per band */
            float x = mix(0.12 + 0.2 * fi + 0.14 * (v * 0.5 + 0.5) + 0.14 * sin(s * 3.0 + fi * 1.7 + tt * mix(0.07, 0.3, k)),
                          0.2 + 0.4 * (v * 0.5 + 0.5) + 0.1 * sin(s * 2.4 + tt * mix(0.06, 0.26, k)), merge) - mix(0.1, 0.17, k) * lift;
            x = mix(x, max(x, 0.45 + 0.35 * (v * 0.5 + 0.5)), bnd);           /* in the band: orchid to deep violet across the width */
            x = mix(max(x, 0.14), 0.03 + 0.2 * x, crown);                  /* never paler than round 8's lightest, except where it is lit behind the nav */
            vec3 lc = pal(x);
            lc *= 0.95 + 0.07 * smoothstep(1.0, 0.6, abs(vv));             /* flat across, turning only at the very edge */
            col = mix(col, clamp(lc, 0.0, 1.0), a); cover = 1.0 - (1.0 - cover) * (1.0 - a);   /* a soft union: where layers cross, the outline rounds instead of creasing */
            float top = step(0.5, a); tv = mix(tv, v, top); tf = mix(tf, fi, top); tl = mix(tl, 0.5 + 0.5 * lift, top);   /* the layer on top, for the texture */
          }
        }
        if (cover > 0.002) {
          /* texture, once, on the layer on top. It follows the cloth: strands drift and bend along the length,
             gather and thin out, and show most where the surface turns toward the light, least in shadow */
          float bend = (vn(vec2(tv * 1.6 + tf * 3.1, s * 2.0)) - 0.5) * 2.4;
          float q = tv * 24.0 + bend * 3.0 + tf * 13.0;                   /* across the strands */
          float lit = mix(0.35, 1.15, tl) * (1.0 - 0.5 * crown);
          float k;
          if (tex < 1.5 || opt > 0.5) {                                   /* Option 2 is always Texture A, seen soft */
            /* A, silk fibres: long strands that bend with the fabric, gathered in places and sparse in others */
            float gather = vn(vec2(tv * 4.0 + tf * 9.0, s * 3.2));
            float fib = vn(vec2(q, s * 2.6 + tf * 5.0)) - 0.5, fine = vn(vec2(q * 4.3 + 11.0, s * 12.0)) - 0.5;
            k = (fib * (0.16 + 0.2 * gather) + fine * 0.13) * lit;
            col += (c4 - col) * max(fine, 0.0) * 0.3 * tl * tl * cover * focus;    /* single fibres catch the light */
          } else if (tex < 2.5) {
            /* B, raw silk: an uneven yarn, finer strands with short thicker slubs scattered through it */
            float fib = vn(vec2(q * 2.6, s * 5.0 + tf * 5.0)) - 0.5;
            float sl = vn(vec2(q * 0.7 + 3.0, s * 9.0 + tf * 2.0));
            float slub = smoothstep(0.6, 0.9, sl);
            k = (fib * 0.24 + slub * 0.5 * (tl - 0.35)) * lit;                /* slubs stand proud: bright in light, dark in shade */
          } else {
            /* C, crushed silk: no strands, soft creases pressed into the cloth, stretched along the flow, catching light on their ridges */
            float cr = 1.0 - abs(vn(vec2(tv * 5.5 + bend * 1.6 + tf * 7.0, s * 4.5)) * 2.0 - 1.0);
            float cr2 = 1.0 - abs(vn(vec2(tv * 13.0 + bend * 2.2, s * 9.0 + tf * 3.0)) * 2.0 - 1.0);
            k = ((cr * cr * cr - 0.3) * 0.36 + (cr2 * cr2 - 0.45) * 0.14) * lit;
          }
          col *= 1.0 + k * cover * mix(0.2, 1.0, focus);                 /* blurred, only the broadest strands survive, faintly */
        }
        cov = cover; gBandOut = bnd * cover;
        return col;
      }

      /* ── Option 2 (round 11): Option 1A itself, the same form, path, layers and motion, seen out of
         focus in the background. Its edges soften, the fine fibres go, and its opacity drifts slowly
         but never below a floor, so it never disappears ── */
      vec3 field(vec2 uv, float yd){
        float op = 0.72 + 0.2 * sin(t * 0.36 + 1.7), cv;                  /* 0.52 to 0.92, about 17 s per breath */
        vec3 c = formOne(uv, yd, mix(0.022, 0.05, mob), t, cv); gCov = cv;
        return mix(g, c, op);
      }

      /* ── Option 3 (round 13): Option 2's scarf, exactly, with a second, separate scarf behind it.
         The back one is the same cloth further away: Option 2's form mirrored so it leans the other
         way, a little smaller, more out of focus, paler and greyer (air between us and it), on a
         slower clock that never lines up with the front one. The front one is laid over it. ── */
      vec3 pair(vec2 uv, float yd){
        float asp = r.x / r.y, sh = 0.07 * smoothstep(1.6, 1.3, asp) * (1.0 - mob);
        /* where the back scarf sits: desktop, mirrored about a line just right of the front scarf's
           waist, so it leans right where the front leans left and the two cross high on the right.
           Phones: not mirrored (a mirror would swing it across the copy), set further right and lower */
        float cen = 0.86 + sh;
        vec2 q = vec2(mix(2.0 * cen - uv.x, uv.x - 0.05, mob), yd);
        q = (q - vec2(cen, 0.5)) / 0.86 + vec2(cen, 0.5);                 /* 86% of the front scarf's size */
        q.y += mob * 0.03;
        float cb, cf;
        gMir = 1.0 - mob; gBand = 1.0;
        vec3 b = formOne(vec2(q.x, 1.0 - q.y), q.y, mix(0.04, 0.075, mob), t * 0.8 + 47.0, cb);   /* slower, offset clock */
        float bb = gBandOut;
        gMir = 0.0;
        /* air: paler, toward blush and lilac, and a little greyer, except in its band of full colour */
        b = mix(b, mix(b, c4, 0.5 * (1.0 - 0.7 * bb)), cb);
        b = mix(b, vec3(dot(b, vec3(0.299, 0.587, 0.114))), 0.09 * cb * (1.0 - bb));
        /* round 14: the two breathe in counter-phase, same 17 s period, half a cycle apart, so one is always
           coming up as the other fades. In its band each holds near full strength whatever its breath */
        float ob = mix(0.6 + 0.14 * sin(t * 0.36 + 1.7 + 3.1416), 0.86, bb);
        vec3 scene = mix(g, b, ob);
        /* the front scarf, Option 2's, laid over the back one */
        vec3 f = formOne(uv, yd, mix(0.022, 0.05, mob), t, cf);
        float bf = gBandOut; gBand = 0.0;
        float of = mix(0.72 + 0.2 * sin(t * 0.36 + 1.7), 0.95, bf);
        gCov = cf; gCov2 = cb;
        return scene * (1.0 - cf * of) + (f - g * (1.0 - cf)) * of;
      }

      /* ── Option 4 (round 14): Option 3's two scarves trade places. Each has a "farness" from 0 (front)
         to 1 (back) that sets its size, blur, tint and opacity exactly as Option 3 sets the front and
         back scarves, so at either end of the cycle it is Option 3, the second time with the roles swapped ── */
      vec3 scarf(vec2 uv, float yd, float far, float mirr, float tt, out float cov){
        float asp = r.x / r.y, sh = 0.07 * smoothstep(1.6, 1.3, asp) * (1.0 - mob), cen = 0.86 + sh;
        vec2 q = vec2(uv.x, yd);
        if (mirr > 0.5) q.x = mix(2.0 * cen - uv.x, uv.x - 0.05, mob);   /* the second scarf, as in Option 3 */
        q = (q - vec2(cen, 0.5)) / mix(1.0, 0.86, far) + vec2(cen, 0.5);   /* further is a little smaller */
        q.y += mob * 0.03 * mirr;
        float c;
        gMir = mirr * (1.0 - mob); gBand = 1.0;
        vec3 col = formOne(vec2(q.x, 1.0 - q.y), q.y, mix(mix(0.022, 0.05, mob), mix(0.04, 0.075, mob), far), tt, c);
        float bb = gBandOut;
        gMir = 0.0; gBand = 0.0;
        col = mix(col, mix(col, c4, 0.5 * far * (1.0 - 0.7 * bb)), c);     /* and paler, toward blush and lilac, except in its band */
        col = mix(col, vec3(dot(col, vec3(0.299, 0.587, 0.114))), 0.09 * far * c * (1.0 - bb));
        gBandOut = bb;
        cov = c; return col;
      }
      vec3 depth(vec2 uv, float yd){
        /* one full exchange there and back every 36 s: 18 s for a scarf to come forward, 18 s to go back */
        float w = 6.2832 / 36.0, d = 0.5 - 0.5 * cos(t * w);              /* 0: the first scarf in front, 1: the second */
        float fa = d, fb = 1.0 - d, ca, cb;
        /* further things move slower: each clock runs at 1.0x in front and 0.8x at the back, integrated so it never jumps */
        float ta = 0.9 * t + 0.1 * sin(t * w) / w, tb = 0.9 * t - 0.1 * sin(t * w) / w + 47.0;
        vec3 A = scarf(uv, yd, fa, 0.0, ta, ca); float ba = gBandOut;
        vec3 B = scarf(uv, yd, fb, 1.0, tb, cb); float bbb = gBandOut;
        /* round 14: counter-phase breaths, as in Option 3, and each scarf holds near full strength in its band */
        float oFront = 0.72 + 0.2 * sin(t * 0.36 + 1.7), oBack = 0.6 + 0.14 * sin(t * 0.36 + 1.7 + 3.1416);
        float oa = mix(mix(oFront, oBack, fa), mix(0.95, 0.86, fa), ba), ob = mix(mix(oFront, oBack, fb), mix(0.95, 0.86, fb), bbb);
        vec3 LA = (A - g * (1.0 - ca)) * oa, LB = (B - g * (1.0 - cb)) * ob;
        float aa = ca * oa, ab = cb * ob;
        vec3 aOverB = (g * (1.0 - ab) + LB) * (1.0 - aa) + LA;
        vec3 bOverA = (g * (1.0 - aa) + LA) * (1.0 - ab) + LB;
        /* the draw order cross-fades only while the two sit at nearly the same depth (same blur, size and tint),
           over about 5 s, so the order change cannot be seen as a jump */
        gCov = ca; gCov2 = cb;
        return mix(aOverB, bOverA, smoothstep(0.3, 0.7, d));
      }

      /* ── Review version, ?hero=centre: the same soft scarf (Option 2's form, Option 3's air and breath) stood in two
         corners. p is the page in units of its height. Each scarf is the form turned so it runs across its corner,
         top edge to side edge, with its open side toward the middle. The second is the first turned half a circle
         about the middle of the page, a little further away (paler, softer) and on the slower, offset clock. ── */
      vec3 cornerScarf(vec2 p, vec2 c, float sc, float far, float tt, out float cov){
        vec2 d = (p - c) / sc; const float ca = 0.355, sa = -0.935;         /* turned about 69 degrees */
        vec2 qa = vec2(ca * d.x + sa * d.y, -sa * d.x + ca * d.y) + vec2(1.2, 0.5);
        float q = qa.x / 1.6, cv;
        gBand = 1.0;
        vec3 col = formOne(vec2(q, 1.0 - qa.y), qa.y, mix(0.022, 0.04, far), tt, cv);
        float bb = gBandOut; gBand = 0.0;
        col = mix(col, mix(col, c4, 0.5 * far * (1.0 - 0.7 * bb)), cv);
        col = mix(col, vec3(dot(col, vec3(0.299, 0.587, 0.114))), 0.09 * far * cv * (1.0 - bb));
        gBandOut = bb; cov = cv; return col;
      }
      vec3 corners(vec2 uv, float yd){
        float asp = r.x / r.y, sc = mix(0.5, 0.86, smoothstep(0.5, 1.5, asp)), ca, cb;
        vec2 p = vec2(uv.x * asp, yd), c = vec2(asp, 0.0) + vec2(-0.27, 0.17) * sc;   /* how far the scarf stands in from its corner */
        vec3 A = cornerScarf(p, c, sc, 0.0, t, ca); float ba = gBandOut;
        A = mix(A, mix(A, c4, 0.6), ca * smoothstep(nv * 3.0, nv * 0.6, yd));   /* behind the nav it goes pale, so the links stay readable */
        vec3 B = cornerScarf(vec2(asp, 1.0) - p, c, sc, 0.5, t * 0.8 + 47.0, cb); float bbb = gBandOut;
        float oa = mix(0.72 + 0.2 * sin(t * 0.36 + 1.7), 0.95, ba), ob = mix(0.66 + 0.17 * sin(t * 0.36 + 1.7 + 3.1416), 0.9, bbb);
        gCov = ca; gCov2 = cb;
        vec3 scene = mix(g, B, ob);
        return scene * (1.0 - ca * oa) + (A - g * (1.0 - ca)) * oa;
      }

      /* ── Night ground (round 20, ctr = 2): the same two scarves as a quiet texture on the ink of the AI x Design section.
         It runs in that section's own canvas with the night palette, where c4 is the colour nearest the ground and c1 the
         furthest from it, so everything above that fades "toward the ground" still does. p is the section in units of its
         height. Each scarf is the form turned and scaled into place: na and nb hold its centre (x in section widths, y in
         heights), its scale and its turn in radians, and nbl how far out of focus it is. The script sets them per screen size ── */
      vec3 nScarf(vec2 p, vec4 q, float asp, float far, float tt, out float cov){
        vec2 d = (p - vec2(q.x * asp, q.y)) / q.z; float ca = cos(q.w), sa = sin(q.w), cv;
        vec2 qa = vec2(ca * d.x + sa * d.y, -sa * d.x + ca * d.y) + vec2(1.2, 0.5);
        gBand = 1.0;
        vec3 col = formOne(vec2(qa.x / 1.6, 1.0 - qa.y), qa.y, nbl * mix(1.0, 1.5, far), tt, cv);
        float bb = gBandOut; gBand = 0.0;
        col = mix(col, mix(col, c4, 0.5 * far * (1.0 - 0.7 * bb)), cv);   /* the further one sits closer to the ground colour */
        gBandOut = bb; cov = cv; return col;
      }
      vec3 night(vec2 uv, float yd){
        float asp = r.x / r.y, ca, cb;
        vec2 p = vec2(uv.x * asp, yd);
        vec3 A = nScarf(p, na, asp, 0.0, t, ca); float ba = gBandOut;
        vec3 B = nScarf(p, nb, asp, 0.6, t * 0.8 + 47.0, cb); float bbb = gBandOut;
        float oa = mix(0.72 + 0.2 * sin(t * 0.36 + 1.7), 0.95, ba), ob = mix(0.66 + 0.17 * sin(t * 0.36 + 1.7 + 3.1416), 0.9, bbb);   /* the landing's counter-phase breath */
        gCov = ca; gCov2 = cb;
        vec3 scene = mix(g, B, ob);
        return scene * (1.0 - ca * oa) + (A - g * (1.0 - ca)) * oa;
      }

      void main(){
        vec2 uv = gl_FragCoord.xy / r; float yd = 1.0 - uv.y;
        vec3 c;                                                            /* a real branch: a ?: would run both options for every pixel */
        float cv;
        if (ctr > 1.5) c = night(uv, yd); else if (ctr > 0.5) c = corners(uv, yd); else if (opt < 0.5) { c = formOne(uv, yd, 0.0, t, cv); gCov = cv; } else if (opt < 1.5) c = field(uv, yd); else if (opt < 2.5) c = pair(uv, yd); else c = depth(uv, yd);
        c += (n2(gl_FragCoord.xy) - 0.5) / 255.0 * mix(5.0, 2.0, step(1.5, ctr));   /* the grain that hides banding: finer on the ink, where 5 levels would show as mottling */
        if (dbg > 0.5) c = vec3(1.0 - gCov, 1.0 - gCov2, 1.0);            /* debug: each scarf's silhouette, red and green channels */
        gl_FragColor = vec4(c, 1.0);
      }`;

  const mount = (cv, { host = cv.parentElement, nav = document.querySelector('.nav'), phone: isPhone = () => innerWidth <= 768, place = null } = {}) => {
    const gl = cv && cv.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
    if (!gl) return null;
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return null;
    gl.useProgram(pr);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = (n) => gl.getUniformLocation(pr, n);
    const rgb = (v) => { const h = getComputedStyle(document.documentElement).getPropertyValue(v).trim().slice(1); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255); };
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

    gl.uniform1f(U('opt'), 3); gl.uniform1f(U('tex'), 1); gl.uniform1f(U('ctr'), 0); gl.uniform1f(U('dbg'), 0);   /* Option 4, Texture A: the homepage look */
    gl.uniform3fv(U('g'), rgb('--ground')); ['c1', 'c2', 'c3', 'c4'].forEach((u, i) => gl.uniform3fv(U(u), rgb('--g' + (i + 1))));

    let t = 20, last = 0, raf = 0, on = false;
    const size = () => {
      if (place) place();
      const phone = isPhone(), cw = cv.clientWidth, ch = cv.clientHeight;
      const k = Math.min(Math.min(devicePixelRatio || 1, 2), Math.sqrt((phone ? 0.25e6 : 0.45e6) / Math.max(1, cw * ch)));
      const w = Math.max(2, Math.round(cw * k)), h = Math.max(2, Math.round(ch * k));
      if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; gl.viewport(0, 0, w, h); }
      gl.uniform2f(U('r'), w, h); gl.uniform1f(U('mob'), phone ? 1 : 0);
      gl.uniform1f(U('nv'), (nav ? nav.offsetHeight : 64) / Math.max(1, ch));
    };
    const draw = () => { gl.uniform1f(U('t'), t); gl.drawArrays(gl.TRIANGLES, 0, 3); };
    const loop = (now) => { raf = requestAnimationFrame(loop); t += Math.min(0.05, (now - last) / 1000); last = now; draw(); };
    const run = () => { cancelAnimationFrame(raf); raf = 0; if (on && !document.hidden && !reduce) { last = performance.now(); raf = requestAnimationFrame(loop); } };
    size(); draw();
    addEventListener('resize', () => { size(); draw(); });
    new IntersectionObserver(([e]) => { on = e.isIntersecting; run(); }, { threshold: 0.02 }).observe(host);
    document.addEventListener('visibilitychange', run);
    cv.classList.add('is-on');
    return { draw, size };
  };

  window.Ribbon = { mount };
})();
