/* eslint-disable react/prop-types, react/no-unknown-property */
import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Edges, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { PLANNER_CONFIG as CFG } from './config';

const TILT = (15 * Math.PI) / 180;
const HOUSE_H = 6.2;
const SKY_DAY = new THREE.Color('#8ec5ff');
const SKY_DUSK = new THREE.Color('#f59e6b');
const SKY_NIGHT = new THREE.Color('#070b18');

const daylight = (h) => Math.max(0, Math.sin((Math.PI * (h - 6)) / 12));

/* ---------------------------------- clock --------------------------------- */
function Clock({ clock, onHour }) {
  const last = useRef(-1);
  useFrame((_, dt) => {
    const c = clock.current;
    if (c.playing) c.hour = (c.hour + dt * 0.9) % 24; // ~27 s per simulated day
    const h = Math.floor(c.hour);
    if (h !== last.current) {
      last.current = h;
      onHour(h);
    }
  });
  return null;
}

/* ------------------------------- sky + sun -------------------------------- */
function SkyAndSun({ clock }) {
  const sun = useRef();
  const sunBall = useRef();
  const amb = useRef();
  const hemi = useRef();
  const { scene } = useThree();
  const tmp = useMemo(() => new THREE.Color(), []);
  useEffect(() => { scene.background = new THREE.Color(SKY_DAY); scene.fog = new THREE.Fog('#8ec5ff', 60, 160); }, [scene]);

  useFrame(() => {
    const h = clock.current.hour;
    const d = daylight(h);
    const ang = ((h - 6) / 12) * Math.PI;
    const x = Math.cos(ang) * 40;
    const y = Math.sin(ang) * 40;
    sun.current.position.set(x, Math.max(y, 4), 18);
    sun.current.intensity = 0.2 + d * 3.2;
    sun.current.color.set(d > 0.25 ? '#fff6e0' : '#ffb27a');
    if (d <= 0) sun.current.color.set('#8aa2ff');
    sunBall.current.position.set(x * 2, y * 2, -60);
    sunBall.current.visible = y > -2;
    amb.current.intensity = 0.25 + d * 0.6;
    hemi.current.intensity = 0.3 + d * 0.7;

    if (d > 0.3) tmp.copy(SKY_DAY);
    else if (d > 0) tmp.copy(SKY_DUSK).lerp(SKY_DAY, d / 0.3);
    else {
      const n = Math.min(1, Math.abs(h < 12 ? 6 - h : h - 18) / 1.5);
      tmp.copy(SKY_DUSK).lerp(SKY_NIGHT, n);
    }
    scene.background.copy(tmp);
    scene.fog.color.copy(tmp);
  });

  return (
    <>
      <ambientLight ref={amb} intensity={0.4} />
      <hemisphereLight ref={hemi} args={['#cfe8ff', '#3b5d2a', 0.4]} />
      <directionalLight
        ref={sun}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
      />
      <mesh ref={sunBall}>
        <sphereGeometry args={[3, 24, 24]} />
        <meshBasicMaterial color="#ffe08a" fog={false} />
      </mesh>
    </>
  );
}

/* ---------------------------------- panel --------------------------------- */
function Panel({ target, overflow, delay, panel, glow, seed }) {
  const ref = useRef();
  const cells = useRef();
  const st = useRef({ phase: 'wait', t: 0, vy: 0, wobble: 0, spin: [0, 0, 0] });

  useFrame((_, dt) => {
    const g = ref.current;
    const s = st.current;
    s.t += dt;
    const p = g.position;

    if (s.phase === 'wait') {
      g.visible = false;
      if (s.t < delay) return;
      g.visible = true;
      p.set(target[0], target[1] + 12, target[2]);
      g.rotation.set(-TILT, 0, 0);
      s.phase = 'drop';
    }
    if (s.phase === 'drop' || s.phase === 'placed') {
      const k = Math.min(1, dt * (s.phase === 'drop' ? 5 : 8));
      p.x += (target[0] - p.x) * k;
      p.y += (target[1] - p.y) * k;
      p.z += (target[2] - p.z) * k;
      g.rotation.set(-TILT, 0, 0);
      if (s.phase === 'drop' && Math.abs(p.y - target[1]) < 0.02) s.phase = 'placed';
      if (s.phase === 'placed' && overflow) { s.phase = 'teeter'; s.wobble = 0; }
    } else if (s.phase === 'teeter') {
      s.wobble += dt;
      g.rotation.set(-TILT + Math.sin(s.wobble * 30) * 0.08, 0, Math.sin(s.wobble * 23) * 0.06);
      if (s.wobble > 0.5 + (seed % 5) * 0.08) {
        s.phase = 'fall';
        s.vy = 0;
        s.spin = [(seed % 7) - 3, (seed % 3) - 1, (seed % 5) - 2].map((v) => v * 0.9);
      }
      if (!overflow) s.phase = 'placed';
    } else if (s.phase === 'fall') {
      s.vy -= 22 * dt;
      p.y += s.vy * dt;
      p.z += dt * 1.2;
      g.rotation.x += s.spin[0] * dt;
      g.rotation.y += s.spin[1] * dt;
      g.rotation.z += s.spin[2] * dt;
      if (p.y <= 0.08) {
        p.y = 0.08;
        if (Math.abs(s.vy) > 4) s.vy = -s.vy * 0.25;
        else {
          s.phase = 'down';
          g.rotation.set(-Math.PI / 2 + 0.05 * ((seed % 3) - 1), (seed % 11) * 0.5, Math.PI / 2 * (seed % 2) + 0.1);
        }
      }
    } else if (s.phase === 'down') {
      if (!overflow) { // roof grew: bring it back up
        p.y = target[1] + 12;
        s.phase = 'drop';
      }
    }

    if (cells.current) {
      const on = s.phase === 'placed' || s.phase === 'drop' ? glow.current : 0;
      cells.current.emissiveIntensity = 0.05 + on * 0.6;
    }
  });

  return (
    <group ref={ref} visible={false}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[panel.width, 0.05, panel.length]} />
        <meshStandardMaterial color="#c9ced6" metalness={0.8} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.03, 0]} castShadow>
        <boxGeometry args={[panel.width - 0.06, 0.02, panel.length - 0.06]} />
        <meshStandardMaterial ref={cells} color="#13305f" emissive="#3b82f6" emissiveIntensity={0.1} metalness={0.7} roughness={0.18} />
      </mesh>
    </group>
  );
}

/* ------------------------------ house + roof ------------------------------ */
function Windows({ roof, lit }) {
  const mats = useRef([]);
  const items = useMemo(() => {
    const out = [];
    const cols = Math.max(1, Math.floor(roof.width / 2.6));
    const sideCols = Math.max(1, Math.floor(roof.length / 2.8));
    for (let f = 0; f < 2; f++) {
      const y = 1.6 + f * 3;
      for (let i = 0; i < cols; i++) {
        const x = -roof.width / 2 + (i + 0.5) * (roof.width / cols);
        if (f === 0 && i === Math.floor(cols / 2)) continue; // door
        out.push({ pos: [x, y, roof.length / 2 + 0.01], rot: [0, 0, 0] });
      }
      for (let i = 0; i < sideCols; i++) {
        const z = -roof.length / 2 + (i + 0.5) * (roof.length / sideCols);
        out.push({ pos: [roof.width / 2 + 0.01, y, z], rot: [0, Math.PI / 2, 0] });
      }
    }
    return out;
  }, [roof.width, roof.length]);

  useFrame(() => {
    mats.current.forEach((m) => {
      if (!m) return;
      const target = lit.current;
      m.emissiveIntensity += (target - m.emissiveIntensity) * 0.15;
    });
  });

  return items.map((w, i) => (
    <mesh key={i} position={w.pos} rotation={w.rot}>
      <planeGeometry args={[1.3, 1.4]} />
      <meshStandardMaterial ref={(m) => { mats.current[i] = m; }} color="#1f2937" emissive="#ffc861" emissiveIntensity={0} />
    </mesh>
  ));
}

function House({ roof, failing, lit }) {
  const slab = useRef();
  const shakeT = useRef(0);
  useEffect(() => { if (failing) shakeT.current = 1.4; }, [failing]);

  useFrame((state, dt) => {
    if (!slab.current) return;
    if (shakeT.current > 0) {
      shakeT.current -= dt;
      const a = shakeT.current;
      slab.current.rotation.z = Math.sin(state.clock.elapsedTime * 40) * 0.015 * a;
      slab.current.position.y = HOUSE_H - (failing ? (1.4 - a) * 0.12 : 0);
    } else {
      slab.current.rotation.z = failing ? 0.012 : 0;
      slab.current.position.y = failing ? HOUSE_H - 0.17 : HOUSE_H;
    }
  });

  const cracks = useMemo(() => {
    const out = [];
    let x = -roof.width * 0.35; let z = -roof.length * 0.1;
    for (let i = 0; i < 9; i++) {
      const nx = x + roof.width * 0.09;
      const nz = z + (i % 2 ? 1 : -1) * roof.length * 0.06;
      const len = Math.hypot(nx - x, nz - z);
      out.push({ pos: [(x + nx) / 2, 0.21, (z + nz) / 2], rot: -Math.atan2(nz - z, nx - x), len });
      x = nx; z = nz;
    }
    return out;
  }, [roof.width, roof.length]);

  return (
    <group>
      {/* walls */}
      <mesh position={[0, HOUSE_H / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[roof.width, HOUSE_H, roof.length]} />
        <meshStandardMaterial color="#efe7da" roughness={0.9} />
      </mesh>
      {/* floor band */}
      <mesh position={[0, 3.1, 0]}>
        <boxGeometry args={[roof.width + 0.12, 0.18, roof.length + 0.12]} />
        <meshStandardMaterial color="#d4c6b0" />
      </mesh>
      {/* door */}
      <mesh position={[-roof.width / 2 + (Math.floor(Math.max(1, Math.floor(roof.width / 2.6)) / 2) + 0.5) * (roof.width / Math.max(1, Math.floor(roof.width / 2.6))), 1.2, roof.length / 2 + 0.02]}>
        <planeGeometry args={[1.2, 2.4]} />
        <meshStandardMaterial color="#6b4423" />
      </mesh>
      <Windows roof={roof} lit={lit} />

      {/* roof slab + parapet */}
      <group ref={slab} position={[0, HOUSE_H, 0]}>
        <mesh position={[0, 0.1, 0]} receiveShadow castShadow>
          <boxGeometry args={[roof.width + 0.3, 0.2, roof.length + 0.3]} />
          <meshStandardMaterial color={failing ? '#b45454' : '#bfb6a8'} roughness={0.95} />
          {failing && <Edges color="#ff2d2d" lineWidth={2} />}
        </mesh>
        {[
          [0, roof.length / 2 + 0.1, roof.width + 0.3, 0.2],
          [0, -roof.length / 2 - 0.1, roof.width + 0.3, 0.2],
        ].map(([x, z, w, d], i) => (
          <mesh key={i} position={[x, 0.45, z]} castShadow>
            <boxGeometry args={[w, 0.5, d]} />
            <meshStandardMaterial color="#e2d8c8" />
          </mesh>
        ))}
        {[roof.width / 2 + 0.1, -roof.width / 2 - 0.1].map((x, i) => (
          <mesh key={i} position={[x, 0.45, 0]} castShadow>
            <boxGeometry args={[0.2, 0.5, roof.length + 0.3]} />
            <meshStandardMaterial color="#e2d8c8" />
          </mesh>
        ))}
        {failing && cracks.map((c, i) => (
          <mesh key={i} position={c.pos} rotation={[0, c.rot, 0]}>
            <boxGeometry args={[c.len, 0.02, 0.08]} />
            <meshBasicMaterial color="#1a0b0b" />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/* ---------------------------- inverter + battery --------------------------- */
function Equipment({ roof, overloaded, socRef, hasBattery }) {
  const box = useRef();
  const smoke = useRef([]);
  const sparks = useRef([]);
  const fill = useRef();
  const x = roof.width / 2 + 0.16;

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (box.current) {
      box.current.emissive.set(overloaded ? '#ff2222' : '#22c55e');
      box.current.emissiveIntensity = overloaded ? 0.6 + Math.sin(t * 18) * 0.5 : 0.25;
    }
    smoke.current.forEach((m, i) => {
      if (!m) return;
      m.visible = overloaded;
      if (!overloaded) return;
      const life = (t * 0.5 + i / smoke.current.length) % 1;
      m.position.set(x + 0.5 + Math.sin(i * 3 + t) * 0.3 * life, 2 + life * 6, roof.length * 0.2 + Math.cos(i) * 0.3);
      m.scale.setScalar(0.3 + life * 1.6);
      m.material.opacity = 0.55 * (1 - life);
    });
    sparks.current.forEach((m, i) => {
      if (!m) return;
      m.visible = overloaded && Math.random() > 0.5;
      m.position.set(x + 0.2 + Math.random() * 0.5, 1.6 + Math.random() * 0.9, roof.length * 0.2 + (Math.random() - 0.5) * 0.9);
      void i;
    });
    if (fill.current) {
      const s = Math.max(0.02, socRef.current / 100);
      fill.current.scale.y = s;
      fill.current.position.y = 0.95 + (s * 1.1) / 2 - 0.55;
      fill.current.material.color.set(s > 0.5 ? '#22c55e' : s > 0.2 ? '#f59e0b' : '#ef4444');
    }
  });

  return (
    <group>
      <mesh position={[x, 2, roof.length * 0.2]} castShadow>
        <boxGeometry args={[0.25, 1.1, 0.8]} />
        <meshStandardMaterial ref={box} color="#e5e7eb" emissive="#22c55e" emissiveIntensity={0.2} />
      </mesh>
      {hasBattery && (
        <group position={[x + 0.05, 0, roof.length * 0.2 - 1.3]}>
          <mesh position={[0, 0.95, 0]} castShadow>
            <boxGeometry args={[0.35, 1.3, 0.7]} />
            <meshStandardMaterial color="#334155" />
          </mesh>
          <mesh ref={fill} position={[0.19, 0.95, 0]}>
            <boxGeometry args={[0.02, 1.1, 0.45]} />
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

/* ------------------------------- neighbours ------------------------------- */
function Neighbourhood({ roof, clock }) {
  const mats = useRef([]);
  const blocks = useMemo(() => {
    const gap = 9;
    return [
      { pos: [-roof.width / 2 - gap - 4, 0, -3], size: [8, 4.5, 10] },
      { pos: [roof.width / 2 + gap + 4, 0, -5], size: [8, 5.2, 10] },
      { pos: [-3, 0, -roof.length / 2 - gap - 5], size: [11, 5.8, 8] },
    ];
  }, [roof.width, roof.length]);
  useFrame(() => {
    const h = clock.current.hour;
    const night = daylight(h) < 0.15 ? 1 : 0;
    mats.current.forEach((m) => { if (m) m.emissiveIntensity = night * 0.9; });
  });
  return blocks.map((b, i) => (
    <group key={i} position={b.pos}>
      <mesh position={[0, b.size[1] / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={b.size} />
        <meshStandardMaterial color="#d8d2c8" />
      </mesh>
      <mesh position={[0, b.size[1] * 0.55, b.size[2] / 2 + 0.01]}>
        <planeGeometry args={[b.size[0] * 0.7, 1]} />
        <meshStandardMaterial ref={(m) => { mats.current[i] = m; }} color="#1f2937" emissive="#ffc861" emissiveIntensity={0} />
      </mesh>
    </group>
  ));
}

/* ------------------------------ camera rig ------------------------------- */
function CameraRig({ roof, controls }) {
  const { camera } = useThree();
  const dist = Math.max(roof.width, roof.length) * 1.35 + 14;
  const target = useMemo(() => new THREE.Vector3(dist * 0.55, HOUSE_H + dist * 0.55, dist * 0.85), [dist]);
  const moving = useRef(true);
  useEffect(() => { moving.current = true; }, [dist]);
  useFrame(() => {
    if (!moving.current) return;
    camera.position.lerp(target, 0.06);
    if (controls.current) { controls.current.target.set(0, HOUSE_H * 0.7, 0); controls.current.update(); }
    if (camera.position.distanceTo(target) < 0.1) moving.current = false;
  });
  return null;
}

/* --------------------------------- scene --------------------------------- */
function SceneContent({ plan, roof, clock, onHour }) {
  const controls = useRef();
  const glow = useRef(0);
  const lit = useRef(0);
  const soc = useRef(50);
  const { layout, panel, chosen } = plan;
  const failing = plan.overflow > 0;
  const overloaded = plan.issues.some((i) => i.type === 'inverter');

  // live values for the current (fractional) hour
  useFrame(() => {
    const h = clock.current.hour;
    const k = Math.floor(h) % 24;
    const peak = Math.max(...plan.solarKw, 0.001);
    glow.current = plan.solarKw[k] / peak;
    const night = daylight(h) < 0.15;
    const dark = plan.sim.blackout[k];
    lit.current = dark ? 0 : night ? 1.6 : 0.08;
    soc.current = plan.sim.soc[k];
  });

  const targets = useMemo(() => {
    const out = [];
    const cols = layout.cols || 3;
    const startX = -((cols - 1) * layout.colW) / 2;
    const startZ = -roof.length / 2 + CFG.roofSetback + (panel.length * Math.cos(TILT)) / 2;
    const y = HOUSE_H + 0.2 + 0.35 + Math.sin(TILT) * panel.length * 0.5;
    for (let i = 0; i < chosen.panels; i++) {
      const c = i % cols;
      const r = Math.floor(i / cols);
      out.push({
        pos: [startX + c * layout.colW, y, startZ + r * layout.pitch],
        overflow: i >= layout.maxPanels,
      });
    }
    return out;
  }, [layout, panel, chosen.panels, roof.length]);

  const stagger = Math.min(0.09, 2.6 / Math.max(1, targets.length));

  return (
    <>
      <Clock clock={clock} onHour={onHour} />
      <SkyAndSun clock={clock} />
      <CameraRig roof={roof} controls={controls} />
      <OrbitControls ref={controls} enablePan={false} minDistance={10} maxDistance={90} maxPolarAngle={Math.PI / 2.15} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[120, 64]} />
        <meshStandardMaterial color="#6f9a4b" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, roof.length / 2 + 6]} receiveShadow>
        <planeGeometry args={[200, 6]} />
        <meshStandardMaterial color="#4b5563" />
      </mesh>
      <ContactShadows position={[0, 0.02, 0]} opacity={0.35} scale={60} blur={2.5} far={12} />

      <House roof={roof} failing={failing} lit={lit} />
      <Equipment roof={roof} overloaded={overloaded} socRef={soc} hasBattery={chosen.batteryKWh > 0} />
      <Neighbourhood roof={roof} clock={clock} />

      {targets.map((t, i) => (
        <Panel
          key={i}
          target={t.pos}
          overflow={t.overflow}
          delay={0.2 + i * stagger}
          panel={panel}
          glow={glow}
          seed={i * 7 + 3}
        />
      ))}
    </>
  );
}

export default function RoofScene({ plan, roof, clock, onHour }) {
  return (
    <Canvas shadows dpr={[1, 2]} camera={{ position: [30, 30, 40], fov: 42, near: 0.5, far: 400 }}>
      <SceneContent plan={plan} roof={roof} clock={clock} onHour={onHour} />
    </Canvas>
  );
}
