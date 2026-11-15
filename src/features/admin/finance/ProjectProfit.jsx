/* eslint-disable react/prop-types */
// Cost and profit of every project: contract value − material issued from stock − project expenses. Owners only.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faCoins, faTrash, faBoxesStacked } from '@fortawesome/free-solid-svg-icons';
import { del } from '../../../lib/api';
import { useLoad } from '../hooks';
import { a, Card, PageHead, Btn, Badge, Empty, ErrorBox, Modal, Table, Loading, LoadFailed, pkr, fmtDate } from '../ui';
import { STAGE_LABELS } from '../labels';
import { EXPENSE_CATEGORY_LABELS, MOVE_LABELS, MOVE_TONES, Stats, qtyText, ExpenseForm } from './shared';

const tone = (n) => (n == null ? a.muted : n >= 0 ? a.green : a.red);
const money = (n) => (n == null ? '—' : `${n < 0 ? '−' : ''}${pkr(Math.abs(n))}`);

function Detail({ id, onClose, onChanged }) {
  const { data, error, loading, reload } = useLoad(`finance/projects/${id}`);
  const [adding, setAdding] = useState(false);
  const [err, setErr] = useState('');
  const changed = () => { reload(); onChanged(); };
  const removeExpense = async (e) => {
    if (!window.confirm(`Delete this ${pkr(e.amount)} expense?`)) return;
    try { await del(`expenses/${e._id}`); changed(); } catch (ex) { setErr(ex.message); }
  };
  return (
    <Modal title={data ? `Cost & profit — ${data.project.title}` : 'Cost & profit'} onClose={onClose} width={820}>
      {(error || err) && <ErrorBox>{error || err}</ErrorBox>}
      {!data ? (loading ? <Loading label="Loading project costs…" /> : <LoadFailed onRetry={reload} />) : (
        <>
          <Stats>
            <div><small>Contract value</small><b>{money(data.value)}</b>{data.value == null && <span>set it on the Projects board</span>}</div>
            <div><small>Material</small><b>{pkr(data.materials)}</b></div>
            <div><small>Other costs</small><b>{pkr(data.expenses)}</b></div>
            <div><small>Profit</small><b style={{ color: tone(data.profit) }}>{money(data.profit)}</b>{data.margin != null && <span>{data.margin.toFixed(1)}% of the contract</span>}</div>
          </Stats>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '4px 0 8px' }}>
            <h4 style={{ margin: 0 }}>Material from stock</h4>
            <Btn as={Link} to="/admin/inventory" $sm $v="ghost"><FontAwesomeIcon icon={faBoxesStacked} /> Issue material in Inventory</Btn>
          </div>
          <Card $pad="0" style={{ marginBottom: 16 }}>
            {data.materialLines.length ? (
              <Table>
                <table>
                  <thead><tr><th>Date</th><th>Item</th><th>Quantity</th><th>Each</th><th>Cost</th></tr></thead>
                  <tbody>
                    {data.materialLines.map((m) => (
                      <tr key={m._id}>
                        <td>{fmtDate(m.date)}</td>
                        <td><b>{m.itemName}</b> {m.type === 'return' && <Badge $tone={MOVE_TONES.return}>{MOVE_LABELS.return}</Badge>}</td>
                        <td>{m.type === 'return' ? '−' : ''}{qtyText(m.qty, m.unit)}</td>
                        <td>{pkr(m.unitCost)}</td>
                        <td><b>{money(m.type === 'return' ? -m.value : m.value)}</b></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Table>
            ) : <Empty>No material issued to this project yet.</Empty>}
          </Card>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '4px 0 8px' }}>
            <h4 style={{ margin: 0 }}>Other costs (labour, transport, fees…)</h4>
            <Btn type="button" $sm onClick={() => setAdding(true)}><FontAwesomeIcon icon={faPlus} /> Add cost</Btn>
          </div>
          <Card $pad="0">
            {data.expenseLines.length ? (
              <Table>
                <table>
                  <thead><tr><th>Date</th><th>What for</th><th>Paid to</th><th>Amount</th><th /></tr></thead>
                  <tbody>
                    {data.expenseLines.map((e) => (
                      <tr key={e._id}>
                        <td>{fmtDate(e.date)}</td>
                        <td><b>{EXPENSE_CATEGORY_LABELS[e.category]}</b>{e.note && <><br /><span style={{ color: a.muted, fontSize: '0.8rem' }}>{e.note}</span></>}</td>
                        <td>{e.paidTo || '—'}</td>
                        <td><b>{pkr(e.amount)}</b></td>
                        <td><Btn type="button" $sm $v="danger" onClick={() => removeExpense(e)} aria-label="Delete cost"><FontAwesomeIcon icon={faTrash} /></Btn></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Table>
            ) : <Empty>No other costs recorded for this project yet.</Empty>}
          </Card>
        </>
      )}
      {adding && (
        <ExpenseForm item={{}} fixed={{ kind: 'project', projectId: id, category: 'labour' }} onClose={() => setAdding(false)} onSaved={() => { setAdding(false); changed(); }} />
      )}
    </Modal>
  );
}

export default function ProjectProfit() {
  const { data, error, loading, reload } = useLoad('finance/projects');
  const [open, setOpen] = useState(null);
  const items = data?.items || [];
  const t = data?.totals;
  return (
    <>
      <PageHead>
        <div><h1>Project cost & profit</h1><p>Contract value, minus material issued from stock and other project costs. Only owner accounts can see this page.</p></div>
      </PageHead>
      {error && <ErrorBox>{error}</ErrorBox>}
      {t && (
        <Stats>
          <div><small>Contract value</small><b>{pkr(t.value)}</b>{t.unpriced > 0 && <span>{t.unpriced} project{t.unpriced > 1 ? 's' : ''} without a value</span>}</div>
          <div><small>Material</small><b>{pkr(t.materials)}</b></div>
          <div><small>Other costs</small><b>{pkr(t.expenses)}</b></div>
          <div><small>Profit</small><b style={{ color: tone(t.profit) }}>{money(t.profit)}</b><span>on projects that have a value</span></div>
        </Stats>
      )}
      <Card $pad="0">
        {items.length ? (
          <Table>
            <table>
              <thead><tr><th>Project</th><th>Stage</th><th>Contract value</th><th>Material</th><th>Other costs</th><th>Total cost</th><th>Profit</th><th /></tr></thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p._id}>
                    <td><b>{p.title}</b>{p.customerName && <><br /><span style={{ color: a.muted, fontSize: '0.8rem' }}>{p.customerName}</span></>}</td>
                    <td><Badge $tone="gray">{STAGE_LABELS[p.stage] || p.stage}</Badge></td>
                    <td>{money(p.value)}</td>
                    <td>{pkr(p.materials)}</td>
                    <td>{pkr(p.expenses)}</td>
                    <td><b>{pkr(p.cost)}</b></td>
                    <td><b style={{ color: tone(p.profit) }}>{money(p.profit)}</b>{p.margin != null && <><br /><span style={{ color: a.muted, fontSize: '0.8rem' }}>{p.margin.toFixed(1)}%</span></>}</td>
                    <td><Btn type="button" $sm $v="ghost" onClick={() => setOpen(p._id)}>Details</Btn></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Table>
        ) : loading ? <Loading label="Loading projects…" /> : error && !data ? <LoadFailed onRetry={reload} />
          : <Empty><FontAwesomeIcon icon={faCoins} /><br />No projects yet — add them on the Projects board first.</Empty>}
      </Card>
      {open && <Detail id={open} onClose={() => setOpen(null)} onChanged={reload} />}
    </>
  );
}
