/* eslint-disable react/prop-types */
// Top-down roof plan for the report: roof outline, parapet, rooftop items, kept-clear zones,
// every installed panel, and dimension lines (roof width/depth, panel array size, setbacks).
// Text inside the SVG is English/numbers only; bilingual labels are in the HTML around it.
import { facingLabel } from '../shading';

const C = {
  roof: '#eef1f5', parapet: '#9aa4b2', panel: '#1e3a8a', panelLine: '#60a5fa',
  item: '#4b5563', tank: '#111827', keep: '#fecaca', shade: '#fed7aa', dim: '#0f172a', accent: '#f47b20',
};

function Dim({ x1, y1, x2, y2, label, vertical, offset = 0 }) {
  const tick = 6;
  if (vertical) {
    const x = x1 + offset;
    return (
      <g stroke={C.dim} strokeWidth="1" fill={C.dim}>
        <line x1={x} y1={y1} x2={x} y2={y2} />
        <line x1={x - tick} y1={y1} x2={x + tick} y2={y1} />
        <line x1={x - tick} y1={y2} x2={x + tick} y2={y2} />
        <text x={x - 8} y={(y1 + y2) / 2} fontSize="13" fontWeight="700" stroke="none" textAnchor="middle"
          transform={`rotate(-90 ${x - 8} ${(y1 + y2) / 2})`} fontFamily="Inter, Arial, sans-serif">{label}</text>
      </g>
    );
  }
  const y = y1 + offset;
  return (
    <g stroke={C.dim} strokeWidth="1" fill={C.dim}>
      <line x1={x1} y1={y} x2={x2} y2={y} />
      <line x1={x1} y1={y - tick} x2={x1} y2={y + tick} />
      <line x1={x2} y1={y - tick} x2={x2} y2={y + tick} />
      <text x={(x1 + x2) / 2} y={y - 7} fontSize="13" fontWeight="700" stroke="none" textAnchor="middle" fontFamily="Inter, Arial, sans-serif">{label}</text>
    </g>
  );
}

export default function RoofPlanSvg({ plan, roof, width = 700, height = 560 }) {
  const facing = plan.shading?.facing ?? 180;
  const { layout, panel, installed } = plan;
  const W = roof.width; const L = roof.length;
  const pad = { l: 64, r: 30, t: 54, b: 60 };
  const s = Math.min((width - pad.l - pad.r) / W, (height - pad.t - pad.b) / L);
  const ox = pad.l + ((width - pad.l - pad.r) - W * s) / 2;
  const oy = pad.t;
  const X = (x) => ox + (x + W / 2) * s;
  const Y = (z) => oy + (z + L / 2) * s;
  const m = (v) => `${v.toFixed(1)} m`;
  const panels = layout.slots.slice(0, installed);
  const pw = layout.colW - 0.03; const pd = layout.depth;
  const ph = plan.site.parapetH || 0;

  // extents of the panel array
  let arr = null;
  if (panels.length) {
    const xs = panels.map((p) => p.x); const zs = panels.map((p) => p.z);
    arr = { x0: Math.min(...xs) - pw / 2, x1: Math.max(...xs) + pw / 2, z0: Math.min(...zs) - pd / 2, z1: Math.max(...zs) + pd / 2 };
  }
  const rows = new Set(panels.map((p) => p.z.toFixed(2))).size;
  const roofH = L * s;

  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <rect x="0" y="0" width={width} height={height} fill="#ffffff" />
      {/* roof + parapet */}
      <rect x={X(-W / 2)} y={Y(-L / 2)} width={W * s} height={L * s} fill={C.roof} stroke={C.parapet} strokeWidth={ph > 0 ? 6 : 2} />

      {/* kept-clear zones */}
      {layout.keepOuts.map((k) => {
        const x0 = Math.max(k.x0, -W / 2); const x1 = Math.min(k.x1, W / 2);
        const z0 = Math.max(k.z0, -L / 2); const z1 = Math.min(k.z1, L / 2);
        if (x1 <= x0 || z1 <= z0) return null;
        return <rect key={k.id} x={X(x0)} y={Y(z0)} width={(x1 - x0) * s} height={(z1 - z0) * s} fill={k.shade ? C.shade : C.keep} opacity="0.7" />;
      })}

      {/* rooftop items */}
      {layout.obstacles.map((o) => (o.type === 'tank' ? (
        <g key={o.id}>
          <circle cx={X(o.x)} cy={Y(o.z)} r={(o.w / 2) * s} fill={C.tank} stroke="#fff" strokeWidth="1.5" />
          <text x={X(o.x)} y={Y(o.z) + 4} fontSize="10" fill="#fff" textAnchor="middle" fontFamily="Inter, Arial, sans-serif">TANK</text>
        </g>
      ) : (
        <g key={o.id}>
          <rect x={X(o.x - o.w / 2)} y={Y(o.z - o.d / 2)} width={o.w * s} height={o.d * s} fill={C.item} stroke="#fff" strokeWidth="1.5" />
          {o.w * s > 34 && o.d * s > 14 && (
            <text x={X(o.x)} y={Y(o.z) + 4} fontSize="10" fill="#fff" textAnchor="middle" fontFamily="Inter, Arial, sans-serif">
              {{ room: 'ROOM', ac: 'AC', geyser: 'GEYSER', other: 'OTHER' }[o.type] || ''}
            </text>
          )}
        </g>
      )))}

      {/* panels */}
      {panels.map((p, i) => (
        <g key={i}>
          <rect x={X(p.x - pw / 2)} y={Y(p.z - pd / 2)} width={pw * s} height={pd * s} fill={C.panel} stroke={C.panelLine} strokeWidth="1" rx="1.5" />
          <line x1={X(p.x)} y1={Y(p.z - pd / 2) + 2} x2={X(p.x)} y2={Y(p.z + pd / 2) - 2} stroke={C.panelLine} strokeWidth="0.6" opacity="0.7" />
        </g>
      ))}

      {/* roof dimensions */}
      <Dim x1={X(-W / 2)} y1={Y(-L / 2)} x2={X(W / 2)} y2={Y(-L / 2)} offset={-22} label={`Roof width ${m(W)}`} />
      <Dim vertical x1={X(-W / 2)} y1={Y(-L / 2)} x2={X(-W / 2)} y2={Y(L / 2)} offset={-26} label={`Roof depth ${m(L)}`} />
      {/* panel array dimensions */}
      {arr && (
        <>
          <Dim x1={X(arr.x0)} y1={Y(L / 2)} x2={X(arr.x1)} y2={Y(L / 2)} offset={26} label={`Panel array ${m(arr.x1 - arr.x0)}`} />
          {roofH > 160 && (
            <Dim vertical x1={X(W / 2)} y1={Y(arr.z0)} x2={X(W / 2)} y2={Y(arr.z1)} offset={22} label={`${m(arr.z1 - arr.z0)} · ${rows} row${rows === 1 ? '' : 's'}`} />
          )}
        </>
      )}

      {/* compass + front marker */}
      <g transform={`translate(${width - 30}, ${pad.t + 6})`} fontFamily="Inter, Arial, sans-serif">
        {/* north arrow: turns with the direction the house faces */}
        <polygon points="0,-14 7,6 0,1 -7,6" fill={C.dim} transform={`rotate(${180 - facing})`} />
        <text x="0" y="26" fontSize="12" fontWeight="700" textAnchor="middle" fill={C.dim}>N</text>
      </g>
      <text x={X(0)} y={Y(L / 2) + 50} fontSize="11" fill={C.accent} fontWeight="700" textAnchor="middle" fontFamily="Inter, Arial, sans-serif">
        {facing === 180 ? 'FRONT · SOUTH (SUN SIDE) ▼' : `FRONT · FACES ${facingLabel(facing).toUpperCase()} ▼`}
      </text>
      <text x={8} y={16} fontSize="10" fill="#64748b" fontFamily="Inter, Arial, sans-serif">
        {`${panel.watts} W panels ${panel.width.toFixed(2)} × ${panel.length.toFixed(2)} m · row pitch ${layout.pitch.toFixed(1)} m · structure: ${plan.structure.label}`}
      </text>
    </svg>
  );
}
