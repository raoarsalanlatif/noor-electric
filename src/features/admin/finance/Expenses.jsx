/* eslint-disable react/prop-types */
// Office, personal and project expenses, month by month. Owners only.
import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faPen, faTrash, faReceipt, faFileCsv } from '@fortawesome/free-solid-svg-icons';
import { del } from '../../../lib/api';
import { useLoad } from '../hooks';
import { a, Card, PageHead, Btn, Badge, Empty, ErrorBox, Field, Table, Loading, LoadFailed, pkr, fmtDate } from '../ui';
import { KIND_LABELS, KIND_TONES, EXPENSE_CATEGORY_LABELS, METHOD_LABELS, Stats, Tabs, Toolbar, ExpenseForm } from './shared';

export default function Expenses() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [kind, setKind] = useState('');
  const { data, error, loading, reload } = useLoad(`expenses?month=${month}`);
  const projects = useLoad('projects').data?.items || [];
  const [form, setForm] = useState(null);
  const [err, setErr] = useState('');
  const all = data?.items || [];
  const items = kind ? all.filter((e) => e.kind === kind) : all;
  const totals = data?.totals || { office: 0, personal: 0, project: 0 };
  const total = totals.office + totals.personal + totals.project;
  // biggest categories first, for the tab that is open
  const breakdown = Object.entries(data?.byCategory || {})
    .map(([k, v]) => { const [kd, c] = k.split(':'); return { kind: kd, category: c, amount: v }; })
    .filter((b) => !kind || b.kind === kind).sort((x, y) => y.amount - x.amount);
  const shown = items.reduce((s, e) => s + e.amount, 0);

  const remove = async (e) => {
    if (!window.confirm(`Delete this ${pkr(e.amount)} expense? This cannot be undone.`)) return;
    try { await del(`expenses/${e._id}`); reload(); } catch (ex) { setErr(ex.message); }
  };
  const exportCsv = () => {
    const rows = [['Date', 'Type', 'Category', 'Amount', 'Paid to', 'Paid by', 'Project', 'Note'],
      ...items.map((e) => [fmtDate(e.date), KIND_LABELS[e.kind], EXPENSE_CATEGORY_LABELS[e.category], e.amount, e.paidTo, METHOD_LABELS[e.method], e.projectTitle, e.note])];
    const csv = rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    link.download = `expenses-${month}${kind ? `-${kind}` : ''}.csv`;
    link.click();
  };

  return (
    <>
      <PageHead>
        <div><h1>Expenses</h1><p>Office, personal and project spending. Only owner accounts can see this page.</p></div>
        <div className="actions">
          {items.length > 0 && <Btn type="button" $v="ghost" onClick={exportCsv}><FontAwesomeIcon icon={faFileCsv} /> Export CSV</Btn>}
          <Btn type="button" onClick={() => setForm({ kind: kind || 'office' })}><FontAwesomeIcon icon={faPlus} /> Add expense</Btn>
        </div>
      </PageHead>
      {(error || err) && <ErrorBox>{error || err}</ErrorBox>}
      <Stats>
        <div><small>Office</small><b>{pkr(totals.office)}</b></div>
        <div><small>Personal</small><b>{pkr(totals.personal)}</b></div>
        <div><small>Projects</small><b>{pkr(totals.project)}</b><span>counted in each project’s cost</span></div>
        <div><small>All spending</small><b>{pkr(total)}</b><span>salaries are on the Team page</span></div>
      </Stats>
      <Toolbar>
        <Field>Month<input type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} /></Field>
        <Tabs>
          <button type="button" className={kind === '' ? 'on' : ''} onClick={() => setKind('')}>All</button>
          {Object.entries(KIND_LABELS).map(([k, v]) => <button key={k} type="button" className={kind === k ? 'on' : ''} onClick={() => setKind(k)}>{v}</button>)}
        </Tabs>
      </Toolbar>
      {breakdown.length > 0 && (
        <Card style={{ marginBottom: 14 }}>
          <div style={{ display: 'grid', gap: 8 }}>
            {breakdown.slice(0, 8).map((b) => (
              <div key={`${b.kind}:${b.category}`} style={{ display: 'grid', gridTemplateColumns: 'minmax(150px, 240px) 1fr auto', gap: 12, alignItems: 'center', fontSize: '0.88rem' }}>
                <span>{EXPENSE_CATEGORY_LABELS[b.category]} {!kind && <Badge $tone={KIND_TONES[b.kind]}>{KIND_LABELS[b.kind]}</Badge>}</span>
                <span style={{ height: 8, borderRadius: 99, background: '#eef1f6', overflow: 'hidden' }}><i style={{ display: 'block', height: '100%', width: `${shown ? (b.amount / shown) * 100 : 0}%`, background: a.blue, borderRadius: 99 }} /></span>
                <b>{pkr(b.amount)}</b>
              </div>
            ))}
          </div>
        </Card>
      )}
      <Card $pad="0">
        {items.length ? (
          <Table>
            <table>
              <thead><tr><th>Date</th><th>What for</th><th>Amount</th><th>Paid to</th><th>Paid by</th><th /></tr></thead>
              <tbody>
                {items.map((e) => (
                  <tr key={e._id}>
                    <td>{fmtDate(e.date)}</td>
                    <td>
                      <b>{EXPENSE_CATEGORY_LABELS[e.category]}</b> <Badge $tone={KIND_TONES[e.kind]}>{KIND_LABELS[e.kind]}</Badge>
                      {(e.projectTitle || e.note) && <><br /><span style={{ color: a.muted, fontSize: '0.8rem' }}>{[e.projectTitle, e.note].filter(Boolean).join(' · ')}</span></>}
                    </td>
                    <td><b>{pkr(e.amount)}</b></td>
                    <td>{e.paidTo || '—'}</td>
                    <td>{METHOD_LABELS[e.method] || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <Btn type="button" $sm $v="ghost" onClick={() => setForm(e)} aria-label="Edit expense"><FontAwesomeIcon icon={faPen} /></Btn>
                        <Btn type="button" $sm $v="danger" onClick={() => remove(e)} aria-label="Delete expense"><FontAwesomeIcon icon={faTrash} /></Btn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Table>
        ) : loading ? <Loading label="Loading expenses…" /> : error && !data ? <LoadFailed onRetry={reload} />
          : <Empty><FontAwesomeIcon icon={faReceipt} /><br />No {kind ? `${KIND_LABELS[kind].toLowerCase()} ` : ''}expenses recorded for this month.</Empty>}
      </Card>
      {form && <ExpenseForm item={form} projects={projects} onClose={() => setForm(null)} onSaved={() => { setForm(null); reload(); }} />}
    </>
  );
}
