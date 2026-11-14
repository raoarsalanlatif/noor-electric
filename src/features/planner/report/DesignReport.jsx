/* eslint-disable react/prop-types */
// The downloadable design report: three A4 pages rendered off-screen, then captured to PDF / images.
// Every label is shown in English and Urdu.
import { forwardRef } from 'react';
import styled from 'styled-components';
import { company, ceo } from '../../../content/company';
import { APPLIANCE_MAP } from '../appliances';
import { ROOF_ITEMS, STRUCTURES } from '../config';
import { SEASONS } from '../../three/sun';
import RoofPlanSvg from './RoofPlanSvg';
import { T, APPLIANCE_UR, ROOF_ITEM_UR, STRUCTURE_UR, SEASON_UR } from './i18n';

export const PAGE_W = 794; // A4 at 96 dpi
export const PAGE_H = 1123;
const URDU_FONT = "'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', 'Noto Naskh Arabic', serif";

const B = { navy: '#0a1f4d', blue: '#1a4fb4', gold: '#f7b31b', orange: '#f47b20', ink: '#0f172a', muted: '#64748b', line: '#e2e8f0', soft: '#f5f7fb', green: '#16a34a', amber: '#d97706', red: '#dc2626' };

const Page = styled.div`
  width: ${PAGE_W}px; height: ${PAGE_H}px; position: relative; overflow: hidden;
  background: #fff; color: ${B.ink}; font-family: Inter, Arial, sans-serif; font-size: 12px; line-height: 1.4;
  display: flex; flex-direction: column;
  .ur { font-family: ${URDU_FONT}; direction: rtl; line-height: 1.9; }
`;

const Head = styled.header`
  background: ${B.navy}; color: #fff; padding: 18px 28px 16px; display: flex; align-items: center; gap: 14px; position: relative;
  &::after { content: ''; position: absolute; left: 0; right: 0; bottom: 0; height: 5px; background: linear-gradient(90deg, ${B.gold}, ${B.orange}, #e5322d); }
  img { width: 54px; height: 54px; background: #fff; border-radius: 50%; padding: 4px; }
  .co b { display: block; font-family: Poppins, Inter, sans-serif; font-size: 18px; letter-spacing: 0.2px; }
  .co span { color: #cbd5e1; font-size: 11px; }
  .ttl { margin-left: auto; text-align: right; }
  .ttl b { display: block; font-family: Poppins, Inter, sans-serif; font-size: 17px; color: ${B.gold}; }
  .ttl .ur { font-size: 15px; color: #fff; line-height: 1.7; }
`;

const Body = styled.main`flex: 1; min-height: 0; padding: 14px 28px 0; display: flex; flex-direction: column; gap: 10px;`;

const Foot = styled.footer`
  padding: 10px 28px 14px; border-top: 1px solid ${B.line}; display: flex; justify-content: space-between; align-items: center; color: ${B.muted}; font-size: 10px;
  b { color: ${B.ink}; }
`;

const Meta = styled.div`
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;
  div { background: ${B.soft}; border-radius: 8px; padding: 7px 10px; }
  small { display: block; color: ${B.muted}; font-size: 9.5px; }
  .ur { font-size: 9.5px; line-height: 1.4; color: ${B.muted}; }
  b { font-size: 12px; }
`;

const H2 = styled.div`
  display: flex; justify-content: space-between; align-items: baseline; border-bottom: 2px solid ${B.navy}; padding-bottom: 3px;
  b { font-family: Poppins, Inter, sans-serif; font-size: 14px; color: ${B.navy}; }
  .ur { font-size: 14px; color: ${B.navy}; line-height: 1.6; }
`;

const Status = styled.div`
  display: flex; justify-content: space-between; align-items: center; border-radius: 10px; padding: 4px 14px; font-weight: 700; font-size: 13px;
  background: ${(p) => ({ ok: '#dcfce7', warn: '#fef3c7', fail: '#fee2e2' }[p.$s])};
  color: ${(p) => ({ ok: '#166534', warn: '#92400e', fail: '#991b1b' }[p.$s])};
  .ur { font-size: 14px; }
`;

const Kpis = styled.div`
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 7px;
  > div { border: 1px solid ${B.line}; border-radius: 10px; padding: 6px 10px 7px; }
  .en { color: ${B.muted}; font-size: 10px; }
  .ur { color: ${B.muted}; font-size: 10px; line-height: 1.45; }
  .v { font-family: Poppins, Inter, sans-serif; font-size: 16px; font-weight: 700; color: ${B.navy}; margin-top: 1px; line-height: 1.25; }
  .s { font-size: 9px; color: ${B.muted}; line-height: 1.4; }
  > div.hi { background: ${B.navy}; border-color: ${B.navy}; }
  > div.hi .en, > div.hi .ur, > div.hi .s { color: #cbd5e1; }
  > div.hi .v { color: ${B.gold}; }
`;

const Shot = styled.figure`
  margin: 0; border-radius: 12px; overflow: hidden; border: 1px solid ${B.line}; position: relative; flex: 1; min-height: 0; background: #0b1220;
  img { width: 100%; height: 100%; object-fit: cover; display: block; }
  figcaption { position: absolute; left: 10px; bottom: 10px; background: rgba(10,31,77,0.85); color: #fff; border-radius: 8px; padding: 4px 10px; font-size: 11px; display: flex; gap: 10px; align-items: center; }
  figcaption .ur { font-size: 11px; line-height: 1.6; }
`;

const Table = styled.table`
  width: 100%; border-collapse: collapse; font-size: 11px;
  th { text-align: left; background: ${B.soft}; color: ${B.navy}; font-weight: 700; padding: 5px 8px; border-bottom: 1px solid ${B.line}; vertical-align: bottom; }
  th .ur { display: block; font-weight: 400; font-size: 9.5px; line-height: 1.4; }
  th.n .ur { text-align: right; }
  td { padding: 2px 8px; border-bottom: 1px solid ${B.line}; vertical-align: middle; }
  td .ur { display: block; font-size: 9.5px; color: ${B.muted}; line-height: 1.4; text-align: left; }
  td.n, th.n { text-align: right; }
  tr.tot td { font-weight: 700; background: ${B.soft}; }
  tr.sel td { background: #fff7ed; }
`;

const Two = styled.div`display: grid; grid-template-columns: ${(p) => p.$cols || '1fr 1fr'}; gap: 14px;`;

const Legend = styled.div`
  display: flex; gap: 16px; flex-wrap: wrap; font-size: 10.5px; color: ${B.muted};
  span { display: inline-flex; align-items: center; gap: 6px; }
  i { width: 14px; height: 10px; border-radius: 2px; display: inline-block; }
  .ur { font-size: 10.5px; line-height: 1.5; }
`;

const Notes = styled.div`
  background: ${B.soft}; border-radius: 10px; padding: 8px 14px; display: grid; gap: 2px;
  p { margin: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 14px; align-items: center; font-size: 11px; }
  .ur { font-size: 11px; text-align: right; line-height: 1.6; }
`;

const Contact = styled.div`
  background: ${B.navy}; color: #fff; border-radius: 12px; padding: 12px 16px; display: flex; align-items: center; gap: 14px;
  img { width: 44px; height: 44px; background: #fff; border-radius: 50%; padding: 3px; }
  b { font-family: Poppins, Inter, sans-serif; font-size: 15px; }
  .ph { margin-left: auto; text-align: right; font-size: 12px; }
  .ph b { color: ${B.gold}; font-size: 16px; display: block; }
  .ur { font-size: 12px; }
`;

/** English label with its Urdu translation underneath (or beside, when inline). */
function Bi({ t, inline, gap = 8 }) {
  if (inline) return <span style={{ display: 'inline-flex', gap, alignItems: 'baseline' }}><span>{t[0]}</span><span className="ur">{t[1]}</span></span>;
  return <><div className="en">{t[0]}</div><div className="ur">{t[1]}</div></>;
}

const pkr = (n) => `Rs ${Math.round(n || 0).toLocaleString('en-PK')}`;
const kwh = (n) => `${(n || 0).toFixed(1)} kWh`;

function Header({ logo }) {
  return (
    <Head>
      <img src={logo} alt="" />
      <div className="co">
        <b>{company.name}</b>
        <span>{company.legalName} · {company.website}</span>
      </div>
      <div className="ttl">
        <b>{T.title[0]}</b>
        <div className="ur">{T.title[1]}</div>
      </div>
    </Head>
  );
}

function Footer({ n, total, designNo }) {
  return (
    <Foot>
      <span><b>{company.phones[0].display}</b> · {company.phones[1].display} · {company.website}</span>
      <span>{designNo} · {T.page[0]} {n}/{total}</span>
    </Foot>
  );
}

const DesignReport = forwardRef(function DesignReport({ plan, roof, load, customer, shot, designNo, date, logo }, ref) {
  const S = plan.structure;
  const panelsWanted = plan.chosen.panels;
  const ph = plan.site.parapetH || 0;
  const loadRows = Object.entries(load)
    .filter(([id, v]) => APPLIANCE_MAP[id] && v.qty > 0)
    .map(([id, v]) => {
      const a = APPLIANCE_MAP[id];
      return { id, a, qty: v.qty, hours: v.hours, kwh: (v.qty * a.watts * a.duty * v.hours) / 1000 };
    });
  const loadTotal = loadRows.reduce((s, r) => s + r.kwh, 0);
  const items = plan.layout.obstacles;
  const itemCounts = {};
  items.forEach((o) => { const k = `${o.type}${o.onTop ? ':top' : ''}`; itemCounts[k] = (itemCounts[k] || 0) + 1; });
  const seasonEn = (SEASONS[plan.season] || SEASONS.annual).label;
  const peak = Math.max(...plan.solarKw, ...plan.loadKw, 0.1);
  const meta = [
    [T.preparedFor, customer?.name || '—'],
    [T.location, `${customer?.area ? `${customer.area}, ` : ''}${plan.city.name}`],
    [T.date, date],
    [T.designNo, designNo],
  ];

  return (
    <div ref={ref}>
      {/* ------------------------------ page 1 ------------------------------ */}
      <Page className="report-page">
        <Header logo={logo} />
        <Body>
          <Meta>{meta.map(([t, v]) => <div key={t[0]}><small>{t[0]} · <span className="ur">{t[1]}</span></small><b>{v}</b></div>)}</Meta>
          <Status $s={plan.status}><span>{T.status[plan.status][0]}</span><span className="ur">{T.status[plan.status][1]}</span></Status>
          <H2><b>{T.summary[0]}</b><span className="ur">{T.summary[1]}</span></H2>
          <Kpis>
            <div className="hi"><Bi t={T.systemSize} /><div className="v">{plan.systemKW.toFixed(2)} kW</div><div className="s">{plan.chosen.batteryKWh ? 'Hybrid · ہائبرڈ' : 'On-grid · آن گرڈ'}</div></div>
            <div className="hi"><Bi t={T.panelsRequired} /><div className="v">{panelsWanted} × {plan.panel.watts} W</div><div className="s">{plan.overflow > 0 ? `${plan.installed} fit · ${plan.overflow} ${T.overflow[0]}` : `${T.panelsInstalled[0]}: ${plan.installed}`}</div></div>
            <div><Bi t={T.inverter} /><div className="v">{plan.chosen.inverterKW} kW</div></div>
            <div><Bi t={T.battery} /><div className="v">{plan.chosen.batteryKWh ? `${plan.chosen.batteryKWh} kWh` : '—'}</div><div className="s">{plan.chosen.batteryKWh ? '' : `${T.noBattery[0]} · ${T.noBattery[1]}`}</div></div>
            <div><Bi t={T.dailyUse} /><div className="v">{kwh(plan.dailyKWh)}</div><div className="s">{Math.round(plan.dailyKWh * 30)} units / month · یونٹس ماہانہ</div></div>
            <div><Bi t={T.peakLoad} /><div className="v">{(plan.peakW / 1000).toFixed(1)} kW</div></div>
            <div><Bi t={T.structure} /><div className="v" style={{ fontSize: 14 }}>{S.label}</div><div className="s ur">{STRUCTURE_UR[S.key]}</div></div>
            <div><Bi t={T.roofSize} /><div className="v">{roof.width} × {roof.length} m</div><div className="s">{Math.round(roof.width * roof.length)} m²</div></div>
            <div><Bi t={T.monthlySaving} /><div className="v">{pkr(plan.monthlySaving)}</div></div>
            <div><Bi t={T.estCost} /><div className="v">{pkr(plan.cost)}</div><div className="s">{T.structureCost[0]}: {pkr(plan.structureCost)}</div></div>
            <div><Bi t={T.payback} /><div className="v">{plan.paybackYears ? `${plan.paybackYears.toFixed(1)}` : '—'}</div><div className="s">{T.years[0]} · {T.years[1]}</div></div>
            <div><Bi t={T.coverage} /><div className="v">{Math.round(plan.coverage * 100)}%</div></div>
          </Kpis>
          <Shot>
            {shot ? <img src={shot} alt="" /> : null}
            <figcaption><span>{T.view3d[0]}</span><span className="ur">{T.view3d[1]}</span></figcaption>
          </Shot>
        </Body>
        <Footer n={1} total={3} designNo={designNo} />
      </Page>

      {/* ------------------------------ page 2 ------------------------------ */}
      <Page className="report-page">
        <Header logo={logo} />
        <Body>
          <H2><b>{T.roofPlan[0]}</b><span className="ur">{T.roofPlan[1]}</span></H2>
          <div style={{ border: `1px solid ${B.line}`, borderRadius: 12, overflow: 'hidden' }}>
            <RoofPlanSvg plan={plan} roof={roof} width={736} height={430} />
          </div>
          <Legend>
            <span><i style={{ background: '#1e3a8a' }} />{T.legendPanel[0]} <span className="ur">{T.legendPanel[1]}</span></span>
            <span><i style={{ background: '#4b5563' }} />{T.legendItem[0]} <span className="ur">{T.legendItem[1]}</span></span>
            <span><i style={{ background: '#fed7aa' }} />{T.legendShade[0]} <span className="ur">{T.legendShade[1]}</span></span>
            <span><i style={{ background: '#f47b20' }} />{T.front[0]} <span className="ur">{T.front[1]}</span></span>
          </Legend>
          <Two>
            <div>
              <H2 style={{ marginBottom: 6 }}><b>{T.roofDetails[0]}</b><span className="ur">{T.roofDetails[1]}</span></H2>
              <Table>
                <tbody>
                  <tr><td>{T.roofSize[0]}<span className="ur">{T.roofSize[1]}</span></td><td className="n"><b>{roof.width} m × {roof.length} m</b></td></tr>
                  <tr><td>{T.roofArea[0]}<span className="ur">{T.roofArea[1]}</span></td><td className="n">{Math.round(roof.width * roof.length)} m² ({Math.round(roof.width * roof.length * 10.764)} sq ft)</td></tr>
                  <tr><td>{T.storeys[0]}<span className="ur">{T.storeys[1]}</span></td><td className="n">{plan.site.storeys}</td></tr>
                  <tr><td>{T.parapet[0]}<span className="ur">{T.parapet[1]}</span></td><td className="n">{ph ? `${Math.round(ph / 0.3048)} ft` : `${T.none[0]} · ${T.none[1]}`}</td></tr>
                  <tr><td>{T.panelSize[0]}<span className="ur">{T.panelSize[1]}</span></td><td className="n">{plan.panel.watts} W · {plan.panel.width.toFixed(2)} × {plan.panel.length.toFixed(2)} m</td></tr>
                  <tr><td>{T.panelFits[0]}<span className="ur">{T.panelFits[1]}</span></td><td className="n"><b>{plan.layout.maxPanels}</b> / {T.panelsRequired[0].toLowerCase()} <b>{panelsWanted}</b></td></tr>
                  <tr><td>{T.rowSpacing[0]}<span className="ur">{T.rowSpacing[1]}</span></td><td className="n">{plan.layout.pitch.toFixed(1)} m</td></tr>
                </tbody>
              </Table>
            </div>
            <div>
              <H2 style={{ marginBottom: 6 }}><b>{T.onRoof[0]}</b><span className="ur">{T.onRoof[1]}</span></H2>
              <Table>
                <tbody>
                  {Object.keys(itemCounts).length === 0 && <tr><td>{T.clearRoof[0]}<span className="ur">{T.clearRoof[1]}</span></td><td /></tr>}
                  {Object.entries(itemCounts).map(([k, n]) => {
                    const [type, top] = k.split(':');
                    return (
                      <tr key={k}>
                        <td>{(ROOF_ITEMS[type] || ROOF_ITEMS.other).label}{top ? ` (${T.onTheRoom[0]})` : ''}<span className="ur">{ROOF_ITEM_UR[type] || ROOF_ITEM_UR.other}{top ? ` (${T.onTheRoom[1]})` : ''}</span></td>
                        <td className="n"><b>× {n}</b></td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
              <H2 style={{ margin: '12px 0 6px' }}><b>{T.structures[0]}</b><span className="ur">{T.structures[1]}</span></H2>
              <Table>
                <thead><tr><th>{T.structure[0]}<span className="ur">{T.structure[1]}</span></th><th className="n">{T.panelFits[0]}<span className="ur">{T.panelFits[1]}</span></th></tr></thead>
                <tbody>
                  {plan.structureOptions.map((o) => (
                    <tr key={o.key} className={o.key === S.key ? 'sel' : ''}>
                      <td>{STRUCTURES[o.key].label}{o.key === S.key ? ` ✓ ${T.selected[0]}` : ''}<span className="ur">{STRUCTURE_UR[o.key]}</span></td>
                      <td className="n" style={{ color: o.fits ? B.green : B.amber, fontWeight: 700 }}>{o.maxPanels}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Two>
        </Body>
        <Footer n={2} total={3} designNo={designNo} />
      </Page>

      {/* ------------------------------ page 3 ------------------------------ */}
      <Page className="report-page">
        <Header logo={logo} />
        <Body>
          <H2><b>{T.loadTitle[0]}</b><span className="ur">{T.loadTitle[1]}</span></H2>
          <Table>
            <thead>
              <tr>
                <th>{T.appliance[0]}<span className="ur">{T.appliance[1]}</span></th>
                <th className="n">{T.qty[0]}<span className="ur">{T.qty[1]}</span></th>
                <th className="n">{T.watts[0]}<span className="ur">{T.watts[1]}</span></th>
                <th className="n">{T.hours[0]}<span className="ur">{T.hours[1]}</span></th>
                <th className="n">{T.units[0]}<span className="ur">{T.units[1]}</span></th>
              </tr>
            </thead>
            <tbody>
              {loadRows.map((r) => (
                <tr key={r.id}>
                  <td>{r.a.name}{r.a.note ? ` (${r.a.note})` : ''}<span className="ur">{APPLIANCE_UR[r.id] || ''}</span></td>
                  <td className="n">{r.qty}</td>
                  <td className="n">{r.a.watts}</td>
                  <td className="n">{r.hours}</td>
                  <td className="n">{r.kwh.toFixed(1)}</td>
                </tr>
              ))}
              <tr className="tot">
                <td>{T.total[0]} · <span className="ur" style={{ display: 'inline' }}>{T.total[1]}</span></td>
                <td className="n">{loadRows.reduce((s, r) => s + r.qty, 0)}</td>
                <td className="n" />
                <td className="n" />
                <td className="n">{loadTotal.toFixed(1)} kWh</td>
              </tr>
            </tbody>
          </Table>

          <Two $cols="1.3fr 1fr">
            <div>
              <H2 style={{ marginBottom: 6 }}><b>{T.dayProfile[0]}</b><span className="ur">{T.dayProfile[1]}</span></H2>
              <svg width="420" height="170" viewBox="0 0 420 170">
                <rect x="0" y="0" width="420" height="170" fill="#fff" />
                {plan.loadKw.map((l, k) => {
                  const x = 30 + k * 16; const hS = (plan.solarKw[k] / peak) * 130; const hL = (l / peak) * 130;
                  return (
                    <g key={k}>
                      <rect x={x} y={145 - hS} width="7" height={hS} fill="#f7b31b" />
                      <rect x={x + 7} y={145 - hL} width="7" height={hL} fill="#1a4fb4" />
                      {k % 3 === 0 && <text x={x + 7} y="160" fontSize="9" textAnchor="middle" fill="#64748b" fontFamily="Inter, Arial">{`${((k + 11) % 12) + 1}${k < 12 ? 'a' : 'p'}`}</text>}
                    </g>
                  );
                })}
                <line x1="28" y1="145" x2="416" y2="145" stroke="#cbd5e1" />
                <text x="2" y="20" fontSize="9" fill="#64748b" fontFamily="Inter, Arial">{peak.toFixed(1)} kW</text>
              </svg>
              <Legend>
                <span><i style={{ background: '#f7b31b' }} />{T.solar[0]} <span className="ur">{T.solar[1]}</span></span>
                <span><i style={{ background: '#1a4fb4' }} />{T.load[0]} <span className="ur">{T.load[1]}</span></span>
              </Legend>
            </div>
            <div>
              <H2 style={{ marginBottom: 6 }}><b>{T.solarPerDay[0]}</b><span className="ur">{T.solarPerDay[1]}</span></H2>
              <Table>
                <tbody>
                  <tr><td>{T.location[0]}<span className="ur">{T.location[1]}</span></td><td className="n">{plan.city.name}</td></tr>
                  <tr><td>{T.season[0]}<span className="ur">{T.season[1]}</span></td><td className="n">{seasonEn}<span className="ur" style={{ textAlign: 'right' }}>{SEASON_UR[plan.season] || ''}</span></td></tr>
                  <tr><td>{T.sunHours[0]}<span className="ur">{T.sunHours[1]}</span></td><td className="n">{plan.sunHours.toFixed(1)} h</td></tr>
                  <tr><td>{T.solarPerDay[0]} ({T.perDay[0]})<span className="ur">{T.solarPerDay[1]} ({T.perDay[1]})</span></td><td className="n"><b>{kwh(plan.solarKWh)}</b></td></tr>
                  <tr><td>{T.billBefore[0]}<span className="ur">{T.billBefore[1]}</span></td><td className="n">{pkr(plan.billBefore)}</td></tr>
                  <tr><td>{T.billAfter[0]}<span className="ur">{T.billAfter[1]}</span></td><td className="n" style={{ color: B.green, fontWeight: 700 }}>{pkr(plan.billAfter)}</td></tr>
                </tbody>
              </Table>
            </div>
          </Two>

          <H2><b>{T.notesTitle[0]}</b><span className="ur">{T.notesTitle[1]}</span></H2>
          <Notes>
            {[T.note1, T.note2, T.note3].map((n) => <p key={n[0]}><span>{n[0]}</span><span className="ur">{n[1]}</span></p>)}
          </Notes>
          <div style={{ marginTop: 'auto', marginBottom: 14 }}>
            <Contact>
              <img src={logo} alt="" />
              <div>
                <b>{company.name}</b>
                <div style={{ fontSize: 11, color: '#cbd5e1' }}>{company.address.line1}, {company.address.line2}, {company.address.city}</div>
                <div style={{ fontSize: 11, color: '#cbd5e1' }}>{ceo.name} · {ceo.role}</div>
              </div>
              <div className="ph">
                <span>{T.contact[0]} · <span className="ur">{T.contact[1]}</span></span>
                <b>{company.phones[0].display}</b>
                <span>{company.phones[1].display} · {company.website}</span>
              </div>
            </Contact>
          </div>
        </Body>
        <Footer n={3} total={3} designNo={designNo} />
      </Page>
    </div>
  );
});

export default DesignReport;
