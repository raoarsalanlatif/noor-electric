/* eslint-disable react/prop-types, react/no-unknown-property */
import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { SkySystem, Neighbourhood } from '../three/Environment';
import HouseModel from '../three/HouseModel';
import { houseHeight } from '../three/dims';
import SolarPanelModel, { PanelLegs, PANEL_TILT } from '../three/SolarPanelModel';
import Worker from '../three/Worker';
import { sunPosition } from '../three/sun';

const ELEVATED_H = 2.6;

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

/* ---------------------------------- panel --------------------------------- */
function Panel({ index, slot, overflow, panel, installedRef, glow, site, roofTop, seed }) {
  const g = useRef();
  const cells = useRef();
  const st = useRef({ phase: 'hidden', vy: 0, t: 0 });
  const base = site.elevated ? ELEVATED_H : 0.25;
  const target = useMemo(
    () => [slot.x, roofTop + base + Math.sin(PANEL_TILT) * panel.length * 0.5, slot.z],
    [slot.x, slot.z, roofTop, base, panel.length],
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
    if (cells.current) cells.current.emissiveIntensity = s.phase === 'placed' ? 0.02 + glow.current * 0.18 : 0.02;
  });

  return (
    <group ref={g} visible={false}>
      <group rotation={[PANEL_TILT, 0, 0]}>
        <SolarPanelModel panel={panel} cellsRef={cells} />
      </group>
      {!site.elevated && !overflow && (
        <group position={[0, -(base + Math.sin(PANEL_TILT) * panel.length * 0.5), 0]}>
          <PanelLegs panel={panel} base={base} />
        </group>
      )}
    </group>
  );
}

/* ----------------------------- elevated frame ----------------------------- */
function ElevatedFrame({ layout, roofTop, panel }) {
  if (!layout.slots.length) return null;
  const xs = layout.slots.map((s) => s.x); const zs = layout.slots.map((s) => s.z);
  const minX = Math.min(...xs) - panel.width / 2; const maxX = Math.max(...xs) + panel.width / 2;
  const minZ = Math.min(...zs) - layout.depth / 2; const maxZ = Math.max(...zs) + layout.depth / 2;
  const cols = [];
  for (let x = minX; x <= maxX + 0.01; x += Math.max(2.4, (maxX - minX) / 4)) {
    for (let z = minZ; z <= maxZ + 0.01; z += Math.max(2.6, (maxZ - minZ) / 3)) cols.push([x, z]);
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
function InstallCrew({ targets, panel, roof, roofTop, parapetH, installedRef, ctl, onProgress, depth }) {
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
    const stand = t ? tmp.set(t.pos[0], roofTop, Math.min(t.pos[2] + depth / 2 + 0.45, L / 2 - 0.45)) : edge;

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
        cp.rotation.set(PANEL_TILT * k, 0, 0);
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
        <SolarPanelModel panel={panel} />
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

/* ------------------------------ camera rig ------------------------------- */
function CameraRig({ roof, height, controls }) {
  const { camera } = useThree();
  const dist = Math.max(roof.width, roof.length) * 1.05 + 13;
  const target = useMemo(() => new THREE.Vector3(dist * 0.62, height + dist * 0.42, dist * 0.82), [dist, height]);
  const moving = useRef(true);
  useEffect(() => { moving.current = true; }, [dist, height]);
  useFrame(() => {
    if (!moving.current) return;
    camera.position.lerp(target, 0.05);
    if (controls.current) { controls.current.target.set(0, height * 0.65, 0); controls.current.update(); }
    if (camera.position.distanceTo(target) < 0.1) moving.current = false;
  });
  return null;
}

/* --------------------------------- scene --------------------------------- */
function SceneContent({ plan, roof, site, lat, season, clock, onHour, crewCtl, onProgress }) {
  const controls = useRef();
  const glow = useRef(0); const lit = useRef(0); const soc = useRef(50);
  const installedRef = useRef(0);
  const { layout, panel, chosen } = plan;
  const roofTop = houseHeight(site);
  const failing = plan.overflow > 0;
  const overloaded = plan.issues.some((i) => i.type === 'inverter');
  const base = site.elevated ? ELEVATED_H : 0.25;

  useFrame(() => {
    const h = clock.current.hour; const k = Math.floor(h) % 24;
    const { alt } = sunPosition(lat, season, h);
    const peak = Math.max(...plan.solarKw, 0.001);
    glow.current = plan.solarKw[k] / peak;
    lit.current = plan.sim.blackout[k] ? 0 : alt < 2 ? 1.6 : 0.05;
    soc.current = plan.sim.soc[k];
  });

  const targets = useMemo(() => Array.from({ length: chosen.panels }, (_, i) => {
    const overflow = i >= layout.maxPanels;
    const slot = overflow ? layout.overflowSlot(i - layout.maxPanels) : layout.slots[i];
    return { slot, overflow, pos: [slot.x, roofTop + base + Math.sin(PANEL_TILT) * panel.length * 0.5, slot.z] };
  }), [chosen.panels, layout, roofTop, base, panel.length]);

  return (
    <>
      <Clock clock={clock} onHour={onHour} />
      <SkySystem clock={clock} lat={lat} season={season} shadowSize={Math.max(roof.width, roof.length) + 8} />
      <CameraRig roof={roof} height={roofTop} controls={controls} />
      <OrbitControls ref={controls} enablePan={false} minDistance={8} maxDistance={110} maxPolarAngle={Math.PI / 2.08} />

      <Neighbourhood roof={roof} clock={clock} lat={lat} season={season} />
      <ContactShadows position={[0, 0.04, 0]} opacity={0.3} scale={70} blur={2.4} far={14} />
      <HouseModel roof={roof} site={site} obstacles={layout.obstacles} failing={failing} litRef={lit} />
      {site.elevated && <ElevatedFrame layout={layout} roofTop={roofTop} panel={panel} />}
      <Equipment roof={roof} overloaded={overloaded} socRef={soc} hasBattery={chosen.batteryKWh > 0} />

      {targets.map((t, i) => (
        <Panel key={i} index={i} slot={t.slot} overflow={t.overflow} panel={panel} installedRef={installedRef}
          glow={glow} site={site} roofTop={roofTop} seed={i * 7 + 3} />
      ))}
      <InstallCrew
        targets={targets} panel={panel} roof={roof} roofTop={roofTop} parapetH={site.parapetH}
        installedRef={installedRef} ctl={crewCtl} onProgress={onProgress} depth={layout.depth}
      />
    </>
  );
}

export default function RoofScene(props) {
  return (
    <Canvas shadows dpr={[1, 2]} gl={{ antialias: true }} camera={{ position: [60, 50, 70], fov: 40, near: 0.5, far: 6000 }}>
      <SceneContent {...props} />
    </Canvas>
  );
}
