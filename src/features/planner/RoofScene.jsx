/* eslint-disable react/prop-types, react/no-unknown-property */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Edges, PerformanceMonitor } from '@react-three/drei';
import * as THREE from 'three';
import { SkySystem, Neighbourhood } from '../three/Environment';
import HouseModel from '../three/HouseModel';
import { houseHeight, tiltRad } from '../three/dims';
import SolarPanelModel, { PanelLegs } from '../three/SolarPanelModel';
import Worker from '../three/Worker';
import { sunPosition } from '../three/sun';
import { plasterTexture } from '../three/textures';


/* ---------------------------------- clock --------------------------------- */
function Clock({ clock, onHour }) {
  const last = useRef(-1);
  useFrame((_, dt) => {
    const c = clock.current;
    if (c.playing) c.hour = (c.hour + dt * 0.45) % 24;
    const h = Math.floor(c.hour);
    if (h !== last.current) { last.current = h; onHour(h); }
  });
  return null;
}

/* ------------------------------ shadow pacer ------------------------------ */
// Redrawing the shadow map is the most expensive part of a frame. It only has to be redrawn when something
// that casts a shadow moves: every frame while the crew is working or the roof is being edited, otherwise
// only when the sun has moved a little.
function ShadowPacer({ clock, busy }) {
  const { gl } = useThree();
  const last = useRef(-99);
  useEffect(() => {
    gl.shadowMap.autoUpdate = false;
    gl.shadowMap.needsUpdate = true;
    return () => { gl.shadowMap.autoUpdate = true; };
  }, [gl]);
  useFrame((state) => {
    const h = clock.current.hour;
    if (state.clock.elapsedTime < busy.current || Math.abs(h - last.current) > 0.03) {
      last.current = h;
      gl.shadowMap.needsUpdate = true;
    }
  });
  return null;
}

/* ---------------------------------- panel --------------------------------- */
/** Shade-map colour: green (no loss) through amber to red (half the day's energy or more lost). */
function heatColor(loss) {
  const v = Math.max(0, Math.min(1, loss / 0.5));
  const c = new THREE.Color();
  if (v < 0.5) c.set('#22c55e').lerp(new THREE.Color('#f59e0b'), v * 2); else c.set('#f59e0b').lerp(new THREE.Color('#ef4444'), (v - 0.5) * 2);
  return c;
}

function Panel({ index, slot, overflow, panel, installedRef, glow, structure, roofTop, seed, shadeRef, heat, realistic, tilt, turnY }) {
  const g = useRef();
  const cells = useRef();
  const st = useRef({ phase: 'hidden', vy: 0, t: 0 });
  // panels on top of a room sit on their own low frame, whatever the main structure is
  const elevated = structure.key === 'elevated' && !slot.onRoom;
  const base = slot.base ?? structure.frontH;
  const legs = slot.onRoom ? 0.15 : base;
  const target = useMemo(
    () => [slot.x, roofTop + base + Math.sin(tilt) * panel.length * 0.5, slot.z],
    [slot.x, slot.z, roofTop, base, panel.length, tilt],
  );

  useFrame((_, dt) => {
    const s = st.current; const grp = g.current; const p = grp.position;
    const installed = index < installedRef.current;
    if (!installed) { grp.visible = false; s.phase = 'hidden'; return; }
    grp.visible = true;
    if (s.phase === 'hidden') { p.set(target[0], target[1] + 0.25, target[2]); grp.rotation.set(0, 0, 0); s.phase = overflow ? 'teeter' : 'placed'; s.t = 0; }
    if (s.phase === 'placed') {
      p.x += (target[0] - p.x) * 0.2; p.y += (target[1] - p.y) * 0.2; p.z += (target[2] - p.z) * 0.2;
      grp.rotation.set(0, 0, 0);
      if (overflow) { s.phase = 'teeter'; s.t = 0; }
    } else if (s.phase === 'teeter') {
      s.t += dt;
      grp.rotation.set(Math.sin(s.t * 30) * 0.08, 0, Math.sin(s.t * 23) * 0.06);
      if (s.t > 0.45) { s.phase = 'fall'; s.vy = 0; }
      if (!overflow) s.phase = 'placed';
    } else if (s.phase === 'fall') {
      s.vy -= 22 * dt; p.y += s.vy * dt; p.z += dt * 1.4;
      grp.rotation.x += ((seed % 7) - 3) * dt; grp.rotation.z += ((seed % 5) - 2) * dt;
      if (p.y <= 0.1) {
        p.y = 0.1;
        if (Math.abs(s.vy) > 4) s.vy = -s.vy * 0.25;
        else { s.phase = 'down'; grp.rotation.set(0.04 * ((seed % 3) - 1), (seed % 11) * 0.5, 0.05); }
      }
    } else if (s.phase === 'down' && !overflow) {
      s.phase = 'hidden';
    }
    // a panel in a building's shadow stops glowing
    const lit = shadeRef?.current ? 1 - (shadeRef.current[index] || 0) : 1;
    if (cells.current) cells.current.emissiveIntensity = s.phase === 'placed' ? 0.02 + glow.current * 0.18 * lit : 0.02;
  });

  return (
    <group ref={g} visible={false}>
      {/* turned so the panel leans towards the chosen side of the roof */}
      <group rotation={[0, turnY, 0]}>
      <group rotation={[tilt, 0, 0]}>
        <SolarPanelModel panel={panel} cellsRef={cells} realistic={realistic} />
        {/* shade map: how much of the day's energy this panel loses to nearby buildings */}
        {heat != null && !overflow && (
          <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[panel.width - 0.04, panel.length - 0.04]} />
            <meshBasicMaterial color={heatColor(heat)} transparent opacity={0.78} depthWrite={false} />
          </mesh>
        )}
      </group>
      {!elevated && !overflow && (
        <group position={[0, -(legs + Math.sin(tilt) * panel.length * 0.5), 0]}>
          <PanelLegs panel={panel} base={legs} tilt={tilt} />
        </group>
      )}
      </group>
    </group>
  );
}

/* ----------------------------- elevated frame ----------------------------- */
function ElevatedFrame({ layout, roofTop }) {
  const ELEVATED_H = layout.structure.frontH;
  const onFrame = layout.slots.filter((s) => !s.onRoom); // panels on top of a room have their own frame
  if (!onFrame.length) return null;
  const xs = onFrame.map((s) => s.x); const zs = onFrame.map((s) => s.z);
  const minX = Math.min(...xs) - layout.footX / 2; const maxX = Math.max(...xs) + layout.footX / 2;
  const minZ = Math.min(...zs) - layout.footZ / 2; const maxZ = Math.max(...zs) + layout.footZ / 2;
  const cols = [];
  for (let x = minX; x <= maxX + 0.01; x += Math.max(2.4, (maxX - minX) / 4)) {
    for (let z = minZ; z <= maxZ + 0.01; z += Math.max(2.6, (maxZ - minZ) / 3)) {
      // don't plant a column through a room, tank or AC
      const blocked = layout.obstacles.some((o) => Math.abs(x - o.x) < o.w / 2 + 0.15 && Math.abs(z - o.z) < o.d / 2 + 0.15);
      if (!blocked) cols.push([x, z]);
    }
  }
  const steel = <meshStandardMaterial color="#8b95a1" metalness={0.7} roughness={0.35} />;
  return (
    <group>
      {cols.map(([x, z], i) => (
        <mesh key={i} position={[x, roofTop + ELEVATED_H / 2, z]} castShadow>
          <boxGeometry args={[0.12, ELEVATED_H, 0.12]} />{steel}
        </mesh>
      ))}
      {[minZ, maxZ].map((z) => (
        <mesh key={z} position={[(minX + maxX) / 2, roofTop + ELEVATED_H, z]} castShadow>
          <boxGeometry args={[maxX - minX + 0.2, 0.14, 0.14]} />{steel}
        </mesh>
      ))}
      {[minX, maxX].map((x) => (
        <mesh key={x} position={[x, roofTop + ELEVATED_H, (minZ + maxZ) / 2]} castShadow>
          <boxGeometry args={[0.14, 0.14, maxZ - minZ + 0.2]} />{steel}
        </mesh>
      ))}
    </group>
  );
}

/* ------------------------------ install crew ------------------------------ */
function InstallCrew({ targets, panel, roof, roofTop, parapetH, installedRef, ctl, onProgress, depth, realistic, tilt, turnY }) {
  const roofW = useRef(); const groundW = useRef();
  const roofAnim = useRef({ mode: 'idle', moving: false, speed: 1 });
  const groundAnim = useRef({ mode: 'idle', moving: false, speed: 1 });
  const carried = useRef(); const rope = useRef();
  const st = useRef({ idx: 0, phase: 'hoist', t: 0, replay: -1, cheer: 0 });
  const W = roof.width; const L = roof.length;
  const hoistZ = L / 2 - 1.6;
  const edge = useMemo(() => new THREE.Vector3(W / 2 - 0.65, roofTop, hoistZ), [W, roofTop, hoistZ]);
  const hoistX = W / 2 + 0.55;
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const lastReport = useRef('');

  useEffect(() => {
    roofW.current.position.copy(edge);
    groundW.current.position.set(W / 2 + 1.5, 0, hoistZ + 0.35);
    groundW.current.rotation.y = -Math.PI / 2;
  }, [edge, W, hoistZ]);

  const face = (obj, dx, dz) => {
    const want = Math.atan2(dx, dz);
    let d = want - obj.rotation.y;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    obj.rotation.y += d * 0.25;
  };

  useFrame((_, dt) => {
    const s = st.current; const c = ctl.current; const total = targets.length;
    if (c.replay !== s.replay) { s.replay = c.replay; s.idx = 0; s.phase = 'hoist'; s.t = 0; installedRef.current = 0; roofW.current.position.copy(edge); }
    if (c.skip) { c.skip = false; s.idx = total; installedRef.current = total; s.phase = 'done'; s.cheer = 2.5; }
    if (s.idx > total) s.idx = total;
    if (installedRef.current > total) installedRef.current = total;
    if (s.idx >= total && s.phase !== 'done') { s.phase = 'done'; s.cheer = 2.5; }
    if (s.idx < total && s.phase === 'done') { s.phase = 'hoist'; s.t = 0; }

    const mult = (c.speed || 1) * Math.min(4, 1 + s.idx * 0.3);
    const ra = roofAnim.current; const ga = groundAnim.current;
    ra.speed = Math.min(2.5, mult); ga.speed = ra.speed;
    const w = roofW.current; const pos = w.position;
    const cp = carried.current;
    rope.current.visible = false;
    cp.visible = false;
    ga.mode = 'idle'; ga.moving = false;

    const t = total ? targets[Math.min(s.idx, total - 1)] : null;
    // the worker stands just in front of the panel's low edge, on the side it leans towards
    const reach = depth / 2 + 0.45;
    const stand = t ? tmp.set(
      Math.max(-W / 2 + 0.45, Math.min(W / 2 - 0.45, t.pos[0] + Math.sin(turnY) * reach)), roofTop,
      Math.max(-L / 2 + 0.45, Math.min(L / 2 - 0.45, t.pos[2] + Math.cos(turnY) * reach)),
    ) : edge;

    const walkTo = (dest, mode) => {
      const dx = dest.x - pos.x; const dz = dest.z - pos.z;
      const dist = Math.hypot(dx, dz);
      const stepLen = 2.4 * mult * dt;
      ra.mode = mode; ra.moving = dist > 0.05;
      if (dist > 0.05) face(w, dx, dz);
      if (dist <= stepLen) { pos.x = dest.x; pos.z = dest.z; return true; }
      pos.x += (dx / dist) * stepLen; pos.z += (dz / dist) * stepLen;
      return false;
    };

    switch (s.phase) {
      case 'hoist': {
        if (!walkTo(edge, 'walk')) break;
        face(w, 1, 0);
        ra.mode = 'pull'; ra.moving = false; ga.mode = 'pull';
        s.t += (dt * mult) / 1.4;
        rope.current.visible = true;
        cp.visible = true;
        cp.position.set(hoistX, THREE.MathUtils.lerp(0.9, roofTop + parapetH + 1.1, Math.min(1, s.t)), hoistZ);
        cp.rotation.set(Math.PI / 2, 0, 0);
        if (s.t >= 1) { s.phase = 'carry'; s.t = 0; }
        break;
      }
      case 'carry': {
        cp.visible = true;
        const arrived = walkTo(stand, 'carry');
        cp.position.set(pos.x, roofTop + 2.2, pos.z);
        cp.rotation.set(0, w.rotation.y, 0);
        if (arrived) { s.phase = 'place'; s.t = 0; }
        break;
      }
      case 'place': {
        face(w, 0, -1);
        ra.mode = 'kneel'; ra.moving = false;
        s.t += (dt * mult) / 0.7;
        const k = Math.min(1, s.t);
        cp.visible = true;
        cp.position.set(
          THREE.MathUtils.lerp(pos.x, t.pos[0], k),
          THREE.MathUtils.lerp(roofTop + 1.6, t.pos[1], k),
          THREE.MathUtils.lerp(pos.z - 0.4, t.pos[2], k),
        );
        cp.rotation.set(tilt * k, turnY, 0, 'YXZ');
        if (s.t >= 1) {
          installedRef.current = s.idx + 1;
          s.phase = t.overflow ? 'oops' : 'return'; s.t = 0; s.idx += 1;
        }
        break;
      }
      case 'oops':
        ra.mode = 'facepalm'; ra.moving = false;
        s.t += dt * mult;
        if (s.t > 0.9) { s.phase = 'return'; s.t = 0; }
        break;
      case 'return':
        if (walkTo(edge, 'walk')) { s.phase = 'hoist'; s.t = 0; }
        break;
      case 'done':
      default:
        if (s.cheer > 0) { s.cheer -= dt; ra.mode = 'cheer'; ra.moving = false; face(w, 0, 1); } else { ra.mode = 'idle'; ra.moving = false; }
    }

    const report = `${Math.min(installedRef.current, total)}/${total}`;
    if (report !== lastReport.current) { lastReport.current = report; onProgress(Math.min(installedRef.current, total), total); }
  });

  return (
    <group>
      <Worker ref={roofW} anim={roofAnim} />
      <Worker ref={groundW} anim={groundAnim} skin="#a8714d" pants="#3f3f46" />
      <group ref={carried} visible={false}>
        <SolarPanelModel panel={panel} realistic={realistic} />
      </group>
      <mesh ref={rope} position={[hoistX, (roofTop + parapetH + 1.6) / 2, hoistZ]} visible={false}>
        <cylinderGeometry args={[0.015, 0.015, roofTop + parapetH + 1.6, 6]} />
        <meshStandardMaterial color="#d9c38c" />
      </mesh>
      {/* pulley arm on the parapet */}
      <mesh position={[W / 2 + 0.3, roofTop + parapetH + 1.55, hoistZ]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.7, 8]} />
        <meshStandardMaterial color="#374151" metalness={0.6} />
      </mesh>
      <mesh position={[W / 2 - 0.05, roofTop + (parapetH + 1.6) / 2, hoistZ]} castShadow>
        <boxGeometry args={[0.06, parapetH + 1.6, 0.06]} />
        <meshStandardMaterial color="#374151" metalness={0.6} />
      </mesh>
    </group>
  );
}

/* --------------------------- inverter + battery --------------------------- */
function Equipment({ roof, overloaded, socRef, hasBattery }) {
  const box = useRef(); const smoke = useRef([]); const sparks = useRef([]); const fill = useRef();
  const x = roof.width / 2 + 0.16;
  const z = -roof.length * 0.15;
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    box.current.emissive.set(overloaded ? '#ff2222' : '#22c55e');
    box.current.emissiveIntensity = overloaded ? 0.6 + Math.sin(t * 18) * 0.5 : 0.25;
    smoke.current.forEach((m, i) => {
      if (!m) return;
      m.visible = overloaded;
      if (!overloaded) return;
      const life = (t * 0.5 + i / smoke.current.length) % 1;
      m.position.set(x + 0.5 + Math.sin(i * 3 + t) * 0.3 * life, 2.2 + life * 6, z + Math.cos(i) * 0.3);
      m.scale.setScalar(0.3 + life * 1.6);
      m.material.opacity = 0.55 * (1 - life);
    });
    sparks.current.forEach((m) => {
      if (!m) return;
      m.visible = overloaded && Math.random() > 0.5;
      m.position.set(x + 0.2 + Math.random() * 0.5, 1.8 + Math.random() * 0.9, z + (Math.random() - 0.5) * 0.9);
    });
    if (fill.current) {
      const s = Math.max(0.02, socRef.current / 100);
      fill.current.scale.y = s;
      fill.current.position.y = 1.0 + (s * 1.1) / 2 - 0.55;
      fill.current.material.color.set(s > 0.5 ? '#22c55e' : s > 0.2 ? '#f59e0b' : '#ef4444');
    }
  });
  return (
    <group>
      <mesh position={[x, 2.2, z]} castShadow>
        <boxGeometry args={[0.22, 0.9, 0.6]} />
        <meshStandardMaterial ref={box} color="#f3f4f6" emissive="#22c55e" emissiveIntensity={0.2} />
      </mesh>
      <mesh position={[x + 0.12, 2.35, z]}>
        <boxGeometry args={[0.01, 0.18, 0.3]} />
        <meshBasicMaterial color="#0f172a" />
      </mesh>
      {/* conduit from the roof */}
      <mesh position={[x - 0.06, 6, z + 0.2]}>
        <cylinderGeometry args={[0.03, 0.03, 7.6, 6]} />
        <meshStandardMaterial color="#9ca3af" />
      </mesh>
      {hasBattery && (
        <group position={[x + 0.05, 0, z - 1.1]}>
          <mesh position={[0, 1.0, 0]} castShadow>
            <boxGeometry args={[0.32, 1.3, 0.62]} />
            <meshStandardMaterial color="#e5e7eb" roughness={0.4} />
          </mesh>
          <mesh ref={fill} position={[0.17, 1.0, 0]}>
            <boxGeometry args={[0.02, 1.1, 0.4]} />
            <meshBasicMaterial color="#22c55e" />
          </mesh>
        </group>
      )}
      {Array.from({ length: 14 }).map((_, i) => (
        <mesh key={`s${i}`} ref={(m) => { smoke.current[i] = m; }} visible={false}>
          <sphereGeometry args={[0.5, 10, 10]} />
          <meshStandardMaterial color="#3f3f46" transparent opacity={0.4} depthWrite={false} />
        </mesh>
      ))}
      {Array.from({ length: 10 }).map((_, i) => (
        <mesh key={`k${i}`} ref={(m) => { sparks.current[i] = m; }} visible={false}>
          <sphereGeometry args={[0.05, 6, 6]} />
          <meshBasicMaterial color="#ffd36b" />
        </mesh>
      ))}
    </group>
  );
}

/* ------------------------------- snapshot -------------------------------- */
// Lets the page grab the current 3D view as a JPEG (for the downloadable report).
function Snapshot({ captureRef }) {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    if (!captureRef) return undefined;
    captureRef.current = () => { gl.render(scene, camera); return gl.domElement.toDataURL('image/jpeg', 0.92); };
    if (import.meta.env.DEV) window.__planner3d = { gl, scene }; // lets the dev tools read draw-call counts
    return () => { captureRef.current = null; };
  }, [gl, scene, camera, captureRef]);
  return null;
}

/* ------------------------------ camera rig ------------------------------- */
function CameraRig({ roof, height, controls, editing, wide }) {
  const { camera } = useThree();
  const dist = Math.max(roof.width, roof.length) * 1.05 + 13;
  // the editor looks down onto the roof so items are easy to place and drag;
  // it pulls back when the customer is placing the buildings around the house
  const target = useMemo(() => {
    if (editing && wide) return new THREE.Vector3(dist * 0.2, height + dist * 2.1, dist * 1.25);
    return editing
      ? new THREE.Vector3(dist * 0.12, height + dist * 0.92, dist * 0.5)
      : new THREE.Vector3(dist * 0.62, height + dist * 0.42, dist * 0.82);
  }, [dist, height, editing, wide]);
  const moving = useRef(true);
  useEffect(() => { moving.current = true; }, [dist, height, editing, wide]);
  useFrame(() => {
    if (!moving.current) return;
    camera.position.lerp(target, 0.05);
    if (controls.current) { controls.current.target.set(0, height * 0.65, 0); controls.current.update(); }
    if (camera.position.distanceTo(target) < 0.1) moving.current = false;
  });
  return null;
}

/* ---------------------------- nearby buildings ---------------------------- */
// A plain building the customer placed next to the house; it casts a real shadow on the roof.
function NearbyBuilding({ b }) {
  const plaster = useMemo(() => {
    const tx = plasterTexture([b.w / 3, b.h / 3]).clone();
    tx.needsUpdate = true;
    return tx;
  }, [b.w, b.h]);
  const floors = Math.max(1, Math.round(b.h / 3.2));
  const fh = b.h / floors;
  return (
    <group position={[b.x, 0, b.z]}>
      <mesh position={[0, b.h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[b.w, b.h, b.d]} />
        <meshStandardMaterial map={plaster} color="#e6e1d8" roughness={0.95} />
      </mesh>
      <mesh position={[0, b.h + 0.12, 0]} castShadow>
        <boxGeometry args={[b.w + 0.25, 0.24, b.d + 0.25]} />
        <meshStandardMaterial color="#cfc6b6" roughness={0.9} />
      </mesh>
      {Array.from({ length: floors }).map((_, f) => (
        <group key={f} position={[0, (f + 0.55) * fh, 0]}>
          {[[0, b.d / 2 + 0.01, 0, b.w], [0, -b.d / 2 - 0.01, Math.PI, b.w], [b.w / 2 + 0.01, 0, Math.PI / 2, b.d], [-b.w / 2 - 0.01, 0, -Math.PI / 2, b.d]].map(([x, z, ry, len], i) => (
            <mesh key={i} position={[x, 0, z]} rotation={[0, ry, 0]}>
              <planeGeometry args={[len * 0.72, Math.min(1.3, fh * 0.42)]} />
              <meshStandardMaterial color="#2a3b4f" metalness={0.5} roughness={0.2} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

/* ------------------------------ roof editor ------------------------------ */
// Click the roof to place the chosen item, drag items to move them. Red areas are where
// panels can't go (the item, a walkway around it and its shadow); blue outlines are the
// panel positions that remain for the current structure.
function RoofEditor({ layout, roof, roofTop, tool, selectedId, onPlace, onSelect, onMoveItem, onDragChange, buildings = [], south = [0, 1] }) {
  const [drag, setDrag] = useState(null);
  const setCursor = (c) => { document.body.style.cursor = c; };
  useEffect(() => () => setCursor(''), []);
  useEffect(() => { setCursor(tool ? 'copy' : ''); }, [tool]);
  const endDrag = () => { if (!drag) return; setDrag(null); onDragChange(false); setCursor(tool ? 'copy' : ''); };
  useEffect(() => {
    if (!drag) return undefined;
    window.addEventListener('pointerup', endDrag);
    return () => window.removeEventListener('pointerup', endDrag);
  });
  const y = roofTop + 0.015;
  const slotW = layout.footX - 0.05;
  const slotD = layout.footZ - 0.08;

  return (
    <group>
      {/* placement surface */}
      <mesh
        position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]}
        onPointerDown={(e) => {
          if (drag) return;
          e.stopPropagation();
          if (tool === 'building') return; // buildings go on the ground, not on the roof
          if (tool) onPlace(tool, e.point.x, e.point.z); else onSelect(null);
        }}
      >
        <planeGeometry args={[roof.width, roof.length]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* where panels can't go */}
      {layout.keepOuts.map((k) => {
        const x0 = Math.max(k.x0, -roof.width / 2); const x1 = Math.min(k.x1, roof.width / 2);
        const z0 = Math.max(k.z0, -roof.length / 2); const z1 = Math.min(k.z1, roof.length / 2);
        if (x1 <= x0 || z1 <= z0) return null;
        return (
          <mesh key={k.id} position={[(x0 + x1) / 2, y + 0.005, (z0 + z1) / 2]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
            <planeGeometry args={[x1 - x0, z1 - z0]} />
            <meshBasicMaterial color={k.shade ? '#f97316' : '#ef4444'} transparent opacity={0.28} depthWrite={false} />
          </mesh>
        );
      })}

      {/* panel spots that remain */}
      {layout.slots.map((s, i) => (
        <mesh key={i} position={[s.x, y + 0.01 + (s.onRoom ? s.base : layout.structure.key === 'elevated' ? layout.structure.frontH : 0), s.z]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
          <planeGeometry args={[slotW, slotD]} />
          <meshBasicMaterial color="#60a5fa" transparent opacity={layout.structure.key === 'elevated' ? 0.35 : 0.22} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      ))}

      {/* grab handles for each item */}
      {layout.obstacles.map((o) => {
        const base = roofTop + (o.onTop ? o.onTop + 0.16 : 0);
        const selected = o.id === selectedId;
        return (
          <mesh
            key={o.id}
            position={[o.x, base + o.h / 2 + 0.02, o.z]}
            onPointerOver={(e) => { e.stopPropagation(); if (!drag) setCursor('grab'); }}
            onPointerOut={() => { if (!drag) setCursor(tool ? 'copy' : ''); }}
            onPointerDown={(e) => {
              e.stopPropagation();
              onSelect(o.id);
              setDrag({ id: o.id, dx: o.x - e.point.x, dz: o.z - e.point.z });
              onDragChange(true);
              setCursor('grabbing');
            }}
          >
            <boxGeometry args={[o.w + 0.06, o.h + 0.06, o.d + 0.06]} />
            <meshBasicMaterial transparent opacity={selected ? 0.12 : 0} color="#facc15" depthWrite={false} />
            {selected && <Edges color="#facc15" lineWidth={2} />}
          </mesh>
        );
      })}

      {/* ground around the house: click to place a nearby building */}
      {tool === 'building' && (
        <mesh position={[0, 0.07, 0]} rotation={[-Math.PI / 2, 0, 0]} onPointerDown={(e) => { if (drag) return; e.stopPropagation(); onPlace('building', e.point.x, e.point.z); }}>
          <planeGeometry args={[320, 320]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}

      {/* grab handles for the nearby buildings */}
      {buildings.map((b) => {
        const selected = b.id === selectedId;
        return (
          <mesh
            key={b.id}
            position={[b.x, b.h / 2 + 0.3, b.z]}
            onPointerOver={(e) => { e.stopPropagation(); if (!drag) setCursor('grab'); }}
            onPointerOut={() => { if (!drag) setCursor(tool ? 'copy' : ''); }}
            onPointerDown={(e) => {
              e.stopPropagation();
              onSelect(b.id);
              setDrag({ id: b.id, dx: b.x - e.point.x, dz: b.z - e.point.z, y: e.point.y });
              onDragChange(true);
              setCursor('grabbing');
            }}
          >
            <boxGeometry args={[b.w + 0.3, b.h + 0.7, b.d + 0.3]} />
            <meshBasicMaterial transparent opacity={selected ? 0.14 : 0} color="#facc15" depthWrite={false} />
            {selected && <Edges color="#facc15" lineWidth={2} />}
          </mesh>
        );
      })}

      {/* invisible floor that follows the pointer while dragging */}
      {drag && (
        <mesh
          position={[0, drag.y ?? roofTop, 0]} rotation={[-Math.PI / 2, 0, 0]}
          onPointerMove={(e) => { e.stopPropagation(); onMoveItem(drag.id, e.point.x + drag.dx, e.point.z + drag.dz); }}
          onPointerUp={(e) => { e.stopPropagation(); endDrag(); }}
        >
          <planeGeometry args={[400, 400]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}
      {/* small marker on the roof edge showing which way is south (the sun side) */}
      <group
        position={[south[0] * (roof.width / 2 - 0.35), y + 0.02, south[1] * (roof.length / 2 - 0.35)]}
        rotation={[0, Math.atan2(-south[1], south[0]), 0]}
      >
        <mesh rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
          <circleGeometry args={[0.22, 3]} />
          <meshBasicMaterial color="#fbbf24" />
        </mesh>
      </group>
    </group>
  );
}

/* --------------------------------- scene --------------------------------- */
function SceneContent({ plan, roof, site, lat, season, clock, onHour, crewCtl, onProgress, editor, captureRef, shadeMap, rich = true }) {
  const editing = Boolean(editor?.editing);
  const [dragging, setDragging] = useState(false);
  const controls = useRef();
  const glow = useRef(0); const lit = useRef(0); const soc = useRef(50); const shadeNow = useRef(null);
  // shadows are redrawn every frame until this time (seconds on the scene clock); see ShadowPacer
  const busy = useRef(Infinity);
  const sceneClock = useThree((st) => st.clock);
  useEffect(() => { busy.current = editing || dragging ? Infinity : sceneClock.elapsedTime + 4; }, [plan, site, roof, editing, dragging, sceneClock]);
  const report = useMemo(() => (done, total) => {
    busy.current = done < total ? Infinity : Math.max(sceneClock.elapsedTime + 4, busy.current === Infinity ? 0 : busy.current);
    onProgress(done, total);
  }, [onProgress, sceneClock]);
  const installedRef = useRef(0);
  const { layout, panel, chosen } = plan;
  const roofTop = houseHeight(site);
  const failing = plan.overflow > 0 && !editing;
  const overloaded = plan.issues.some((i) => i.type === 'inverter');
  const { structure } = plan;
  const elevated = structure.key === 'elevated';
  const base = structure.frontH;
  const tilt = tiltRad(site);
  const turnY = (layout.turn * Math.PI) / 2; // quarter turns towards the side the panels lean to
  const { facing, buildings } = plan.shading;
  // direction of south on the roof (x, z), for the editor's sun-side marker
  const south = useMemo(() => { const a = ((360 - facing) * Math.PI) / 180; return [Math.sin(a), -Math.cos(a)]; }, [facing]);
  // the sun's shadow map has to reach the nearby buildings as well as the house
  const shadowSize = useMemo(() => buildings.reduce(
    (m, b) => Math.max(m, Math.abs(b.x) + b.w / 2 + 3, Math.abs(b.z) + b.d / 2 + 3, b.h + 3),
    Math.max(roof.width, roof.length) + 8,
  ), [buildings, roof.width, roof.length]);

  useFrame(() => {
    const h = clock.current.hour; const k = Math.floor(h) % 24;
    const { alt } = sunPosition(lat, season, h);
    const peak = Math.max(...plan.solarKw, 0.001);
    glow.current = plan.solarKw[k] / peak;
    lit.current = plan.sim.blackout[k] ? 0 : alt < 2 ? 1.6 : 0.05;
    soc.current = plan.sim.soc[k];
    shadeNow.current = plan.shading.panelHourly ? plan.shading.panelHourly[k] : null;
  });

  const targets = useMemo(() => Array.from({ length: chosen.panels }, (_, i) => {
    const overflow = i >= layout.maxPanels;
    const slot = overflow ? layout.overflowSlot(i - layout.maxPanels) : layout.slots[i];
    return { slot, overflow, pos: [slot.x, roofTop + (slot.base ?? base) + Math.sin(tilt) * panel.length * 0.5, slot.z] };
  }), [chosen.panels, layout, roofTop, base, panel.length, tilt]);

  return (
    <>
      <Clock clock={clock} onHour={onHour} />
      <Snapshot captureRef={captureRef} />
      <ShadowPacer clock={clock} busy={busy} />
      <SkySystem clock={clock} lat={lat} season={season} shadowSize={Math.min(70, shadowSize)} facing={facing} reflections={rich} />
      <CameraRig roof={roof} height={roofTop} controls={controls} editing={editing} wide={Boolean(editor?.wide)} />
      <OrbitControls ref={controls} enabled={!dragging} enablePan={false} minDistance={8} maxDistance={110} maxPolarAngle={Math.PI / 2.08} />

      {/* once the customer adds the real buildings around the house, the decorative ones are hidden */}
      <Neighbourhood roof={roof} clock={clock} lat={lat} season={season} houses={buildings.length === 0} lawn />
      {buildings.map((b) => <NearbyBuilding key={b.id} b={b} />)}
      {/* soft ground shadow under the house: drawn once, and again only when the house or its neighbours change */}
      <ContactShadows key={`${roof.width}:${roof.length}:${roofTop}:${buildings.map((b) => `${b.x.toFixed(1)},${b.z.toFixed(1)},${b.w},${b.d}`).join(';')}`} frames={1} position={[0, 0.04, 0]} opacity={0.3} scale={70} blur={2.4} far={14} />
      <HouseModel roof={roof} site={site} obstacles={layout.obstacles} failing={failing} litRef={lit} />
      {elevated && !editing && <ElevatedFrame layout={layout} roofTop={roofTop} />}
      {editing && (
        <RoofEditor
          layout={layout} roof={roof} roofTop={roofTop}
          tool={editor.tool} selectedId={editor.selectedId}
          onPlace={editor.onPlace} onSelect={editor.onSelect} onMoveItem={editor.onMoveItem}
          onDragChange={setDragging} buildings={buildings} south={south}
        />
      )}
      <Equipment roof={roof} overloaded={overloaded} socRef={soc} hasBattery={chosen.batteryKWh > 0} />

      {!editing && targets.map((t, i) => (
        <Panel key={i} index={i} slot={t.slot} overflow={t.overflow} panel={panel} installedRef={installedRef}
          glow={glow} structure={structure} roofTop={roofTop} seed={i * 7 + 3} realistic={rich} tilt={tilt} turnY={turnY}
          shadeRef={shadeNow} heat={shadeMap && plan.shading.panelHourly ? plan.shading.perPanel[i] ?? 0 : null} />
      ))}
      {!editing && (
      <InstallCrew
        targets={targets} panel={panel} roof={roof} roofTop={roofTop} parapetH={site.parapetH}
        installedRef={installedRef} ctl={crewCtl} onProgress={report} depth={layout.depth} realistic={rich} tilt={tilt} turnY={turnY}
      />
      )}
    </>
  );
}

export default function RoofScene(props) {
  // Start with the best picture. If the device cannot hold a smooth frame rate, step down and stay there:
  // first to standard resolution, then to the simpler lighting and panel materials (no sky reflections).
  const [level, setLevel] = useState(0);
  const dpr = level === 0 ? Math.min(2, typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1) : 1;
  return (
    <Canvas shadows dpr={dpr} gl={{ antialias: true, powerPreference: 'high-performance' }} camera={{ position: [60, 50, 70], fov: 40, near: 0.5, far: 6000 }}>
      <PerformanceMonitor bounds={() => [26, 55]} onDecline={() => setLevel((l) => Math.min(2, l + 1))} />
      <SceneContent {...props} rich={level < 2} />
    </Canvas>
  );
}
