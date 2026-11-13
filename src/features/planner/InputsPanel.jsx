/* eslint-disable react/prop-types */
import { useState } from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMinus, faPlus, faPlug, faRulerCombined, faSolarPanel } from '@fortawesome/free-solid-svg-icons';
import { APPLIANCES } from './appliances';
import { CITIES, PANEL_OPTIONS, INVERTER_SIZES } from './config';
import { Card, Label, Range, NumberInput, Select, Segmented, Seg, Toggle, Row, t } from './ui';

const Tabs = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  margin-bottom: 14px;
`;

const Tab = styled.button`
  border: 1px solid ${(p) => (p.$active ? t.orange : t.line)};
  background: ${(p) => (p.$active ? `${t.orange}18` : 'transparent')};
  color: ${(p) => (p.$active ? t.orange : t.muted)};
  border-radius: 12px;
  padding: 10px 6px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  span { font-size: 0.68rem; opacity: 0.8; font-weight: 500; }
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 520px;
  overflow-y: auto;
  padding-right: 4px;
  @media (max-width: 1024px) { max-height: none; }
`;

const Item = styled.div`
  display: grid;
  grid-template-columns: 32px 1fr auto;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border-radius: 12px;
  background: ${(p) => (p.$on ? t.cardHi : 'transparent')};
  border: 1px solid ${(p) => (p.$on ? `${t.orange}40` : t.line)};
  transition: background 0.2s, border-color 0.2s;
  .icon { width: 32px; height: 32px; border-radius: 9px; display: grid; place-items: center;
    background: ${(p) => (p.$on ? `${t.orange}22` : '#1e293b')}; color: ${(p) => (p.$on ? t.orange : t.muted)}; }
  .name { font-size: 0.9rem; color: ${t.text}; line-height: 1.2; }
  .meta { font-size: 0.74rem; color: ${t.muted}; }
  .hours { grid-column: 2 / 4; display: flex; align-items: center; gap: 8px; font-size: 0.75rem; color: ${t.muted}; }
  .hours input { flex: 1; }
`;

const Stepper = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  button { width: 28px; height: 28px; border-radius: 8px; border: 1px solid ${t.line}; background: ${t.bg}; color: ${t.text}; cursor: pointer; }
  button:hover { border-color: ${t.orange}; }
  b { min-width: 18px; text-align: center; color: ${t.text}; }
`;

const Total = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 10px 12px;
  border-radius: 12px;
  background: ${t.bg};
  margin-bottom: 10px;
  font-size: 0.85rem;
  color: ${t.muted};
  strong { font-size: 1.3rem; color: ${t.text}; }
`;

const Field = styled.div` margin-bottom: 16px; `;

const Hint = styled.p`
  font-size: 0.78rem;
  color: ${t.muted};
  margin: 6px 0 0;
`;

const Demo = styled.button`
  width: 100%;
  margin-top: 6px;
  border: 1px dashed ${t.red}88;
  background: ${t.red}12;
  color: #fca5a5;
  padding: 10px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
`;

function LoadTab({ load, setLoad, plan }) {
  const set = (id, patch) => setLoad((prev) => {
    const cur = prev[id] || { qty: 0, hours: APPLIANCES.find((a) => a.id === id).hours };
    const next = { ...cur, ...patch };
    const out = { ...prev, [id]: next };
    if (next.qty <= 0) delete out[id];
    return out;
  });
  return (
    <>
      <Total>
        <span>Daily energy use</span>
        <span><strong>{plan.dailyKWh.toFixed(1)}</strong> kWh</span>
      </Total>
      <List>
        {APPLIANCES.map((a) => {
          const cur = load[a.id];
          const on = !!cur?.qty;
          return (
            <Item key={a.id} $on={on}>
              <div className="icon"><FontAwesomeIcon icon={a.icon} /></div>
              <div>
                <div className="name">{a.name}</div>
                <div className="meta">{a.note ? `${a.note} · ` : ''}{a.watts} W</div>
              </div>
              <Stepper>
                <button type="button" aria-label={`Fewer ${a.name}`} onClick={() => set(a.id, { qty: (cur?.qty || 0) - 1 })}><FontAwesomeIcon icon={faMinus} /></button>
                <b>{cur?.qty || 0}</b>
                <button type="button" aria-label={`More ${a.name}`} onClick={() => set(a.id, { qty: (cur?.qty || 0) + 1 })}><FontAwesomeIcon icon={faPlus} /></button>
              </Stepper>
              {on && (
                <div className="hours">
                  <span>Hours/day</span>
                  <Range min={0.5} max={24} step={0.5} value={cur.hours} onChange={(e) => set(a.id, { hours: Number(e.target.value) })} />
                  <b style={{ color: t.text, minWidth: 30 }}>{cur.hours}h</b>
                </div>
              )}
            </Item>
          );
        })}
      </List>
    </>
  );
}

function SiteTab({ cityId, setCityId, roof, setRoof, panelWatts, setPanelWatts, plan }) {
  const dim = (key, label) => (
    <Field>
      <Row $justify="space-between"><Label>{label}</Label>
        <Row $gap="4px"><NumberInput min={3} max={60} value={roof[key]} onChange={(e) => setRoof({ ...roof, [key]: Math.max(1, Number(e.target.value) || 0) })} /><span style={{ color: t.muted }}>m</span></Row>
      </Row>
      <Range min={3} max={40} step={0.5} value={roof[key]} onChange={(e) => setRoof({ ...roof, [key]: Number(e.target.value) })} />
    </Field>
  );
  const ok = plan.overflow === 0;
  return (
    <>
      <Field>
        <Label>City</Label>
        <Select value={cityId} onChange={(e) => setCityId(e.target.value)}>
          {CITIES.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.sunHours} sun hours</option>)}
        </Select>
      </Field>
      {dim('width', 'Roof width (front)')}
      {dim('length', 'Roof depth')}
      <Total>
        <span>Roof area {Math.round(plan.layout.roofArea)} m²</span>
        <span style={{ color: ok ? t.green : t.red }}><strong style={{ color: 'inherit' }}>{plan.layout.maxPanels}</strong> panels fit</span>
      </Total>
      <Field>
        <Label>Panel size</Label>
        <Segmented>
          {PANEL_OPTIONS.map((p) => (
            <Seg key={p.watts} type="button" $active={panelWatts === p.watts} onClick={() => setPanelWatts(p.watts)}>{p.watts} W</Seg>
          ))}
        </Segmented>
        <Hint>Rows are spaced {plan.layout.pitch.toFixed(1)} m apart so panels don&apos;t shade each other, with a safety margin along the edges.</Hint>
      </Field>
      <Demo type="button" onClick={() => setRoof({ width: 6, length: 7 })}>Try a small 6 × 7 m roof</Demo>
    </>
  );
}

function SystemTab({ mode, setMode, custom, setCustom, withBattery, setWithBattery, offGrid, setOffGrid, plan }) {
  const toCustom = () => {
    setCustom({ panels: plan.recommended.panels, inverterKW: plan.recommended.inverterKW, batteryKWh: plan.recommended.batteryKWh });
    setMode('custom');
  };
  return (
    <>
      <Field>
        <Segmented>
          <Seg type="button" $active={mode === 'auto'} onClick={() => setMode('auto')}>Recommended</Seg>
          <Seg type="button" $active={mode === 'custom'} onClick={toCustom}>I&apos;ll choose</Seg>
        </Segmented>
        <Hint>{mode === 'auto' ? 'We size the system from your load. Switch to "I\'ll choose" to test your own setup.' : 'Push the numbers and watch what breaks.'}</Hint>
      </Field>

      {mode === 'custom' ? (
        <>
          <Field>
            <Row $justify="space-between"><Label>Panels</Label><b style={{ color: t.text }}>{custom.panels} × {plan.panel.watts} W</b></Row>
            <Range min={0} max={Math.max(60, plan.layout.maxPanels + 20)} value={custom.panels} onChange={(e) => setCustom({ ...custom, panels: Number(e.target.value) })} />
          </Field>
          <Field>
            <Label>Inverter</Label>
            <Select value={custom.inverterKW} onChange={(e) => setCustom({ ...custom, inverterKW: Number(e.target.value) })}>
              {INVERTER_SIZES.map((s) => <option key={s} value={s}>{s} kW</option>)}
            </Select>
          </Field>
          {withBattery && (
            <Field>
              <Row $justify="space-between"><Label>Battery</Label><b style={{ color: t.text }}>{custom.batteryKWh} kWh</b></Row>
              <Range min={0} max={60} step={2.5} value={custom.batteryKWh} onChange={(e) => setCustom({ ...custom, batteryKWh: Number(e.target.value) })} />
            </Field>
          )}
        </>
      ) : (
        <Total>
          <span>{plan.recommended.panels} panels · {plan.recommended.inverterKW} kW inverter{withBattery ? ` · ${plan.recommended.batteryKWh} kWh battery` : ''}</span>
        </Total>
      )}

      <Toggle>
        <span>Add battery backup<small>Stores daytime sun for the evening</small></span>
        <input type="checkbox" checked={withBattery} onChange={(e) => setWithBattery(e.target.checked)} />
      </Toggle>
      <Toggle>
        <span>Simulate a full-day outage<small>No grid at all — does the house stay lit?</small></span>
        <input type="checkbox" checked={offGrid} onChange={(e) => setOffGrid(e.target.checked)} />
      </Toggle>
    </>
  );
}

export default function InputsPanel(props) {
  const [tab, setTab] = useState('load');
  return (
    <Card>
      <Tabs>
        <Tab type="button" $active={tab === 'load'} onClick={() => setTab('load')}><FontAwesomeIcon icon={faPlug} />Your load<span>Step 1</span></Tab>
        <Tab type="button" $active={tab === 'site'} onClick={() => setTab('site')}><FontAwesomeIcon icon={faRulerCombined} />Your roof<span>Step 2</span></Tab>
        <Tab type="button" $active={tab === 'system'} onClick={() => setTab('system')}><FontAwesomeIcon icon={faSolarPanel} />System<span>Step 3</span></Tab>
      </Tabs>
      {tab === 'load' && <LoadTab {...props} />}
      {tab === 'site' && <SiteTab {...props} />}
      {tab === 'system' && <SystemTab {...props} />}
    </Card>
  );
}
