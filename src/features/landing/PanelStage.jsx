/* eslint-disable react/prop-types, react/no-unknown-property */
// The 3D pieces of the landing page, drawn like product photography on black:
//   <PanelStage />            one solar panel, floating and slowly turning (the hero)
//   <PanelStage field />      a field of panels sliding past under a moving light (the showreel card)
// Loaded on demand; the page shows fine without it.
import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const W = 1.134; const L = 2.278; const T = 0.035; // a 580 W panel, metres

/** The face of a modern half-cut mono panel: near-black cells, hairline gaps, fine busbars. */
function cellTexture() {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 2048;
  const g = c.getContext('2d');
  g.fillStyle = '#5d6a7e'; g.fillRect(0, 0, c.width, c.height);
  const cols = 6; const rows = 24; const gap = 3; const mid = 18; const edge = 12;
  const cw = (c.width - edge * 2) / cols; const ch = (c.height - edge * 2 - mid) / rows;
  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      const px = edge + x * cw + gap / 2; const py = edge + y * ch + gap / 2 + (y >= rows / 2 ? mid : 0);
      const lg = g.createLinearGradient(px, py, px + cw, py + ch);
      lg.addColorStop(0, '#11264f'); lg.addColorStop(0.5, '#0a1836'); lg.addColorStop(1, '#0f2147');
      g.fillStyle = lg; g.fillRect(px, py, cw - gap, ch - gap);
      g.strokeStyle = 'rgba(190,205,230,0.2)'; g.lineWidth = 1;
      for (let b = 1; b <= 11; b++) { const bx = px + ((cw - gap) * b) / 12; g.beginPath(); g.moveTo(bx, py); g.lineTo(bx, py + ch - gap); g.stroke(); }
    }
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 16;
  return t;
}

/** Studio lighting as reflections: a warm "sun" softbox, a cool strip and a dim floor, on black. */
function Studio({ intensity = 1 }) {
  const { gl, scene } = useThree();
  useEffect(() => {
    const room = new THREE.Scene();
    const box = (color, k, size, pos) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(...size), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(k), side: THREE.DoubleSide }));
      m.position.set(...pos); room.add(m);
    };
    box('#ff9a3c', 7, [7, 7, 0.2], [9, 6, 9]); // sun
    box('#ffffff', 4, [0.8, 14, 0.2], [-10, 2, 6]); // tall cool strip
    box('#8fb6ff', 1.6, [16, 0.2, 6], [0, 11, -4]); // sky
    box('#ffffff', 0.25, [30, 0.2, 30], [0, -9, 0]); // floor bounce
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(room, 0.03);
    scene.environment = env.texture; scene.environmentIntensity = intensity;
    return () => { scene.environment = null; env.dispose(); pmrem.dispose(); room.traverse((o) => { o.geometry?.dispose(); o.material?.dispose(); }); };
  }, [gl, scene, intensity]);
  return null;
}

function useParts() {
  return useMemo(() => {
    const f = 0.032; // frame width
    const bar = (w, l, x, z) => new THREE.BoxGeometry(w, T, l).translate(x, 0, z);
    return {
      cells: cellTexture(),
      glass: new THREE.BoxGeometry(W - f * 1.2, 0.006, L - f * 1.2).translate(0, T / 2 - 0.006, 0),
      back: new THREE.BoxGeometry(W - f, 0.004, L - f).translate(0, -T / 2 + 0.008, 0),
      frame: mergeGeometries([bar(W, f, 0, L / 2 - f / 2), bar(W, f, 0, -L / 2 + f / 2), bar(f, L - f * 2, W / 2 - f / 2, 0), bar(f, L - f * 2, -W / 2 + f / 2, 0)]),
      frameMat: new THREE.MeshStandardMaterial({ color: '#9aa2ad', metalness: 1, roughness: 0.3 }),
      glassMat: new THREE.MeshPhysicalMaterial({ metalness: 0, roughness: 0.5, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 1 }),
      backMat: new THREE.MeshStandardMaterial({ color: '#d9dde3', roughness: 0.7 }),
    };
  }, []);
}

/** One panel: anodised aluminium frame, glass over cells, white back sheet. */
function Panel({ parts }) {
  useEffect(() => { parts.glassMat.map = parts.cells; parts.glassMat.needsUpdate = true; }, [parts]);
  return (
    <group>
      <mesh geometry={parts.frame} material={parts.frameMat} />
      <mesh geometry={parts.glass} material={parts.glassMat} />
      <mesh geometry={parts.back} material={parts.backMat} />
    </group>
  );
}

/* --------------------------------- hero ---------------------------------- */
function HeroPanel({ pointer }) {
  const g = useRef(); const key = useRef();
  const parts = useParts();
  const { viewport } = useThree();
  // on narrow screens the panel sits in the middle; on wide ones to the right of centre
  const x = viewport.aspect > 1.1 ? viewport.width * 0.17 : 0;
  const s = viewport.aspect > 1.1 ? 1 : 0.82;
  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;
    const k = Math.min(1, dt * 3);
    g.current.rotation.y += (-0.5 + Math.sin(t * 0.35) * 0.22 + pointer.current.x * 0.35 - g.current.rotation.y) * k;
    g.current.rotation.x += (0.16 + Math.sin(t * 0.27) * 0.05 + pointer.current.y * 0.14 - g.current.rotation.x) * k;
    g.current.position.y = 0.12 + Math.sin(t * 0.6) * 0.045;
    key.current.position.set(Math.sin(t * 0.3) * 2.5 + 2.5, 1.6, 2.6); // a slow sweep of warm light across the glass
  });
  return (
    <>
      <group ref={g} position={[x, 0.12, 0]} scale={s}>
        <group rotation={[Math.PI / 2, 0, 0.14]}><Panel parts={parts} /></group>
      </group>
      <pointLight ref={key} intensity={9} distance={12} decay={2} color="#ffb768" />
      <directionalLight position={[-3, 2.5, 5]} intensity={1.7} color="#cfe0ff" />
    </>
  );
}

/* --------------------------------- field --------------------------------- */
// Rows of tilted panels running to the horizon. Every panel is an instance, so the whole field is three draw calls.
const COLS = 22; const ROWS = 9; const GX = W + 0.06; const GZ = L * 0.94 + 0.9;

function Field() {
  const parts = useParts();
  const group = useRef(); const sweep = useRef();
  const refs = [useRef(), useRef(), useRef()];
  const { scene } = useThree();
  useEffect(() => {
    parts.glassMat.map = parts.cells; parts.glassMat.needsUpdate = true;
    scene.fog = new THREE.Fog('#0b0b0b', 9, 26);
    const m = new THREE.Object3D();
    for (let i = 0; i < COLS * ROWS; i++) {
      m.position.set(((i % COLS) - (COLS - 1) / 2) * GX, 0, (Math.floor(i / COLS) - (ROWS - 1) / 2) * GZ - 6);
      m.rotation.set(0.42, 0, 0); // tilted up towards the sun
      m.updateMatrix();
      refs.forEach((r) => r.current.setMatrixAt(i, m.matrix));
    }
    refs.forEach((r) => { r.current.instanceMatrix.needsUpdate = true; });
    return () => { scene.fog = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parts, scene]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    group.current.position.x = ((t * 0.1) % GX) - GX / 2; // an endless slow slide
    sweep.current.position.set(Math.sin(t * 0.22) * 9, 2.6, -4 + Math.cos(t * 0.17) * 5);
  });
  const n = COLS * ROWS;
  return (
    <>
      <group ref={group} rotation={[0, 0, 0]}>
        <instancedMesh ref={refs[0]} args={[parts.frame, parts.frameMat, n]} frustumCulled={false} />
        <instancedMesh ref={refs[1]} args={[parts.glass, parts.glassMat, n]} frustumCulled={false} />
        <instancedMesh ref={refs[2]} args={[parts.back, parts.backMat, n]} frustumCulled={false} />
      </group>
      <pointLight ref={sweep} intensity={90} distance={18} decay={2} color="#ffb768" />
      <directionalLight position={[-3, 6, 4]} intensity={0.35} color="#bcd4ff" />
    </>
  );
}

export default function PanelStage({ field = false, active = true }) {
  const pointer = useRef({ x: 0, y: 0 });
  useEffect(() => {
    if (field) return undefined;
    const move = (e) => { pointer.current = { x: (e.clientX / window.innerWidth) * 2 - 1, y: (e.clientY / window.innerHeight) * 2 - 1 }; };
    window.addEventListener('pointermove', move, { passive: true });
    return () => window.removeEventListener('pointermove', move);
  }, [field]);
  return (
    <Canvas
      dpr={[1, 2]} frameloop={active ? 'always' : 'never'}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={field ? { position: [-3.5, 2.7, 5.2], fov: 36, near: 0.1, far: 80 } : { position: [0, 0, 5.2], fov: 32, near: 0.1, far: 50 }}
      onCreated={({ camera }) => { if (field) camera.lookAt(1.2, 0.2, -5); }}
      style={{ pointerEvents: 'none' }}
    >
      <Studio intensity={field ? 0.8 : 1} />
      {field ? <Field /> : <HeroPanel pointer={pointer} />}
    </Canvas>
  );
}
