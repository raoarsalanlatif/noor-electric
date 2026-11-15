/* eslint-disable react/prop-types, react/no-unknown-property */
import { useMemo } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { solarCellsTexture, solarCellsTextureHD } from './textures';

export const PANEL_TILT = (15 * Math.PI) / 180;

// Geometry and frame materials are shared by every panel of the same size (one copy in memory, not one per panel).
const cache = new Map();
const shared = (key, build) => { if (!cache.has(key)) cache.set(key, build()); return cache.get(key); };
const frameGeo = (p) => shared(`f:${p.width}:${p.length}`, () => new THREE.BoxGeometry(p.width, 0.045, p.length));
const faceGeo = (p) => shared(`c:${p.width}:${p.length}`, () => new THREE.PlaneGeometry(p.width - 0.05, p.length - 0.05));
const frameMat = (realistic) => shared(`fm:${realistic}`, () => new THREE.MeshStandardMaterial(realistic
  ? { color: '#b9c0c9', metalness: 0.85, roughness: 0.32 }
  : { color: '#cfd5dd', metalness: 0.35, roughness: 0.35 }));

/**
 * Aluminium-framed mono panel; face points up, long side along z.
 * `realistic` (Solar Planner) uses a glass-covered face that reflects the sky; the default look is unchanged.
 */
export default function SolarPanelModel({ panel, cellsRef, dirt = 0, realistic = false }) {
  const cells = useMemo(() => (realistic ? solarCellsTextureHD() : solarCellsTexture()), [realistic]);
  return (
    <group>
      <mesh castShadow receiveShadow geometry={frameGeo(panel)} material={frameMat(realistic)} />
      <mesh position={[0, 0.024, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow geometry={faceGeo(panel)}>
        {realistic ? (
          <meshPhysicalMaterial
            ref={cellsRef}
            map={cells}
            metalness={0}
            roughness={0.4}
            clearcoat={0.7}
            clearcoatRoughness={0.08}
            envMapIntensity={0.8}
            emissive="#2f6bff"
            emissiveIntensity={0.02}
          />
        ) : (
          <meshStandardMaterial
            ref={cellsRef}
            map={cells}
            metalness={0.25}
            roughness={0.22}
            emissive="#2f6bff"
            emissiveIntensity={0.02}
            color={dirt > 0 ? '#b59b74' : '#ffffff'}
          />
        )}
      </mesh>
    </group>
  );
}

const legMat = () => shared('lm', () => new THREE.MeshStandardMaterial({ color: '#9ca3af', metalness: 0.8, roughness: 0.35 }));

/** Mounting legs for a tilted panel sitting on a flat roof (the four legs are one mesh). */
export function PanelLegs({ panel, base = 0.25 }) {
  const geo = shared(`l:${panel.width}:${panel.length}:${base}`, () => {
    const depth = panel.length * Math.cos(PANEL_TILT);
    const back = base + Math.sin(PANEL_TILT) * panel.length;
    const parts = [];
    [-panel.width / 2 + 0.1, panel.width / 2 - 0.1].forEach((x) => {
      parts.push(new THREE.BoxGeometry(0.04, base, 0.04).translate(x, base / 2, depth / 2 - 0.1));
      parts.push(new THREE.BoxGeometry(0.04, back, 0.04).translate(x, back / 2, -depth / 2 + 0.1));
    });
    return mergeGeometries(parts);
  });
  return <mesh castShadow geometry={geo} material={legMat()} />;
}
