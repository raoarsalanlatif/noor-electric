/* eslint-disable react/prop-types */
// Sun access for every month and hour, with the yearly solar access, tilt-and-orientation factor and TSRF.
// The table needs twelve full planner runs, so it is only worked out when the customer opens it.
import { useMemo, useState } from 'react';
import styled from 'styled-components';
import { Card, CardTitle, Button, t } from './ui';
import { yearlyOutlook } from './yearly';
import { tiltDeg } from '../three/dims';

const Stats = styled.div`
  display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin-bottom: 12px;
  > div { background: ${t.cardHi}; border: 1px solid ${t.line}; border-radius: 12px; padding: 10px 12px; }
  .k { font-size: 0.7rem; color: ${t.muted}; text-transform: uppercase; letter-spacing: 0.06em; }
  .v { font-size: 1.3rem; font-weight: 800; margin-top: 2px; }
  .s { font-size: 0.74rem; color: ${t.muted}; margin-top: 2px; }
  @media (max-width: 640px) { grid-template-columns: 1fr; }
`;

const Scroll = styled.div`overflow-x: auto;`;
const Table = styled.table`
  border-collapse: collapse; width: 100%; min-width: 560px; font-size: 0.74rem; font-variant-numeric: tabular-nums;
  th, td { padding: 4px 3px; text-align: center; }
  th { color: ${t.muted}; font-weight: 600; }
  td.m { text-align: left; color: ${t.muted}; font-weight: 600; }
  td.y { font-weight: 800; }
`;
const Note = styled.p`color: ${t.muted}; font-size: 0.8rem; margin: 10px 0 0;`;

const fmtHour = (h) => `${((h + 11) % 12) + 1}${h < 12 ? 'a' : 'p'}`;
const tone = (v) => (v >= 95 ? t.green : v >= 75 ? t.amber : t.red);

export default function SunAccessCard({ plan, planInput }) {
  const [open, setOpen] = useState(false);
  const outlook = useMemo(() => (open && plan.installed > 0 ? yearlyOutlook(planInput, plan) : null), [open, planInput, plan]);
  // show only the hours in which the sun is up in at least one month
  const hours = useMemo(() => (outlook
    ? Array.from({ length: 24 }, (_, k) => k).filter((k) => outlook.months.some((m) => m.sunAccess[k] !== null))
    : []), [outlook]);

  return (
    <Card>
      <CardTitle>Sun access through the year</CardTitle>
      {!open && (
        <>
          <Note style={{ margin: '0 0 12px' }}>See how much direct sun reaches the panels in every month and hour, and the yearly solar access and TSRF an engineer will ask for.</Note>
          <Button type="button" onClick={() => setOpen(true)} disabled={plan.installed === 0}>Show sun access</Button>
        </>
      )}
      {outlook && (
        <>
          <Stats>
            <div><div className="k">Solar access</div><div className="v" style={{ color: tone(outlook.year.sunAccessPct) }}>{outlook.year.sunAccessPct.toFixed(1)}%</div><div className="s">of unshaded energy, after shade</div></div>
            <div><div className="k">Tilt and direction</div><div className="v">{outlook.year.tofPct.toFixed(1)}%</div><div className="s">{tiltDeg(plan.site)}° at {Math.round(plan.shading.facing)}° against {outlook.year.bestTilt}° due south</div></div>
            <div><div className="k">TSRF</div><div className="v" style={{ color: tone(outlook.year.tsrfPct) }}>{outlook.year.tsrfPct.toFixed(1)}%</div><div className="s">solar access × tilt and direction</div></div>
          </Stats>
          <Scroll>
            <Table>
              <thead>
                <tr><th />{hours.map((k) => <th key={k}>{fmtHour(k)}</th>)}<th>Shade loss</th></tr>
              </thead>
              <tbody>
                {outlook.months.map((m) => (
                  <tr key={m.name}>
                    <td className="m">{m.name.slice(0, 3)}</td>
                    {hours.map((k) => (m.sunAccess[k] === null
                      ? <td key={k} style={{ color: t.line }}>–</td>
                      : <td key={k} style={{ color: tone(m.sunAccess[k]) }}>{m.sunAccess[k]}</td>))}
                    <td className="y" style={{ color: m.shadePct >= 3 ? t.amber : t.green }}>{m.shadePct < 0.5 ? '0%' : `${m.shadePct.toFixed(1)}%`}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Scroll>
          <Note>
            Each cell is the share of the panel area in direct sun in that hour (solar time). Shade comes from nearby buildings, things on the roof and the panel row in front.
            {outlook.year.clippedKWh > 1 && ` The inverter clips about ${Math.round(outlook.year.clippedKWh).toLocaleString('en-PK')} kWh a year.`}
            {' '}These are modelled figures; shading is confirmed on site.
          </Note>
        </>
      )}
    </Card>
  );
}
