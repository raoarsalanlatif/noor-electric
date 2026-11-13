/* eslint-disable react/prop-types */
import { useMemo, useState } from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faChevronLeft, faChevronRight, faCalendarCheck, faDownload, faTrash } from '@fortawesome/free-solid-svg-icons';
import { faGoogle, faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { post, patch, del } from '../../../lib/api';
import { useLoad, useTeam } from '../hooks';
import { a, Card, PageHead, Btn, Badge, Empty, ErrorBox, Modal, Field, FormGrid, fmtDateTime, toLocalInput } from '../ui';
import { EVENT_LABELS, EVENT_COLORS } from '../labels';
import { googleCalendarUrl, downloadIcs, whatsappInviteUrl } from '../calendarLinks';

const Grid = styled.div`
  display: grid; grid-template-columns: repeat(7, minmax(0, 1fr));
  border-top: 1px solid ${a.line}; border-left: 1px solid ${a.line};
  .dow { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.06em; color: ${a.muted}; padding: 8px; border-right: 1px solid ${a.line}; border-bottom: 1px solid ${a.line}; background: #fafbfd; }
  .cell { min-height: 108px; border-right: 1px solid ${a.line}; border-bottom: 1px solid ${a.line}; padding: 6px; cursor: pointer; background: #fff; }
  .cell:hover { background: #fafcff; }
  .cell.out { background: #fafbfd; color: #b0b8c6; }
  .cell.today .n { background: ${a.blue}; color: #fff; }
  .n { display: inline-grid; place-items: center; width: 24px; height: 24px; border-radius: 50%; font-size: 0.8rem; font-weight: 600; }
  .ev { display: block; width: 100%; text-align: left; border: 0; border-radius: 6px; padding: 3px 6px; margin-top: 3px; font-size: 0.74rem; color: #fff;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; cursor: pointer; }
  .ev.done { opacity: 0.55; text-decoration: line-through; }
  @media (max-width: 700px) { .cell { min-height: 64px; padding: 3px; } .ev { font-size: 0; height: 6px; padding: 0; } }
`;

const Layout = styled.div`
  display: grid; grid-template-columns: 1fr 320px; gap: 16px; align-items: start;
  @media (max-width: 1100px) { grid-template-columns: 1fr; }
  ul { list-style: none; margin: 0; padding: 0; }
  li { padding: 10px 0; border-bottom: 1px solid ${a.line}; cursor: pointer; font-size: 0.88rem; }
  li:last-child { border-bottom: 0; }
  li small { display: block; color: ${a.muted}; }
`;

const Share = styled.div`
  margin-top: 16px; padding: 14px; border-radius: 12px; background: #f8fafc; border: 1px solid ${a.line};
  h4 { margin: 0 0 10px; font-size: 0.9rem; }
  .row { display: flex; gap: 8px; flex-wrap: wrap; }
`;

export function EventForm({ initial, onClose, onSaved }) {
  const team = useTeam();
  const isNew = !initial._id;
  const [f, setF] = useState({ type: 'site_visit', status: 'scheduled', assignees: [], ...initial, start: initial.start?.length === 16 ? initial.start : toLocalInput(initial.start), end: initial.end ? toLocalInput(initial.end) : '' });
  const [err, setErr] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const toggle = (id) => setF({ ...f, assignees: f.assignees.includes(id) ? f.assignees.filter((x) => x !== id) : [...f.assignees, id] });
  const payload = () => ({ ...f, start: f.start ? new Date(f.start).toISOString() : null, end: f.end ? new Date(f.end).toISOString() : null });

  const save = async () => {
    setErr('');
    try {
      if (isNew) await post('events', payload());
      else await patch(`events/${initial._id}`, payload());
      onSaved();
    } catch (e) { setErr(e.message); }
  };
  const remove = async () => {
    if (!window.confirm('Delete this event?')) return;
    try { await del(`events/${initial._id}`); onSaved(); } catch (e) { setErr(e.message); }
  };
  const ev = payload();
  const assigned = team.filter((m) => f.assignees.includes(m._id));

  return (
    <Modal
      title={isNew ? 'New calendar event' : f.title}
      onClose={onClose}
      width={680}
      footer={<>{!isNew ? <Btn type="button" $v="danger" onClick={remove}><FontAwesomeIcon icon={faTrash} /> Delete</Btn> : <span />}<Btn type="button" onClick={save}>{isNew ? 'Create event' : 'Save'}</Btn></>}
    >
      {err && <ErrorBox>{err}</ErrorBox>}
      <FormGrid>
        <Field $full>Title<input value={f.title || ''} onChange={set('title')} placeholder="e.g. Site visit — Hayatabad" /></Field>
        <Field>Type<select value={f.type} onChange={set('type')}>{Object.entries(EVENT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
        <Field>Status<select value={f.status} onChange={set('status')}><option value="scheduled">Scheduled</option><option value="done">Done</option><option value="cancelled">Cancelled</option></select></Field>
        <Field>Starts<input type="datetime-local" value={f.start || ''} onChange={set('start')} /></Field>
        <Field>Ends (optional)<input type="datetime-local" value={f.end || ''} onChange={set('end')} /></Field>
        <Field $full>Location<input value={f.location || ''} onChange={set('location')} placeholder="Address or Google Maps link" /></Field>
        <Field>Customer<input value={f.customerName || ''} onChange={set('customerName')} /></Field>
        <Field>Customer phone<input value={f.customerPhone || ''} onChange={set('customerPhone')} /></Field>
        <Field as="div" $full>Team
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {team.length ? team.map((m) => (
              <button key={m._id} type="button" onClick={() => toggle(m._id)} style={{ border: `1px solid ${f.assignees.includes(m._id) ? a.blue : a.line}`, background: f.assignees.includes(m._id) ? '#eff4ff' : '#fff', color: a.text, borderRadius: 999, padding: '5px 11px', cursor: 'pointer', fontSize: '0.82rem' }}>{m.name}</button>
            )) : <span style={{ fontWeight: 400 }}>Add employees under Team & salaries to assign them.</span>}
          </div>
        </Field>
        <Field $full>Notes<textarea value={f.notes || ''} onChange={set('notes')} /></Field>
      </FormGrid>
      {f.title && f.start && (
        <Share>
          <h4><FontAwesomeIcon icon={faCalendarCheck} /> Send the invite</h4>
          <div className="row">
            <Btn as="a" $v="ghost" $sm href={googleCalendarUrl(ev)} target="_blank" rel="noopener noreferrer"><FontAwesomeIcon icon={faGoogle} /> Google Calendar</Btn>
            <Btn type="button" $v="ghost" $sm onClick={() => downloadIcs({ ...ev, _id: initial._id })}><FontAwesomeIcon icon={faDownload} /> .ics (Outlook / Apple)</Btn>
            {f.customerPhone && <Btn as="a" $v="green" $sm href={whatsappInviteUrl(ev, f.customerPhone)} target="_blank" rel="noopener noreferrer"><FontAwesomeIcon icon={faWhatsapp} /> Customer</Btn>}
            {assigned.filter((m) => m.phone).map((m) => (
              <Btn key={m._id} as="a" $v="green" $sm href={whatsappInviteUrl(ev, m.phone)} target="_blank" rel="noopener noreferrer"><FontAwesomeIcon icon={faWhatsapp} /> {m.name}</Btn>
            ))}
          </div>
        </Share>
      )}
    </Modal>
  );
}

const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function CalendarPage() {
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d; });
  const gridStart = useMemo(() => { const d = new Date(cursor); const wd = (d.getDay() + 6) % 7; d.setDate(d.getDate() - wd); return d; }, [cursor]);
  const gridEnd = useMemo(() => new Date(gridStart.getTime() + 42 * 864e5), [gridStart]);
  const { data, error, reload } = useLoad(`events?from=${gridStart.toISOString()}&to=${gridEnd.toISOString()}`);
  const upcoming = useLoad(`events?from=${new Date(new Date().setHours(0, 0, 0, 0)).toISOString()}&to=${new Date(Date.now() + 30 * 864e5).toISOString()}`);
  const [open, setOpen] = useState(null);
  const events = data?.items || [];
  const today = new Date().toDateString();
  const days = Array.from({ length: 42 }, (_, i) => new Date(gridStart.getTime() + i * 864e5));
  const onDay = (d) => events.filter((e) => new Date(e.start).toDateString() === d.toDateString());
  const shift = (n) => { const d = new Date(cursor); d.setMonth(d.getMonth() + n); setCursor(d); };
  const newOn = (d) => { const s = new Date(d); s.setHours(11, 0, 0, 0); setOpen({ start: toLocalInput(s) }); };
  const done = () => { setOpen(null); reload(); upcoming.reload(); };

  return (
    <>
      <PageHead>
        <div><h1>Calendar</h1><p>Site visits, installations and commitments. Share each one to Google Calendar or WhatsApp.</p></div>
        <div className="actions">
          <Btn type="button" $v="ghost" onClick={() => shift(-1)} aria-label="Previous month"><FontAwesomeIcon icon={faChevronLeft} /></Btn>
          <Btn type="button" $v="ghost" onClick={() => { const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); setCursor(d); }}>Today</Btn>
          <Btn type="button" $v="ghost" onClick={() => shift(1)} aria-label="Next month"><FontAwesomeIcon icon={faChevronRight} /></Btn>
          <Btn type="button" onClick={() => newOn(new Date(Date.now() + 864e5))}><FontAwesomeIcon icon={faPlus} /> New event</Btn>
        </div>
      </PageHead>
      {error && <ErrorBox>{error}</ErrorBox>}
      <Layout>
        <Card $pad="0" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '12px 14px', fontWeight: 700, fontFamily: 'Poppins, sans-serif' }}>{cursor.toLocaleDateString('en-PK', { month: 'long', year: 'numeric' })}</div>
          <Grid>
            {DOW.map((d) => <div key={d} className="dow">{d}</div>)}
            {days.map((d) => (
              <div key={d.toISOString()} className={`cell ${d.getMonth() !== cursor.getMonth() ? 'out' : ''} ${d.toDateString() === today ? 'today' : ''}`} onClick={() => newOn(d)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') newOn(d); }}>
                <span className="n">{d.getDate()}</span>
                {onDay(d).slice(0, 4).map((e) => (
                  <button key={e._id} type="button" className={`ev ${e.status !== 'scheduled' ? 'done' : ''}`} style={{ background: EVENT_COLORS[e.type] }} onClick={(x) => { x.stopPropagation(); setOpen(e); }} title={e.title}>
                    {new Date(e.start).toLocaleTimeString('en-PK', { hour: 'numeric', minute: '2-digit' })} {e.title}
                  </button>
                ))}
                {onDay(d).length > 4 && <small style={{ fontSize: '0.7rem', color: a.muted }}>+{onDay(d).length - 4} more</small>}
              </div>
            ))}
          </Grid>
        </Card>
        <Card>
          <h3 style={{ margin: '0 0 6px', fontSize: '1rem' }}>Upcoming 30 days</h3>
          {(upcoming.data?.items || []).filter((e) => e.status === 'scheduled').length ? (
            <ul>
              {upcoming.data.items.filter((e) => e.status === 'scheduled').map((e) => (
                <li key={e._id} onClick={() => setOpen(e)}>
                  <b>{e.title}</b>
                  <small>{fmtDateTime(e.start)}{e.location ? ` · ${e.location}` : ''}</small>
                  <Badge $tone="blue" style={{ marginTop: 4, background: `${EVENT_COLORS[e.type]}1a`, color: EVENT_COLORS[e.type] }}>{EVENT_LABELS[e.type]}</Badge>
                </li>
              ))}
            </ul>
          ) : <Empty>Nothing scheduled yet. Click a day to add an event.</Empty>}
        </Card>
      </Layout>
      {open && <EventForm initial={open} onClose={() => setOpen(null)} onSaved={done} />}
    </>
  );
}
