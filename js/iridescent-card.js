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

  void main() {
    vec2 uv = vUv;
    float t = uTime * 0.06;

    // Rotate the UV space so everything flows along one diagonal axis.
    // angle ~16°, bands run roughly top-right to bottom-left.
    float a = 0.28;
    float c = cos(a);
    float s = sin(a);
    vec2 ruv = vec2(uv.x * c + uv.y * s, -uv.x * s + uv.y * c);

    // Gentle low-frequency warp so the bands "breathe" / wave very subtly.
    // Kept small so the directional flow stays dominant.
    float warp =
        snoise(vec2(ruv.x * 1.1 + t,         ruv.y * 0.6)) * 0.04
      + snoise(vec2(ruv.x * 2.4 - t * 0.5,   ruv.y * 1.2)) * 0.025;

    // Vertical color sweep along the rotated axis
    float g = ruv.y + warp;

    vec3 magenta  = vec3(0.96, 0.40, 0.78);
    vec3 lavender = vec3(0.78, 0.66, 0.97);
    vec3 orange   = vec3(0.99, 0.65, 0.50);
    vec3 peach    = vec3(1.00, 0.82, 0.66);
    vec3 white    = vec3(1.00, 1.00, 1.00);

    vec3 color = magenta;
    color = mix(color, lavender, smoothstep(0.10, 0.45, g));
    color = mix(color, orange,   smoothstep(0.55, 0.75, g));
    color = mix(color, peach,    smoothstep(0.75, 0.88, g));
    color = mix(color, white,    smoothstep(0.88, 1.05, g));

    // Specular streaks — narrow bright threads catching light along the diagonal.
    // sin gives the band, pow+smoothstep sharpens it into a thin highlight.
    float streak1 = sin(ruv.y * 14.0 + warp * 6.0 - t * 1.4);
    streak1 = pow(smoothstep(0.55, 1.0, streak1), 3.0);

    float streak2 = sin(ruv.y * 22.0 + warp * 10.0 + t * 0.9);
    streak2 = pow(smoothstep(0.75, 1.0, streak2), 4.0) * 0.6;

    color = mix(color, white, streak1 * 0.55);
    color = mix(color, white, streak2 * 0.4);

    gl_FragColor = vec4(color, 1.0);
  }
`;

export function createIridescentCard(container) {
  if (!container || container.dataset.iridescentReady === "true") return null;
  container.dataset.iridescentReady = "true";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

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
