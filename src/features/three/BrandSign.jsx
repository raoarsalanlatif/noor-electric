/* eslint-disable react/prop-types, react/no-unknown-property */
import { useEffect, useState } from 'react';
import * as THREE from 'three';

// "Powered by Noor Electric" signboard used on every building in the 3D scenes.
// The texture is drawn once on a canvas (logo + wordmark) and shared by all signs.

const CW = 1400;
const CH = 200;
let shared = null;
const listeners = new Set();

function draw(logo) {
  const c = document.createElement('canvas');
  c.width = CW; c.height = CH;
  const g = c.getContext('2d');
  // board
  const grad = g.createLinearGradient(0, 0, CW, 0);
  grad.addColorStop(0, '#0a1f4d');
  grad.addColorStop(1, '#123a8c');
  g.fillStyle = grad;
  g.fillRect(0, 0, CW, CH);
  // accent stripe in brand colours
  const acc = g.createLinearGradient(0, 0, CW, 0);
  acc.addColorStop(0, '#f6b915'); acc.addColorStop(0.6, '#f37021'); acc.addColorStop(1, '#e5322d');
  g.fillStyle = acc;
  g.fillRect(0, CH - 14, CW, 14);
  // logo on a white disc
  g.fillStyle = '#ffffff';
  g.beginPath(); g.arc(100, 93, 74, 0, Math.PI * 2); g.fill();
  if (logo) g.drawImage(logo, 36, 29, 128, 128);
  // wordmark
  g.textBaseline = 'middle';
  g.fillStyle = '#f6b915';
  g.font = '700 40px Poppins, "Segoe UI", Arial, sans-serif';
  g.fillText('POWERED BY', 205, 58);
  g.fillStyle = '#ffffff';
  g.font = '800 78px Poppins, "Segoe UI", Arial, sans-serif';
  g.fillText('NOOR ELECTRIC', 202, 122);
  g.fillStyle = 'rgba(255,255,255,0.75)';
  g.font = '600 34px Poppins, "Segoe UI", Arial, sans-serif';
  g.textAlign = 'right';
  g.fillText('noorelectric.org', CW - 40, 122);
  return c;
}

function getTexture() {
  if (shared) return shared;
  const tex = new THREE.CanvasTexture(draw(null));
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  shared = tex;
  const img = new Image();
  img.onload = () => {
    tex.image = draw(img);
    tex.needsUpdate = true;
    listeners.forEach((fn) => fn());
  };
  img.src = `${import.meta.env.BASE_URL}images/logo-192.png`;
  return tex;
}

/**
 * Wall-mounted sign. `position` is the centre of the sign face; it faces +Z unless rotated.
 * `width` sets the size; the height follows the artwork's aspect ratio.
 */
export default function BrandSign({ position, rotation = [0, 0, 0], width = 3 }) {
  const [tex] = useState(getTexture);
  const [, bump] = useState(0);
  useEffect(() => {
    const fn = () => bump((n) => n + 1);
    listeners.add(fn);
    return () => listeners.delete(fn);
  }, []);
  const h = width * (CH / CW);
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0, -0.03]} castShadow>
        <boxGeometry args={[width + 0.08, h + 0.08, 0.05]} />
        <meshStandardMaterial color="#d1d5db" metalness={0.6} roughness={0.35} />
      </mesh>
      <mesh>
        <planeGeometry args={[width, h]} />
        <meshStandardMaterial map={tex} roughness={0.45} emissive="#ffffff" emissiveMap={tex} emissiveIntensity={0.18} toneMapped={false} />
      </mesh>
    </group>
  );
}
