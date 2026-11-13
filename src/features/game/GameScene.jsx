/* eslint-disable react/prop-types, react/no-unknown-property */
import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { SkySystem, Neighbourhood } from '../three/Environment';
import HouseModel from '../three/HouseModel';
import SolarPanelModel from '../three/SolarPanelModel';
import Worker from '../three/Worker';
import { sfx } from './sfx';

import { DIFFICULTIES, ROOF, SITE, DAY_LEN, NIGHT_LEN, LAT, ROOF_TOP, BOUND, PANEL, CATCH_Y0, CATCH_Y1, rand, PLAYER_SCALE } from './state';

function hourOf(g) {
  return g.phase === 'day' ? 6 + 12 * (g.phaseT / DAY_LEN) : (18 + 12 * (g.phaseT / NIGHT_LEN)) % 24;
}

/* ------------------------------ falling items ----------------------------- */
function ItemMeshes({ game, refs }) {
  const sunMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffd23f', emissive: '#ffb300', emissiveIntensity: 2.2, roughness: 0.3 }), []);
  const haloMat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#ffcf4a', transparent: true, opacity: 0.25, depthWrite: false, blending: THREE.AdditiveBlending }), []);
  const dustMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#7a5a3a', roughness: 1, flatShading: true }), []);
  const batMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#22c55e', emissive: '#16a34a', emissiveIntensity: 0.6 }), []);
  const waterMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#4fb3ff', emissive: '#1d7ed8', emissiveIntensity: 0.6, transparent: true, opacity: 0.85, roughness: 0.1 }), []);
  return game.current.items.map((it, i) => (
    <group key={i} ref={(r) => { refs.current[i] = r; }} visible={false}>
      {(it.type === 'sun' || it.type === 'big') && (
        <>
          <mesh material={sunMat} scale={it.type === 'big' ? 1.7 : 1}><icosahedronGeometry args={[0.32, 1]} /></mesh>
          <mesh material={haloMat} scale={it.type === 'big' ? 1.8 : 1}><sphereGeometry args={[0.62, 16, 16]} /></mesh>
        </>
      )}
      {it.type === 'dust' && (
        <>
          <mesh material={dustMat} castShadow><dodecahedronGeometry args={[0.32, 0]} /></mesh>
          <mesh material={dustMat} position={[0.22, 0.12, 0.05]} scale={0.6}><dodecahedronGeometry args={[0.32, 0]} /></mesh>
          <mesh material={dustMat} position={[-0.2, -0.08, 0.1]} scale={0.5}><dodecahedronGeometry args={[0.32, 0]} /></mesh>
        </>
      )}
      {it.type === 'battery' && (
        <>
          <mesh material={batMat} castShadow><boxGeometry args={[0.38, 0.6, 0.38]} /></mesh>
          <mesh position={[0, 0.34, 0]}><boxGeometry args={[0.16, 0.08, 0.16]} /><meshStandardMaterial color="#e5e7eb" /></mesh>
          <mesh position={[0, 0, 0.2]}><boxGeometry args={[0.22, 0.06, 0.01]} /><meshBasicMaterial color="#fff" /></mesh>
          <mesh position={[0, 0, 0.2]}><boxGeometry args={[0.06, 0.22, 0.01]} /><meshBasicMaterial color="#fff" /></mesh>
        </>
      )}
      {it.type === 'water' && (
        <mesh material={waterMat} scale={[0.8, 1.15, 0.8]}><sphereGeometry args={[0.3, 16, 16]} /></mesh>
      )}
    </group>
  ));
}

/* ------------------- landing markers + player catch ring ------------------ */
const MARK_COLORS = { sun: '#ffd23f', big: '#ffb300', dust: '#b07a45', battery: '#4ade80', water: '#4fb3ff' };

/** A glowing target on the roof under every falling item, plus a light beam up to it. */
function ItemMarkers({ game, refs }) {
  return game.current.items.map((it, i) => {
    const color = MARK_COLORS[it.type];
    return (
      <group key={i} ref={(r) => { refs.current[i] = r; }} visible={false}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={2}>
          <ringGeometry args={[0.55, 0.75, 40]} />
          <meshBasicMaterial color={color} transparent opacity={0.6} depthWrite={false} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} renderOrder={2}>
          <circleGeometry args={[0.22, 24]} />
          <meshBasicMaterial color={color} transparent opacity={0.8} depthWrite={false} />
        </mesh>
        <mesh renderOrder={1}>
          <cylinderGeometry args={[0.05, 0.05, 1, 8, 1, true]} />
          <meshBasicMaterial color={color} transparent opacity={0.28} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
      </group>
    );
  });
}

function CatchRing({ ringRef }) {
  return (
    <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} renderOrder={3}>
      <ringGeometry args={[0.95, 1.12, 48]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.45} depthWrite={false} />
    </mesh>
  );
}

/* ------------------------------- wind streaks ----------------------------- */
function WindStreaks({ game }) {
  const N = 46;
  const meshes = useRef([]);
  const pts = useMemo(() => Array.from({ length: N }, () => ({ x: rand(-13, 13), y: rand(0.4, 7), z: rand(-13, 13), l: rand(0.6, 1.6) })), []);
  useFrame((_, dt) => {
    const w = game.current.wind || { x: 0, z: 0, speed: 0, angle: 0 };
    const show = game.current.status === 'playing' && w.speed > 0.3;
    const op = Math.min(0.55, w.speed / 9);
    pts.forEach((p, i) => {
      const m = meshes.current[i];
      if (!m) return;
      m.visible = show;
      if (!show) return;
      p.x += w.x * 3.2 * dt; p.z += w.z * 3.2 * dt;
      if (p.x > 13) p.x -= 26; if (p.x < -13) p.x += 26;
      if (p.z > 13) p.z -= 26; if (p.z < -13) p.z += 26;
      m.position.set(p.x, ROOF_TOP + p.y, p.z);
      m.rotation.y = -w.angle;
      m.scale.set(p.l * (0.6 + w.speed * 0.25), 1, 1);
      m.material.opacity = op;
    });
  });
  return pts.map((_, i) => (
    <mesh key={i} ref={(m) => { meshes.current[i] = m; }} visible={false}>
      <boxGeometry args={[1, 0.025, 0.025]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.3} depthWrite={false} />
    </mesh>
  ));
}

/* ------------------------------- particles -------------------------------- */
function Bursts({ burstRef }) {
  const N = 6; const P = 12;
  const meshes = useRef([]);
  const state = useRef(Array.from({ length: N }, () => ({ t: 1, x: 0, y: 0, z: 0, color: '#fff', dirs: Array.from({ length: P }, () => new THREE.Vector3(rand(-1, 1), rand(0.2, 1.4), rand(-1, 1)).normalize()) })));
  const next = useRef(0);
  useEffect(() => {
    burstRef.current = (x, y, z, color) => {
      const b = state.current[next.current % N]; next.current += 1;
      b.t = 0; b.x = x; b.y = y; b.z = z; b.color = color;
    };
  }, [burstRef]);
  useFrame((_, dt) => {
    state.current.forEach((b, i) => {
      b.t += dt * 1.8;
      for (let k = 0; k < P; k++) {
        const m = meshes.current[i * P + k];
        if (!m) continue;
        m.visible = b.t < 1;
        if (!m.visible) continue;
        const d = b.dirs[k];
        m.position.set(b.x + d.x * b.t * 1.6, b.y + d.y * b.t * 1.6 - b.t * b.t * 0.8, b.z + d.z * b.t * 1.6);
        m.scale.setScalar(1 - b.t);
        m.material.color.set(b.color);
      }
    });
  });
  return Array.from({ length: N * P }).map((_, i) => (
    <mesh key={i} ref={(m) => { meshes.current[i] = m; }} visible={false}>
      <sphereGeometry args={[0.07, 6, 6]} />
      <meshBasicMaterial color="#fff" />
    </mesh>
  ));
}

/* ------------------------------ clouds + bolts ---------------------------- */
function Weather({ game }) {
  const clouds = useRef([]); const shadows = useRef([]); const rings = useRef([]); const bolts = useRef([]);
  const puffs = useMemo(() => Array.from({ length: 7 }, (_, i) => [Math.cos(i) * 1.3, Math.sin(i * 2) * 0.3, Math.sin(i) * 0.9, 0.9 + (i % 3) * 0.3]), []);
  useFrame((state) => {
    const g = game.current;
    g.clouds.forEach((c, i) => {
      const m = clouds.current[i]; const sh = shadows.current[i];
      if (!m) return;
      m.visible = c.active; sh.visible = c.active;
      if (c.active) { m.position.set(c.x, ROOF_TOP + 9, c.z); sh.position.set(c.x, ROOF_TOP + 0.05, c.z); }
    });
    g.strikes.forEach((s, i) => {
      const r = rings.current[i]; const b = bolts.current[i];
      if (!r) return;
      r.visible = s.active && s.t < 1;
      b.visible = s.active && s.t >= 1 && s.t < 1.18;
      if (s.active) {
        r.position.set(s.x, ROOF_TOP + 0.06, s.z);
        r.scale.setScalar(1.4 - s.t * 0.4);
        r.material.opacity = 0.4 + Math.abs(Math.sin(state.clock.elapsedTime * 14)) * 0.5;
        b.position.set(s.x, ROOF_TOP + 4.5, s.z);
        b.rotation.y = state.clock.elapsedTime * 30;
      }
    });
  });
  return (
    <>
      {[0, 1].map((i) => (
        <group key={`c${i}`}>
          <group ref={(m) => { clouds.current[i] = m; }} visible={false}>
            {puffs.map(([x, y, z, r], k) => (
              <mesh key={k} position={[x, y, z]} castShadow>
                <sphereGeometry args={[r, 12, 12]} />
                <meshStandardMaterial color="#5b6472" roughness={1} />
              </mesh>
            ))}
          </group>
          <mesh ref={(m) => { shadows.current[i] = m; }} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
            <circleGeometry args={[2.3, 32]} />
            <meshBasicMaterial color="#000" transparent opacity={0.28} depthWrite={false} />
          </mesh>
        </group>
      ))}
      {[0, 1, 2].map((i) => (
        <group key={`s${i}`}>
          <mesh ref={(m) => { rings.current[i] = m; }} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
            <ringGeometry args={[1.0, 1.25, 32]} />
            <meshBasicMaterial color="#ff3b3b" transparent opacity={0.8} depthWrite={false} />
          </mesh>
          <mesh ref={(m) => { bolts.current[i] = m; }} visible={false}>
            <boxGeometry args={[0.12, 9, 0.12]} />
            <meshBasicMaterial color="#fff6a8" />
          </mesh>
        </group>
      ))}
    </>
  );
}

/* --------------------------------- engine --------------------------------- */
function Engine({ game, keys, clock, onHud, onEvent, onOver, itemRefs, markerRefs, catchRing, burst, workerRef, workerAnim, panelCells, litRef }) {
  const hudT = useRef(0);
  const { camera, size } = useThree();
  const look = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, rawDt) => {
    const g = game.current;
    const dt = Math.min(rawDt, 0.05);
    const portrait = size.width < size.height;

    // camera follows lightly
    // a steep, almost top-down view makes it easy to see where things will land
    const camTarget = portrait
      ? new THREE.Vector3(g.px * 0.2, ROOF_TOP + 23, ROOF.length / 2 + 9.5)
      : new THREE.Vector3(g.px * 0.3, ROOF_TOP + 16.5, ROOF.length / 2 + 8.5);
    camera.position.lerp(camTarget, 0.06);
    look.set(g.px * 0.3, ROOF_TOP, -0.4);
    camera.lookAt(look);
    if (camera.fov !== (portrait ? 58 : 46)) { camera.fov = portrait ? 58 : 46; camera.updateProjectionMatrix(); }

    if (g.status !== 'playing') {
      clock.current.hour = g.status === 'ready' ? (clock.current.hour + dt * 0.4) % 24 : clock.current.hour;
      workerAnim.current.mode = g.status === 'over' ? 'facepalm' : 'carry';
      workerAnim.current.moving = false;
      litRef.current = g.status === 'over' ? 0 : 1.2;
      itemRefs.current.forEach((r) => { if (r) r.visible = false; });
      markerRefs.current.forEach((r) => { if (r) r.visible = false; });
      if (catchRing.current) catchRing.current.visible = g.status === 'playing';
      if (workerRef.current) workerRef.current.position.set(g.px, ROOF_TOP, g.pz);
      return;
    }

    /* ---- time of day ---- */
    g.t += dt; g.phaseT += dt;
    if (g.phase === 'day' && g.phaseT >= DAY_LEN) { g.phase = 'night'; g.phaseT = 0; sfx.night(); onEvent({ text: 'Night falls — run on your battery!', color: '#a5b4fc', big: true }); }
    if (g.phase === 'night' && g.phaseT >= NIGHT_LEN) {
      g.phase = 'day'; g.phaseT = 0; g.day += 1; g.score += Math.round(100 * (g.diff?.score || 1)); sfx.day();
      onEvent({ text: `Day ${g.day}! +${Math.round(100 * (g.diff?.score || 1))} survival bonus`, color: '#ffd23f', big: true });
    }
    const hour = hourOf(g);
    clock.current.hour = hour;
    const sunAmt = g.phase === 'day' ? Math.sin((Math.PI * g.phaseT) / DAY_LEN) : 0;
    const lvl = 1 + (g.day - 1) * 0.14;

    /* ---- house load ---- */
    let load = 1.25;
    if (hour >= 12 && hour < 16.5) load += 1.1; // ACs in the afternoon
    if (hour >= 18 && hour < 23) load += 0.9; // evening lights, TV, cooking
    if (hour >= 23 || hour < 6) load += 0.25;
    const D = g.diff || DIFFICULTIES.normal;
    g.energy -= load * lvl * D.drain * dt;

    /* ---- wind: steady breeze plus gusts that grow each day ---- */
    const wd = g.wind;
    wd.angle += Math.sin(g.t * 0.13) * 0.15 * dt;
    if (D.gust > 0) {
      wd.nextGust -= dt;
      if (wd.nextGust <= 0 && wd.gustT <= 0) {
        wd.gustT = rand(1.4, 2.4);
        wd.gustLen = wd.gustT;
        wd.gustPeak = D.gust * (1 + (g.day - 1) * 0.12) * rand(0.7, 1.1);
        wd.angle += rand(-0.9, 0.9);
        wd.nextGust = rand(3.5, 7) / (1 + (g.day - 1) * 0.1);
        if (wd.gustPeak > 2.5) onEvent({ text: 'Strong gust! Hold your ground 🌬️', color: '#e2e8f0' });
      }
    }
    if (wd.gustT > 0) { wd.gustT -= dt; wd.gust = wd.gustPeak * Math.sin(Math.PI * (1 - wd.gustT / wd.gustLen)); } else wd.gust = 0;
    wd.speed = D.wind > 0 ? D.wind * (1 + (g.day - 1) * 0.1) + wd.gust : 0;
    wd.x = Math.cos(wd.angle) * wd.speed;
    wd.z = Math.sin(wd.angle) * wd.speed;

    /* ---- player ---- */
    const ra = workerAnim.current;
    let mx = 0; let mz = 0;
    if (keys.current.left) mx -= 1; if (keys.current.right) mx += 1;
    if (keys.current.up) mz -= 1; if (keys.current.down) mz += 1;
    if (!mx && !mz && g.target) {
      const dx = g.target.x - g.px; const dz = g.target.z - g.pz;
      const d = Math.hypot(dx, dz);
      if (d > 0.15) { mx = dx / d; mz = dz / d; }
    }
    if (keys.current.clean) { keys.current.clean = false; if (g.dirt > 0.02 && g.cleaning <= 0) { g.cleaning = 0.8; } }
    g.stun = Math.max(0, g.stun - dt);
    if (g.cleaning > 0) {
      g.cleaning -= dt;
      if (g.cleaning <= 0) { g.dirt = 0; sfx.clean(); onEvent({ text: 'Panel cleaned ✨', color: '#7dd3fc' }); }
    }
    const canMove = g.stun <= 0 && g.cleaning <= 0;
    const len = Math.hypot(mx, mz);
    if (canMove && len > 0) {
      const sp = 7 * dt;
      g.px = THREE.MathUtils.clamp(g.px + (mx / len) * sp, -BOUND, BOUND);
      g.pz = THREE.MathUtils.clamp(g.pz + (mz / len) * sp, -BOUND, BOUND);
      const w = workerRef.current;
      if (w) {
        const want = Math.atan2(mx, mz); let d = want - w.rotation.y;
        while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2;
        w.rotation.y += d * 0.3;
      }
    }
    // the wind pushes the installer (and the big panel he's holding acts like a sail)
    if (wd.speed > 0) {
      g.px = THREE.MathUtils.clamp(g.px + wd.x * dt, -BOUND, BOUND);
      g.pz = THREE.MathUtils.clamp(g.pz + wd.z * dt, -BOUND, BOUND);
    }
    if (workerRef.current) workerRef.current.rotation.z = THREE.MathUtils.lerp(workerRef.current.rotation.z, -wd.x * 0.03, 0.1);
    ra.mode = g.cleaning > 0 ? 'kneel' : g.stun > 0 ? 'facepalm' : 'carry';
    ra.moving = canMove && len > 0;
    ra.speed = 1.4;
    if (workerRef.current) workerRef.current.position.set(g.px, ROOF_TOP, g.pz);
    if (panelCells.current) panelCells.current.color.setRGB(1 - g.dirt * 0.45, 1 - g.dirt * 0.55, 1 - g.dirt * 0.75);

    /* ---- spawning ---- */
    const spawn = (type, x, z) => {
      const it = g.items.find((o) => o.type === type && !o.active);
      if (!it) return;
      it.active = true; it.x = x ?? rand(-BOUND, BOUND); it.z = z ?? rand(-BOUND, BOUND);
      it.y = ROOF_TOP + 13 + rand(0, 3);
      const fall = (4.2 + g.day * 0.5) * D.fall;
      it.vy = type === 'sun' ? fall * 0.85 : type === 'big' ? fall * 0.7 : type === 'dust' ? fall * 1.1 : fall * 0.8;
      it.phase = rand(0, 6);
    };
    const tm = g.timers;
    const tick = (key, rate, fn) => { tm[key] -= dt; if (tm[key] <= 0) { tm[key] = rate > 0 ? -Math.log(1 - Math.random()) / rate : 999; fn(); } };
    if (g.phase === 'day') {
      tick('sun', 0.7 + 1.5 * sunAmt, () => spawn('sun'));
      tick('big', 0.05 + 0.04 * sunAmt, () => spawn('big'));
      tick('water', g.dirt > 0.2 ? 0.14 : 0.04, () => spawn('water'));
    }
    tick('dust', (0.22 + 0.07 * (g.day - 1)) * D.dust * (g.phase === 'day' ? 1 : 0.4), () => spawn('dust'));
    tick('battery', g.phase === 'day' ? 0.05 : 0.07, () => spawn('battery'));
    if (g.day >= 2 || g.t > 22) {
      tick('cloud', 0.06 + 0.02 * g.day, () => {
        const c = g.clouds.find((o) => !o.active);
        if (c) { const dir = Math.random() < 0.5 ? 1 : -1; c.active = true; c.x = -dir * 16; c.z = rand(-3, 3); c.vx = dir * rand(1.4, 2.2); }
      });
    }

    /* ---- clouds + lightning ---- */
    g.clouds.forEach((c) => {
      if (!c.active) return;
      c.x += c.vx * dt;
      if (Math.abs(c.x) > 17) c.active = false;
    });
    const overRoof = g.clouds.filter((c) => c.active && Math.abs(c.x) < ROOF.width / 2 + 1);
    if (overRoof.length && g.day >= 2) {
      tick('strike', 0.35 + 0.1 * g.day, () => {
        const s = g.strikes.find((o) => !o.active);
        const c = overRoof[0];
        if (s) { s.active = true; s.t = 0; s.x = THREE.MathUtils.clamp(rand(c.x - 1.6, c.x + 1.6) * 0.5 + g.px * 0.5, -BOUND, BOUND); s.z = THREE.MathUtils.clamp(rand(c.z - 1.6, c.z + 1.6) * 0.5 + g.pz * 0.5, -BOUND, BOUND); }
      });
    }
    g.strikes.forEach((s) => {
      if (!s.active) return;
      const before = s.t;
      s.t += dt;
      if (before < 1 && s.t >= 1) {
        g.flash = 1;
        if (Math.hypot(s.x - g.px, s.z - g.pz) < 1.35) {
          g.energy -= 14; g.stun = 1; g.combo = 1; sfx.zap();
          onEvent({ text: 'ZAP! −14 ⚡', color: '#f87171' });
          burst.current?.(g.px, ROOF_TOP + 1.5, g.pz, '#fff6a8');
        } else { sfx.dust(); }
      }
      if (s.t > 1.3) s.active = false;
    });

    /* ---- items ---- */
    const shadeAt = (x, z) => g.clouds.some((c) => c.active && Math.hypot(c.x - x, c.z - z) < 2.3);
    const eff = 1 - g.dirt * 0.7;
    let sunInReach = false;
    g.items.forEach((it, i) => {
      const r = itemRefs.current[i];
      const mk = markerRefs.current[i];
      if (!it.active) { if (r) r.visible = false; if (mk) mk.visible = false; return; }
      it.y -= it.vy * dt;
      it.phase += dt * 3;
      if (D.drift > 0) {
        it.x = THREE.MathUtils.clamp(it.x + wd.x * D.drift * dt, -BOUND - 1.5, BOUND + 1.5);
        it.z = THREE.MathUtils.clamp(it.z + wd.z * D.drift * dt, -BOUND - 1.5, BOUND + 1.5);
      }
      if (r) {
        r.visible = true;
        r.position.set(it.x, it.y, it.z);
        r.rotation.y += dt * 2; r.rotation.x += dt * (it.type === 'dust' ? 3 : 0.5);
      }
      if (mk) {
        const h = Math.max(0, it.y - ROOF_TOP);
        const k = Math.min(1, h / 14); // 1 = just spawned, 0 = about to land
        mk.visible = true;
        // predict where the wind will carry it before it lands
        const tLand = Math.max(0, (it.y - (ROOF_TOP + 2.6)) / it.vy);
        const lx = THREE.MathUtils.clamp(it.x + wd.x * D.drift * tLand, -BOUND - 1.5, BOUND + 1.5);
        const lz = THREE.MathUtils.clamp(it.z + wd.z * D.drift * tLand, -BOUND - 1.5, BOUND + 1.5);
        mk.position.set(lx, ROOF_TOP + 0.04, lz);
        mk.children[2].position.x = it.x - lx; mk.children[2].position.z = it.z - lz;
        const [ring, dot, beam] = mk.children;
        ring.scale.setScalar(0.55 + k * 1.1); // shrinks onto the spot as it falls
        ring.material.opacity = 0.35 + (1 - k) * 0.55;
        dot.material.opacity = 0.4 + (1 - k) * 0.5;
        beam.scale.set(1, Math.max(0.01, h), 1);
        beam.position.y = h / 2;
      }
      if ((it.type === 'sun' || it.type === 'big') && it.y < ROOF_TOP + 9 && Math.hypot(it.x - g.px, it.z - g.pz) < (it.type === 'big' ? 1.35 : 1.05)) sunInReach = true;
      const reach = it.type === 'big' ? 1.35 : 1.05;
      if (it.y < CATCH_Y1 && it.y > CATCH_Y0 && g.cleaning <= 0 && Math.hypot(it.x - g.px, it.z - g.pz) < reach) {
        it.active = false;
        if (it.type === 'sun' || it.type === 'big') {
          const shaded = shadeAt(it.x, it.z);
          const base = it.type === 'big' ? 18 : 5.5;
          const gain = base * eff * (shaded ? 0.35 : 1);
          g.energy += gain; g.kwh += gain * 0.1;
          g.score += Math.round((it.type === 'big' ? 50 : 10) * g.combo * D.score);
          g.combo = Math.min(5, g.combo + (it.type === 'big' ? 1 : 0.25));
          if (it.type === 'big') { sfx.big(); onEvent({ text: `MEGA SUN! +${Math.round(gain)}⚡`, color: '#ffd23f' }); } else sfx.catch(g.combo * 2);
          burst.current?.(it.x, it.y, it.z, '#ffd23f');
        } else if (it.type === 'dust') {
          g.dirt = Math.min(1, g.dirt + 0.25); g.combo = 1; sfx.dust();
          onEvent({ text: 'Dusty panel! Press SPACE / Clean', color: '#d6a46a' });
          burst.current?.(it.x, it.y, it.z, '#7a5a3a');
        } else if (it.type === 'battery') {
          g.cap = Math.min(200, g.cap + 15); g.energy += 12; g.score += Math.round(25 * D.score); sfx.battery();
          onEvent({ text: 'Battery upgrade! +15 capacity', color: '#4ade80' });
          burst.current?.(it.x, it.y, it.z, '#4ade80');
        } else if (it.type === 'water') {
          g.dirt = 0; g.score += 15; sfx.water();
          onEvent({ text: 'Washed clean 💧', color: '#7dd3fc' });
          burst.current?.(it.x, it.y, it.z, '#4fb3ff');
        }
      }
      if (it.y < ROOF_TOP + 0.1) it.active = false;
    });

    if (catchRing.current) {
      const cr = catchRing.current;
      cr.visible = true;
      cr.position.set(g.px, ROOF_TOP + 0.05, g.pz);
      cr.material.color.set(sunInReach ? '#ffd23f' : '#ffffff');
      cr.material.opacity = sunInReach ? 0.75 + Math.sin(g.t * 20) * 0.2 : 0.4;
    }

    g.energy = Math.min(g.cap, g.energy);
    g.flash = Math.max(0, g.flash - dt * 4);
    litRef.current = g.phase === 'night' || hour >= 17.5 ? (g.energy < 15 ? (Math.random() > 0.5 ? 1.4 : 0.2) : 1.4) : 0.05;

    if (g.energy <= 0) {
      g.energy = 0; g.status = 'over'; sfx.over();
      onOver({ score: g.score, day: g.day, kwh: g.kwh, hour });
    }

    hudT.current += dt;
    if (hudT.current > 0.1) {
      hudT.current = 0;
      onHud({ energy: g.energy, cap: g.cap, score: g.score, day: g.day, hour, phase: g.phase, combo: g.combo, dirt: g.dirt, cleaning: g.cleaning > 0, flash: g.flash, windX: wd.x, windZ: wd.z, windSpeed: wd.speed, gusting: wd.gust > 1.5, phaseLeft: (g.phase === 'day' ? DAY_LEN : NIGHT_LEN) - g.phaseT });
    }
  });
  return null;
}

/* ------------------------------- input plane ------------------------------ */
function TouchPlane({ game }) {
  const down = useRef(false);
  const setTarget = (e) => {
    const g = game.current;
    g.target = { x: THREE.MathUtils.clamp(e.point.x, -BOUND, BOUND), z: THREE.MathUtils.clamp(e.point.z, -BOUND, BOUND) };
  };
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, ROOF_TOP + 0.02, 0]}
      onPointerDown={(e) => { down.current = true; setTarget(e); }}
      onPointerMove={(e) => { if (down.current || e.pointerType === 'mouse') setTarget(e); }}
      onPointerUp={() => { down.current = false; }}
      onPointerLeave={() => { down.current = false; }}
    >
      <planeGeometry args={[60, 60]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}

function SceneContent(props) {
  const { game } = props;
  const itemRefs = useRef([]);
  const markerRefs = useRef([]);
  const catchRing = useRef();
  const burst = useRef(null);
  const workerRef = useRef();
  const workerAnim = useRef({ mode: 'carry', moving: false, speed: 1 });
  const panelCells = useRef();
  const litRef = useRef(1.2);
  const clock = props.clock;
  const carry = (
    <group position={[0, 1.27, 0]}>
      <SolarPanelModel panel={PANEL} cellsRef={panelCells} />
    </group>
  );
  return (
    <>
      <SkySystem clock={clock} lat={LAT} season="summer" shadowSize={22} />
      <Neighbourhood roof={ROOF} clock={clock} lat={LAT} season="summer" />
      <HouseModel roof={ROOF} site={SITE} obstacles={[]} litRef={litRef} />
      <Worker ref={workerRef} anim={workerAnim} carryPanel={carry} scale={PLAYER_SCALE} />
      <ItemMeshes game={game} refs={itemRefs} />
      <ItemMarkers game={game} refs={markerRefs} />
      <CatchRing ringRef={catchRing} />
      <WindStreaks game={game} />
      <Weather game={game} />
      <Bursts burstRef={burst} />
      <TouchPlane game={game} />
      <Engine {...props} itemRefs={itemRefs} markerRefs={markerRefs} catchRing={catchRing} burst={burst} workerRef={workerRef} workerAnim={workerAnim} panelCells={panelCells} litRef={litRef} />
    </>
  );
}

export default function GameScene(props) {
  return (
    <Canvas shadows dpr={[1, 1.75]} camera={{ position: [0, 20, 22], fov: 46, near: 0.5, far: 6000 }}>
      <SceneContent {...props} />
    </Canvas>
  );
}
