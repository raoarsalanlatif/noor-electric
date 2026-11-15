/* eslint-disable react/prop-types, react/no-unknown-property */
// The 3D scene in the landing-page hero: a floating island with a solar-powered house.
// The sun circles the island, so the scene runs through day and night — panels glint in the sun,
// energy rises from the roof, and the windows stay lit after dark.
// Loaded only when the hero is shown and the browser supports WebGL (see HeroSection).
import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import HouseModel from '../three/HouseModel';
import SolarPanelModel, { PanelLegs, PANEL_TILT } from '../three/SolarPanelModel';
import { houseHeight } from '../three/dims';
import { lawnTexture } from '../three/textures';
import { roofLayout, roofObstacles } from '../planner/sizing';
import { PANEL_OPTIONS, defaultRoofItems } from '../planner/config';

const ROOF = { width: 9, length: 11 };
const SITE = { storeys: 2, parapetH: 0.9, structure: 'L2', items: defaultRoofItems(ROOF) };
const PANEL = PANEL_OPTIONS[2];
const DAY = 38; // seconds for one trip of the sun around the island

/** Soft reflections for glass and metal, without downloading an environment image. */
function Reflections() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = env.texture;
    scene.environmentIntensity = 0.45;
    return () => { scene.environment = null; env.dispose(); pmrem.dispose(); };
  }, [gl, scene]);
  return null;
}

/** Round glow sprite texture (drawn once). */
function useGlowTexture() {
  return useMemo(() => {
    const c = document.createElement('canvas'); c.width = 128; c.height = 128;
    const g = c.getContext('2d');
    const rg = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    rg.addColorStop(0, 'rgba(255,236,170,1)'); rg.addColorStop(0.25, 'rgba(255,196,70,0.55)'); rg.addColorStop(1, 'rgba(255,170,40,0)');
    g.fillStyle = rg; g.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
}

/** The sun and its light, circling the island; `day` is 1 at noon and 0 at night. */
function Sun({ day, lit }) {
  const ball = useRef(); const light = useRef(); const moon = useRef(); const hemi = useRef(); const halo = useRef();
  const glow = useGlowTexture();
  const target = useMemo(() => new THREE.Object3D(), []);
  useFrame(({ clock }) => {
    const a = (clock.elapsedTime / DAY) * Math.PI * 2 + 0.9;
    const x = Math.cos(a) * 30; const y = Math.sin(a) * 24 + 3; const z = -10 + Math.sin(a) * 6;
    const up = THREE.MathUtils.clamp((y + 2) / 14, 0, 1);
    day.current = up;
    lit.current = up < 0.25 ? 1.5 : 0.04;
    ball.current.position.set(x, y, z);
    halo.current.position.set(x, y, z);
    halo.current.material.opacity = 0.35 + up * 0.6;
    light.current.position.set(x, Math.max(y, 2), z + 14);
    light.current.intensity = 0.25 + up * 3;
    light.current.color.setHSL(0.09, 0.9, 0.6 + up * 0.32);
    moon.current.intensity = (1 - up) * 0.9;
    hemi.current.intensity = 0.22 + up * 0.5;
  });
  return (
    <>
      <primitive object={target} position={[0, 4, 0]} />
      <mesh ref={ball}>
        <sphereGeometry args={[1.5, 24, 24]} />
        <meshBasicMaterial color="#ffd76a" toneMapped={false} />
      </mesh>
      <sprite ref={halo} scale={[15, 15, 1]}>
        <spriteMaterial map={glow} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      <directionalLight
        ref={light} target={target} castShadow
        shadow-mapSize={[1024, 1024]} shadow-bias={-0.0005} shadow-normalBias={0.04}
        shadow-camera-left={-18} shadow-camera-right={18} shadow-camera-top={18} shadow-camera-bottom={-18} shadow-camera-far={90}
      />
      <directionalLight ref={moon} position={[-14, 18, 12]} color="#8fb0ff" intensity={0} />
      <hemisphereLight ref={hemi} args={['#cfe4ff', '#3d5a2c', 0.5]} />
      <ambientLight intensity={0.12} />
    </>
  );
}

/** Golden sparks rising from the panels while the sun is up: energy being made. */
function Energy({ slots, y, day }) {
  const ref = useRef();
  const N = 70;
  const seeds = useMemo(() => Array.from({ length: N }, (_, i) => {
    const s = slots[i % slots.length];
    return { x: s.x + (Math.random() - 0.5) * 1, z: s.z + (Math.random() - 0.5) * 1.8, o: Math.random(), v: 0.5 + Math.random() * 0.7 };
  }), [slots]);
  const positions = useMemo(() => new Float32Array(N * 3), []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    seeds.forEach((p, i) => {
      const life = (t * 0.22 * p.v + p.o) % 1;
      positions[i * 3] = p.x + Math.sin(t * 0.8 + i) * 0.25 * life;
      positions[i * 3 + 1] = y + life * 7;
      positions[i * 3 + 2] = p.z;
    });
    ref.current.geometry.attributes.position.needsUpdate = true;
    ref.current.material.opacity = 0.9 * day.current;
  });
  return (
    <points ref={ref}>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry>
      <pointsMaterial color="#ffd15c" size={0.22} transparent depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation />
    </points>
  );
}

function Tree({ position, s = 1 }) {
  return (
    <group position={position} scale={s}>
      <mesh position={[0, 1.1, 0]} castShadow><cylinderGeometry args={[0.15, 0.22, 2.2, 7]} /><meshStandardMaterial color="#6b4a2f" roughness={1} /></mesh>
      {[[0, 3, 0, 1.45], [0.6, 2.6, 0.3, 1.05], [-0.55, 2.7, -0.2, 1.1], [0, 3.8, 0.1, 0.95]].map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]} castShadow><icosahedronGeometry args={[r, 1]} /><meshStandardMaterial color={i % 2 ? '#3f7a32' : '#4d8a3a'} roughness={0.95} flatShading /></mesh>
      ))}
    </group>
  );
}

/** The floating piece of land the house stands on. */
function Island() {
  const lawn = useMemo(() => lawnTexture([7, 7]), []);
  const rock = useMemo(() => {
    const g = new THREE.ConeGeometry(12.6, 11, 9, 4);
    const p = g.attributes.position; // roughen the rock so it does not look like a perfect cone
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i); if (y > 5.4) continue;
      p.setX(i, p.getX(i) * (0.82 + Math.sin(i * 12.9898) * 0.16)); p.setZ(i, p.getZ(i) * (0.82 + Math.cos(i * 78.233) * 0.16));
    }
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <group>
      <mesh position={[0, -0.35, 0]} receiveShadow>
        <cylinderGeometry args={[13.4, 12.8, 0.7, 48]} />
        <meshStandardMaterial map={lawn} roughness={1} />
      </mesh>
      <mesh position={[0, -1.05, 0]}><cylinderGeometry args={[12.9, 12.6, 0.8, 48]} /><meshStandardMaterial color="#6d5237" roughness={1} /></mesh>
      <mesh geometry={rock} position={[0, -6.9, 0]} rotation={[Math.PI, 0, 0]}><meshStandardMaterial color="#5a4a3e" roughness={1} flatShading /></mesh>
      {/* paved plot and path */}
      <mesh position={[0, 0.02, 0.6]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[ROOF.width + 4.5, ROOF.length + 5]} /><meshStandardMaterial color="#c8c0b2" roughness={1} /></mesh>
      <mesh position={[0, 0.03, ROOF.length / 2 + 4.4]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[2.4, 3.6]} /><meshStandardMaterial color="#b7afa1" roughness={1} /></mesh>
      <Tree position={[-9, 0, 4.5]} s={1.15} /><Tree position={[9.2, 0, -3]} s={1.3} /><Tree position={[-7.5, 0, -7]} s={0.95} /><Tree position={[7.4, 0, 7.4]} s={0.9} />
    </group>
  );
}

function Diorama({ pointer }) {
  const spin = useRef(); const day = useRef(1); const lit = useRef(0); const cells = useRef([]);
  const roofTop = houseHeight(SITE);
  const layout = useMemo(() => roofLayout(ROOF, PANEL, SITE, 'L2'), []);
  const obstacles = useMemo(() => roofObstacles(ROOF, SITE), []);
  const base = layout.structure.frontH;
  const y = roofTop + base + Math.sin(PANEL_TILT) * PANEL.length * 0.5;
  useFrame(({ clock }, dt) => {
    // slow turn, nudged by the pointer
    const want = clock.elapsedTime * 0.07 + pointer.current.x * 0.5 - 0.55;
    spin.current.rotation.y += (want - spin.current.rotation.y) * Math.min(1, dt * 2.5);
    spin.current.rotation.x += (pointer.current.y * 0.07 - spin.current.rotation.x) * Math.min(1, dt * 2.5);
    cells.current.forEach((m) => { if (m) m.emissiveIntensity = 0.02 + day.current * 0.2; });
  });
  return (
    <>
      <Sun day={day} lit={lit} />
      <Float speed={1.1} rotationIntensity={0.05} floatIntensity={0.9} floatingRange={[-0.35, 0.35]}>
        <group ref={spin} position={[0, -2.2, 0]}>
          <Island />
          <HouseModel roof={ROOF} site={SITE} obstacles={obstacles} litRef={lit} />
          {layout.slots.map((s, i) => (
            <group key={i} position={[s.x, y, s.z]}>
              <group rotation={[PANEL_TILT, 0, 0]}><SolarPanelModel panel={PANEL} realistic cellsRef={(m) => { cells.current[i] = m; }} /></group>
              <group position={[0, -(base + Math.sin(PANEL_TILT) * PANEL.length * 0.5), 0]}><PanelLegs panel={PANEL} base={base} /></group>
            </group>
          ))}
          <Energy slots={layout.slots} y={y + 0.3} day={day} />
        </group>
      </Float>
      <Sparkles count={70} scale={[70, 40, 30]} position={[0, 4, -12]} size={2.2} speed={0.25} opacity={0.5} color="#bcd4ff" />
    </>
  );
}

export default function HeroScene({ active = true }) {
  const pointer = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const move = (e) => { pointer.current = { x: (e.clientX / window.innerWidth) * 2 - 1, y: (e.clientY / window.innerHeight) * 2 - 1 }; };
    window.addEventListener('pointermove', move, { passive: true });
    return () => window.removeEventListener('pointermove', move);
  }, []);
  return (
    <Canvas
      shadows dpr={[1, 1.75]} frameloop={active ? 'always' : 'never'}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{ position: [30, 14, 37], fov: 34, near: 1, far: 300 }}
      onCreated={({ camera }) => camera.lookAt(-3.5, 1.2, 0)}
      style={{ pointerEvents: 'none' }}
    >
      <Reflections />
      <Diorama pointer={pointer} />
    </Canvas>
  );
}
