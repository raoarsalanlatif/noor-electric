/* eslint-disable react/prop-types */
import styled from 'styled-components';
import {
  ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, Tooltip, ReferenceLine, CartesianGrid, Legend,
  BarChart, Bar, Cell, LabelList,
} from 'recharts';
import { Card, CardTitle, t, statusColor } from './ui';
import { PLANNER_CONFIG } from './config';

const pkr = (n) => `Rs ${Math.round(n).toLocaleString('en-PK')}`;
const fmtHour = (h) => `${((h + 11) % 12) + 1}${h < 12 ? 'am' : 'pm'}`;

const Kpis = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  @media (max-width: 720px) { grid-template-columns: repeat(2, 1fr); }
`;

const Kpi = styled.div`
  background: ${t.card};
  border: 1px solid ${(p) => (p.$tone ? `${p.$tone}66` : t.line)};
  border-radius: 14px;
  padding: 14px;
  .k { font-size: 0.72rem; color: ${t.muted}; text-transform: uppercase; letter-spacing: 0.06em; }
  .v { font-size: 1.45rem; font-weight: 800; color: ${(p) => p.$tone || t.text}; margin-top: 4px; line-height: 1.1; }
  .s { font-size: 0.76rem; color: ${t.muted}; margin-top: 4px; }
`;

const Grid2 = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 12px;
  @media (max-width: 900px) { grid-template-columns: 1fr; }
`;

const Bar100 = styled.div`
  height: 8px;
  border-radius: 99px;
  background: #1e293b;
  overflow: hidden;
  margin-top: 8px;
  div { height: 100%; width: ${(p) => p.$pct}%; background: ${(p) => p.$color}; transition: width 0.4s; }
`;

const tooltipStyle = { background: '#0b1220', border: `1px solid ${t.line}`, borderRadius: 10, color: t.text, fontSize: 12 };

export default function Analytics({ plan, hour }) {
  const data = plan.loadKw.map((l, k) => ({
    h: k,
    Load: +l.toFixed(2),
    Solar: +plan.solarKw[k].toFixed(2),
    Battery: plan.chosen.batteryKWh ? Math.round(plan.sim.soc[k]) : null,
  }));
  const bill = [
    { name: 'Today', v: Math.round(plan.billBefore) },
    { name: 'With solar', v: Math.round(plan.billAfter) },
  ];
  const cov = Math.round(plan.coverage * 100);
  const covTone = cov >= 85 ? t.green : cov >= 50 ? t.amber : t.red;
  const roofTone = plan.overflow ? t.red : t.green;
  const invTone = plan.issues.some((i) => i.type === 'inverter') ? t.red : undefined;

  return (
    <>
      <Kpis>
        <Kpi><div className="k">Daily use</div><div className="v">{plan.dailyKWh.toFixed(1)} kWh</div><div className="s">Peak load {(plan.peakW / 1000).toFixed(1)} kW</div></Kpi>
        <Kpi><div className="k">System</div><div className="v">{plan.systemKW.toFixed(1)} kW</div><div className="s">{plan.installed} × {plan.panel.watts} W panels</div></Kpi>
        <Kpi $tone={roofTone}>
          <div className="k">Roof space</div>
          <div className="v">{plan.chosen.panels} / {plan.layout.maxPanels}</div>
          <div className="s">{plan.overflow ? `${plan.overflow} panels won't fit` : 'panels needed / fit'}</div>
        </Kpi>
        <Kpi $tone={invTone}>
          <div className="k">Inverter · battery</div>
          <div className="v">{plan.chosen.inverterKW} kW</div>
          <div className="s">{plan.chosen.batteryKWh ? `${plan.chosen.batteryKWh} kWh battery` : 'No battery'}</div>
        </Kpi>
        <Kpi $tone={covTone}>
          <div className="k">Solar covers</div>
          <div className="v">{cov}%</div>
          <Bar100 $pct={cov} $color={covTone}><div /></Bar100>
        </Kpi>
        <Kpi $tone={t.green}><div className="k">Monthly saving</div><div className="v">{pkr(plan.monthlySaving)}</div><div className="s">Bill {pkr(plan.billBefore)} → {pkr(plan.billAfter)}</div></Kpi>
        <Kpi><div className="k">Est. cost</div><div className="v">{pkr(plan.cost)}</div><div className="s">Payback {plan.paybackYears ? `${plan.paybackYears.toFixed(1)} yrs` : '—'}</div></Kpi>
        <Kpi><div className="k">CO₂ avoided</div><div className="v">{plan.co2TonsYear.toFixed(1)} t</div><div className="s">per year</div></Kpi>
      </Kpis>

      <Grid2>
        <Card>
          <CardTitle>Your 24 hours — load vs sun</CardTitle>
          <ResponsiveContainer width="100%" height={250}>
            <ComposedChart data={data} margin={{ top: 6, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gSolar" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={t.orange} stopOpacity={0.7} /><stop offset="100%" stopColor={t.orange} stopOpacity={0.05} /></linearGradient>
                <linearGradient id="gLoad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={t.blue} stopOpacity={0.6} /><stop offset="100%" stopColor={t.blue} stopOpacity={0.05} /></linearGradient>
              </defs>
              <CartesianGrid stroke={t.line} vertical={false} />
              <XAxis dataKey="h" tickFormatter={fmtHour} interval={3} stroke={t.muted} fontSize={11} />
              <YAxis yAxisId="kw" stroke={t.muted} fontSize={11} unit=" kW" width={62} />
              <YAxis yAxisId="soc" orientation="right" domain={[0, 100]} hide />
              <Tooltip contentStyle={tooltipStyle} labelFormatter={fmtHour} formatter={(v, n) => (n === 'Battery' ? [`${v}%`, n] : [`${v} kW`, n])} />
              <Legend wrapperStyle={{ fontSize: 12, color: t.muted }} />
              <Area yAxisId="kw" type="monotone" dataKey="Solar" stroke={t.orange} fill="url(#gSolar)" strokeWidth={2} isAnimationActive={false} />
              <Area yAxisId="kw" type="monotone" dataKey="Load" stroke={t.blue} fill="url(#gLoad)" strokeWidth={2} isAnimationActive={false} />
              {plan.chosen.batteryKWh > 0 && <Line yAxisId="soc" type="monotone" dataKey="Battery" stroke={t.green} dot={false} strokeWidth={2} strokeDasharray="4 3" isAnimationActive={false} />}
              <ReferenceLine yAxisId="kw" x={hour} stroke="#fff" strokeOpacity={0.6} />
            </ComposedChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <CardTitle>Monthly bill</CardTitle>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={bill} margin={{ top: 24, right: 8, left: 8, bottom: 0 }}>
              <XAxis dataKey="name" stroke={t.muted} fontSize={12} />
              <Bar dataKey="v" radius={[8, 8, 0, 0]} isAnimationActive={false}>
                <Cell fill="#64748b" />
                <Cell fill={statusColor.ok} />
                <LabelList dataKey="v" position="top" formatter={pkr} fill={t.text} fontSize={12} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p style={{ color: t.muted, fontSize: '0.75rem', margin: '6px 0 0' }}>
            Grid units at Rs {PLANNER_CONFIG.tariffPerKWh}/kWh; extra solar exported at Rs {PLANNER_CONFIG.exportRatePerKWh}/kWh. Add a battery to use more of your own sun.
          </p>
        </Card>
      </Grid2>
    </>
  );
}
