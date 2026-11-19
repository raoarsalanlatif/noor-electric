/* eslint-disable react/prop-types */
// Top-down shading drawings for the report.
//  - with `hour`: where the shadows of nearby buildings fall on the roof at that hour (drawn at panel height)
//  - without:     every panel coloured by the share of the day's energy it loses to shade
// Text inside the SVG is English/numbers only, like the roof plan.
import { sunFor } from '../../three/sun';
import { panelHeight } from '../shading';

const C = { roof: '#eef1f5', parapet: '#9aa4b2', panel: '#1e3a8a', panelLine: '#60a5fa', building: '#cbd5e1', buildingLine: '#64748b', shadow: '#0f172a', sun: '#f59e0b', ink: '#0f172a', muted: '#64748b' };

const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
/** Green (no loss) through amber to red (half the day's energy or more lost) — same scale as the 3D shade map. */
export function lossColor(loss) {
  const v = Math.max(0, Math.min(1, loss / 0.5));
  const g = [34, 197, 94]; const a = [245, 158, 11]; const r = [239, 68, 68];
  const c = v < 0.5 ? mix(g, a, v * 2) : mix(a, r, (v - 0.5) * 2);
  return `rgb(${c.join(',')})`;
}

/** Convex outline of a set of [x, z] points. */
function hull(points) {
  const p = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = []; const upper = [];
  p.forEach((q) => { while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop(); lower.push(q); });
  p.reverse().forEach((q) => { while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], q) <= 0) upper.pop(); upper.push(q); });
  return lower.slice(0, -1).concat(upper.slice(0, -1));
}

/** Outline of a building's shadow on the horizontal plane at height `y` for sun direction `dir`. */
function shadowOutline(b, y, dir) {
  const rise = b.h - y;
  if (rise <= 0 || dir[1] <= 0.02) return null;
  const sx = (-dir[0] / dir[1]) * rise; const sz = (-dir[2] / dir[1]) * rise;
  const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([i, j]) => [b.x + (i * b.w) / 2, b.z + (j * b.d) / 2]);
  return hull(corners.concat(corners.map(([x, z]) => [x + sx, z + sz])));
}

export default function ShadowPlanSvg({ plan, roof, hour, season = 'winter', width = 236, height = 250, title, uid = 's', losses, margin = 0.3 }) {
  const { layout, panel, installed, shading, site } = plan;
  const W = roof.width; const L = roof.length;
  const pad = title ? 26 : 6; // `margin`: ground shown around the roof (share of its size) so the neighbours are visible
  const spanX = W * (1 + 2 * margin); const spanZ = L * (1 + 2 * margin);
  const s = Math.min((width - 8) / spanX, (height - pad - 8) / spanZ);
  const cx = width / 2; const cz = pad + (height - pad) / 2;
  const X = (x) => cx + x * s; const Y = (z) => cz + z * s;
  const panels = layout.slots.slice(0, installed);
  const pw = layout.footX; const pd = layout.footZ;
  const byHour = hour != null;
  const sun = byHour ? sunFor(plan.city.lat, season, hour, shading.facing) : null;
  const y = panelHeight(site, layout, panel);
  const shadows = byHour && sun.alt > 0 ? shading.buildings.map((b) => shadowOutline(b, y, sun.dir)).filter(Boolean) : [];
  const flat = sun ? Math.hypot(sun.dir[0], sun.dir[2]) || 1 : 1;
  const sunAt = sun ? [cx + (sun.dir[0] / flat) * (width / 2 - 14), cz + (sun.dir[2] / flat) * ((height - pad) / 2 - 14)] : null;
  const clip = `roof-${uid}`;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs><clipPath id={clip}><rect x={X(-W / 2)} y={Y(-L / 2)} width={W * s} height={L * s} /></clipPath></defs>
      <rect x="0" y="0" width={width} height={height} fill="#ffffff" />
      {title && <text x={width / 2} y="16" fontSize="12" fontWeight="700" textAnchor="middle" fill={C.ink} fontFamily="Inter, Arial, sans-serif">{title}</text>}
      {/* nearby buildings */}
      {shading.buildings.map((b) => (
        <g key={b.id}>
          <rect x={X(b.x - b.w / 2)} y={Y(b.z - b.d / 2)} width={b.w * s} height={b.d * s} fill={C.building} stroke={C.buildingLine} strokeWidth="1" />
          {b.w * s > 30 && b.d * s > 14 && (
            <text x={X(b.x)} y={Y(b.z) + 3.5} fontSize="9.5" fontWeight="700" textAnchor="middle" fill={C.buildingLine} fontFamily="Inter, Arial, sans-serif">{`${b.h.toFixed(0)} m`}</text>
          )}
        </g>
      ))}
      {/* roof */}
      <rect x={X(-W / 2)} y={Y(-L / 2)} width={W * s} height={L * s} fill={C.roof} stroke={C.parapet} strokeWidth="2.5" />
      {(layout.wings || []).map((g) => (
        <rect key={g.id} x={X(g.x - g.w / 2)} y={Y(g.z - g.d / 2)} width={g.w * s} height={g.d * s} fill={C.roof} stroke={C.parapet} strokeWidth="2.5" />
      ))}
      {/* panels */}
      {panels.map((p, i) => {
        const loss = (losses || shading.perPanel)[i] || 0;
        return (
          <g key={i}>
            <rect x={X(p.x - pw / 2)} y={Y(p.z - pd / 2)} width={pw * s} height={pd * s} rx="1"
              fill={byHour ? C.panel : lossColor(loss)} stroke={byHour ? C.panelLine : '#ffffff'} strokeWidth={byHour ? 0.6 : 1} />
            {!byHour && pw * s > 18 && (
              <text x={X(p.x)} y={Y(p.z) + 3.5} fontSize={Math.min(11, pw * s * 0.36)} fontWeight="700" textAnchor="middle" fill="#0f172a" fontFamily="Inter, Arial, sans-serif">{`${Math.round(loss * 100)}%`}</text>
            )}
          </g>
        );
      })}
      {/* shadows on the roof */}
      <g clipPath={`url(#${clip})`}>
        {shadows.map((pts, i) => <polygon key={i} points={pts.map(([x, z]) => `${X(x)},${Y(z)}`).join(' ')} fill={C.shadow} opacity="0.5" />)}
      </g>
      {/* where the sun is */}
      {sunAt && sun.alt > 0 && (
        <g>
          <circle cx={sunAt[0]} cy={sunAt[1]} r="6.5" fill={C.sun} />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
            <line key={a} x1={sunAt[0] + Math.cos((a * Math.PI) / 180) * 8.5} y1={sunAt[1] + Math.sin((a * Math.PI) / 180) * 8.5}
              x2={sunAt[0] + Math.cos((a * Math.PI) / 180) * 11.5} y2={sunAt[1] + Math.sin((a * Math.PI) / 180) * 11.5} stroke={C.sun} strokeWidth="1.6" />
          ))}
        </g>
      )}
      {byHour && sun.alt <= 0 && <text x={width / 2} y={height - 6} fontSize="10" textAnchor="middle" fill={C.muted} fontFamily="Inter, Arial, sans-serif">Sun is below the horizon</text>}
    </svg>
  );
}
