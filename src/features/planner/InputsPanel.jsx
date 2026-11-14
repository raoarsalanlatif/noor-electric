/* eslint-disable react/prop-types */
import { useState } from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMinus, faPlus, faPlug, faRulerCombined, faSolarPanel, faLocationCrosshairs, faPenRuler, faXmark, faCheck } from '@fortawesome/free-solid-svg-icons';
import { APPLIANCES } from './appliances';
import { CITIES, PANEL_OPTIONS, INVERTER_SIZES, nearestCity, ROOF_ITEMS } from './config';
import { ITEM_ICONS } from './RoofEditorUI';
import { SEASONS } from '../three/sun';
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

const Items = styled.ul`
  list-style: none; margin: 0 0 10px; padding: 0; display: grid; gap: 6px;
  li { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 10px; background: ${t.bg}; border: 1px solid ${t.line}; font-size: 0.86rem; color: ${t.text}; }
  li svg { color: ${t.orange}; width: 16px; }
  li small { color: ${t.muted}; margin-left: auto; }
  li button { border: 0; background: none; color: ${t.muted}; cursor: pointer; padding: 2px 4px; }
  li button:hover { color: #fca5a5; }
`;

const QuickAdd = styled.div`
  display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px;
  button { display: inline-flex; align-items: center; gap: 6px; border: 1px dashed ${t.line}; background: transparent; color: ${t.muted};
    border-radius: 9px; padding: 6px 9px; cursor: pointer; font-size: 0.78rem; }
  button:hover { color: ${t.text}; border-color: ${t.orange}; }
`;

const EditRoof = styled.button`
  width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 6px;
  border: 0; border-radius: 12px; padding: 11px; cursor: pointer; font-weight: 700; font-size: 0.9rem;
  background: ${t.orange}; color: #111;
`;

const StructTable = styled.div`
  display: grid; gap: 6px; margin-top: 8px;
  button { display: grid; grid-template-columns: 1fr auto; gap: 2px 10px; text-align: left; cursor: pointer;
    border: 1px solid ${t.line}; background: ${t.bg}; color: ${t.text}; border-radius: 11px; padding: 9px 11px; font: inherit; }
  button.on { border-color: ${t.orange}; background: ${t.orange}14; }
  b { font-size: 0.9rem; display: flex; align-items: center; gap: 6px; }
  small { color: ${t.muted}; font-size: 0.76rem; }
  .fit { text-align: right; font-weight: 700; font-size: 0.86rem; }
  .tag { font-size: 0.66rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 2px 6px; border-radius: 6px; background: ${t.green}22; color: ${t.green}; }
`;

const pkrShort = (n) => (n >= 100000 ? `Rs ${(n / 100000).toFixed(n >= 1000000 ? 1 : 2)} lac` : `Rs ${Math.round(n / 1000)}k`);

function StructurePicker({ site, setSite, plan }) {
  const auto = plan.structureAuto;
  const choose = (key) => setSite({ ...site, structure: key });
  const bestKey = plan.structureOptions.find((o) => o.fits)?.key;
  return (
    <Field>
      <Label>Mounting structure</Label>
      <Segmented>
        <Seg type="button" $active={auto} onClick={() => choose('auto')}>Auto</Seg>
        {plan.structureOptions.map((o) => <Seg key={o.key} type="button" $active={!auto && plan.structure.key === o.key} onClick={() => choose(o.key)}>{o.short}</Seg>)}
      </Segmented>
      <StructTable>
        {plan.structureOptions.map((o) => (
          <button key={o.key} type="button" className={plan.structure.key === o.key ? 'on' : ''} onClick={() => choose(o.key)}>
            <b>{o.label}{o.key === bestKey && <span className="tag">Best value</span>}</b>
            <span className="fit" style={{ color: o.fits ? t.green : t.amber }}>{o.maxPanels} panels{o.fits ? <> <FontAwesomeIcon icon={faCheck} /></> : ''}</span>
            <small>{o.desc}</small>
            <small style={{ textAlign: 'right' }}>{pkrShort(o.cost)}</small>
          </button>
        ))}
      </StructTable>
      <Hint>
        {auto
          ? <>Auto picks the cheapest structure that fits the {plan.chosen.panels} panels you need — now <b style={{ color: t.text }}>{plan.structure.label}</b>.</>
          : <>You chose <b style={{ color: t.text }}>{plan.structure.label}</b>. Switch to Auto to let us pick.</>}
        {' '}Structure prices are indicative, per your system size.
      </Hint>
    </Field>
  );
}

const SubHead = styled.h4`
  font-size: 0.72rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${t.muted};
  margin: 18px 0 10px;
  padding-top: 14px;
  border-top: 1px solid ${t.line};
`;

const GpsButton = styled.button`
  width: 100%;
  margin-top: 8px;
  border: 1px solid ${t.line};
  background: ${t.bg};
  color: ${t.text};
  border-radius: 10px;
  padding: 9px 12px;
  cursor: pointer;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  &:hover { border-color: ${t.orange}; }
`;

function SiteTab({ location, setLocation, season, setSeason, site, setSite, roof, setRoof, panelWatts, setPanelWatts, plan, onEditRoof, onAddItem, onRemoveItem }) {
  const [gps, setGps] = useState('');
  const dim = (key, label) => (
    <Field>
      <Row $justify="space-between"><Label>{label}</Label>
        <Row $gap="4px"><NumberInput min={3} max={60} value={roof[key]} onChange={(e) => setRoof({ ...roof, [key]: Math.max(1, Number(e.target.value) || 0) })} /><span style={{ color: t.muted }}>m</span></Row>
      </Row>
      <Range min={4} max={40} step={0.5} value={roof[key]} onChange={(e) => setRoof({ ...roof, [key]: Number(e.target.value) })} />
    </Field>
  );
  const ok = plan.overflow === 0;
  const set = (patch) => setSite({ ...site, ...patch });
  const useGps = () => {
    if (!navigator.geolocation) { setGps('Location is not available in this browser.'); return; }
    setGps('Finding you…');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const { city, km } = nearestCity(coords.latitude, coords.longitude);
        setLocation({ ...city, id: 'gps', name: km < 40 ? city.name : `My location (near ${city.name})`, lat: coords.latitude });
        setGps(`Using your location · sun path for ${coords.latitude.toFixed(2)}°N`);
      },
      () => setGps('Could not get your location — pick a city instead.'),
      { timeout: 10000, maximumAge: 600000 },
    );
  };
  return (
    <>
      <Field>
        <Label>Location</Label>
        <Select value={location.id === 'gps' ? 'gps' : location.id} onChange={(e) => { const c = CITIES.find((x) => x.id === e.target.value); if (c) { setLocation(c); setGps(''); } }}>
          {location.id === 'gps' && <option value="gps">{location.name}</option>}
          {CITIES.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.sunHours} sun hours</option>)}
        </Select>
        <GpsButton type="button" onClick={useGps}><FontAwesomeIcon icon={faLocationCrosshairs} /> Use my location</GpsButton>
        {gps && <Hint>{gps}</Hint>}
      </Field>
      <Field>
        <Label>Season</Label>
        <Segmented>
          {Object.entries(SEASONS).map(([k, v]) => (
            <Seg key={k} type="button" $active={season === k} onClick={() => setSeason(k)}>{v.label}</Seg>
          ))}
        </Segmented>
        <Hint>The sun follows its real path for this latitude and season.</Hint>
      </Field>

      <SubHead>Roof size</SubHead>
      {dim('width', 'Roof width (front)')}
      {dim('length', 'Roof depth')}

      <SubHead>Your house</SubHead>
      <Field>
        <Label>Storeys</Label>
        <Segmented>
          {[1, 2, 3].map((n) => <Seg key={n} type="button" $active={site.storeys === n} onClick={() => set({ storeys: n })}>{n}</Seg>)}
        </Segmented>
      </Field>
      <Field>
        <Label>Parapet wall around the roof</Label>
        <Segmented>
          {[[0, 'None'], [0.9, '3 ft'], [1.5, '5 ft']].map(([h, l]) => <Seg key={h} type="button" $active={site.parapetH === h} onClick={() => set({ parapetH: h })}>{l}</Seg>)}
        </Segmented>
        <Hint>Taller walls shade the panels next to them, so we keep a wider gap.</Hint>
      </Field>

      <SubHead>On your roof</SubHead>
      <Hint style={{ marginTop: -4, marginBottom: 8 }}>Add the water tanks, rooms, AC units and anything else on your roof — then drag them to where they really are.</Hint>
      {(plan.layout.obstacles || []).length > 0 ? (
        <Items>
          {plan.layout.obstacles.map((o) => {
            const def = ROOF_ITEMS[o.type] || ROOF_ITEMS.other;
            return (
              <li key={o.id}>
                <FontAwesomeIcon icon={ITEM_ICONS[o.type] || ITEM_ICONS.other} />
                <span>{def.label}{o.onTop ? ' (on the room)' : ''}</span>
                <small>{o.type === 'tank' ? `Ø${o.w.toFixed(1)}` : `${o.w.toFixed(1)}×${o.d.toFixed(1)}`} × {o.h.toFixed(1)} m</small>
                <button type="button" aria-label={`Remove ${def.label}`} onClick={() => onRemoveItem(o.id)}><FontAwesomeIcon icon={faXmark} /></button>
              </li>
            );
          })}
        </Items>
      ) : <Hint>Nothing on the roof yet — a clear roof fits the most panels.</Hint>}
      <QuickAdd>
        {Object.entries(ROOF_ITEMS).map(([key, it]) => (
          <button key={key} type="button" onClick={() => onAddItem(key)}><FontAwesomeIcon icon={faPlus} /> {it.short}</button>
        ))}
      </QuickAdd>
      <EditRoof type="button" onClick={onEditRoof}><FontAwesomeIcon icon={faPenRuler} /> Arrange my roof in 3D</EditRoof>

      <StructurePicker site={site} setSite={setSite} plan={plan} />

      <Total style={{ marginTop: 12 }}>
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
        <Hint>Rows are spaced {plan.layout.pitch.toFixed(1)} m apart so panels don&apos;t shade each other.</Hint>
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
        <Tab type="button" $active={tab === 'site'} onClick={() => setTab('site')}><FontAwesomeIcon icon={faRulerCombined} />Your home<span>Step 2</span></Tab>
        <Tab type="button" $active={tab === 'system'} onClick={() => setTab('system')}><FontAwesomeIcon icon={faSolarPanel} />System<span>Step 3</span></Tab>
      </Tabs>
      {tab === 'load' && <LoadTab {...props} />}
      {tab === 'site' && <SiteTab {...props} />}
      {tab === 'system' && <SystemTab {...props} />}
    </Card>
  );
}
