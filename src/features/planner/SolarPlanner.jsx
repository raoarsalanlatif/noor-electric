import { Suspense, lazy, useCallback, useMemo, useRef, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlay, faPause, faTriangleExclamation, faCircleCheck, faCircleXmark, faWandMagicSparkles, faSun, faMoon, faPenRuler,
} from '@fortawesome/free-solid-svg-icons';
import InputsPanel from './InputsPanel';
import Analytics from './Analytics';
import BookingCard from './BookingCard';
import { computePlan } from './sizing';
import { DEFAULT_LOAD } from './appliances';
import { CITIES, DEFAULT_SITE, ROOF_ITEMS } from './config';
import { EditorToolbar, EditorInspector } from './RoofEditorUI';
import { sunPosition } from '../three/sun';
import { Card, CardTitle, Button, Range, t, statusColor } from './ui';

const RoofScene = lazy(() => import('./RoofScene'));

const Page = styled.div`
  background: radial-gradient(1200px 500px at 70% -10%, #1d2b4a 0%, ${t.bg} 60%);
  color: ${t.text};
  min-height: 100vh;
  padding: 28px 4% 60px;
  font-family: 'Inter', system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  @media (max-width: 600px) { padding: 20px 16px 48px; }
`;

const Hero = styled.header`
  max-width: 1400px;
  margin: 0 auto 22px;
  h1 { font-size: clamp(1.7rem, 3.4vw, 2.6rem); margin: 0 0 6px; letter-spacing: -0.02em; color: ${t.text}; }
  h1 span { background: linear-gradient(90deg, ${t.orange}, #ffd36b); -webkit-background-clip: text; background-clip: text; color: transparent; }
  p { color: ${t.muted}; margin: 0; max-width: 680px; }
`;

const Layout = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 380px minmax(0, 1fr);
  grid-template-areas: 'side scene' 'side rest';
  gap: 18px;
  align-items: start;
  @media (max-width: 1024px) {
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas: 'scene' 'side' 'rest';
  }
`;

const Side = styled.aside`
  grid-area: side;
  position: sticky;
  top: 96px;
  @media (max-width: 1024px) { position: static; }
`;

const Main = styled.div`
  grid-area: rest;
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
`;

const SceneWrap = styled.div`
  grid-area: scene;
  position: relative;
  height: clamp(340px, 52vh, 560px);
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid ${(p) => (p.$status === 'fail' ? `${t.red}aa` : t.line)};
  box-shadow: ${(p) => (p.$status === 'fail' ? `0 0 0 4px ${t.red}22, 0 20px 60px ${t.red}22` : '0 20px 60px rgba(0,0,0,0.35)')};
  transition: border-color 0.3s, box-shadow 0.3s;
  background: #0b1220;
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.03); }
`;

const Banner = styled.div`
  position: absolute;
  top: 14px;
  left: 14px;
  right: 14px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
  pointer-events: none;
  .status {
    pointer-events: auto;
    display: inline-flex; align-items: center; gap: 8px;
    padding: 10px 14px; border-radius: 12px;
    background: ${(p) => `${statusColor[p.$status]}22`};
    border: 1px solid ${(p) => statusColor[p.$status]};
    color: #fff;
    backdrop-filter: blur(8px);
    font-weight: 800;
    letter-spacing: 0.02em;
    animation: ${(p) => (p.$status === 'fail' ? pulse : 'none')} 1.2s ease-in-out infinite;
    svg { color: ${(p) => statusColor[p.$status]}; }
  }
  .live {
    background: rgba(10,15,26,0.7); backdrop-filter: blur(8px);
    border: 1px solid ${t.line}; border-radius: 12px; padding: 8px 12px; font-size: 0.8rem; color: ${t.muted};
    text-align: right;
    b { color: ${t.text}; }
  }
  @media (max-width: 600px) { .live { display: none; } }
`;

const TimeBar = styled.div`
  position: absolute;
  bottom: 12px;
  left: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: rgba(10,15,26,0.75);
  backdrop-filter: blur(8px);
  border: 1px solid ${t.line};
  border-radius: 12px;
  button { width: 34px; height: 34px; border-radius: 9px; border: 0; background: ${t.orange}; color: #111; cursor: pointer; flex-shrink: 0; }
  .clock { min-width: 74px; font-variant-numeric: tabular-nums; font-weight: 700; display: flex; gap: 6px; align-items: center; }
`;

const Crew = styled.div`
  position: absolute;
  left: 14px;
  top: 70px;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  padding: 6px 8px 6px 12px;
  background: rgba(10,15,26,0.72);
  backdrop-filter: blur(8px);
  border: 1px solid ${t.line};
  border-radius: 12px;
  font-size: 0.8rem;
  color: ${t.muted};
  max-width: calc(100% - 28px);
  b { color: ${t.text}; }
  .label { margin-right: 4px; }
  button { border: 1px solid ${t.line}; background: transparent; color: ${t.text}; border-radius: 8px; padding: 4px 9px; cursor: pointer; font-size: 0.78rem; }
  button.on, button:hover { background: ${t.orange}; color: #111; border-color: ${t.orange}; }
`;

const EditBtn = styled.button`
  position: absolute; right: 14px; bottom: 70px; z-index: 2;
  display: inline-flex; align-items: center; gap: 8px;
  border: 0; border-radius: 12px; padding: 10px 14px; cursor: pointer;
  background: ${t.orange}; color: #111; font-weight: 700; font-size: 0.85rem;
  box-shadow: 0 10px 30px rgba(0,0,0,0.35);
  &:hover { filter: brightness(1.08); }
`;

const Loading = styled.div`
  height: 100%; display: grid; place-items: center; color: ${t.muted};
`;

const Diagnosis = styled(Card)`
  border-color: ${(p) => `${statusColor[p.$status]}66`};
  ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
  li { display: flex; gap: 10px; align-items: flex-start; }
  li svg { margin-top: 3px; }
  li b { display: block; color: ${t.text}; }
  li span { color: ${t.muted}; font-size: 0.88rem; }
`;

const Fixes = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 10px;
  margin-top: 14px;
`;

const Fix = styled.div`
  background: ${t.cardHi};
  border: 1px solid ${t.line};
  border-radius: 12px;
  padding: 12px;
  b { display: block; color: ${t.text}; margin-bottom: 4px; }
  p { font-size: 0.85rem; color: ${t.muted}; margin: 0 0 8px; }
  button { padding: 7px 12px; font-size: 0.8rem; border-radius: 9px; }
`;

const fmtHour = (h) => `${((h + 11) % 12) + 1}:00 ${h < 12 ? 'AM' : 'PM'}`;
const statusText = {
  ok: 'Doable — this system works',
  warn: 'Works, with gaps',
  fail: 'Not doable as designed',
};
const statusIcon = { ok: faCircleCheck, warn: faTriangleExclamation, fail: faCircleXmark };

export default function SolarPlanner() {
  const [load, setLoad] = useState(DEFAULT_LOAD);
  const [location, setLocation] = useState(CITIES[0]);
  const [season, setSeason] = useState('annual');
  const [site, setSite] = useState(DEFAULT_SITE);
  const [roof, setRoof] = useState({ width: 10, length: 14 });
  const crewCtl = useRef({ speed: 1, skip: false, replay: 0 });
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [speed, setSpeed] = useState(1);
  const onProgress = useCallback((done, total) => setProgress({ done, total }), []);
  const [panelWatts, setPanelWatts] = useState(550);
  const [mode, setMode] = useState('auto');
  const [custom, setCustom] = useState({ panels: 12, inverterKW: 6, batteryKWh: 10 });
  const [withBattery, setWithBattery] = useState(false);
  const [offGrid, setOffGrid] = useState(false);

  const clock = useRef({ hour: 9, playing: true });
  const [hour, setHour] = useState(9);
  const [playing, setPlaying] = useState(true);
  const onHour = useCallback((h) => setHour(h), []);

  // ---- 3D roof editor ----
  const [editing, setEditing] = useState(false);
  const [tool, setTool] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const sceneRef = useRef(null);
  const updateItems = useCallback((fn) => setSite((st) => ({ ...st, items: fn(st.items || []) })), []);
  const addItem = useCallback((type, x = 0, z = 0) => {
    const def = ROOF_ITEMS[type] || ROOF_ITEMS.other;
    const id = `${type}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e4)}`;
    updateItems((items) => [...items, { id, type, x, z, w: def.w, d: def.d, h: def.h }]);
    setSelectedId(id);
    setTool(null);
    return id;
  }, [updateItems]);
  const moveItem = useCallback((id, x, z) => updateItems((items) => items.map((it) => (it.id === id ? { ...it, x, z } : it))), [updateItems]);
  const changeItem = (id, patch) => updateItems((items) => items.map((it) => {
    if (it.id !== id) return it;
    const next = { ...it, ...patch };
    if (it.type === 'tank' && patch.w) next.d = patch.w; // tanks are round
    return next;
  }));
  const removeItem = (id) => { updateItems((items) => items.filter((it) => it.id !== id)); setSelectedId(null); };
  const openEditor = () => {
    // edit in clear midday light
    clock.current.hour = 12.01; clock.current.playing = false; setPlaying(false); setHour(12);
    setEditing(true);
    sceneRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };
  const closeEditor = () => {
    setEditing(false); setTool(null); setSelectedId(null); crewCtl.current.replay += 1;
    clock.current.playing = true; setPlaying(true);
  };
  const editor = useMemo(() => ({
    editing, tool, selectedId,
    onPlace: (type, x, z) => addItem(type, x, z),
    onSelect: setSelectedId,
    onMoveItem: moveItem,
  }), [editing, tool, selectedId, addItem, moveItem]);

  const plan = useMemo(
    () => computePlan({ load, location, season, site, roof, panelWatts, mode, custom, withBattery, offGrid }),
    [load, location, season, site, roof, panelWatts, mode, custom, withBattery, offGrid],
  );

  const togglePlay = () => {
    clock.current.playing = !clock.current.playing;
    setPlaying(clock.current.playing);
  };
  const scrub = (e) => {
    const h = Number(e.target.value);
    clock.current.hour = h + 0.01;
    clock.current.playing = false;
    setPlaying(false);
    setHour(h);
  };

  const applyFix = (action) => {
    if (!action) return;
    if (action.panelWatts) setPanelWatts(action.panelWatts);
    if (action.swapAC) {
      setLoad((prev) => {
        const n = (prev.ac15?.qty || 0) + (prev.ac1?.qty || 0);
        const next = { ...prev, ac15inv: { qty: (prev.ac15inv?.qty || 0) + n, hours: prev.ac15?.hours || prev.ac1?.hours || 8 } };
        delete next.ac15; delete next.ac1;
        return next;
      });
    }
    if (action.inverterKW) setCustom((c) => ({ ...c, inverterKW: action.inverterKW }));
    if (action.batteryKWh) { setWithBattery(true); setCustom((c) => ({ ...c, batteryKWh: action.batteryKWh })); }
    if (action.structure) setSite((st) => ({ ...st, structure: action.structure }));
  };

  const k = hour % 24;
  const night = sunPosition(location.lat, season, k + 0.5).alt < 0;
  const setSpeedX = (x) => { crewCtl.current.speed = x; setSpeed(x); };
  const installing = progress.done < progress.total;

  return (
    <Page>
      <Hero>
        <h1>Design your <span>solar system</span> live</h1>
        <p>Tell us what you run at home and how big your roof is. We size the system, build it on your roof in 3D and show you — honestly — whether it works.</p>
      </Hero>

      <Layout>
        <Side>
          <InputsPanel
            load={load} setLoad={setLoad}
            location={location} setLocation={setLocation}
            season={season} setSeason={setSeason}
            site={site} setSite={setSite}
            onEditRoof={openEditor} onAddItem={(type) => { addItem(type, 0, 0); openEditor(); }} onRemoveItem={removeItem}
            roof={roof} setRoof={setRoof}
            panelWatts={panelWatts} setPanelWatts={setPanelWatts}
            mode={mode} setMode={setMode}
            custom={custom} setCustom={setCustom}
            withBattery={withBattery} setWithBattery={setWithBattery}
            offGrid={offGrid} setOffGrid={setOffGrid}
            plan={plan}
          />
        </Side>

          <SceneWrap $status={plan.status} ref={sceneRef}>
            <Suspense fallback={<Loading>Building your roof…</Loading>}>
              <RoofScene plan={plan} roof={roof} site={site} lat={location.lat} season={season}
                clock={clock} onHour={onHour} crewCtl={crewCtl} onProgress={onProgress} editor={editor} />
            </Suspense>
            {editing && (() => {
              const sel = plan.layout.obstacles.find((o) => o.id === selectedId);
              const raw = (site.items || []).find((o) => o.id === selectedId);
              return (
                <>
                  <EditorToolbar tool={tool} setTool={setTool} onDone={closeEditor} structureLabel={plan.structure.label} fits={plan.layout.maxPanels} />
                  <EditorInspector
                    item={raw && sel ? { ...raw, ...sel } : null} tool={tool}
                    onChange={(patch) => changeItem(selectedId, patch)}
                    onRotate={() => raw && changeItem(selectedId, { w: raw.d, d: raw.w })}
                    onDuplicate={() => raw && addItem(raw.type, Math.min(roof.width / 2, raw.x + raw.w + 0.3), raw.z)}
                    onDelete={() => removeItem(selectedId)}
                  />
                </>
              );
            })()}
            {!editing && (<>
            <Banner $status={plan.status}>
              <div className="status"><FontAwesomeIcon icon={statusIcon[plan.status]} />{statusText[plan.status]}</div>
              <div className="live">
                Sun <b>{plan.solarKw[k].toFixed(1)} kW</b> · Load <b>{plan.loadKw[k].toFixed(1)} kW</b>
                {plan.chosen.batteryKWh > 0 && <> · Battery <b>{Math.round(plan.sim.soc[k])}%</b></>}
                {plan.sim.blackout[k] && <div style={{ color: '#fca5a5', fontWeight: 700 }}>{plan.sim.trip[k] ? 'Inverter tripped!' : 'Power cut — house is dark'}</div>}
              </div>
            </Banner>
            <Crew>
              <span className="label">
                {installing ? <>Installing panel <b>{progress.done + 1}</b> of {progress.total}</> : plan.overflow > 0 ? <><b>{progress.total - plan.overflow}</b> installed · <b style={{ color: t.red }}>{plan.overflow}</b> fell off the roof</> : <><b>{progress.total}</b> panels installed</>}
              </span>
              {installing ? (
                <>
                  {[1, 2, 4].map((x) => <button key={x} type="button" className={speed === x ? 'on' : ''} onClick={() => setSpeedX(x)}>{x}×</button>)}
                  <button type="button" onClick={() => { crewCtl.current.skip = true; }}>Skip</button>
                </>
              ) : (
                <button type="button" onClick={() => { crewCtl.current.replay += 1; }}>Replay install</button>
              )}
            </Crew>
            <EditBtn type="button" onClick={openEditor}><FontAwesomeIcon icon={faPenRuler} /> Edit roof</EditBtn>
            <TimeBar>
              <button type="button" onClick={togglePlay} aria-label={playing ? 'Pause day' : 'Play day'}><FontAwesomeIcon icon={playing ? faPause : faPlay} /></button>
              <div className="clock"><FontAwesomeIcon icon={night ? faMoon : faSun} style={{ color: night ? '#a5b4fc' : t.orange }} />{fmtHour(k)}</div>
              <Range min={0} max={23} step={1} value={k} onChange={scrub} aria-label="Time of day" />
            </TimeBar>
            </>)}
          </SceneWrap>

        <Main>

          {(plan.issues.length > 0 || plan.fixes.length > 0) && (
            <Diagnosis $status={plan.status}>
              <CardTitle>What we found</CardTitle>
              <ul>
                {plan.issues.map((i) => (
                  <li key={i.type}>
                    <FontAwesomeIcon icon={i.severity === 'fail' ? faCircleXmark : faTriangleExclamation} style={{ color: i.severity === 'fail' ? t.red : t.amber }} />
                    <div><b>{i.title}</b><span>{i.detail}</span></div>
                  </li>
                ))}
              </ul>
              {plan.fixes.length > 0 && (
                <Fixes>
                  {plan.fixes.map((f) => (
                    <Fix key={f.title}>
                      <b><FontAwesomeIcon icon={faWandMagicSparkles} style={{ color: t.orange }} /> {f.title}</b>
                      <p>{f.detail}</p>
                      {f.action && <Button type="button" onClick={() => applyFix(f.action)}>Apply</Button>}
                    </Fix>
                  ))}
                </Fixes>
              )}
            </Diagnosis>
          )}

          <Analytics plan={plan} hour={k} />
          <BookingCard plan={plan} />
          <p style={{ color: t.muted, fontSize: '0.78rem', margin: 0 }}>
            Indicative estimate based on average sun hours for {plan.city.name} ({season === 'annual' ? 'year average' : season}) and typical appliance usage. Prices and tariffs are illustrative; final design is confirmed after a site survey.
          </p>
        </Main>
      </Layout>
    </Page>
  );
}
