/* eslint-disable react/prop-types, react/no-unknown-property */
import { forwardRef, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { vestTexture } from './textures';

/**
 * Low-poly installer with a hard hat and hi-vis vest.
 * Drive it by mutating `anim.current`:
 *   { mode: 'idle'|'walk'|'carry'|'climb'|'pull'|'facepalm'|'cheer', speed: 1, moving: bool }
 * The outer group (ref) is positioned/rotated by the caller.
 */
const Worker = forwardRef(function Worker({ anim, skin = '#c68e64', pants = '#2d3e50', scale = 1, carryPanel = null }, ref) {
  const legL = useRef(); const legR = useRef();
  const armL = useRef(); const armR = useRef();
  const torso = useRef(); const head = useRef();
  const phase = useRef(Math.random() * 6);
  const mats = useMemo(() => ({
    skin: new THREE.MeshStandardMaterial({ color: skin, roughness: 0.7 }),
    pants: new THREE.MeshStandardMaterial({ color: pants, roughness: 0.9 }),
    vest: new THREE.MeshStandardMaterial({ map: vestTexture(), roughness: 0.6 }),
    shirt: new THREE.MeshStandardMaterial({ color: '#1e3a8a', roughness: 0.8 }),
    hat: new THREE.MeshStandardMaterial({ color: '#ffc61a', roughness: 0.35, metalness: 0.1 }),
    boot: new THREE.MeshStandardMaterial({ color: '#3b2a1e', roughness: 0.9 }),
    glove: new THREE.MeshStandardMaterial({ color: '#f4f4f4', roughness: 0.8 }),
  }), [skin, pants]);

  useFrame((_, dt) => {
    const a = anim.current;
    const sp = a.speed || 1;
    phase.current += dt * 9 * sp * (a.moving || a.mode === 'climb' || a.mode === 'pull' || a.mode === 'cheer' ? 1 : 0.15);
    const p = phase.current;
    const s = Math.sin(p);
    const lerp = (obj, axis, v, k = 0.25) => { obj.rotation[axis] += (v - obj.rotation[axis]) * k; };
    let lL = 0; let lR = 0; let aL = 0; let aR = 0; let aLz = 0.08; let aRz = -0.08; let tor = 0; let hd = 0;
    const walking = a.moving;

    switch (a.mode) {
      case 'carry':
        lL = walking ? s * 0.55 : 0; lR = -lL;
        aL = -Math.PI + 0.12; aR = -Math.PI + 0.12; aLz = 0.25; aRz = -0.25;
        break;
      case 'climb':
        aL = -2.5 + s * 0.45; aR = -2.5 - s * 0.45;
        lL = -0.6 + s * 0.5; lR = -0.6 - s * 0.5;
        break;
      case 'pull':
        aL = -1.5 + s * 0.7; aR = -1.5 - s * 0.7; tor = 0.12 + s * 0.05;
        break;
      case 'facepalm':
        aR = -2.3; aRz = 0.9; hd = 0.35; tor = 0.15;
        break;
      case 'cheer':
        aL = -2.9; aR = -2.9; aLz = 0.4 + s * 0.3; aRz = -0.4 - s * 0.3;
        lL = Math.abs(s) * -0.3;
        break;
      case 'kneel':
        lL = -1.4; lR = 0.2; tor = 0.35; aL = -1.1; aR = -1.1;
        break;
      case 'walk':
        lL = walking ? s * 0.6 : 0; lR = -lL; aL = -lL * 0.8; aR = -aL;
        break;
      default: // idle
        aL = Math.sin(p * 0.5) * 0.04; aR = -aL;
    }
    lerp(legL.current, 'x', lL); lerp(legR.current, 'x', lR);
    lerp(armL.current, 'x', aL); lerp(armR.current, 'x', aR);
    lerp(armL.current, 'z', aLz); lerp(armR.current, 'z', aRz);
    lerp(torso.current, 'x', tor); lerp(head.current, 'x', hd);
    // little bounce when walking
    torso.current.position.y = 0.95 + (walking ? Math.abs(Math.cos(p)) * 0.035 : 0) + (a.mode === 'kneel' ? -0.35 : 0);
  });

  return (
    <group ref={ref} scale={scale}>
      {/* legs pivot at the hips */}
      {[[legL, -0.11], [legR, 0.11]].map(([r, x]) => (
        <group key={x} ref={r} position={[x, 0.92, 0]}>
          <mesh position={[0, -0.42, 0]} castShadow material={mats.pants}>
            <capsuleGeometry args={[0.085, 0.62, 4, 8]} />
          </mesh>
          <mesh position={[0, -0.86, 0.05]} castShadow material={mats.boot}>
            <boxGeometry args={[0.15, 0.1, 0.28]} />
          </mesh>
        </group>
      ))}
      <group ref={torso} position={[0, 0.95, 0]}>
        <mesh position={[0, 0.3, 0]} castShadow material={mats.vest}>
          <boxGeometry args={[0.44, 0.58, 0.26]} />
        </mesh>
        <mesh position={[0, 0.02, 0]} castShadow material={mats.pants}>
          <boxGeometry args={[0.42, 0.12, 0.24]} />
        </mesh>
        {/* arms pivot at the shoulders */}
        {[[armL, -0.28, 1], [armR, 0.28, -1]].map(([r, x]) => (
          <group key={x} ref={r} position={[x, 0.53, 0]}>
            <mesh position={[0, -0.27, 0]} castShadow material={mats.shirt}>
              <capsuleGeometry args={[0.065, 0.42, 4, 8]} />
            </mesh>
            <mesh position={[0, -0.57, 0]} castShadow material={mats.glove}>
              <sphereGeometry args={[0.07, 10, 10]} />
            </mesh>
          </group>
        ))}
        <group ref={head} position={[0, 0.66, 0]}>
          <mesh position={[0, 0.06, 0]} castShadow material={mats.skin}>
            <sphereGeometry args={[0.13, 16, 16]} />
          </mesh>
          <mesh position={[0, 0.13, 0]} castShadow material={mats.hat}>
            <sphereGeometry args={[0.145, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          </mesh>
          <mesh position={[0, 0.13, 0.04]} material={mats.hat}>
            <cylinderGeometry args={[0.17, 0.17, 0.02, 20]} />
          </mesh>
          {/* eyes so you can tell which way he faces */}
          {[-0.045, 0.045].map((x) => (
            <mesh key={x} position={[x, 0.07, 0.12]}>
              <sphereGeometry args={[0.016, 8, 8]} />
              <meshBasicMaterial color="#111" />
            </mesh>
          ))}
        </group>
        {carryPanel}
      </group>
    </group>
  );
});

export default Worker;
