/* eslint-disable react/prop-types, react-refresh/only-export-components */
// Labels, small layout pieces and the expense form shared by the Inventory, Expenses and Project profit pages.
import { useState } from 'react';
import styled from 'styled-components';
import { post, patch } from '../../../lib/api';
import { a, Btn, ErrorBox, Modal, Field, FormGrid, toDateInput } from '../ui';

export const ITEM_CATEGORY_LABELS = {
  panel: 'Solar panels', inverter: 'Inverters', battery: 'Batteries', structure: 'Mounting structure',
  cable: 'Cable & wire', protection: 'Breakers & protection', accessory: 'Accessories', other: 'Other',
};
export const UNIT_LABELS = { pcs: 'pieces', m: 'metres', ft: 'feet', kg: 'kg', set: 'sets', box: 'boxes', roll: 'rolls' };
export const MOVE_LABELS = { in: 'Purchase', out: 'Issued', return: 'Returned', adjust: 'Count correction' };
export const MOVE_TONES = { in: 'green', out: 'blue', return: 'teal', adjust: 'gold' };
export const KIND_LABELS = { office: 'Office', personal: 'Personal', project: 'Project' };
export const KIND_TONES = { office: 'blue', personal: 'purple', project: 'teal' };
export const EXPENSE_CATEGORY_LABELS = {
  rent: 'Rent', utilities: 'Electricity, gas & water', fuel_transport: 'Fuel & transport', office_supplies: 'Office supplies',
  marketing: 'Marketing & ads', internet_phone: 'Internet & phone', maintenance: 'Repairs & maintenance', food: 'Tea & food',
  tax_fees: 'Taxes & fees', household: 'Household', family: 'Family', medical: 'Medical', education: 'Education', travel: 'Travel',
  labour: 'Labour', transport: 'Transport', civil_work: 'Civil work', net_metering: 'Net-metering fees',
  direct_material: 'Material bought for the job', commission: 'Commission', other: 'Other',
};
export const EXPENSE_CATEGORIES = {
  office: ['rent', 'utilities', 'fuel_transport', 'office_supplies', 'marketing', 'internet_phone', 'maintenance', 'food', 'tax_fees', 'other'],
  personal: ['household', 'family', 'medical', 'education', 'travel', 'other'],
  project: ['labour', 'transport', 'civil_work', 'net_metering', 'direct_material', 'commission', 'other'],
};
export const METHOD_LABELS = { cash: 'Cash', bank: 'Bank transfer', jazzcash: 'JazzCash', easypaisa: 'Easypaisa', cheque: 'Cheque', card: 'Card' };

export const qtyText = (n, unit) => `${Number(n || 0).toLocaleString('en-PK', { maximumFractionDigits: 2 })} ${unit || ''}`.trim();
export const today = () => toDateInput(new Date());

export const Stats = styled.div`
  display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 12px; margin-bottom: 16px;
  > div { background: #fff; border: 1px solid ${a.line}; border-radius: 14px; padding: 14px 16px; }
  small { display: block; color: ${a.muted}; font-size: 0.76rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; }
  b { display: block; font-size: 1.35rem; color: ${a.text}; margin-top: 4px; font-family: 'Poppins', sans-serif; }
  span { color: ${a.muted}; font-size: 0.8rem; }
`;

export const Tabs = styled.div`
  display: inline-flex; background: #fff; border: 1px solid ${a.line}; border-radius: 12px; padding: 4px; gap: 4px; flex-wrap: wrap;
  button { border: 0; background: none; padding: 7px 14px; border-radius: 9px; font: inherit; font-size: 0.88rem; font-weight: 600; color: ${a.muted}; cursor: pointer; }
  button.on { background: ${a.navy}; color: #fff; }
`;

export const Toolbar = styled.div`
  display: flex; gap: 10px; flex-wrap: wrap; align-items: flex-end; margin-bottom: 14px;
  label { min-width: 170px; }
  .grow { flex: 1; min-width: 200px; }
`;

/** Add or edit an expense. `fixed` pins the kind and project (used from a project's cost page). */
export function ExpenseForm({ item, projects = [], fixed, onClose, onSaved }) {
  const isNew = !item._id;
  const [f, setF] = useState({
    kind: 'office', category: 'other', amount: '', paidTo: '', method: 'cash', projectId: '', note: '',
    ...item, ...fixed,
    date: item.date ? toDateInput(item.date) : today(),
  });
  const [err, setErr] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const setKind = (e) => setF({ ...f, kind: e.target.value, category: 'other' });
  const cats = EXPENSE_CATEGORIES[f.kind] || EXPENSE_CATEGORIES.office;
  const ready = Number(f.amount) > 0 && f.date && (f.kind !== 'project' || f.projectId);
  const save = async () => {
    setErr('');
    const body = { kind: f.kind, category: f.category, amount: Number(f.amount), date: f.date, paidTo: f.paidTo, method: f.method, projectId: f.kind === 'project' ? f.projectId : '', note: f.note };
    try {
      if (isNew) await post('expenses', body); else await patch(`expenses/${item._id}`, body);
      onSaved();
    } catch (e) { setErr(e.message); }
  };
  return (
    <Modal title={isNew ? 'Add expense' : 'Edit expense'} onClose={onClose} width={560}
      footer={<><span /><Btn type="button" onClick={save} disabled={!ready}>{isNew ? 'Add expense' : 'Save changes'}</Btn></>}>
      {err && <ErrorBox>{err}</ErrorBox>}
      <FormGrid>
        {!fixed && (
          <Field>Type
            <select value={f.kind} onChange={setKind}>{Object.entries(KIND_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          </Field>
        )}
        <Field>Category
          <select value={f.category} onChange={set('category')}>{cats.map((c) => <option key={c} value={c}>{EXPENSE_CATEGORY_LABELS[c]}</option>)}</select>
        </Field>
        {f.kind === 'project' && !fixed && (
          <Field $full>Project
            <select value={f.projectId || ''} onChange={set('projectId')}>
              <option value="">Choose a project…</option>
              {projects.map((p) => <option key={p._id} value={p._id}>{p.title}{p.customerName ? ` — ${p.customerName}` : ''}</option>)}
            </select>
          </Field>
        )}
        <Field>Amount (Rs)<input type="number" min="0" step="1" value={f.amount} onChange={set('amount')} /></Field>
        <Field>Date<input type="date" value={f.date} onChange={set('date')} /></Field>
        <Field>Paid to<input value={f.paidTo} onChange={set('paidTo')} placeholder="e.g. landlord, PESCO, labour contractor" /></Field>
        <Field>Paid by
          <select value={f.method} onChange={set('method')}>{Object.entries(METHOD_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        </Field>
        <Field $full>Note<textarea value={f.note} onChange={set('note')} rows={2} style={{ minHeight: 60 }} /></Field>
      </FormGrid>
    </Modal>
  );
}
