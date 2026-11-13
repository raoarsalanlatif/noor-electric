/* eslint-disable react/prop-types */
import { useState } from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash, faSolarPanel, faCalendarDay, faCircleCheck, faLocationDot } from '@fortawesome/free-solid-svg-icons';
import { post, patch, del } from '../../../lib/api';
import { useLoad, useTeam } from '../hooks';
import { a, PageHead, Btn, ErrorBox, Modal, Field, FormGrid, pkr, fmtDate, toDateInput } from '../ui';
import { STAGE_LABELS, STAGES } from '../labels';

const STAGE_COLORS = { lead: '#94a3b8', survey: '#1a4fb4', quotation: '#7c3aed', approved: '#0891b2', installation: '#f47b20', net_metering: '#d97706', completed: '#16a34a' };
const PRIORITY = { low: ['#f2f4f7', '#475467'], normal: ['#eff4ff', '#1d4ed8'], high: ['#fef3f2', '#b42318'] };

const Columns = styled.div`
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(270px, 1fr);
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 12px;
  align-items: start;
`;

const Col = styled.div`
  background: #eaeef5;
  border-radius: 14px;
  padding: 10px;
  min-height: 200px;
  outline: ${(p) => (p.$over ? `2px dashed ${a.blue}` : 'none')};
  .head { display: flex; align-items: center; justify-content: space-between; padding: 4px 6px 10px; font-weight: 700; font-size: 0.88rem; color: ${a.text}; }
  .head span.dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; margin-right: 8px; }
  .head small { color: ${a.muted}; font-weight: 600; }
  .add { width: 100%; border: 1px dashed #c3cad6; background: transparent; color: ${a.muted}; border-radius: 10px; padding: 8px; cursor: pointer; font-size: 0.84rem; margin-top: 4px; }
  .add:hover { border-color: ${a.blue}; color: ${a.blue}; background: #fff; }
`;

const CardEl = styled.div`
  background: #fff;
  border-radius: 12px;
  padding: 11px 12px;
  margin-bottom: 8px;
  box-shadow: 0 1px 2px rgba(16,24,40,0.08);
  border-left: 4px solid ${(p) => p.$c};
  cursor: grab;
  opacity: ${(p) => (p.$dragging ? 0.4 : 1)};
  &:hover { box-shadow: 0 6px 16px rgba(16,24,40,0.12); }
  b { display: block; font-size: 0.9rem; color: ${a.text}; margin-bottom: 4px; }
  .meta { display: flex; flex-wrap: wrap; gap: 6px 10px; font-size: 0.76rem; color: ${a.muted}; }
  .meta svg { margin-right: 4px; }
  .foot { display: flex; justify-content: space-between; align-items: center; margin-top: 8px; }
  .avatars { display: flex; }
  .avatars span { width: 24px; height: 24px; border-radius: 50%; background: ${a.navy}; color: #fff; font-size: 0.66rem; display: grid; place-items: center; margin-left: -6px; border: 2px solid #fff; font-weight: 700; }
  .tag { font-size: 0.7rem; font-weight: 700; padding: 2px 7px; border-radius: 6px; }
  .progress { height: 4px; background: #eef2f7; border-radius: 9px; margin-top: 8px; overflow: hidden; }
  .progress div { height: 100%; background: ${a.green}; }
`;

const Check = styled.div`
  display: grid; gap: 6px;
  .item { display: flex; gap: 8px; align-items: center; }
  .item input[type=text] { flex: 1; border: 1px solid ${a.line}; border-radius: 8px; padding: 6px 8px; font: inherit; }
  .item button { border: 0; background: none; color: ${a.muted}; cursor: pointer; }
`;

const initials = (n) => n.split(' ').map((x) => x[0]).slice(0, 2).join('').toUpperCase();

function ProjectModal({ project, onClose, onSaved }) {
  const team = useTeam();
  const isNew = !project._id;
  const [f, setF] = useState({ priority: 'normal', checklist: [], assignees: [], ...project, dueDate: toDateInput(project.dueDate) });
  const [err, setErr] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const toggle = (id) => setF({ ...f, assignees: f.assignees.includes(id) ? f.assignees.filter((x) => x !== id) : [...f.assignees, id] });
  const setItem = (i, patchObj) => setF({ ...f, checklist: f.checklist.map((c, j) => (j === i ? { ...c, ...patchObj } : c)) });

  const save = async () => {
    setErr('');
    const body = { ...f, dueDate: f.dueDate || null, checklist: f.checklist.filter((c) => c.text.trim()) };
    try {
      if (isNew) await post('projects', body); else await patch(`projects/${project._id}`, body);
      onSaved();
    } catch (e) { setErr(e.message); }
  };
  const remove = async () => {
    if (!window.confirm('Delete this project card?')) return;
    try { await del(`projects/${project._id}`); onSaved(); } catch (e) { setErr(e.message); }
  };

  return (
    <Modal
      title={isNew ? 'New project' : f.title}
      onClose={onClose}
      width={720}
      footer={<>{!isNew ? <Btn type="button" $v="danger" onClick={remove}><FontAwesomeIcon icon={faTrash} /> Delete</Btn> : <span />}<Btn type="button" onClick={save}>{isNew ? 'Create' : 'Save'}</Btn></>}
    >
      {err && <ErrorBox>{err}</ErrorBox>}
      <FormGrid $cols={3}>
        <Field $full>Title<input value={f.title || ''} onChange={set('title')} placeholder="e.g. 12 kW hybrid — Hayatabad" /></Field>
        <Field>Stage<select value={f.stage} onChange={set('stage')}>{STAGES.map((s) => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}</select></Field>
        <Field>Priority<select value={f.priority} onChange={set('priority')}><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option></select></Field>
        <Field>Due date<input type="date" value={f.dueDate || ''} onChange={set('dueDate')} /></Field>
        <Field>Customer<input value={f.customerName || ''} onChange={set('customerName')} /></Field>
        <Field>Phone<input value={f.customerPhone || ''} onChange={set('customerPhone')} /></Field>
        <Field>Location<input value={f.location || ''} onChange={set('location')} /></Field>
        <Field>System size (kW)<input type="number" step="0.1" value={f.systemKW ?? ''} onChange={set('systemKW')} /></Field>
        <Field>Project value (Rs)<input type="number" value={f.value ?? ''} onChange={set('value')} /></Field>
        <Field>Labels (comma separated)<input value={(f.labels || []).join(', ')} onChange={(e) => setF({ ...f, labels: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) })} /></Field>
        <Field as="div" $full>Team
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {team.length ? team.map((m) => (
              <button key={m._id} type="button" onClick={() => toggle(m._id)} style={{ border: `1px solid ${f.assignees.includes(m._id) ? a.blue : a.line}`, background: f.assignees.includes(m._id) ? '#eff4ff' : '#fff', borderRadius: 999, padding: '5px 11px', cursor: 'pointer', fontSize: '0.82rem', color: a.text }}>{m.name}</button>
            )) : <span style={{ fontWeight: 400 }}>No team members yet.</span>}
          </div>
        </Field>
        <Field as="div" $full>Checklist
          <Check>
            {f.checklist.map((c, i) => (
              <div className="item" key={i}>
                <input type="checkbox" checked={c.done} onChange={(e) => setItem(i, { done: e.target.checked })} />
                <input type="text" value={c.text} onChange={(e) => setItem(i, { text: e.target.value })} />
                <button type="button" onClick={() => setF({ ...f, checklist: f.checklist.filter((_, j) => j !== i) })} aria-label="Remove item"><FontAwesomeIcon icon={faTrash} /></button>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <Btn type="button" $v="ghost" $sm onClick={() => setF({ ...f, checklist: [...f.checklist, { text: '', done: false }] })}><FontAwesomeIcon icon={faPlus} /> Add item</Btn>
              {!f.checklist.length && (
                <Btn type="button" $v="ghost" $sm onClick={() => setF({ ...f, checklist: ['Site survey done', 'Quotation approved', 'Advance received', 'Panels & inverter delivered', 'Structure installed', 'Panels mounted & wired', 'Inverter commissioned', 'Net-metering file submitted', 'Green meter installed', 'Final payment received'].map((text) => ({ text, done: false })) })}>Use standard installation checklist</Btn>
              )}
            </div>
          </Check>
        </Field>
        <Field $full>Notes<textarea value={f.notes || ''} onChange={set('notes')} /></Field>
      </FormGrid>
    </Modal>
  );
}

export default function Board() {
  const { data, error, reload, setData } = useLoad('projects');
  const team = useTeam();
  const [open, setOpen] = useState(null);
  const [drag, setDrag] = useState(null);
  const [over, setOver] = useState(null);
  const [err, setErr] = useState('');
  const items = data?.items || [];
  const byStage = (s) => items.filter((p) => p.stage === s).sort((x, y) => (x.order || 0) - (y.order || 0));
  const nameOf = (id) => team.find((m) => m._id === id)?.name || '?';

  const dropOn = async (stage, beforeId) => {
    if (!drag) return;
    const card = items.find((p) => p._id === drag);
    setDrag(null); setOver(null);
    if (!card) return;
    const col = byStage(stage).filter((p) => p._id !== card._id);
    const idx = beforeId ? col.findIndex((p) => p._id === beforeId) : col.length;
    col.splice(idx < 0 ? col.length : idx, 0, { ...card, stage });
    const orderIds = col.map((p) => p._id);
    setData((d) => ({ ...d, items: d.items.map((p) => (orderIds.includes(p._id) ? { ...p, stage, order: orderIds.indexOf(p._id) + 1 } : p)) }));
    try { await post('projects/reorder', { stage, ids: orderIds }); } catch (e) { setErr(e.message); reload(); }
  };

  return (
    <>
      <PageHead>
        <div><h1>Project board</h1><p>Drag cards between stages — from first lead to green meter.</p></div>
        <div className="actions"><Btn type="button" onClick={() => setOpen({ stage: 'lead' })}><FontAwesomeIcon icon={faPlus} /> New project</Btn></div>
      </PageHead>
      {(error || err) && <ErrorBox>{error || err}</ErrorBox>}
      <Columns>
        {STAGES.map((s) => {
          const col = byStage(s);
          const total = col.reduce((acc, p) => acc + (p.value || 0), 0);
          return (
            <Col
              key={s}
              $over={over === s}
              onDragOver={(e) => { e.preventDefault(); setOver(s); }}
              onDragLeave={() => setOver(null)}
              onDrop={(e) => { e.preventDefault(); dropOn(s, null); }}
            >
              <div className="head"><span><span className="dot" style={{ background: STAGE_COLORS[s] }} />{STAGE_LABELS[s]} <small>{col.length}</small></span><small>{total ? pkr(total) : ''}</small></div>
              {col.map((p) => {
                const doneN = (p.checklist || []).filter((c) => c.done).length;
                const totalN = (p.checklist || []).length;
                const overdue = p.dueDate && new Date(p.dueDate) < new Date() && s !== 'completed';
                return (
                  <CardEl
                    key={p._id}
                    $c={STAGE_COLORS[s]}
                    $dragging={drag === p._id}
                    draggable
                    onDragStart={(e) => { setDrag(p._id); e.dataTransfer.effectAllowed = 'move'; }}
                    onDragEnd={() => { setDrag(null); setOver(null); }}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setOver(s); }}
                    onDrop={(e) => { e.preventDefault(); e.stopPropagation(); dropOn(s, p._id); }}
                    onClick={() => setOpen(p)}
                  >
                    <b>{p.title}</b>
                    <div className="meta">
                      {p.customerName && <span>{p.customerName}</span>}
                      {p.location && <span><FontAwesomeIcon icon={faLocationDot} />{p.location}</span>}
                      {p.systemKW ? <span><FontAwesomeIcon icon={faSolarPanel} />{p.systemKW} kW</span> : null}
                      {p.dueDate && <span style={{ color: overdue ? a.red : undefined }}><FontAwesomeIcon icon={faCalendarDay} />{fmtDate(p.dueDate, { day: 'numeric', month: 'short' })}</span>}
                      {totalN > 0 && <span><FontAwesomeIcon icon={faCircleCheck} />{doneN}/{totalN}</span>}
                    </div>
                    {totalN > 0 && <div className="progress"><div style={{ width: `${(doneN / totalN) * 100}%` }} /></div>}
                    <div className="foot">
                      <span style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {p.priority !== 'normal' && <span className="tag" style={{ background: PRIORITY[p.priority][0], color: PRIORITY[p.priority][1] }}>{p.priority}</span>}
                        {(p.labels || []).slice(0, 2).map((l) => <span key={l} className="tag" style={{ background: '#f2f4f7', color: '#475467' }}>{l}</span>)}
                        {p.value ? <span className="tag" style={{ background: '#ecfdf3', color: '#027a48' }}>{pkr(p.value)}</span> : null}
                      </span>
                      <span className="avatars" style={{ paddingLeft: 6 }}>{(p.assignees || []).slice(0, 3).map((id) => <span key={id} title={nameOf(id)}>{initials(nameOf(id))}</span>)}</span>
                    </div>
                  </CardEl>
                );
              })}
              <button type="button" className="add" onClick={() => setOpen({ stage: s })}><FontAwesomeIcon icon={faPlus} /> Add card</button>
            </Col>
          );
        })}
      </Columns>
      {open && <ProjectModal project={open} onClose={() => setOpen(null)} onSaved={() => { setOpen(null); reload(); }} />}
    </>
  );
}
