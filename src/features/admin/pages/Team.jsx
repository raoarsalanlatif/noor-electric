/* eslint-disable react/prop-types */
import { useState } from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faUsers, faWandMagicSparkles, faTrash, faCircleCheck, faFileCsv } from '@fortawesome/free-solid-svg-icons';
import { post, patch, del } from '../../../lib/api';
import { useLoad } from '../hooks';
import { a, Card, PageHead, Btn, Badge, Table, Empty, ErrorBox, Modal, Field, FormGrid, pkr, fmtDate, toDateInput, Loading, LoadFailed } from '../ui';

const Tabs = styled.div`
  display: flex; gap: 6px; margin-bottom: 14px;
  button { border: 1px solid ${a.line}; background: #fff; border-radius: 10px; padding: 8px 14px; font-weight: 600; cursor: pointer; color: ${a.text}; }
  button.on { background: ${a.navy}; color: #fff; border-color: ${a.navy}; }
`;
const Totals = styled.div`
  display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 12px;
  div { background: #fff; border: 1px solid ${a.line}; border-radius: 12px; padding: 10px 14px; font-size: 0.82rem; color: ${a.muted}; }
  b { display: block; color: ${a.text}; font-size: 1.15rem; font-family: 'Poppins', sans-serif; }
`;

function EmployeeModal({ emp, onClose, onSaved }) {
  const isNew = !emp._id;
  const [f, setF] = useState({ active: true, ...emp, joinDate: toDateInput(emp.joinDate) });
  const [err, setErr] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = async () => {
    setErr('');
    try {
      if (isNew) await post('employees', f); else await patch(`employees/${emp._id}`, f);
      onSaved();
    } catch (e) { setErr(e.message); }
  };
  const remove = async () => {
    if (!window.confirm(`Delete ${emp.name}? Their past payroll records are kept.`)) return;
    try { await del(`employees/${emp._id}`); onSaved(); } catch (e) { setErr(e.message); }
  };
  return (
    <Modal title={isNew ? 'Add team member' : emp.name} onClose={onClose}
      footer={<>{!isNew ? <Btn type="button" $v="danger" onClick={remove}><FontAwesomeIcon icon={faTrash} /> Delete</Btn> : <span />}<Btn type="button" onClick={save}>Save</Btn></>}>
      {err && <ErrorBox>{err}</ErrorBox>}
      <FormGrid>
        <Field>Full name<input value={f.name || ''} onChange={set('name')} /></Field>
        <Field>Job title<input value={f.title || ''} onChange={set('title')} placeholder="e.g. Senior installer" /></Field>
        <Field>Phone / WhatsApp<input value={f.phone || ''} onChange={set('phone')} /></Field>
        <Field>Email<input value={f.email || ''} onChange={set('email')} /></Field>
        <Field>CNIC<input value={f.cnic || ''} onChange={set('cnic')} /></Field>
        <Field>Joined<input type="date" value={f.joinDate || ''} onChange={set('joinDate')} /></Field>
        <Field>Monthly base salary (Rs)<input type="number" value={f.baseSalary ?? ''} onChange={set('baseSalary')} /></Field>
        <Field>Monthly allowances (Rs)<input type="number" value={f.allowances ?? ''} onChange={set('allowances')} /></Field>
        <Field $full>Bank / payment details<input value={f.bank || ''} onChange={set('bank')} placeholder="e.g. Meezan Bank, account title…" /></Field>
        <Field>Status<select value={f.active ? 'true' : 'false'} onChange={(e) => setF({ ...f, active: e.target.value === 'true' })}><option value="true">Active</option><option value="false">Left the company</option></select></Field>
        <Field $full>Notes<textarea value={f.notes || ''} onChange={set('notes')} /></Field>
      </FormGrid>
    </Modal>
  );
}

function Employees() {
  const { data, error, loading, reload } = useLoad('employees');
  const [open, setOpen] = useState(null);
  const items = data?.items || [];
  const monthly = items.filter((e) => e.active).reduce((s, e) => s + (e.baseSalary || 0) + (e.allowances || 0), 0);
  return (
    <>
      {error && <ErrorBox>{error}</ErrorBox>}
      <Totals>
        <div><b>{items.filter((e) => e.active).length}</b>active team members</div>
        <div><b>{pkr(monthly)}</b>monthly salaries + allowances</div>
        <div style={{ marginLeft: 'auto', border: 0, background: 'none', padding: 0 }}><Btn type="button" onClick={() => setOpen({})}><FontAwesomeIcon icon={faPlus} /> Add team member</Btn></div>
      </Totals>
      <Card $pad="0">
        {items.length ? (
          <Table>
            <table>
              <thead><tr><th>Name</th><th>Title</th><th>Phone</th><th>Joined</th><th>Base salary</th><th>Allowances</th><th>Status</th></tr></thead>
              <tbody>
                {items.map((e) => (
                  <tr key={e._id} style={{ cursor: 'pointer' }} onClick={() => setOpen(e)}>
                    <td><b>{e.name}</b></td><td>{e.title || '—'}</td><td>{e.phone || '—'}</td><td>{fmtDate(e.joinDate)}</td>
                    <td>{pkr(e.baseSalary)}</td><td>{pkr(e.allowances)}</td>
                    <td><Badge $tone={e.active ? 'green' : 'gray'}>{e.active ? 'Active' : 'Left'}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Table>
        ) : loading && !data ? <Loading label="Loading team…" /> : error && !data ? <LoadFailed onRetry={reload} /> : <Empty><FontAwesomeIcon icon={faUsers} /><br />Add your installers, engineers and office staff.</Empty>}
      </Card>
      {open && <EmployeeModal emp={open} onClose={() => setOpen(null)} onSaved={() => { setOpen(null); reload(); }} />}
    </>
  );
}

function Payroll() {
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const { data, error, loading, reload, setData } = useLoad(`payroll?month=${month}`);
  const [err, setErr] = useState('');
  const items = data?.items || [];
  const total = items.reduce((s, r) => s + (r.net || 0), 0);
  const paid = items.filter((r) => r.status === 'paid').reduce((s, r) => s + (r.net || 0), 0);

  const generate = async () => {
    setErr('');
    try { const r = await post('payroll/generate', { month }); if (!r.created) setErr('Everyone already has a payroll row for this month.'); reload(); } catch (e) { setErr(e.message); }
  };
  const update = async (row, change) => {
    setErr('');
    try {
      const r = await patch(`payroll/${row._id}`, change);
      setData((d) => ({ ...d, items: d.items.map((x) => (x._id === row._id ? { ...x, ...change, net: r.net, paidOn: change.status === 'paid' ? new Date().toISOString() : change.status === 'pending' ? null : x.paidOn } : x)) }));
    } catch (e) { setErr(e.message); }
  };
  const remove = async (row) => {
    if (!window.confirm(`Remove ${row.employeeName} from ${month} payroll?`)) return;
    try { await del(`payroll/${row._id}`); reload(); } catch (e) { setErr(e.message); }
  };
  const exportCsv = () => {
    const rows = [['Employee', 'Title', 'Base', 'Allowances', 'Bonus', 'Deductions', 'Net', 'Status', 'Paid on', 'Method', 'Note'],
      ...items.map((r) => [r.employeeName, r.title, r.base, r.allowances, r.bonus, r.deductions, r.net, r.status, r.paidOn ? fmtDate(r.paidOn) : '', r.method, r.note])];
    const csv = rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    link.download = `payroll-${month}.csv`;
    link.click();
  };
  const num = (row, k) => (
    <input type="number" defaultValue={row[k] ?? 0} onBlur={(e) => { const v = Number(e.target.value) || 0; if (v !== row[k]) update(row, { [k]: v }); }} aria-label={`${k} for ${row.employeeName}`} />
  );

  return (
    <>
      {(error || err) && <ErrorBox>{error || err}</ErrorBox>}
      <Totals>
        <div><Field style={{ minWidth: 160 }}>Month<input type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} /></Field></div>
        <div><b>{pkr(total)}</b>total payroll</div>
        <div><b style={{ color: a.green }}>{pkr(paid)}</b>paid</div>
        <div><b style={{ color: total - paid > 0 ? a.amber : a.text }}>{pkr(total - paid)}</b>still to pay</div>
        <div style={{ marginLeft: 'auto', border: 0, background: 'none', padding: 0, display: 'flex', gap: 8, alignItems: 'center' }}>
          {items.length > 0 && <Btn type="button" $v="ghost" onClick={exportCsv}><FontAwesomeIcon icon={faFileCsv} /> Export CSV</Btn>}
          <Btn type="button" onClick={generate}><FontAwesomeIcon icon={faWandMagicSparkles} /> Generate {month} payroll</Btn>
        </div>
      </Totals>
      <Card $pad="0">
        {items.length ? (
          <Table>
            <table>
              <thead><tr><th>Employee</th><th>Base</th><th>Allowances</th><th>Bonus</th><th>Deductions</th><th>Net pay</th><th>Status</th><th>Method</th><th /></tr></thead>
              <tbody>
                {items.map((r) => (
                  <tr key={r._id}>
                    <td><b>{r.employeeName}</b><br /><span style={{ color: a.muted, fontSize: '0.8rem' }}>{r.title}</span></td>
                    <td>{num(r, 'base')}</td><td>{num(r, 'allowances')}</td><td>{num(r, 'bonus')}</td><td>{num(r, 'deductions')}</td>
                    <td><b>{pkr(r.net)}</b></td>
                    <td>
                      {r.status === 'paid'
                        ? <Btn type="button" $sm $v="ghost" onClick={() => update(r, { status: 'pending' })} title="Mark as unpaid"><FontAwesomeIcon icon={faCircleCheck} color={a.green} /> Paid {r.paidOn ? fmtDate(r.paidOn, { day: 'numeric', month: 'short' }) : ''}</Btn>
                        : <Btn type="button" $sm $v="gold" onClick={() => update(r, { status: 'paid' })}>Mark paid</Btn>}
                    </td>
                    <td>
                      <select defaultValue={r.method || ''} onChange={(e) => update(r, { method: e.target.value })} style={{ border: `1px solid ${a.line}`, borderRadius: 8, padding: '5px 6px' }}>
                        <option value="">—</option><option>Bank transfer</option><option>Cash</option><option>JazzCash</option><option>Easypaisa</option><option>Cheque</option>
                      </select>
                    </td>
                    <td><Btn type="button" $sm $v="danger" onClick={() => remove(r)} aria-label="Remove row"><FontAwesomeIcon icon={faTrash} /></Btn></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Table>
        ) : loading ? <Loading label="Loading payroll…" /> : error && !data ? <LoadFailed onRetry={reload} /> : <Empty>No payroll for {month} yet. Press “Generate {month} payroll” to create a row for every active team member.</Empty>}
      </Card>
    </>
  );
}

export default function Team() {
  const [tab, setTab] = useState('payroll');
  return (
    <>
      <PageHead><div><h1>Team & salaries</h1><p>Only owner accounts can see this page.</p></div></PageHead>
      <Tabs>
        <button type="button" className={tab === 'payroll' ? 'on' : ''} onClick={() => setTab('payroll')}>Monthly payroll</button>
        <button type="button" className={tab === 'team' ? 'on' : ''} onClick={() => setTab('team')}>Team members</button>
      </Tabs>
      {tab === 'payroll' ? <Payroll /> : <Employees />}
    </>
  );
}
