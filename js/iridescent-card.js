import * as THREE from "https://esm.sh/three@0.160.0";

console.log("[iridescent] module loaded, THREE =", typeof THREE);

const VERTEX = /* glsl */`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const FRAGMENT = /* glsl */`
  uniform float uTime;
  varying vec2 vUv;

  // Simplex 2D noise — Ashima Arts, public domain
  vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
           + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy),
                            dot(x12.zw, x12.zw)), 0.0);
    m = m * m; m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  // One strand: a translucent band centered at yPos, warped by noise.
  // Each strand uses a unique seed so they all wave independently.
  float strand(vec2 ruv, float yPos, float thickness, float freq, float seed, float t) {
    float warp = snoise(vec2(ruv.x * freq + t + seed, ruv.y * 0.4 + seed)) * 0.18;
    float d = abs(ruv.y + warp - yPos);
    return smoothstep(thickness, 0.0, d);
  }

  void main() {
    vec2 uv = vUv;
    float t = uTime * 0.08;

    // Rotate UV so strands flow diagonally.
    float a = 0.25;
    float c = cos(a);
    float s = sin(a);
    vec2 ruv = vec2(uv.x * c + uv.y * s, -uv.x * s + uv.y * c);

    // White canvas — strands paint onto it.
    vec3 col = vec3(1.0);

    vec3 pink     = vec3(0.96, 0.45, 0.78);
    vec3 lavender = vec3(0.78, 0.66, 0.97);
    vec3 purple   = vec3(0.62, 0.50, 0.95);
    vec3 orange   = vec3(1.00, 0.62, 0.48);
    vec3 peach    = vec3(1.00, 0.82, 0.66);

    // Pink strands (clustered near top)
    col = mix(col, pink, strand(ruv, 0.08, 0.18, 1.5, 1.0,  t * 1.0) * 0.65);
    col = mix(col, pink, strand(ruv, 0.18, 0.14, 2.0, 7.5,  t * 1.3) * 0.55);
    col = mix(col, pink, strand(ruv, 0.04, 0.12, 1.8, 13.2, t * 0.8) * 0.60);

    // Lavender / purple strands (mid)
    col = mix(col, lavender, strand(ruv, 0.32, 0.17, 1.7, 21.0, t * 0.9) * 0.60);
    col = mix(col, lavender, strand(ruv, 0.42, 0.13, 2.3, 29.4, t * 1.1) * 0.55);
    col = mix(col, purple,   strand(ruv, 0.38, 0.11, 1.9, 35.7, t * 0.7) * 0.55);
    col = mix(col, lavender, strand(ruv, 0.50, 0.10, 2.4, 41.1, t * 1.2) * 0.45);

    // Orange strands (lower mid)
    col = mix(col, orange, strand(ruv, 0.62, 0.16, 1.8, 49.0, t * 1.0) * 0.60);
    col = mix(col, orange, strand(ruv, 0.70, 0.13, 2.4, 56.2, t * 1.2) * 0.50);

    // Peach strand (bottom, fading into white)
    col = mix(col, peach, strand(ruv, 0.85, 0.14, 1.6, 63.5, t * 0.8) * 0.40);

    gl_FragColor = vec4(col, 1.0);
  }
`;

export function createIridescentCard(container) {
  if (!container || container.dataset.iridescentReady === "true") return null;
  container.dataset.iridescentReady = "true";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const dpr = window.devicePixelRatio || 1;

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(dpr);
  const width0 = container.clientWidth || 1;
  const height0 = container.clientHeight || 1;
  renderer.setSize(width0, height0, false);
  renderer.domElement.style.display = "block";
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  container.appendChild(renderer.domElement);

  const material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  scene.add(mesh);

  const start = performance.now();
  let rafId = 0;
  let visible = false;

  function frame() {
    if (!visible) return;
    rafId = requestAnimationFrame(frame);
    material.uniforms.uTime.value = (performance.now() - start) / 1000;
    renderer.render(scene, camera);
  }

  // Static render once for reduced-motion users
  if (reduceMotion) {
    renderer.render(scene, camera);
  } else {
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !visible) {
        visible = true;
        frame();
      } else if (!entry.isIntersecting) {
        visible = false;
        cancelAnimationFrame(rafId);
      }
    }, { threshold: 0 });
    io.observe(container);
  }

  const resize = new ResizeObserver(() => {
    const w = container.clientWidth || 1;
    const h = container.clientHeight || 1;
    renderer.setSize(w, h, false);
    if (!visible) renderer.render(scene, camera);
  });
  resize.observe(container);

  return {
    destroy() {
      cancelAnimationFrame(rafId);
      resize.disconnect();
      renderer.dispose();
      mesh.geometry.dispose();
      material.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      delete container.dataset.iridescentReady;
    }
  };
}

// Auto-mount on any element with [data-iridescent]
const targets = document.querySelectorAll("[data-iridescent]");
console.log("[iridescent] mounting on", targets.length, "element(s)");
targets.forEach(el => {
  try {
    createIridescentCard(el);
    console.log("[iridescent] mounted, size =", el.clientWidth, "x", el.clientHeight);
  } catch (err) {
    console.error("[iridescent] mount failed:", err);
  }
});
