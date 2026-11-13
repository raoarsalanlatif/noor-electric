/* eslint-disable react/prop-types, react/no-unknown-property */
import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Sky, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { sunPosition, daylightFromAlt } from './sun';
import { grassTexture, roadTexture, plasterTexture, brickTexture } from './textures';

const FOG_DAY = new THREE.Color('#cfe2f3');
const FOG_DUSK = new THREE.Color('#e9b38a');
const FOG_NIGHT = new THREE.Color('#0a1022');

/** Physical sky, sun/moon lights and stars driven by a shared clock ref ({ hour }). */
export function SkySystem({ clock, lat, season, shadowSize = 30 }) {
  const sky = useRef();
  const sun = useRef();
  const moon = useRef();
  const amb = useRef();
  const hemi = useRef();
  const stars = useRef();
  const { scene, gl } = useThree();
  const target = useMemo(() => new THREE.Object3D(), []);
  const tmp = useMemo(() => new THREE.Color(), []);

  useEffect(() => {
    scene.fog = new THREE.Fog(FOG_DAY, 70, 220);
    scene.add(target);
    return () => { scene.remove(target); scene.fog = null; };
  }, [scene, target]);

  useFrame(() => {
    const { alt, dir } = sunPosition(lat, season, clock.current.hour);
    const d = daylightFromAlt(alt);
    const [x, y, z] = dir;
    if (sky.current) sky.current.material.uniforms.sunPosition.value.set(x * 1000, y * 1000, z * 1000);
    sun.current.position.set(x * 60, Math.max(y, 0.02) * 60, z * 60);
    sun.current.target = target;
    sun.current.intensity = alt > 0 ? 0.4 + d * 2.6 : 0;
    sun.current.color.setHSL(0.1, 0.9, 0.62 + d * 0.3);
    moon.current.intensity = alt > 0 ? 0 : 0.35;
    amb.current.intensity = 0.12 + d * 0.35;
    hemi.current.intensity = 0.18 + d * 0.55;
    gl.toneMappingExposure = 0.55 + (1 - d) * 0.15;
    if (stars.current) stars.current.visible = alt < -3;
    if (d > 0.35) tmp.copy(FOG_DAY);
    else if (alt > -2) tmp.copy(FOG_DUSK).lerp(FOG_DAY, d / 0.35);
    else tmp.copy(FOG_DUSK).lerp(FOG_NIGHT, Math.min(1, (-alt - 2) / 8));
    scene.fog.color.copy(tmp);
  });

  return (
    <>
      <Sky ref={sky} distance={4500} turbidity={6} rayleigh={1.6} mieCoefficient={0.006} mieDirectionalG={0.85} />
      <group ref={stars}><Stars radius={300} depth={60} count={2500} factor={5} fade speed={0.5} /></group>
      <ambientLight ref={amb} />
      <hemisphereLight ref={hemi} args={['#cfe8ff', '#4a6a35', 0.4]} />
      <directionalLight
        ref={sun}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
        shadow-camera-left={-shadowSize}
        shadow-camera-right={shadowSize}
        shadow-camera-top={shadowSize}
        shadow-camera-bottom={-shadowSize}
        shadow-camera-far={150}
      />
      <directionalLight ref={moon} position={[-30, 40, -20]} color="#9db4ff" intensity={0} />
    </>
  );
}

function Tree({ position, s = 1 }) {
  return (
    <group position={position} scale={s}>
      <mesh position={[0, 1.2, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.24, 2.4, 8]} />
        <meshStandardMaterial color="#6b4a2f" roughness={1} />
      </mesh>
      {[[0, 3.1, 0, 1.5], [0.6, 2.7, 0.3, 1.1], [-0.6, 2.8, -0.2, 1.15], [0, 3.9, 0.1, 1]].map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]} castShadow>
          <icosahedronGeometry args={[r, 1]} />
          <meshStandardMaterial color={i % 2 ? '#3f7a32' : '#4d8a3a'} roughness={0.95} flatShading />
        </mesh>
      ))}
    </group>
  );
}

function StreetLamp({ position, clock, lat, season }) {
  const bulb = useRef();
  const light = useRef();
  useFrame(() => {
    const { alt } = sunPosition(lat, season, clock.current.hour);
    const on = alt < 2;
    bulb.current.emissiveIntensity = on ? 3 : 0;
    light.current.intensity = on ? 18 : 0;
  });
  return (
    <group position={position}>
      <mesh position={[0, 2.6, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.09, 5.2, 8]} />
        <meshStandardMaterial color="#4b5563" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, 5.15, -0.5]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 1, 6]} />
        <meshStandardMaterial color="#4b5563" />
      </mesh>
      <mesh position={[0, 5.05, -0.95]}>
        <boxGeometry args={[0.3, 0.1, 0.5]} />
        <meshStandardMaterial ref={bulb} color="#fff7d6" emissive="#ffd27a" emissiveIntensity={0} />
      </mesh>
      <pointLight ref={light} position={[0, 4.8, -0.95]} distance={16} decay={1.6} color="#ffd9a0" />
    </group>
  );
}

function NeighbourHouse({ position, size, windowsRef, idx }) {
  const plaster = useMemo(() => {
    const t = plasterTexture([size[0] / 3, size[1] / 3]).clone();
    t.needsUpdate = true;
    return t;
  }, [size]);
  return (
    <group position={position}>
      <mesh position={[0, size[1] / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial map={plaster} color={idx % 2 ? '#f1e3cf' : '#e9edf0'} roughness={0.95} />
      </mesh>
      <mesh position={[0, size[1] + 0.25, 0]} castShadow>
        <boxGeometry args={[size[0] + 0.2, 0.5, size[2] + 0.2]} />
        <meshStandardMaterial color="#d6cbb8" />
      </mesh>
      {[0.3, 0.68].map((h, i) => (
        <mesh key={i} position={[0, size[1] * h, size[2] / 2 + 0.01]}>
          <planeGeometry args={[size[0] * 0.6, 1.1]} />
          <meshStandardMaterial ref={(m) => { windowsRef.current[idx * 2 + i] = m; }} color="#253445" emissive="#ffcf7a" emissiveIntensity={0} />
        </mesh>
      ))}
    </group>
  );
}

/** Ground, road, boundary wall, trees, street lamps and neighbouring houses. */
export function Neighbourhood({ roof, clock, lat, season, compact = false }) {
  const W = roof.width; const L = roof.length;
  const windows = useRef([]);
  const grass = useMemo(() => grassTexture([50, 50]), []);
  const road = useMemo(() => roadTexture([24, 1]), []);
  const brick = useMemo(() => brickTexture([1, 1]), []);
  const plotW = W + 6; const plotL = L + 7;
  useFrame(() => {
    const { alt } = sunPosition(lat, season, clock.current.hour);
    const v = alt < 1 ? 1.3 : 0;
    windows.current.forEach((m) => { if (m) m.emissiveIntensity = v; });
  });
  const wallH = 1.6;
  const wallMat = <meshStandardMaterial map={brick} color="#d8cdbd" roughness={0.95} />;
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[160, 64]} />
        <meshStandardMaterial map={grass} roughness={1} />
      </mesh>
      {/* road and pavement */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, L / 2 + 7]} receiveShadow>
        <planeGeometry args={[240, 7]} />
        <meshStandardMaterial map={road} roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.06, L / 2 + 3.1]} receiveShadow>
        <boxGeometry args={[240, 0.12, 1.8]} />
        <meshStandardMaterial color="#b9b2a6" roughness={1} />
      </mesh>
      {/* plot floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0.5]} receiveShadow>
        <planeGeometry args={[plotW, plotL]} />
        <meshStandardMaterial color="#c8c0b2" roughness={1} />
      </mesh>
      {/* boundary wall with a gate gap at the front */}
      <mesh position={[-plotW / 2, wallH / 2, 0.5]} castShadow receiveShadow><boxGeometry args={[0.25, wallH, plotL]} />{wallMat}</mesh>
      <mesh position={[plotW / 2, wallH / 2, 0.5]} castShadow receiveShadow><boxGeometry args={[0.25, wallH, plotL]} />{wallMat}</mesh>
      <mesh position={[0, wallH / 2, 0.5 - plotL / 2]} castShadow receiveShadow><boxGeometry args={[plotW, wallH, 0.25]} />{wallMat}</mesh>
      <mesh position={[-plotW / 4 - 1.6, wallH / 2, 0.5 + plotL / 2]} castShadow receiveShadow><boxGeometry args={[plotW / 2 - 3.2, wallH, 0.25]} />{wallMat}</mesh>
      <mesh position={[plotW / 4 + 1.6, wallH / 2, 0.5 + plotL / 2]} castShadow receiveShadow><boxGeometry args={[plotW / 2 - 3.2, wallH, 0.25]} />{wallMat}</mesh>
      {/* gate */}
      <mesh position={[0, 1, 0.5 + plotL / 2]} castShadow>
        <boxGeometry args={[3.2, 2, 0.08]} />
        <meshStandardMaterial color="#1f2937" metalness={0.7} roughness={0.35} />
      </mesh>

      <Tree position={[-plotW / 2 + 1.4, 0, plotL / 2 - 1]} s={0.9} />
      <Tree position={[plotW / 2 + 4, 0, -L / 2 - 2]} s={1.2} />
      <Tree position={[-plotW / 2 - 5, 0, L / 2 + 1]} s={1.1} />
      {!compact && <Tree position={[plotW / 2 + 9, 0, L / 2 + 2]} s={1} />}

      <StreetLamp position={[-plotW / 2 - 1, 0, L / 2 + 3.4]} clock={clock} lat={lat} season={season} />
      <StreetLamp position={[plotW / 2 + 6, 0, L / 2 + 3.4]} clock={clock} lat={lat} season={season} />

      {!compact && (
        <>
          <NeighbourHouse idx={0} windowsRef={windows} position={[-plotW / 2 - 9, 0, -4]} size={[10, 6.4, 11]} />
          <NeighbourHouse idx={1} windowsRef={windows} position={[plotW / 2 + 17, 0, -8]} size={[9, 6.4, 10]} />
          <NeighbourHouse idx={2} windowsRef={windows} position={[-3, 0, -L / 2 - 14]} size={[14, 6.4, 9]} />
        </>
      )}
    </group>
  );
}
