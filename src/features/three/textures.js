// Procedural canvas textures: realistic surfaces without downloading any image files.
import * as THREE from 'three';

const cache = new Map();

function make(key, w, h, draw, repeat) {
  const k = `${key}:${repeat ? repeat.join('x') : ''}`;
  if (cache.has(k)) return cache.get(k);
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  draw(g, w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  if (repeat) { tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(repeat[0], repeat[1]); }
  cache.set(k, tex);
  return tex;
}

// deterministic pseudo-random so textures are identical every load
function rng(seed) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

function speckle(g, w, h, n, colors, size, seed) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    g.fillStyle = colors[Math.floor(r() * colors.length)];
    const s = size * (0.4 + r());
    g.globalAlpha = 0.25 + r() * 0.35;
    g.fillRect(r() * w, r() * h, s, s);
  }
  g.globalAlpha = 1;
}

/** Monocrystalline cells with busbars — the face of a solar panel. */
export const solarCellsTexture = () => make('cells', 512, 1024, (g, w, h) => {
  const grad = g.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#0d1d3d');
  grad.addColorStop(0.5, '#132a57');
  grad.addColorStop(1, '#0b1a36');
  g.fillStyle = grad;
  g.fillRect(0, 0, w, h);
  const cols = 6; const rows = 12;
  const cw = w / cols; const ch = h / rows;
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const x = c * cw + 3; const y = r * ch + 3;
      const cg = g.createLinearGradient(x, y, x + cw, y + ch);
      cg.addColorStop(0, '#16336b'); cg.addColorStop(1, '#0f2550');
      g.fillStyle = cg;
      g.fillRect(x, y, cw - 6, ch - 6);
      // chamfered corners like real mono cells
      g.fillStyle = '#dfe6f2';
      const k = 7;
      [[x, y], [x + cw - 6 - k, y], [x, y + ch - 6 - k], [x + cw - 6 - k, y + ch - 6 - k]].forEach(([px, py]) => {
        g.beginPath(); g.moveTo(px, py); g.lineTo(px + k, py); g.lineTo(px, py + k); g.fill();
      });
      g.strokeStyle = 'rgba(200,210,230,0.55)';
      g.lineWidth = 1.4;
      for (let b = 1; b <= 3; b++) {
        g.beginPath(); g.moveTo(x + (cw - 6) * (b / 4), y); g.lineTo(x + (cw - 6) * (b / 4), y + ch - 6); g.stroke();
      }
    }
  }
  g.fillStyle = '#e8edf5';
  for (let c = 1; c < cols; c++) g.fillRect(c * cw - 1.5, 0, 3, h);
  for (let r = 1; r < rows; r++) g.fillRect(0, r * ch - 1.5, w, 3);
});

export const plasterTexture = (repeat = [2, 2]) => make('plaster', 256, 256, (g, w, h) => {
  g.fillStyle = '#efe6d6'; g.fillRect(0, 0, w, h);
  speckle(g, w, h, 2600, ['#e2d6c2', '#f7f0e4', '#d9ccb6'], 2.4, 7);
}, repeat);

export const concreteTexture = (repeat = [3, 3]) => make('concrete', 256, 256, (g, w, h) => {
  g.fillStyle = '#b9b4ab'; g.fillRect(0, 0, w, h);
  speckle(g, w, h, 3000, ['#a7a198', '#c9c4bb', '#9c958b'], 2.2, 11);
  g.strokeStyle = 'rgba(80,70,60,0.18)';
  g.lineWidth = 1;
  g.strokeRect(0.5, 0.5, w - 1, h - 1);
}, repeat);

export const brickTexture = (repeat = [4, 2]) => make('brick', 256, 128, (g, w, h) => {
  g.fillStyle = '#c9c1b2'; g.fillRect(0, 0, w, h);
  const bw = 64; const bh = 21;
  const r = rng(5);
  for (let y = 0; y < h; y += bh) {
    const off = (y / bh) % 2 ? bw / 2 : 0;
    for (let x = -bw; x < w + bw; x += bw) {
      const shade = 150 + Math.floor(r() * 40);
      g.fillStyle = `rgb(${shade + 40},${shade - 10},${shade - 40})`;
      g.fillRect(x + off + 2, y + 2, bw - 4, bh - 4);
    }
  }
}, repeat);

export const grassTexture = (repeat = [40, 40]) => make('grass', 256, 256, (g, w, h) => {
  g.fillStyle = '#5f8f3e'; g.fillRect(0, 0, w, h);
  speckle(g, w, h, 5000, ['#4f7d32', '#73a24c', '#6a9444', '#3f6b28'], 3, 3);
}, repeat);

export const roadTexture = (repeat = [20, 1]) => make('road', 256, 128, (g, w, h) => {
  g.fillStyle = '#3d4248'; g.fillRect(0, 0, w, h);
  speckle(g, w, h, 2500, ['#33373c', '#4a5057', '#2c3034'], 2, 9);
  g.fillStyle = '#e8e4d6';
  g.fillRect(20, h / 2 - 3, 90, 6);
  g.fillRect(150, h / 2 - 3, 90, 6);
}, repeat);

export const tankTexture = () => make('tank', 256, 256, (g, w, h) => {
  g.fillStyle = '#1f2a37'; g.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 32) {
    g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(0, y, w, 6);
  }
  g.fillStyle = '#2b6cb0'; g.fillRect(0, h * 0.42, w, 26);
});

export const acGrillTexture = () => make('acgrill', 256, 256, (g, w, h) => {
  g.fillStyle = '#e9ecef'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#c3c9d0';
  g.beginPath(); g.arc(w * 0.38, h / 2, w * 0.3, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#8a939d'; g.lineWidth = 3;
  for (let r = 10; r < w * 0.3; r += 10) { g.beginPath(); g.arc(w * 0.38, h / 2, r, 0, Math.PI * 2); g.stroke(); }
  g.fillStyle = '#d5dade'; g.fillRect(w * 0.76, h * 0.2, w * 0.16, h * 0.6);
});

export const vestTexture = () => make('vest', 128, 128, (g, w, h) => {
  g.fillStyle = '#ff7a1a'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#e8eef2';
  g.fillRect(0, h * 0.55, w, 12);
  g.fillRect(0, h * 0.78, w, 12);
  g.fillRect(w * 0.22, 0, 10, h);
  g.fillRect(w * 0.7, 0, 10, h);
});
