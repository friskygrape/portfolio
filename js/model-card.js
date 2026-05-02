import * as THREE from "https://esm.sh/three@0.160.0";
import { GLTFLoader } from "https://esm.sh/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";

// ──────────────────────────────────────────────────────────
// Colorization strategies
// ──────────────────────────────────────────────────────────

// Icons: 3-column layout, base+note per icon
function colorIcons(model) {
  const meshInfos = [];
  model.traverse((node) => {
    if (!node.isMesh) return;
    const bbox = new THREE.Box3().setFromObject(node);
    const center = bbox.getCenter(new THREE.Vector3());
    const size = bbox.getSize(new THREE.Vector3());
    meshInfos.push({ node, x: center.x, volume: size.x * size.y * size.z });
  });

  const xs = meshInfos.map(m => m.x);
  const xRange = (Math.max(...xs) - Math.min(...xs)) || 1;
  const xMin = Math.min(...xs);
  meshInfos.forEach(m => {
    const t = (m.x - xMin) / xRange;
    m.column = t < 0.34 ? 0 : t < 0.67 ? 1 : 2;
  });
  [0, 1, 2].forEach(col => {
    const inCol = meshInfos.filter(m => m.column === col)
                           .sort((a, b) => b.volume - a.volume);
    inCol.forEach((m, idx) => { m.role = idx === 0 ? "base" : "note"; });
  });

  const colorMap = {
    0: { base: 0x5B5BD6, note: 0xFFFFFF },
    1: { base: 0x7C5BFF, note: 0xFFFFFF },
    2: { base: 0xFFFFFF, note: 0xC97BD9 }
  };

  meshInfos.forEach(m => {
    m.node.material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(colorMap[m.column][m.role]),
      roughness: 0.4,
      metalness: 0.05
    });
  });
}

// Room: meshes are unnamed but their parent groups are. Walk up to find a
// meaningful ancestor name (e.g. "lamp", "book-blue") and color by group.
function colorRoom(model) {
  // Color map keyed by parent group name (matching the reference image)
  const PINK     = 0xE8A2B0;
  const PINK_LT  = 0xF2C5CC;
  const CREAM    = 0xF5E5C5;
  const YELLOW   = 0xFFD672;
  const RUG_YEL  = 0xF5D27A;
  const GREEN    = 0x6BB585;
  const RED      = 0xC24B4B;
  const BLUE     = 0x5B7BC4;
  const DARK     = 0x2E2620;
  const PURPLE   = 0x8B7FBF;
  const PINK_AC  = 0xE89AA8;

  const groupColors = {
    // Room
    "Walls":        PINK,
    "window":       PINK,
    "窗户":         PINK_LT,
    "carpet":       RUG_YEL,
    // Furniture
    "table":        CREAM,
    "chair":        PINK,
    "bucket":       PINK,
    "Pen holder":   DARK,
    "box":          DARK,
    // Plant
    "plant":        GREEN,
    "Plant Base":   PINK,
    // Lamp
    "lamp":         YELLOW,
    // Books
    "book-blue":    BLUE,
    "book-red":     RED,
    "book-yellow":  YELLOW,
    "book-green":   GREEN,
    // Misc props
    "paper":        0xFFFFFF,
    "Sphere":       PINK_LT,
    "heart-ui":     PINK_AC,
    // Macarons
    "Color Purple": PURPLE,
    "Color Yellow": YELLOW,
    "Color Pink":   PINK_AC,
    // Drawing tablet / canvas
    "artboard":     CREAM,
    "artboard-2":   PINK_LT,
    // Easel painting (Chinese for "painting")
    "画":           BLUE,
    // Monitor UI
    "material-ui":  BLUE,
    "color-ui":     PINK_AC,
    "picture-ui":   PINK_AC,
    "text-ui":      DARK,
    // Wall pictures (varied — pink frames mostly, two darker)
    "picture-1":    PINK,
    "picture-2":    PINK,
    "picture-3":    PINK,
    "picture-4":    DARK,
    "picture-5":    PINK,
    "picture-6":    PINK,
    "picture-7":    PINK,
    "picture-8":    DARK,
    // Letters
    "A":            DARK,
    "a":            DARK
  };

  const PRIMITIVE_NAMES = new Set([
    "Cube","Rectangle","Cylinder","Sphere","Ellipse","Shape","Triangle","Group"
  ]);

  function findGroupLabel(node) {
    let cur = node;
    while (cur) {
      const name = cur.name || "";
      const first = name.split(" ")[0];
      if (name && name !== "Scene" && !PRIMITIVE_NAMES.has(first)) {
        return name;
      }
      cur = cur.parent;
    }
    return null;
  }

  const counts = {};
  const matched = {};
  const unmatched = {};
  let total = 0;
  model.traverse((node) => {
    if (!node.isMesh) return;
    // Log full ancestor chain for diagnostics
    const chain = [];
    let cur = node;
    while (cur) { chain.push(cur.name || "(unnamed)"); cur = cur.parent; }
    const label = findGroupLabel(node);
    const inMap = label && groupColors[label] !== undefined;
    const hex = inMap ? groupColors[label] : PINK;
    node.material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(hex),
      roughness: 0.7,
      metalness: 0.0
    });
    const k = label || "(unknown)";
    counts[k] = (counts[k] || 0) + 1;
    if (inMap) matched[k] = (matched[k] || 0) + 1;
    else unmatched[k] = (unmatched[k] || 0) + 1;
    total++;
    if (total <= 20) {
      console.log(`[room] mesh #${total}: chain=[${chain.reverse().join(" → ")}] → label="${label}" color=${inMap ? "matched" : "DEFAULT"}`);
    }
  });
  console.log("[room] total:", total, "matched:", matched, "unmatched (default pink):", unmatched);
}

// Walk up to find a meaningful ancestor name (skip generics like "Cube 4")
const PRIMITIVE_NAMES_DBG = new Set([
  "Cube","Rectangle","Cylinder","Sphere","Ellipse","Shape","Triangle","Group"
]);
function findGroupLabelDbg(node) {
  let cur = node;
  while (cur) {
    const name = cur.name || "";
    const first = name.split(" ")[0];
    if (name && name !== "Scene" && !PRIMITIVE_NAMES_DBG.has(first)) {
      return name;
    }
    cur = cur.parent;
  }
  return "(unknown)";
}

// Hover-over-mesh tooltip — shows the group name at the cursor.
function setupHoverTooltip(container, scene, camera, model) {
  const tip = document.createElement("div");
  Object.assign(tip.style, {
    position: "absolute",
    pointerEvents: "none",
    background: "rgba(0,0,0,0.85)",
    color: "white",
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "13px",
    fontFamily: "monospace",
    zIndex: "100",
    transform: "translate(8px, 8px)",
    display: "none",
    whiteSpace: "nowrap"
  });
  container.appendChild(tip);

  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();

  container.addEventListener("pointermove", (e) => {
    const rect = container.getBoundingClientRect();
    ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(ndc, camera);
    const hits = raycaster.intersectObject(model, true);
    if (hits.length > 0) {
      const label = findGroupLabelDbg(hits[0].object);
      tip.textContent = label;
      tip.style.left = (e.clientX - rect.left) + "px";
      tip.style.top  = (e.clientY - rect.top)  + "px";
      tip.style.display = "block";
    } else {
      tip.style.display = "none";
    }
  });
  container.addEventListener("pointerleave", () => { tip.style.display = "none"; });
}

// ──────────────────────────────────────────────────────────

export function createModelCard(container) {
  if (!container || container.dataset.modelReady === "true") return null;
  container.dataset.modelReady = "true";

  const url = container.dataset.model;
  if (!url) {
    console.warn("[model] no data-model URL on container");
    return null;
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const dpr = window.devicePixelRatio || 1;
  const w0 = container.clientWidth || 1;
  const h0 = container.clientHeight || 1;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, w0 / h0, 0.1, 100);
  camera.position.set(0, 0, 5);

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(dpr);
  renderer.setSize(w0, h0, false);
  Object.assign(renderer.domElement.style, {
    display: "block",
    width: "100%",
    height: "100%"
  });
  container.appendChild(renderer.domElement);

  // Lighting — 3-point + hemisphere for color variation top/bottom.
  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb0b8c4, 0.8));

  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(3, 4, 5);
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xffffff, 0.7);
  fill.position.set(-4, 0, 3);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0xffffff, 0.5);
  rim.position.set(0, -3, -4);
  scene.add(rim);

  // Click + drag to orbit the model. Rotation is cumulative — the model
  // stays where you let go.
  let targetRotY = 0;
  let targetRotX = 0;
  let currentRotY = 0;
  let currentRotX = 0;
  let isDragging = false;
  let lastX = 0;
  let lastY = 0;
  const DRAG_SENSITIVITY = 0.008; // radians per pixel
  const LERP = 0.18;
  const X_CLAMP = Math.PI / 2.2;  // prevent flipping upside down

  container.style.cursor = "grab";
  container.style.touchAction = "none"; // prevent page scroll on touch drag

  function onPointerDown(e) {
    isDragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    container.style.cursor = "grabbing";
    if (e.pointerId !== undefined) container.setPointerCapture(e.pointerId);
  }
  function onPointerMove(e) {
    if (!isDragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    targetRotY += dx * DRAG_SENSITIVITY;
    targetRotX += dy * DRAG_SENSITIVITY;
    targetRotX = Math.max(-X_CLAMP, Math.min(X_CLAMP, targetRotX));
  }
  function onPointerUp(e) {
    if (!isDragging) return;
    isDragging = false;
    container.style.cursor = "grab";
    if (e.pointerId !== undefined && container.hasPointerCapture(e.pointerId)) {
      container.releasePointerCapture(e.pointerId);
    }
  }
  container.addEventListener("pointerdown", onPointerDown);
  container.addEventListener("pointermove", onPointerMove);
  container.addEventListener("pointerup", onPointerUp);
  container.addEventListener("pointercancel", onPointerUp);

  let model = null;
  const loader = new GLTFLoader();
  loader.load(
    url,
    (gltf) => {
      model = gltf.scene;
      model.updateMatrixWorld(true);

      // Pick a colorization strategy based on the model
      const palette = container.dataset.palette || "icons";
      if (palette === "icons") colorIcons(model);
      else if (palette === "room") colorRoom(model);

      // Debug: hovering shows the group name in a tooltip
      if (container.dataset.debug === "true") setupHoverTooltip(container, scene, camera, model);

      // Center + scale to fit the camera view.
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const fitScale = maxDim > 0 ? 1.6 / maxDim : 1;
      model.scale.multiplyScalar(fitScale);
      model.position.sub(center.multiplyScalar(fitScale));
      scene.add(model);
      console.log("[model] loaded", url, "with", meshInfos.length, "meshes",
        meshInfos.map(m => `col${m.column}/${m.role}`));
    },
    undefined,
    (err) => console.error("[model] load failed:", err)
  );

  let visible = false;
  let rafId = 0;

  function tick() {
    if (!visible) return;
    rafId = requestAnimationFrame(tick);
    if (model) {
      currentRotY += (targetRotY - currentRotY) * LERP;
      currentRotX += (targetRotX - currentRotX) * LERP;
      model.rotation.y = currentRotY;
      model.rotation.x = currentRotX;
    }
    renderer.render(scene, camera);
  }

  if (reduceMotion) {
    renderer.render(scene, camera);
    visible = false;
  } else {
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !visible) {
        visible = true;
        tick();
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
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    if (!visible) renderer.render(scene, camera);
  });
  resize.observe(container);

  return {
    destroy() {
      cancelAnimationFrame(rafId);
      resize.disconnect();
      container.removeEventListener("pointerdown", onPointerDown);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerup", onPointerUp);
      container.removeEventListener("pointercancel", onPointerUp);
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      delete container.dataset.modelReady;
    }
  };
}

const targets = document.querySelectorAll("[data-model]");
console.log("[model] mounting on", targets.length, "element(s)");
targets.forEach(el => {
  try { createModelCard(el); }
  catch (err) { console.error("[model] mount failed:", err); }
});
