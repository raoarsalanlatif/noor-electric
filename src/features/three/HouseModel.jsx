/* eslint-disable react/prop-types, react/no-unknown-property */
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Edges } from '@react-three/drei';
import { STOREY_H, SLAB } from './constants';
import BrandSign from './BrandSign';
import { plasterTexture, concreteTexture, tankTexture, acGrillTexture } from './textures';


function Window({ position, rotation, w = 1.4, h = 1.5, matRef }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0, 0.03]}>
        <boxGeometry args={[w + 0.16, h + 0.16, 0.06]} />
        <meshStandardMaterial color="#5b4636" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0, 0.065]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial ref={matRef} color="#2a3b4f" metalness={0.5} roughness={0.15} emissive="#ffc861" emissiveIntensity={0} />
      </mesh>
      <mesh position={[0, 0, 0.075]}>
        <boxGeometry args={[0.05, h, 0.02]} />
        <meshStandardMaterial color="#5b4636" />
      </mesh>
      <mesh position={[0, -h / 2 - 0.12, 0.1]}>
        <boxGeometry args={[w + 0.3, 0.08, 0.22]} />
        <meshStandardMaterial color="#d4c6b0" />
      </mesh>
    </group>
  );
}

/**
 * A typical Pakistani house: plastered walls, floor bands, windows, a porch,
 * parapet walls, an optional stair room (mumty), water tank and AC outdoor units.
 */
export default function HouseModel({ roof, site, obstacles = [], failing = false, litRef }) {
  const W = roof.width; const L = roof.length;
  const H = site.storeys * STOREY_H;
  const winMats = useRef([]);
  const slab = useRef();
  const shakeT = useRef(0);
  const plaster = useMemo(() => { const t = plasterTexture([W / 2.5, H / 2.5]).clone(); t.needsUpdate = true; return t; }, [W, H]);
  const concrete = useMemo(() => { const t = concreteTexture([W / 3, L / 3]).clone(); t.needsUpdate = true; return t; }, [W, L]);
  const tank = useMemo(() => tankTexture(), []);
  const grill = useMemo(() => acGrillTexture(), []);

  useEffect(() => { if (failing) shakeT.current = 1.4; }, [failing]);

  useFrame((state, dt) => {
    const lit = litRef ? litRef.current : 0;
    winMats.current.forEach((m) => { if (m) m.emissiveIntensity += (lit - m.emissiveIntensity) * 0.15; });
    if (!slab.current) return;
    if (shakeT.current > 0) {
      shakeT.current -= dt;
      slab.current.rotation.z = Math.sin(state.clock.elapsedTime * 40) * 0.012 * shakeT.current;
    } else {
      slab.current.rotation.z = failing ? 0.01 : 0;
    }
    slab.current.position.y = H + (failing ? -0.12 : 0);
  });

  const windows = useMemo(() => {
    const out = [];
    const cols = Math.max(1, Math.floor(W / 2.7));
    const side = Math.max(1, Math.floor(L / 3));
    for (let f = 0; f < site.storeys; f++) {
      const y = f * STOREY_H + 1.55;
      for (let i = 0; i < cols; i++) {
        if (f === 0 && i === Math.floor(cols / 2)) continue; // door
        out.push({ p: [-W / 2 + (i + 0.5) * (W / cols), y, L / 2], r: [0, 0, 0] });
      }
      for (let i = 0; i < side; i++) {
        const z = -L / 2 + (i + 0.5) * (L / side);
        out.push({ p: [-W / 2, y, z], r: [0, -Math.PI / 2, 0] });
      }
    }
    return out;
  }, [W, L, site.storeys]);
  const doorX = -W / 2 + (Math.floor(Math.max(1, Math.floor(W / 2.7)) / 2) + 0.5) * (W / Math.max(1, Math.floor(W / 2.7)));
  const ph = site.parapetH;

  return (
    <group>
      <mesh position={[0, H / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[W, H, L]} />
        <meshStandardMaterial map={plaster} color="#f3ead9" roughness={0.92} />
      </mesh>
      {Array.from({ length: site.storeys - 1 }).map((_, f) => (
        <mesh key={f} position={[0, (f + 1) * STOREY_H, 0]} castShadow>
          <boxGeometry args={[W + 0.14, 0.2, L + 0.14]} />
          <meshStandardMaterial color="#c9b79c" roughness={0.8} />
        </mesh>
      ))}
      {/* plinth */}
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[W + 0.1, 0.5, L + 0.1]} />
        <meshStandardMaterial color="#8f877b" roughness={1} />
      </mesh>
      {/* Powered by Noor Electric fascia sign along the roof edge */}
      <BrandSign position={[0, H + 0.06, L / 2 + 0.24]} width={Math.min(6, W * 0.7)} />

      {/* door and porch */}
      <mesh position={[doorX, 1.25, L / 2 + 0.02]}>
        <planeGeometry args={[1.3, 2.5]} />
        <meshStandardMaterial color="#5a3a22" roughness={0.6} />
      </mesh>
      <mesh position={[doorX, 2.85, L / 2 + 0.8]} castShadow>
        <boxGeometry args={[2.8, 0.14, 1.6]} />
        <meshStandardMaterial color="#d4c6b0" />
      </mesh>
      {windows.map((w, i) => (
        <Window key={i} position={w.p} rotation={w.r} matRef={(m) => { winMats.current[i] = m; }} />
      ))}

      {/* roof slab, parapets and rooftop structures */}
      <group ref={slab} position={[0, H, 0]}>
        <mesh position={[0, SLAB / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[W + 0.3, SLAB, L + 0.3]} />
          <meshStandardMaterial map={concrete} color={failing ? '#c46a6a' : '#ffffff'} roughness={0.95} />
          {failing && <Edges color="#ff2d2d" />}
        </mesh>
        {ph > 0 && (
          <>
            {[[0, L / 2 + 0.05, W + 0.3, 0.2], [0, -L / 2 - 0.05, W + 0.3, 0.2]].map(([x, z, w, d], i) => (
              <mesh key={`pz${i}`} position={[x, SLAB + ph / 2, z]} castShadow receiveShadow>
                <boxGeometry args={[w, ph, d]} />
                <meshStandardMaterial map={plaster} color="#efe4d1" roughness={0.95} />
              </mesh>
            ))}
            {[W / 2 + 0.05, -W / 2 - 0.05].map((x, i) => (
              <mesh key={`px${i}`} position={[x, SLAB + ph / 2, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.2, ph, L + 0.3]} />
                <meshStandardMaterial map={plaster} color="#efe4d1" roughness={0.95} />
              </mesh>
            ))}
          </>
        )}
        {failing && Array.from({ length: 8 }).map((_, i) => (
          <mesh key={`c${i}`} position={[-W * 0.3 + i * W * 0.08, SLAB + 0.01, (i % 2 ? 1 : -1) * L * 0.05]} rotation={[0, (i % 2 ? 0.6 : -0.6), 0]}>
            <boxGeometry args={[W * 0.1, 0.02, 0.07]} />
            <meshBasicMaterial color="#1a0b0b" />
          </mesh>
        ))}
        {obstacles.map((o, i) => {
          if (o.type === 'room' || o.type === 'stairRoom') {
            return (
              <group key={i} position={[o.x, SLAB, o.z]}>
                <mesh position={[0, o.h / 2, 0]} castShadow receiveShadow>
                  <boxGeometry args={[o.w, o.h, o.d]} />
                  <meshStandardMaterial map={plaster} color="#f0e6d4" roughness={0.92} />
                </mesh>
                <mesh position={[0, o.h + 0.08, 0]} castShadow>
                  <boxGeometry args={[o.w + 0.2, 0.16, o.d + 0.2]} />
                  <meshStandardMaterial map={concrete} />
                </mesh>
                <mesh position={[o.w / 2 + 0.01, 1.05, o.d * 0.15]} rotation={[0, Math.PI / 2, 0]}>
                  <planeGeometry args={[0.95, 2.1]} />
                  <meshStandardMaterial color="#6b4a2f" />
                </mesh>
              </group>
            );
          }
          if (o.type === 'tank') {
            return (
              <group key={i} position={[o.x, SLAB + (o.onTop ? o.onTop + 0.16 : 0), o.z]}>
                <mesh position={[0, o.h / 2 + 0.1, 0]} castShadow>
                  <cylinderGeometry args={[o.w / 2, o.w / 2 * 0.95, o.h, 24]} />
                  <meshStandardMaterial map={tank} roughness={0.5} />
                </mesh>
                <mesh position={[0, o.h + 0.16, 0]} castShadow>
                  <cylinderGeometry args={[0.22, 0.22, 0.14, 16]} />
                  <meshStandardMaterial color="#111827" />
                </mesh>
                <mesh position={[0, 0.05, 0]}>
                  <boxGeometry args={[o.w + 0.2, 0.1, o.w + 0.2]} />
                  <meshStandardMaterial color="#6b7280" metalness={0.5} />
                </mesh>
              </group>
            );
          }
          const lift = SLAB + (o.onTop ? o.onTop + 0.16 : 0);
          if (o.type === 'geyser') {
            // evacuated-tube solar water heater: tilted tube rack with a tank along the top
            const tubes = Math.max(4, Math.round(o.w / 0.12));
            return (
              <group key={o.id || i} position={[o.x, lift, o.z]}>
                <group rotation={[-0.75, 0, 0]} position={[0, o.h * 0.42, 0.05]}>
                  {Array.from({ length: tubes }).map((_, k) => (
                    <mesh key={k} position={[-o.w / 2 + (k + 0.5) * (o.w / tubes), 0, 0]} castShadow>
                      <cylinderGeometry args={[0.035, 0.035, o.d * 1.15, 8]} />
                      <meshStandardMaterial color="#1f2937" metalness={0.4} roughness={0.25} />
                    </mesh>
                  ))}
                </group>
                <mesh position={[0, o.h - 0.15, -o.d / 2 + 0.15]} rotation={[0, 0, Math.PI / 2]} castShadow>
                  <cylinderGeometry args={[0.17, 0.17, o.w, 16]} />
                  <meshStandardMaterial color="#d1d5db" metalness={0.6} roughness={0.3} />
                </mesh>
                {[-o.w / 2 + 0.05, o.w / 2 - 0.05].map((x) => (
                  <mesh key={x} position={[x, o.h / 2, 0]} castShadow>
                    <boxGeometry args={[0.04, o.h, o.d]} />
                    <meshStandardMaterial color="#9ca3af" metalness={0.7} />
                  </mesh>
                ))}
              </group>
            );
          }
          if (o.type === 'other') {
            return (
              <group key={o.id || i} position={[o.x, lift, o.z]}>
                <mesh position={[0, o.h / 2, 0]} castShadow receiveShadow>
                  <boxGeometry args={[o.w, o.h, o.d]} />
                  <meshStandardMaterial color="#b8b2a7" roughness={0.85} />
                </mesh>
              </group>
            );
          }
          // AC outdoor unit
          return (
            <group key={i} position={[o.x, lift, o.z]}>
              <mesh position={[0, o.h / 2 + 0.08, 0]} castShadow>
                <boxGeometry args={[o.w, o.h, o.d]} />
                <meshStandardMaterial color="#e9ecef" roughness={0.5} />
              </mesh>
              <mesh position={[0, o.h / 2 + 0.08, o.d / 2 + 0.005]}>
                <planeGeometry args={[o.w * 0.96, o.h * 0.92]} />
                <meshStandardMaterial map={grill} roughness={0.5} />
              </mesh>
            </group>
          );
        })}
      </group>
    </group>
  );
}

