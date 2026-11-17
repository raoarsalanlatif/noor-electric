/* eslint-disable react/prop-types */
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDoorClosed, faFaucetDrip, faFan, faTemperatureHigh, faCube, faCheck, faRotate, faTrash, faCopy, faHandPointer, faExpand, faCompress, faBuilding,
} from '@fortawesome/free-solid-svg-icons';
import { ROOF_ITEMS, SURROUNDING } from './config';
import { t } from './ui';

export const ITEM_ICONS = { room: faDoorClosed, tank: faFaucetDrip, ac: faFan, geyser: faTemperatureHigh, other: faCube, building: faBuilding };

const Bar = styled.div`
  position: absolute; top: 12px; left: 12px; right: 12px; z-index: 3;
  display: flex; gap: 6px; flex-wrap: wrap; align-items: center;
  padding: 8px; border-radius: 14px; background: rgba(10,15,26,0.85); backdrop-filter: blur(8px); border: 1px solid ${t.line};
  .title { color: ${t.text}; font-weight: 700; font-size: 0.85rem; margin: 0 6px 0 4px; }
  button { display: inline-flex; align-items: center; gap: 6px; border: 1px solid ${t.line}; background: ${t.card}; color: ${t.text};
    border-radius: 10px; padding: 7px 10px; cursor: pointer; font-size: 0.8rem; font-weight: 600; }
  button:hover { border-color: ${t.orange}; }
  button.on { background: ${t.orange}; color: #111; border-color: ${t.orange}; }
  .fs { margin-left: auto; }
  .sep { width: 1px; align-self: stretch; background: ${t.line}; margin: 0 2px; }
  .done { background: #22c55e; color: #052e16; border-color: #22c55e; }
  @media (max-width: 640px) { .title { width: 100%; } button span { display: none; } .done span { display: inline; } }
`;

const Inspector = styled.div`
  position: absolute; left: 12px; right: 12px; bottom: 12px; z-index: 3;
  display: flex; gap: 10px; flex-wrap: wrap; align-items: center;
  padding: 10px 12px; border-radius: 14px; background: rgba(10,15,26,0.88); backdrop-filter: blur(8px); border: 1px solid ${t.line};
  color: ${t.muted}; font-size: 0.82rem;
  b { color: ${t.text}; }
  label { display: inline-flex; align-items: center; gap: 5px; }
  input { width: 58px; background: ${t.bg}; color: ${t.text}; border: 1px solid ${t.line}; border-radius: 8px; padding: 5px 6px; font: inherit; }
  button { display: inline-flex; align-items: center; gap: 6px; border: 1px solid ${t.line}; background: transparent; color: ${t.text};
    border-radius: 9px; padding: 6px 10px; cursor: pointer; font-size: 0.8rem; }
  button:hover { border-color: ${t.orange}; }
  button.del { color: #fca5a5; border-color: #7f1d1d; }
  .acts { margin-left: auto; display: flex; gap: 6px; }
  .legend { display: flex; gap: 12px; flex-wrap: wrap; }
  .sw { display: inline-block; width: 12px; height: 12px; border-radius: 3px; margin-right: 5px; vertical-align: -1px; }
`;

const num = (v, min, max) => Math.min(max, Math.max(min, Number(v) || min));

export function EditorToolbar({ tool, setTool, onDone, structureLabel, fits, fullscreen, onFullscreen, panelSide, onTurnPanels }) {
  return (
    <Bar>
      <span className="title">Roof editor · {structureLabel}: <span style={{ color: t.orange }}>{fits} panels fit</span></span>
      {Object.entries(ROOF_ITEMS).map(([key, it]) => (
        <button key={key} type="button" className={tool === key ? 'on' : ''} onClick={() => setTool(tool === key ? null : key)} title={`Place: ${it.label}`}>
          <FontAwesomeIcon icon={ITEM_ICONS[key]} /><span>{it.short}</span>
        </button>
      ))}
      <span className="sep" />
      <button type="button" className={tool === 'building' ? 'on' : ''} onClick={() => setTool(tool === 'building' ? null : 'building')} title="Place a nearby building to see its shadow">
        <FontAwesomeIcon icon={faBuilding} /><span>{SURROUNDING.label}</span>
      </button>
      {onTurnPanels && (
        <button type="button" onClick={onTurnPanels} title={`Panels lean towards the ${panelSide} of the house. Click to turn them to the next side.`}>
          <FontAwesomeIcon icon={faRotate} /><span>Turn panels</span>
        </button>
      )}
      {onFullscreen && (
        <button type="button" className="fs" onClick={onFullscreen} aria-label={fullscreen ? 'Exit full screen' : 'View full screen'} title={fullscreen ? 'Exit full screen (Esc)' : 'Full screen'}>
          <FontAwesomeIcon icon={fullscreen ? faCompress : faExpand} />
        </button>
      )}
      <button type="button" className="done" onClick={onDone}><FontAwesomeIcon icon={faCheck} /><span>Done</span></button>
    </Bar>
  );
}

export function EditorInspector({ item, tool, onChange, onRotate, onDuplicate, onDelete }) {
  if (!item) {
    return (
      <Inspector>
        <FontAwesomeIcon icon={faHandPointer} style={{ color: t.orange }} />
        <span>{tool === 'building' ? <>Click on the ground next to the house to place a <b>nearby building</b>.</> : tool ? <>Click on the roof to place the <b>{ROOF_ITEMS[tool].label.toLowerCase()}</b>.</> : <>Pick an item above and click the roof to place it. Drag items to move them; click one to edit its size.</>}</span>
        <span className="legend" style={{ marginLeft: 'auto' }}>
          <span><i className="sw" style={{ background: '#60a5fa88' }} />Panel spots</span>
          <span><i className="sw" style={{ background: '#ef444488' }} />Blocked</span>
          <span><i className="sw" style={{ background: '#f9731688' }} />Shadow</span>
        </span>
      </Inspector>
    );
  }
  const building = item.type === 'building';
  const def = building ? SURROUNDING : ROOF_ITEMS[item.type] || ROOF_ITEMS.other;
  const field = (k, label, min, max) => (
    <label>{label}<input type="number" step="0.1" min={min} max={max} value={item[k]} onChange={(e) => onChange({ [k]: num(e.target.value, min, max) })} />m</label>
  );
  return (
    <Inspector>
      <b><FontAwesomeIcon icon={ITEM_ICONS[item.type] || faCube} /> {def.label}</b>
      {building ? (
        <>
          {field('w', 'Width', 2, 60)}{field('d', 'Depth', 2, 60)}{field('h', 'Height', 2, 120)}
          <span>≈ {Math.max(1, Math.round(item.h / 3.2))} storey{Math.round(item.h / 3.2) > 1 ? 's' : ''} · {Math.round(item.h / 0.3048)} ft · drag it to where it really stands</span>
        </>
      ) : item.type === 'tank' ? (
        <>{field('w', 'Diameter', 0.5, 3)}{field('h', 'Height', 0.5, 3)}</>
      ) : (
        <>{field('w', 'Width', 0.3, 12)}{field('d', 'Depth', 0.3, 12)}{field('h', 'Height', 0.2, 4)}</>
      )}
      {item.type === 'room' && (
        <label title="Start the panels on the roof of this room to save space on the main roof">
          <input type="checkbox" style={{ width: 'auto' }} checked={Boolean(item.panelsOnTop)} onChange={(e) => onChange({ panelsOnTop: e.target.checked })} />
          Panels on top
        </label>
      )}
      <span className="acts">
        {item.type !== 'tank' && <button type="button" onClick={onRotate}><FontAwesomeIcon icon={faRotate} /> Rotate</button>}
        <button type="button" onClick={onDuplicate}><FontAwesomeIcon icon={faCopy} /> Copy</button>
        <button type="button" className="del" onClick={onDelete}><FontAwesomeIcon icon={faTrash} /> Remove</button>
      </span>
    </Inspector>
  );
}
