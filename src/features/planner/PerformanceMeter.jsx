/* eslint-disable react/prop-types */
// Live performance meter shown over the 3D view. It follows the time slider:
// 100% is the best hour of this season for the same panels facing south under open sky,
// so the needle drops with the time of day, the direction of the house and shade from nearby buildings.
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLayerGroup } from '@fortawesome/free-solid-svg-icons';
import { t } from './ui';

const Box = styled.div`
  position: absolute; top: 62px; right: 14px; z-index: 2; width: 172px;
  padding: 10px 12px 10px; border-radius: 14px; color: ${t.text};
  background: rgba(10,15,26,0.78); backdrop-filter: blur(8px); border: 1px solid ${t.line};
  .ttl { font-size: 0.66rem; text-transform: uppercase; letter-spacing: 0.08em; color: ${t.muted}; }
  .gauge { position: relative; margin-top: 4px; }
  .pct { position: absolute; left: 0; right: 0; bottom: 0; text-align: center; font-size: 1.5rem; font-weight: 800; line-height: 1; }
  .pct small { font-size: 0.8rem; font-weight: 700; }
  .rows { margin-top: 8px; display: grid; gap: 3px; font-size: 0.74rem; color: ${t.muted}; }
  .rows div { display: flex; justify-content: space-between; gap: 8px; }
  .rows b { color: ${t.text}; font-weight: 700; }
  button { margin-top: 8px; width: 100%; display: inline-flex; align-items: center; justify-content: center; gap: 6px; cursor: pointer;
    border: 1px solid ${t.line}; background: transparent; color: ${t.text}; border-radius: 9px; padding: 6px 8px; font-size: 0.76rem; font-weight: 700; }
  button:hover { border-color: ${t.orange}; }
  button.on { background: ${t.orange}; color: #111; border-color: ${t.orange}; }
  .key { margin-top: 6px; height: 6px; border-radius: 99px; background: linear-gradient(90deg, #22c55e, #f59e0b, #ef4444); }
  .keyl { display: flex; justify-content: space-between; font-size: 0.64rem; color: ${t.muted}; margin-top: 2px; }
  @media (max-width: 640px) {
    /* phones: just the dial (and the shade map switch), tucked under the install bar */
    width: 104px; padding: 6px 8px 8px; top: 116px;
    .rows, .ttl, .key, .keyl { display: none; }
    .pct { font-size: 1.05rem; }
    button { margin-top: 6px; padding: 5px 6px; font-size: 0.7rem; }
  }
`;

const R = 54; const LEN = Math.PI * R; // half circle

export default function PerformanceMeter({ plan, hour, shadeMap, onShadeMap }) {
  const best = Math.max(...plan.solarKwOpen, 0);
  const now = plan.solarKw[hour] || 0;
  const pct = best > 0 ? Math.min(1, now / best) : 0;
  const night = (plan.solarKwOpen[hour] || 0) <= 0;
  const { shading } = plan;
  const sunOn = 1 - (shading.shade[hour] || 0);
  const tone = night ? t.muted : pct >= 0.6 ? t.green : pct >= 0.3 ? t.amber : t.red;
  const hasBuildings = shading.buildings.length > 0;
  return (
    <Box role="group" aria-label="Performance meter">
      <div className="ttl">Performance now</div>
      <div className="gauge">
        <svg viewBox="0 0 128 70" width="100%" aria-hidden="true">
          <path d={`M 10 64 A ${R} ${R} 0 0 1 118 64`} fill="none" stroke="#1e293b" strokeWidth="10" strokeLinecap="round" />
          {pct > 0.005 && (
            <path d={`M 10 64 A ${R} ${R} 0 0 1 118 64`} fill="none" stroke={tone} strokeWidth="10" strokeLinecap="round"
              strokeDasharray={`${LEN * pct} ${LEN}`} style={{ transition: 'stroke-dasharray 0.4s, stroke 0.4s' }} />
          )}
        </svg>
        <div className="pct" style={{ color: tone }}>{night ? 'Night' : <>{Math.round(pct * 100)}<small>%</small></>}</div>
      </div>
      <div className="rows">
        <div><span>Output</span><b>{now.toFixed(1)} kW</b></div>
        <div><span>Sun on panels</span><b style={{ color: !night && sunOn < 0.9 ? t.amber : undefined }}>{night ? '—' : `${Math.round(sunOn * 100)}%`}</b></div>
        <div className="day"><span>Today</span><b>{plan.solarKWh.toFixed(1)} kWh</b></div>
        {hasBuildings && <div className="day"><span>Lost to shade</span><b style={{ color: shading.lossPct >= 3 ? t.amber : t.green }}>{Math.round(shading.lossPct)}%</b></div>}
      </div>
      {hasBuildings && (
        <>
          <button type="button" className={shadeMap ? 'on' : ''} aria-pressed={shadeMap} onClick={onShadeMap} title="Colour each panel by how much of the day's energy it loses to shade">
            <FontAwesomeIcon icon={faLayerGroup} /> Shade map
          </button>
          {shadeMap && (<><div className="key" /><div className="keyl"><span>no loss</span><span>50%+ lost</span></div></>)}
        </>
      )}
    </Box>
  );
}
