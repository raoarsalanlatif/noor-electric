/* eslint-disable react/prop-types */
// Stock of panels, inverters, cable and other material: what is in the store, purchases, issues to projects,
// returns and count corrections. Purchase costs and stock value are shown to owners only.
import { useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus, faBoxesStacked, faArrowDown, faArrowUp, faRotateLeft, faClockRotateLeft, faPen, faTrash, faScaleBalanced, faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import { post, patch, del } from '../../../lib/api';
import { useAuth, useLoad } from '../hooks';
import { a, Card, PageHead, Btn, Badge, Empty, ErrorBox, Modal, Field, FormGrid, Table, Loading, LoadFailed, pkr, fmtDate } from '../ui';
import { ITEM_CATEGORY_LABELS, UNIT_LABELS, MOVE_LABELS, MOVE_TONES, Stats, Toolbar, qtyText, today } from './shared';

function ItemForm({ item, canSeeCosts, onClose, onSaved }) {
  const isNew = !item._id;
  const [f, setF] = useState({ name: '', category: 'panel', unit: 'pcs', sku: '', minQty: 0, notes: '', openingQty: '', openingCost: '', ...item });
  const [err, setErr] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = async () => {
    setErr('');
    const body = { name: f.name, category: f.category, unit: f.unit, sku: f.sku, minQty: Number(f.minQty) || 0, notes: f.notes };
    try {
      if (isNew) await post('inventory', { ...body, openingQty: Number(f.openingQty) || 0, openingCost: Number(f.openingCost) || 0 });
      else await patch(`inventory/${item._id}`, body);
      onSaved();
    } catch (e) { setErr(e.message); }
  };
  return (
    <Modal title={isNew ? 'Add stock item' : `Edit — ${item.name}`} onClose={onClose} width={600}
      footer={<><span /><Btn type="button" onClick={save} disabled={!f.name.trim()}>{isNew ? 'Add item' : 'Save changes'}</Btn></>}>
      {err && <ErrorBox>{err}</ErrorBox>}
      <FormGrid>
        <Field $full>Item name<input value={f.name} onChange={set('name')} placeholder="e.g. Longi 585 W panel" /></Field>
        <Field>Category<select value={f.category} onChange={set('category')}>{Object.entries(ITEM_CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
        <Field>Counted in<select value={f.unit} onChange={set('unit')}>{Object.entries(UNIT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
        <Field>Model / code (optional)<input value={f.sku} onChange={set('sku')} /></Field>
        <Field>Warn me when stock falls to<input type="number" min="0" value={f.minQty} onChange={set('minQty')} /></Field>
        {isNew && <Field>In stock now<input type="number" min="0" value={f.openingQty} onChange={set('openingQty')} placeholder="0" /></Field>}
        {isNew && canSeeCosts && <Field>Cost per {f.unit === 'pcs' ? 'piece' : f.unit} (Rs)<input type="number" min="0" value={f.openingCost} onChange={set('openingCost')} placeholder="0" /></Field>}
        <Field $full>Notes<textarea value={f.notes} onChange={set('notes')} rows={2} style={{ minHeight: 60 }} /></Field>
      </FormGrid>
    </Modal>
  );
}

const MOVE_TITLES = { in: 'Stock in (purchase)', out: 'Issue stock', return: 'Return from a project', adjust: 'Correct the count' };

function MoveForm({ type, item, items, projects, canSeeCosts, onClose, onSaved }) {
  const [f, setF] = useState({ itemId: item?._id || '', qty: '', unitCost: '', projectId: '', supplier: '', note: '', date: today(), countedQty: '' });
  const [err, setErr] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const picked = items.find((i) => i._id === f.itemId);
  const ready = f.itemId && (type === 'adjust' ? f.countedQty !== '' : Number(f.qty) > 0) && (type !== 'return' || f.projectId);
  const save = async () => {
    setErr('');
    try {
      await post('stock-moves', {
        itemId: f.itemId, type, qty: Number(f.qty) || 0, unitCost: Number(f.unitCost) || 0, countedQty: f.countedQty === '' ? null : Number(f.countedQty),
        projectId: f.projectId, supplier: f.supplier, note: f.note, date: f.date,
      });
      onSaved();
    } catch (e) { setErr(e.message); }
  };
  return (
    <Modal title={MOVE_TITLES[type]} onClose={onClose} width={560}
      footer={<><span>{picked && <span style={{ color: a.muted, fontSize: '0.86rem' }}>In stock now: <b style={{ color: a.text }}>{qtyText(picked.qty, picked.unit)}</b></span>}</span><Btn type="button" onClick={save} disabled={!ready}>Save</Btn></>}>
      {err && <ErrorBox>{err}</ErrorBox>}
      <FormGrid>
        <Field $full>Item
          <select value={f.itemId} onChange={set('itemId')} disabled={Boolean(item)}>
            <option value="">Choose an item…</option>
            {items.map((i) => <option key={i._id} value={i._id}>{i.name} — {qtyText(i.qty, i.unit)} in stock</option>)}
          </select>
        </Field>
        {type === 'adjust' ? (
          <Field $full>Quantity you counted in the store<input type="number" min="0" step="any" value={f.countedQty} onChange={set('countedQty')} /></Field>
        ) : (
          <Field>Quantity{picked ? ` (${picked.unit})` : ''}<input type="number" min="0" step="any" value={f.qty} onChange={set('qty')} /></Field>
        )}
        {type === 'in' && canSeeCosts && <Field>Price paid per {picked?.unit === 'pcs' || !picked ? 'piece' : picked.unit} (Rs)<input type="number" min="0" value={f.unitCost} onChange={set('unitCost')} /></Field>}
        {type === 'in' && <Field>Supplier<input value={f.supplier} onChange={set('supplier')} /></Field>}
        {(type === 'out' || type === 'return') && (
          <Field>Project
            <select value={f.projectId} onChange={set('projectId')}>
              <option value="">{type === 'out' ? 'Not for a project (damaged, sample, office use)' : 'Choose a project…'}</option>
              {projects.map((p) => <option key={p._id} value={p._id}>{p.title}{p.customerName ? ` — ${p.customerName}` : ''}</option>)}
            </select>
          </Field>
        )}
        {type !== 'adjust' && <Field>Date<input type="date" value={f.date} onChange={set('date')} /></Field>}
        <Field $full>Note<input value={f.note} onChange={set('note')} placeholder={type === 'adjust' ? 'e.g. two panels broken in transport' : ''} /></Field>
      </FormGrid>
      {type === 'out' && <p style={{ fontSize: '0.8rem', color: a.muted, marginTop: 10 }}>Material issued to a project is added to that project’s cost at the average purchase price.</p>}
      {type === 'in' && !canSeeCosts && <p style={{ fontSize: '0.8rem', color: a.muted, marginTop: 10 }}>The purchase price is entered by an owner; until then this stock is valued at the item’s current average cost.</p>}
    </Modal>
  );
}

function History({ item, canSeeCosts, onClose, onChanged }) {
  const { data, error, loading, reload } = useLoad(`stock-moves?itemId=${item._id}`);
  const [err, setErr] = useState('');
  const undo = async (m) => {
    if (!window.confirm('Undo this entry? The stock goes back to what it was before.')) return;
    try { await del(`stock-moves/${m._id}`); reload(); onChanged(); } catch (e) { setErr(e.message); }
  };
  const moves = data?.items || [];
  return (
    <Modal title={`History — ${item.name}`} onClose={onClose} width={760}>
      {(error || err) && <ErrorBox>{error || err}</ErrorBox>}
      {moves.length ? (
        <Table>
          <table>
            <thead><tr><th>Date</th><th>What</th><th>Quantity</th>{canSeeCosts && <th>Value</th>}<th>Details</th>{canSeeCosts && <th />}</tr></thead>
            <tbody>
              {moves.map((m) => (
                <tr key={m._id}>
                  <td>{fmtDate(m.date)}</td>
                  <td><Badge $tone={MOVE_TONES[m.type]}>{MOVE_LABELS[m.type]}</Badge></td>
                  <td><b>{m.type === 'out' ? '−' : m.type === 'adjust' ? (m.qty > 0 ? '+' : '−') : '+'}{qtyText(Math.abs(m.qty), m.unit)}</b></td>
                  {canSeeCosts && <td>{pkr(m.value)}<br /><span style={{ color: a.muted, fontSize: '0.78rem' }}>{pkr(m.unitCost)} each</span></td>}
                  <td style={{ color: a.muted }}>{[m.projectTitle, m.supplier, m.note].filter(Boolean).join(' · ') || '—'}</td>
                  {canSeeCosts && <td><Btn type="button" $sm $v="ghost" onClick={() => undo(m)}><FontAwesomeIcon icon={faRotateLeft} /> Undo</Btn></td>}
                </tr>
              ))}
            </tbody>
          </table>
        </Table>
      ) : loading ? <Loading label="Loading history…" /> : error && !data ? <LoadFailed onRetry={reload} /> : <Empty>No stock changes recorded for this item yet.</Empty>}
    </Modal>
  );
}

export default function Inventory() {
  const { isOwner } = useAuth();
  const { data, error, loading, reload } = useLoad('inventory');
  const projects = useLoad('projects').data?.items || [];
  const [form, setForm] = useState(null); // item being added or edited
  const [move, setMove] = useState(null); // { type, item }
  const [history, setHistory] = useState(null);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [err, setErr] = useState('');
  const canSeeCosts = Boolean(data?.canSeeCosts);
  const all = useMemo(() => data?.items || [], [data]);
  const items = all.filter((i) => (!cat || i.category === cat) && (!q || `${i.name} ${i.sku}`.toLowerCase().includes(q.toLowerCase())));
  const low = all.filter((i) => i.minQty > 0 && i.qty <= i.minQty);
  const value = all.reduce((s, i) => s + (i.stockValue || 0), 0);
  const done = () => { setForm(null); setMove(null); reload(); };
  const remove = async (i) => {
    if (!window.confirm(`Delete “${i.name}” and its history? This cannot be undone.`)) return;
    try { await del(`inventory/${i._id}`); reload(); } catch (e) { setErr(e.message); }
  };

  return (
    <>
      <PageHead>
        <div><h1>Inventory</h1><p>What is in the store, what came in and what went out to each project.</p></div>
        <div className="actions">
          <Btn type="button" $v="ghost" onClick={() => setMove({ type: 'in' })} disabled={!all.length}><FontAwesomeIcon icon={faArrowDown} /> Stock in</Btn>
          <Btn type="button" $v="ghost" onClick={() => setMove({ type: 'out' })} disabled={!all.length}><FontAwesomeIcon icon={faArrowUp} /> Issue to project</Btn>
          <Btn type="button" onClick={() => setForm({})}><FontAwesomeIcon icon={faPlus} /> Add item</Btn>
        </div>
      </PageHead>
      {(error || err) && <ErrorBox>{error || err}</ErrorBox>}
      <Stats>
        <div><small>Items</small><b>{all.length}</b></div>
        {canSeeCosts && <div><small>Stock value</small><b>{pkr(value)}</b><span>at average purchase cost</span></div>}
        <div><small>Low stock</small><b style={{ color: low.length ? a.amber : a.text }}>{low.length}</b><span>{low.length ? low.slice(0, 2).map((i) => i.name).join(', ') + (low.length > 2 ? '…' : '') : 'nothing to reorder'}</span></div>
      </Stats>
      <Toolbar>
        <Field className="grow">Search<input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Item name or code" /></Field>
        <Field>Category<select value={cat} onChange={(e) => setCat(e.target.value)}><option value="">All categories</option>{Object.entries(ITEM_CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
      </Toolbar>
      <Card $pad="0">
        {items.length ? (
          <Table>
            <table>
              <thead><tr><th>Item</th><th>In stock</th>{canSeeCosts && <th>Average cost</th>}{canSeeCosts && <th>Stock value</th>}<th /></tr></thead>
              <tbody>
                {items.map((i) => {
                  const isLow = i.minQty > 0 && i.qty <= i.minQty;
                  return (
                    <tr key={i._id}>
                      <td><b>{i.name}</b><br /><span style={{ color: a.muted, fontSize: '0.8rem' }}>{ITEM_CATEGORY_LABELS[i.category]}{i.sku ? ` · ${i.sku}` : ''}</span></td>
                      <td><b>{qtyText(i.qty, i.unit)}</b>{isLow && <><br /><Badge $tone="gold"><FontAwesomeIcon icon={faTriangleExclamation} /> Low — reorder at {i.minQty}</Badge></>}</td>
                      {canSeeCosts && <td>{pkr(i.avgCost)}</td>}
                      {canSeeCosts && <td>{pkr(i.stockValue)}</td>}
                      <td>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                          <Btn type="button" $sm $v="ghost" onClick={() => setMove({ type: 'in', item: i })}><FontAwesomeIcon icon={faArrowDown} /> In</Btn>
                          <Btn type="button" $sm $v="ghost" onClick={() => setMove({ type: 'out', item: i })} disabled={!i.qty}><FontAwesomeIcon icon={faArrowUp} /> Issue</Btn>
                          <Btn type="button" $sm $v="ghost" onClick={() => setMove({ type: 'return', item: i })} title="Material coming back from a project"><FontAwesomeIcon icon={faRotateLeft} /> Return</Btn>
                          <Btn type="button" $sm $v="ghost" onClick={() => setMove({ type: 'adjust', item: i })} title="Correct the count after a stock check"><FontAwesomeIcon icon={faScaleBalanced} /> Count</Btn>
                          <Btn type="button" $sm $v="ghost" onClick={() => setHistory(i)}><FontAwesomeIcon icon={faClockRotateLeft} /> History</Btn>
                          <Btn type="button" $sm $v="ghost" onClick={() => setForm(i)} aria-label={`Edit ${i.name}`}><FontAwesomeIcon icon={faPen} /></Btn>
                          {isOwner && <Btn type="button" $sm $v="danger" onClick={() => remove(i)} aria-label={`Delete ${i.name}`}><FontAwesomeIcon icon={faTrash} /></Btn>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Table>
        ) : loading ? <Loading label="Loading inventory…" /> : error && !data ? <LoadFailed onRetry={reload} />
          : <Empty><FontAwesomeIcon icon={faBoxesStacked} /><br />{all.length ? 'No items match this search.' : 'No stock items yet — add your panels, inverters and cable to start tracking them.'}</Empty>}
      </Card>
      {form && <ItemForm item={form} canSeeCosts={canSeeCosts} onClose={() => setForm(null)} onSaved={done} />}
      {move && <MoveForm type={move.type} item={move.item} items={all} projects={projects} canSeeCosts={canSeeCosts} onClose={() => setMove(null)} onSaved={done} />}
      {history && <History item={history} canSeeCosts={canSeeCosts} onClose={() => setHistory(null)} onChanged={reload} />}
    </>
  );
}
