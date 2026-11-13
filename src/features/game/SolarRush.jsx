import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import styled, { keyframes, css } from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBolt, faSun, faMoon, faPlay, faRotateRight, faVolumeHigh, faVolumeXmark, faBroom, faTrophy,
  faCarBattery, faDroplet, faCloudBolt, faArrowLeft, faArrowRight, faArrowUp, faArrowDown, faSolarPanel,
} from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { newGame } from './state';
import { sfx, setMuted } from './sfx';
import { company } from '../../content/company';

const GameScene = lazy(() => import('./GameScene'));

const C = { bg: '#060b18', panel: 'rgba(8,14,30,0.72)', line: 'rgba(255,255,255,0.12)', gold: '#f7b31b', text: '#f1f5f9', muted: '#94a3b8', green: '#4ade80', red: '#f87171' };

const Page = styled.div`
  position: relative;
  height: calc(100vh - 76px);
  height: calc(100dvh - 76px);
  min-height: 520px;
  background: ${C.bg};
  overflow: hidden;
  font-family: 'Inter', system-ui, sans-serif;
  color: ${C.text};
  user-select: none;
  -webkit-user-select: none;
  touch-action: none;
  @media (max-width: 600px) { height: calc(100dvh - 68px); }
  canvas { touch-action: none; }
`;

const Hud = styled.div`
  position: absolute; left: 0; right: 0; top: 0;
  padding: 12px;
  display: flex; gap: 10px; align-items: flex-start; justify-content: space-between;
  pointer-events: none;
  z-index: 2;
`;

const Chip = styled.div`
  background: ${C.panel};
  backdrop-filter: blur(8px);
  border: 1px solid ${C.line};
  border-radius: 14px;
  padding: 8px 12px;
  font-size: 0.85rem;
  display: flex; align-items: center; gap: 8px;
  b { font-family: 'Poppins', sans-serif; font-size: 1.1rem; }
  small { color: ${C.muted}; }
`;

const EnergyBar = styled.div`
  width: min(320px, 44vw);
  .row { display: flex; justify-content: space-between; font-size: 0.78rem; color: ${C.muted}; margin-bottom: 5px; }
  .row b { color: ${C.text}; font-size: 0.9rem; }
  .bar { height: 12px; border-radius: 99px; background: rgba(255,255,255,0.1); overflow: hidden; position: relative; }
  .fill { height: 100%; border-radius: 99px; transition: width 0.15s linear, background 0.3s; }
`;

const pulse = keyframes`0%,100%{opacity:1}50%{opacity:.35}`;
const rise = keyframes`
  0% { opacity: 0; transform: translate(-50%, 10px) scale(0.9); }
  15% { opacity: 1; transform: translate(-50%, 0) scale(1); }
  80% { opacity: 1; }
  100% { opacity: 0; transform: translate(-50%, -24px); }
`;

const Toasts = styled.div`
  position: absolute; left: 50%; top: 92px; transform: translateX(-50%);
  width: 100%; pointer-events: none; z-index: 2;
`;
const Toast = styled.div`
  position: absolute; left: 50%; white-space: nowrap;
  top: ${(p) => p.$i * 34}px;
  font-family: 'Poppins', sans-serif; font-weight: 700;
  font-size: ${(p) => (p.$big ? '1.35rem' : '1rem')};
  color: ${(p) => p.$color};
  text-shadow: 0 2px 12px rgba(0,0,0,0.7);
  animation: ${rise} 1.6s ease forwards;
`;

const Flash = styled.div`
  position: absolute; inset: 0; background: #fff; pointer-events: none; z-index: 1;
  opacity: ${(p) => p.$v * 0.6};
`;

const Controls = styled.div`
  position: absolute; left: 12px; right: 12px; bottom: 12px; z-index: 2;
  display: flex; justify-content: space-between; align-items: flex-end; gap: 10px;
  pointer-events: none;
  > * { pointer-events: auto; }
`;

const RoundBtn = styled.button`
  border: 1px solid ${C.line}; background: ${C.panel}; color: ${C.text};
  backdrop-filter: blur(8px);
  border-radius: 16px; padding: 12px 16px; font-weight: 700; cursor: pointer;
  display: inline-flex; align-items: center; gap: 8px; font-size: 0.9rem;
  ${(p) => p.$hot && css`background: #a16207; border-color: ${C.gold}; animation: ${pulse} 0.9s infinite;`}
`;

const Hint = styled.div`
  font-size: 0.78rem; color: ${C.muted}; background: ${C.panel}; border: 1px solid ${C.line};
  padding: 8px 12px; border-radius: 12px; backdrop-filter: blur(8px);
  @media (max-width: 700px) { display: none; }
`;

const Overlay = styled.div`
  position: absolute; inset: 0; z-index: 3;
  display: grid; place-items: center;
  padding: 16px;
  background: radial-gradient(ellipse at center, rgba(6,11,24,0.55), rgba(6,11,24,0.88));
  overflow-y: auto;
`;

const Card = styled.div`
  width: min(560px, 100%);
  background: rgba(10,18,38,0.92);
  border: 1px solid ${C.line};
  border-radius: 24px;
  padding: clamp(22px, 4vw, 36px);
  text-align: center;
  box-shadow: 0 40px 100px rgba(0,0,0,0.5);
  h1 { font-family: 'Poppins', sans-serif; font-size: clamp(2.2rem, 7vw, 3.4rem); color: #fff; line-height: 1; margin-bottom: 10px; }
  h1 span { background: linear-gradient(90deg, ${C.gold}, #ff8a1f, #ff4d2e); -webkit-background-clip: text; background-clip: text; color: transparent; }
  h2 { font-family: 'Poppins', sans-serif; font-size: 1.8rem; color: #fff; margin-bottom: 6px; }
  p.lead { color: ${C.muted}; margin: 0 auto 20px; max-width: 420px; }
`;

const Legend = styled.ul`
  list-style: none; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 0 0 22px; text-align: left;
  li { display: flex; gap: 10px; align-items: center; font-size: 0.86rem; color: #cbd5e1; background: rgba(255,255,255,0.04); padding: 9px 10px; border-radius: 12px; }
  i { width: 30px; height: 30px; border-radius: 9px; display: grid; place-items: center; font-style: normal; flex-shrink: 0; }
  @media (max-width: 420px) { grid-template-columns: 1fr; }
`;

const Big = styled.button`
  border: 0; border-radius: 999px; padding: 15px 30px; cursor: pointer;
  font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 1.05rem;
  background: linear-gradient(135deg, ${C.gold}, #ff8a1f); color: #111;
  box-shadow: 0 12px 30px rgba(247,179,27,0.4);
  display: inline-flex; align-items: center; gap: 10px;
  &:hover { transform: translateY(-2px); }
`;

const Stats = styled.div`
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 18px 0 20px;
  div { background: rgba(255,255,255,0.05); border-radius: 14px; padding: 12px 6px; }
  b { display: block; font-family: 'Poppins', sans-serif; font-size: 1.5rem; color: ${C.gold}; }
  small { color: ${C.muted}; font-size: 0.75rem; }
`;

const Row = styled.div`
  display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin-top: 12px;
  a, button.link { display: inline-flex; align-items: center; gap: 8px; padding: 11px 16px; border-radius: 999px; text-decoration: none;
    border: 1px solid ${C.line}; color: ${C.text}; font-weight: 600; font-size: 0.9rem; background: transparent; cursor: pointer; }
  a:hover, button.link:hover { border-color: ${C.gold}; color: ${C.gold}; }
`;

const DPad = styled.div`
  display: none;
  @media (pointer: coarse) { display: grid; grid-template-columns: repeat(3, 48px); grid-template-rows: repeat(2, 48px); gap: 6px; }
  button { border: 1px solid ${C.line}; background: ${C.panel}; color: ${C.text}; border-radius: 12px; font-size: 1.1rem; }
  .u { grid-column: 2; grid-row: 1; } .l { grid-column: 1; grid-row: 2; } .d { grid-column: 2; grid-row: 2; } .r { grid-column: 3; grid-row: 2; }
`;

const fmt = (h) => `${((Math.floor(h) + 11) % 12) + 1}:${String(Math.floor((h % 1) * 60)).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
const BEST_KEY = 'noor-solar-rush-best';
const readBest = () => { try { return Number(localStorage.getItem(BEST_KEY)) || 0; } catch { return 0; } };

export default function SolarRush() {
  const game = useRef({ ...newGame(), status: 'ready' });
  const clock = useRef({ hour: 9 });
  const keys = useRef({});
  const [status, setStatus] = useState('ready');
  const [hud, setHud] = useState(null);
  const [result, setResult] = useState(null);
  const [best, setBest] = useState(readBest);
  const [toasts, setToasts] = useState([]);
  const [muted, setMutedState] = useState(false);
  const toastId = useRef(0);

  useEffect(() => { document.title = `Solar Rush — play | ${company.name}`; }, []);

  const start = useCallback(() => {
    sfx.unlock();
    game.current = newGame();
    setResult(null); setToasts([]);
    setStatus('playing');
  }, []);

  useEffect(() => {
    const map = { ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right', ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down' };
    const down = (e) => {
      if (map[e.key]) { keys.current[map[e.key]] = true; game.current.target = null; e.preventDefault(); }
      if (e.key === ' ' || e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        if (game.current.status === 'playing') keys.current.clean = true;
        else start();
      }
      if (e.key === 'Enter' && game.current.status !== 'playing') start();
    };
    const up = (e) => { if (map[e.key]) keys.current[map[e.key]] = false; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, [start]);

  const onHud = useCallback((h) => setHud(h), []);
  const onEvent = useCallback((ev) => {
    const id = ++toastId.current;
    setToasts((t) => [...t.slice(-2), { ...ev, id }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 1600);
  }, []);
  const onOver = useCallback((r) => {
    setResult(r);
    setStatus('over');
    setBest((b) => {
      const nb = Math.max(b, r.score);
      try { localStorage.setItem(BEST_KEY, String(nb)); } catch { /* ignore */ }
      return nb;
    });
  }, []);

  const toggleMute = () => { setMuted(!muted); setMutedState(!muted); };
  const hold = (k) => ({
    onPointerDown: (e) => { e.preventDefault(); keys.current[k] = true; },
    onPointerUp: () => { keys.current[k] = false; },
    onPointerLeave: () => { keys.current[k] = false; },
  });

  const pct = hud ? Math.max(0, Math.min(100, (hud.energy / hud.cap) * 100)) : 60;
  const barColor = pct > 50 ? 'linear-gradient(90deg,#22c55e,#4ade80)' : pct > 22 ? 'linear-gradient(90deg,#f59e0b,#fbbf24)' : 'linear-gradient(90deg,#dc2626,#f87171)';
  const shareText = result ? `I kept my house powered for ${result.day} day${result.day > 1 ? 's' : ''} and scored ${result.score} in Solar Rush by ${company.name}! Can you beat me? https://${company.website}/play` : '';

  return (
    <Page>
      <Suspense fallback={<Overlay><Card><h2>Loading Solar Rush…</h2></Card></Overlay>}>
        <GameScene game={game} keys={keys} clock={clock} onHud={onHud} onEvent={onEvent} onOver={onOver} />
      </Suspense>
      <Flash $v={hud?.flash || 0} />

      {status === 'playing' && hud && (
        <>
          <Hud>
            <Chip><EnergyBar>
              <div className="row">
                <span><FontAwesomeIcon icon={faBolt} color={C.gold} /> House battery</span>
                <span><b>{Math.round(hud.energy)}</b> / {hud.cap}</span>
              </div>
              <div className="bar"><div className="fill" style={{ width: `${pct}%`, background: barColor }} /></div>
            </EnergyBar></Chip>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <Chip><FontAwesomeIcon icon={hud.phase === 'day' ? faSun : faMoon} color={hud.phase === 'day' ? C.gold : '#a5b4fc'} /><span><b>Day {hud.day}</b> <small>{fmt(hud.hour)}</small></span></Chip>
              <Chip><FontAwesomeIcon icon={faTrophy} color={C.gold} /><b>{hud.score}</b>{hud.combo > 1.2 && <small>×{hud.combo.toFixed(1)}</small>}</Chip>
            </div>
          </Hud>
          <Toasts>
            {toasts.map((t, i) => <Toast key={t.id} $i={i} $color={t.color} $big={t.big}>{t.text}</Toast>)}
          </Toasts>
          <Controls>
            <DPad>
              <button type="button" className="u" aria-label="Up" {...hold('up')}><FontAwesomeIcon icon={faArrowUp} /></button>
              <button type="button" className="l" aria-label="Left" {...hold('left')}><FontAwesomeIcon icon={faArrowLeft} /></button>
              <button type="button" className="d" aria-label="Down" {...hold('down')}><FontAwesomeIcon icon={faArrowDown} /></button>
              <button type="button" className="r" aria-label="Right" {...hold('right')}><FontAwesomeIcon icon={faArrowRight} /></button>
            </DPad>
            <Hint>Move: arrows / WASD / mouse · Clean: Space</Hint>
            <div style={{ display: 'flex', gap: 8 }}>
              <RoundBtn type="button" onClick={toggleMute} aria-label={muted ? 'Unmute' : 'Mute'}><FontAwesomeIcon icon={muted ? faVolumeXmark : faVolumeHigh} /></RoundBtn>
              <RoundBtn type="button" $hot={hud.dirt > 0.2} onClick={() => { keys.current.clean = true; }}>
                <FontAwesomeIcon icon={faBroom} /> Clean {hud.dirt > 0.02 && <small>{Math.round(hud.dirt * 100)}% dusty</small>}
              </RoundBtn>
            </div>
          </Controls>
        </>
      )}

      {status === 'ready' && (
        <Overlay>
          <Card>
            <h1>Solar <span>Rush</span></h1>
            <p className="lead">You’re the installer. Catch sunshine on your panel to keep the house powered — then survive the night on your battery.</p>
            <Legend>
              <li><i style={{ background: '#ffd23f33', color: '#ffd23f' }}><FontAwesomeIcon icon={faSun} /></i>Catch sun = energy</li>
              <li><i style={{ background: '#7a5a3a55', color: '#d6a46a' }}><FontAwesomeIcon icon={faBroom} /></i>Dust blocks your panel — clean it</li>
              <li><i style={{ background: '#22c55e33', color: '#4ade80' }}><FontAwesomeIcon icon={faCarBattery} /></i>Batteries store more power</li>
              <li><i style={{ background: '#4fb3ff33', color: '#7dd3fc' }}><FontAwesomeIcon icon={faDroplet} /></i>Water washes the panel</li>
              <li><i style={{ background: '#f8717133', color: C.red }}><FontAwesomeIcon icon={faCloudBolt} /></i>Dodge lightning under storms</li>
              <li><i style={{ background: '#a5b4fc33', color: '#a5b4fc' }}><FontAwesomeIcon icon={faMoon} /></i>No sun at night — plan ahead</li>
            </Legend>
            <Big type="button" onClick={start}><FontAwesomeIcon icon={faPlay} /> Play</Big>
            <p style={{ color: C.muted, fontSize: '0.8rem', marginTop: 14 }}>
              Arrows / WASD or mouse to move · Space to clean · On phones, drag on the roof
              {best > 0 && <><br />Your best: <b style={{ color: C.gold }}>{best}</b></>}
            </p>
          </Card>
        </Overlay>
      )}

      {status === 'over' && result && (
        <Overlay>
          <Card>
            <h2>Load-shedding! 🔌</h2>
            <p className="lead">The house ran out of power at {fmt(result.hour)} on day {result.day}.</p>
            <Stats>
              <div><b>{result.score}</b><small>score</small></div>
              <div><b>{result.day}</b><small>day{result.day > 1 ? 's' : ''} survived</small></div>
              <div><b>{Math.max(result.score, best)}</b><small>best</small></div>
            </Stats>
            <Big type="button" onClick={start}><FontAwesomeIcon icon={faRotateRight} /> Play again</Big>
            <Row>
              <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer"><FontAwesomeIcon icon={faWhatsapp} /> Challenge a friend</a>
              <Link to="/planner"><FontAwesomeIcon icon={faSolarPanel} /> Design my real system</Link>
            </Row>
            <p style={{ color: C.muted, fontSize: '0.85rem', marginTop: 18 }}>
              In real life, a properly sized hybrid system keeps your lights on all night. <Link to="/contact" style={{ color: C.gold }}>Book a free site survey →</Link>
            </p>
          </Card>
        </Overlay>
      )}
    </Page>
  );
}
