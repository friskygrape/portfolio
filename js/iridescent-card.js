import * as THREE from "https://esm.sh/three@0.160.0";

console.log("[iridescent] module loaded, THREE =", typeof THREE);

const VERTEX = /* glsl */`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

// Adapted from Stripe's contour-band flow shader.
// Technique: 2-octave FBM with rotation between octaves, then fract() the
// value to create visible contour bands (the "threads"), and smoothstep
// the leading edge of each band for depth.
const FRAGMENT = /* glsl */`
  precision highp float;

  uniform float u_time;
  uniform float u_seed;
  uniform float u_contour_lines;
  uniform float u_noise_scale;
  uniform vec3 u_color1;
  uniform vec3 u_color2;
  uniform vec3 u_color3;
  uniform vec3 u_color4;

  varying vec2 vUv;

  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                     -0.577350269189626, 0.024390243902439);
  const mat2 rot = mat2(0.87758256, 0.47942554, -0.47942554, 0.87758256);
  const vec2 shift = vec2(100.0);

  vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }

  float snoise(vec2 v) {
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

  // 2-octave FBM with a rotation between octaves
  float fbm(vec2 x, float time) {
    float v = 0.0;
    v += 0.5 * snoise(x + time);
    x = rot * x * 2.0 + shift;
    v += 0.25 * snoise(x + time);
    return v;
  }

  void main() {
    // Anisotropic UV — stretch Y so noise variation is slower along Y,
    // making contour bands run horizontally instead of forming closed blobs.
    // Then rotate so bands flow diagonally (matching reference card).
    vec2 stretchedUv = vec2(vUv.x, vUv.y * 0.35);
    float angle = 0.35;
    mat2 r = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
    vec2 pos = (r * stretchedUv) * u_noise_scale;

    float timeOffset = u_time * 0.04 + u_seed;

    float f = fbm(pos, timeOffset);
    f = (f + 1.0) * 0.5;

    // Blend across 4 colors based on FBM value
    float colorStep = f * 4.0;
    float blend1 = clamp(colorStep,        0.0, 1.0);
    float blend2 = clamp(colorStep - 1.0,  0.0, 1.0);
    float blend3 = clamp(colorStep - 2.0,  0.0, 1.0);

    vec3 color = u_color1;
    color = mix(color, u_color2, blend1);
    color = mix(color, u_color3, blend2);
    color = mix(color, u_color4, blend3);

    // Contour bands — the silk threads
    float contour = fract(f * u_contour_lines);
    float shadow = smoothstep(0.6, 1.0, contour);
    float shadowStrength = (1.0 - step(0.5, blend3)) * 0.1;
    color = mix(color, color * (1.0 - shadowStrength), shadow);

    gl_FragColor = vec4(color, 1.0);
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
    uniforms: {
      u_time: { value: 0 },
      u_seed: { value: Math.random() * 100 },
      u_contour_lines: { value: 10.0 },
      u_noise_scale: { value: 0.5 },
      // Iridescent palette: deep magenta → pink → lavender/peach → near white
      u_color1: { value: new THREE.Color(0.62, 0.18, 0.55) },
      u_color2: { value: new THREE.Color(0.96, 0.42, 0.78) },
      u_color3: { value: new THREE.Color(0.78, 0.66, 0.97) },
      u_color4: { value: new THREE.Color(1.00, 0.85, 0.75) }
    },
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
    material.uniforms.u_time.value = (performance.now() - start) / 1000;
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
