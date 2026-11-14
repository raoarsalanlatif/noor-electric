/* eslint-disable react/prop-types */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faInbox, faCalendarPlus, faTableColumns, faTrash } from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { patch, post, del } from '../../../lib/api';
import { useLoad, useTeam } from '../hooks';
import { a, Card, PageHead, Btn, Badge, Table, Empty, ErrorBox, Modal, Field, FormGrid, pkr, fmtDate, waLink, toLocalInput, Loading, LoadFailed } from '../ui';
import { QUOTE_LABELS, QUOTE_TONES } from '../labels';
import { EventForm } from './CalendarPage';

const Filters = styled.div`
  display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 14px;
  button { border: 1px solid ${a.line}; background: #fff; border-radius: 999px; padding: 6px 12px; font-size: 0.82rem; cursor: pointer; color: ${a.text}; }
  button.on { background: ${a.navy}; color: #fff; border-color: ${a.navy}; }
`;

const Pre = styled.pre`
  white-space: pre-wrap; font-family: inherit; font-size: 0.85rem; background: #f8fafc; border: 1px solid ${a.line}; border-radius: 10px; padding: 10px; margin: 0;
`;

function QuoteModal({ quote, onClose, onSaved }) {
  const isNew = !quote._id;
  const team = useTeam();
  const navigate = useNavigate();
  const [f, setF] = useState({ ...quote });
  const [err, setErr] = useState('');
  const [visit, setVisit] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const save = async () => {
    setErr('');
    try {
      if (isNew) await post('quotes', f);
      else await patch(`quotes/${quote._id}`, { status: f.status, quotedAmount: f.quotedAmount, notes: f.notes, assignedTo: f.assignedTo || null, name: f.name, phone: f.phone, city: f.city, area: f.area, systemType: f.systemType });
      onSaved();
    } catch (e) { setErr(e.message); }
  };
  const convert = async () => {
    try { await post(`quotes/${quote._id}/convert`); navigate('/admin/projects'); } catch (e) { setErr(e.message); }
  };
  const remove = async () => {
    if (!window.confirm('Delete this quotation request?')) return;
    try { await del(`quotes/${quote._id}`); onSaved(); } catch (e) { setErr(e.message); }
  };

  if (visit) {
    const start = new Date(); start.setDate(start.getDate() + 1); start.setHours(11, 0, 0, 0);
    return (
      <EventForm
        initial={{ title: `Site visit — ${quote.name}`, type: 'site_visit', start: toLocalInput(start), location: [quote.area, quote.city].filter(Boolean).join(', '), customerName: quote.name, customerPhone: quote.phone, quoteId: quote._id, notes: quote.plan?.summary || quote.message || '' }}
        onClose={() => setVisit(false)}
        onSaved={() => { setVisit(false); onSaved(); }}
      />
    );
  }

  return (
    <Modal
      title={isNew ? 'New quotation' : `Quotation — ${quote.name}`}
      onClose={onClose}
      width={720}
      footer={(
        <>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {!isNew && <Btn type="button" $v="danger" onClick={remove}><FontAwesomeIcon icon={faTrash} /></Btn>}
            {!isNew && <Btn type="button" $v="ghost" onClick={() => setVisit(true)}><FontAwesomeIcon icon={faCalendarPlus} /> Book site visit</Btn>}
            {!isNew && <Btn type="button" $v="ghost" onClick={convert}><FontAwesomeIcon icon={faTableColumns} /> Add to project board</Btn>}
          </div>
          <Btn type="button" onClick={save}>Save</Btn>
        </>
      )}
    >
      {err && <ErrorBox>{err}</ErrorBox>}
      <FormGrid>
        <Field>Customer name<input value={f.name || ''} onChange={set('name')} /></Field>
        <Field>Phone<input value={f.phone || ''} onChange={set('phone')} /></Field>
        <Field>City<input value={f.city || ''} onChange={set('city')} /></Field>
        <Field>Area / address<input value={f.area || ''} onChange={set('area')} /></Field>
        <Field>System wanted<input value={f.systemType || ''} onChange={set('systemType')} placeholder="e.g. 10 kW hybrid" /></Field>
        <Field>Status
          <select value={f.status || 'new'} onChange={set('status')}>{Object.entries(QUOTE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        </Field>
        <Field>Quoted amount (Rs)<input type="number" value={f.quotedAmount ?? ''} onChange={set('quotedAmount')} /></Field>
        <Field>Assigned to
          <select value={f.assignedTo || ''} onChange={set('assignedTo')}><option value="">—</option>{team.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}</select>
        </Field>
        {!isNew && f.message && <Field as="div" $full>Customer message<Pre>{f.message}</Pre></Field>}
        {!isNew && f.plan?.summary && <Field as="div" $full>Solar Planner design<Pre>{f.plan.summary}</Pre></Field>}
        <Field $full>Internal notes<textarea value={f.notes || ''} onChange={set('notes')} /></Field>
      </FormGrid>
      {!isNew && quote.phone && (
        <div style={{ marginTop: 14 }}>
          <Btn as="a" $v="green" href={waLink(quote.phone, `Assalam o Alaikum ${quote.name}, this is Noor Electric Renewables regarding your solar enquiry.`)} target="_blank" rel="noopener noreferrer"><FontAwesomeIcon icon={faWhatsapp} /> WhatsApp customer</Btn>
        </div>
      )}
    </Modal>
  );
}

export default function Quotes() {
  const [status, setStatus] = useState('');
  const { data, error, loading, reload } = useLoad(`quotes${status ? `?status=${status}` : ''}`);
  const [open, setOpen] = useState(null);
  const items = data?.items || [];
  return (
    <>
      <PageHead>
        <div><h1>Quotation requests</h1><p>Enquiries from the website contact form and Solar Planner, plus ones you add.</p></div>
        <div className="actions"><Btn type="button" onClick={() => setOpen({ status: 'new' })}><FontAwesomeIcon icon={faPlus} /> New quotation</Btn></div>
      </PageHead>
      {error && <ErrorBox>{error}</ErrorBox>}
      <Filters>
        <button type="button" className={!status ? 'on' : ''} onClick={() => setStatus('')}>All</button>
        {Object.entries(QUOTE_LABELS).map(([k, v]) => <button key={k} type="button" className={status === k ? 'on' : ''} onClick={() => setStatus(k)}>{v}</button>)}
      </Filters>
      <Card $pad="0">
        {items.length ? (
          <Table>
            <table>
              <thead><tr><th>Received</th><th>Customer</th><th>Location</th><th>Request</th><th>Source</th><th>Quoted</th><th>Status</th></tr></thead>
              <tbody>
                {items.map((q) => (
                  <tr key={q._id} onClick={() => setOpen(q)} style={{ cursor: 'pointer' }}>
                    <td>{fmtDate(q.createdAt)}</td>
                    <td><b>{q.name}</b><br /><span style={{ color: a.muted }}>{q.phone}</span></td>
                    <td>{[q.area, q.city].filter(Boolean).join(', ') || '—'}</td>
                    <td>{q.plan?.systemKW ? `${q.plan.systemKW} kW design${q.plan.status ? ` (${q.plan.status})` : ''}` : q.systemType || (q.monthlyBill ? `Bill ${pkr(q.monthlyBill)}` : '—')}</td>
                    <td><Badge $tone={q.source === 'planner' ? 'teal' : q.source === 'manual' ? 'gray' : 'blue'}>{q.source}</Badge></td>
                    <td>{pkr(q.quotedAmount)}</td>
                    <td><Badge $tone={QUOTE_TONES[q.status]}>{QUOTE_LABELS[q.status]}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Table>
        ) : loading ? <Loading label="Loading quotations…" /> : error && !data ? <LoadFailed onRetry={reload} /> : <Empty><FontAwesomeIcon icon={faInbox} /><br />No quotation requests {status ? 'with this status' : 'yet'}.</Empty>}
      </Card>
      {open && <QuoteModal quote={open} onClose={() => setOpen(null)} onSaved={() => { setOpen(null); reload(); }} />}
    </>
  );
}
