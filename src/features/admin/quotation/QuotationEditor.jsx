/* eslint-disable react/prop-types */
// Build the quotation document for an enquiry: edit on the left, live A4 preview on the right.
// Starts from a template (built-in or saved by the team), saves onto the enquiry, exports to PDF.
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash, faArrowUp, faArrowDown, faFilePdf, faShareNodes, faFloppyDisk, faLayerGroup } from '@fortawesome/free-solid-svg-icons';
import { patch, post, del } from '../../../lib/api';
import { img } from '../../../content/company';
import { useLoad } from '../hooks';
import { a, Btn, ErrorBox, Modal, Field, FormGrid } from '../ui';
import QuotationSheet from './QuotationSheet';
import { PAGE_W } from './paginate';
import { BUILT_IN_TEMPLATES } from './templates';
import { UNITS, totals, lineAmount, fmtMoney, fromTemplate, toTemplate, emptyItem, emptySection, move, setAt, removeAt } from './model';
import { quotationPdf, sharePdf, saveBlob } from './exportQuotation';

const Layout = styled.div`
  *, *::before, *::after { box-sizing: border-box; }
  display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 0.9fr); gap: 18px; align-items: start;
  @media (max-width: 980px) { grid-template-columns: 1fr; }
`;
const Tabs = styled.div`
  display: none; gap: 6px; margin-bottom: 12px;
  button { flex: 1; border: 1px solid ${a.line}; background: #fff; border-radius: 10px; padding: 8px; font-weight: 600; font-size: 0.86rem; color: ${a.text}; cursor: pointer; }
  button.on { background: ${a.navy}; color: #fff; border-color: ${a.navy}; }
  @media (max-width: 980px) { display: flex; }
`;
const Pane = styled.div`
  min-width: 0;
  @media (max-width: 980px) { display: ${(p) => (p.$show ? 'block' : 'none')}; }
`;
const PreviewPane = styled(Pane)`
  position: sticky; top: 70px;
  .frame { background: #e8ecf3; border: 1px solid ${a.line}; border-radius: 12px; padding: 12px; max-height: calc(100vh - 220px); overflow-y: auto; }
  .scaled { transform-origin: top left; }
  .scaled .report-page { box-shadow: 0 2px 10px rgba(16,24,40,0.12); }
  @media (max-width: 980px) { position: static; .frame { max-height: none; } }
`;
const Group = styled.section`
  border: 1px solid ${a.line}; border-radius: 12px; margin-top: 12px; overflow: hidden; background: #fff;
  > header { display: flex; align-items: center; gap: 8px; padding: 8px 10px; background: #f1f6fb; border-bottom: 1px solid ${a.line}; }
  > header .no { width: 26px; height: 26px; border-radius: 50%; background: #65a0d0; color: #fff; font-weight: 700; font-size: 0.8rem; display: grid; place-items: center; flex-shrink: 0; }
  > header input, > header select { font: inherit; font-size: 0.9rem; border: 1px solid ${a.line}; border-radius: 8px; padding: 6px 8px; background: #fff; color: ${a.text}; min-width: 0; }
  > header input.title { flex: 1; font-weight: 600; }
  > header select { width: 92px; }
  .rows { padding: 8px 10px 10px; display: grid; gap: 8px; }
  .labels, .row { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr) 84px 64px 96px 30px; gap: 6px; align-items: start; }
  .labels { font-size: 0.7rem; font-weight: 600; color: ${a.muted}; text-transform: uppercase; letter-spacing: 0.04em; }
  .row textarea, .row input { font: inherit; font-size: 0.86rem; border: 1px solid ${a.line}; border-radius: 8px; padding: 6px 8px; width: 100%; color: ${a.text}; background: #fff; }
  .row textarea { resize: vertical; min-height: 34px; line-height: 1.3; field-sizing: content; }
  .row textarea:focus, .row input:focus, > header input:focus { outline: 2px solid ${a.blue}33; border-color: ${a.blue}; }
  .row .amt { padding: 7px 0; text-align: right; font-weight: 600; font-size: 0.82rem; color: ${a.text}; white-space: nowrap; }
  @media (max-width: 560px) {
    .labels { display: none; }
    .row { grid-template-columns: 1fr 1fr 30px; padding-bottom: 8px; border-bottom: 1px dashed ${a.line}; }
    .row textarea { grid-column: 1 / -1; }
    .row .amt { text-align: left; }
  }
`;
const Icon = styled.button`
  border: 0; background: none; color: ${(p) => (p.$danger ? a.red : a.muted)}; cursor: pointer; padding: 7px 6px; border-radius: 8px; font-size: 0.82rem;
  &:hover { background: #eef2f7; } &:disabled { opacity: 0.3; cursor: default; }
`;
const Bar = styled.div`
  display: flex; gap: 8px; align-items: center; flex-wrap: wrap; padding: 10px 12px; border: 1px solid ${a.line}; border-radius: 12px; background: #f8fafc; margin-bottom: 12px;
  label { font-size: 0.8rem; font-weight: 600; color: ${a.muted}; }
  select { font: inherit; font-size: 0.88rem; border: 1px solid ${a.line}; border-radius: 8px; padding: 7px 9px; background: #fff; flex: 1; min-width: 150px; }
`;
const Sum = styled.div`
  margin-top: 12px; border: 1px solid ${a.line}; border-radius: 12px; padding: 10px 12px; display: grid; gap: 6px; font-size: 0.9rem;
  div { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
  input { width: 140px; text-align: right; font: inherit; border: 1px solid ${a.line}; border-radius: 8px; padding: 6px 8px; }
  .grand { font-weight: 700; font-size: 1rem; color: ${a.navy}; border-top: 1px solid ${a.line}; padding-top: 8px; }
`;
const Check = styled.label`display: flex; align-items: center; gap: 8px; font-size: 0.86rem; color: ${a.text}; margin-top: 12px; cursor: pointer;`;
const Hint = styled.p`margin: 6px 0 0; font-size: 0.8rem; color: ${(p) => (p.$err ? a.red : a.muted)};`;
const Offscreen = styled.div`position: fixed; left: -${PAGE_W + 200}px; top: 0; width: ${PAGE_W}px; pointer-events: none; z-index: -1;`;

/** Scale the full-size sheet down to the width of its container. */
function ScaledSheet(props) {
  const box = useRef(null); const sheet = useRef(null);
  const [size, setSize] = useState({ scale: 0.5, height: 600 });
  useEffect(() => {
    const measure = () => {
      if (!box.current || !sheet.current) return;
      const scale = Math.min(1, box.current.clientWidth / PAGE_W);
      setSize({ scale, height: sheet.current.offsetHeight * scale });
    };
    const ro = new ResizeObserver(measure);
    ro.observe(box.current); ro.observe(sheet.current);
    measure();
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={box} style={{ height: size.height, overflow: 'hidden' }}>
      <div className="scaled" style={{ transform: `scale(${size.scale})`, width: PAGE_W }}>
        <QuotationSheet ref={sheet} gap={14} {...props} />
      </div>
    </div>
  );
}

export default function QuotationEditor({ quote, onClose, onSaved }) {
  const saved = useLoad('quote-templates');
  const templates = useMemo(() => [
    ...BUILT_IN_TEMPLATES,
    ...(saved.data?.items || []).map((t) => ({ id: t._id, name: t.name, quotation: t.quotation, custom: true })),
  ], [saved.data]);
  const [doc, setDoc] = useState(() => quote.quotation || fromTemplate(BUILT_IN_TEMPLATES[0], quote));
  const [tplId, setTplId] = useState('');
  const [tab, setTab] = useState('edit');
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [dirty, setDirty] = useState(!quote.quotation);
  const [job, setJob] = useState(null);
  const exportRef = useRef(null);
  const canShare = typeof navigator !== 'undefined' && Boolean(navigator.canShare);
  const t = totals(doc);
  const assets = { logo: img('logo.png'), seal: img('quotation-seal.png') };

  const change = (patchDoc) => { setDoc((d) => ({ ...d, ...patchDoc })); setDirty(true); setMsg(''); };
  const field = (k) => (e) => change({ [k]: e.target.value });
  const setSections = (fn) => { setDoc((d) => ({ ...d, sections: fn(d.sections) })); setDirty(true); setMsg(''); };
  const setSection = (si, p) => setSections((s) => setAt(s, si, p));
  const setItems = (si, fn) => setSections((s) => setAt(s, si, { items: fn(s[si].items) }));

  const applyTemplate = (id) => {
    const tpl = templates.find((x) => x.id === id);
    if (!tpl) return;
    if (!window.confirm(`Replace the items, note and terms with the “${tpl.name}” template? Customer details are kept.`)) return;
    const fresh = fromTemplate(tpl, quote);
    setDoc((d) => ({ ...fresh, proposedTo: d.proposedTo, location: d.location, date: d.date, refNo: d.refNo, customerId: d.customerId, title: fresh.title || d.title }));
    setTplId(id); setDirty(true);
  };
  const saveTemplate = async () => {
    const name = window.prompt('Name for this template', doc.title || '');
    if (!name?.trim()) return;
    setErr('');
    try { const r = await post('quote-templates', { name, quotation: toTemplate(doc) }); await saved.reload(); setTplId(r.item._id); setMsg(`Template “${name.trim()}” saved.`); } catch (e) { setErr(e.message); }
  };
  const deleteTemplate = async () => {
    const tpl = templates.find((x) => x.id === tplId);
    if (!tpl?.custom || !window.confirm(`Delete the “${tpl.name}” template?`)) return;
    try { await del(`quote-templates/${tpl.id}`); setTplId(''); saved.reload(); } catch (e) { setErr(e.message); }
  };

  const save = async () => {
    setErr(''); setMsg('');
    try { await patch(`quotes/${quote._id}`, { quotation: doc }); setDirty(false); setMsg('Quotation saved.'); onSaved?.({ ...quote, quotation: doc, quotedAmount: t.grandTotal }); } catch (e) { setErr(e.message); }
  };

  // export: render the sheet at full size off-screen, capture it, then download or share
  useEffect(() => {
    if (!job) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const file = await quotationPdf(exportRef.current, doc);
        if (cancelled) return;
        if (job === 'share' && await sharePdf(file, `Quotation from Noor Electric Renewables — ${doc.title}`)) setMsg('Shared.');
        else { saveBlob(file, file.name); setMsg('PDF downloaded.'); }
      } catch (e) { setErr(`Export failed: ${e.message || e}`); } finally { if (!cancelled) setJob(null); }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job]);

  const close = () => { if (!dirty || window.confirm('Close without saving your changes?')) onClose(); };
  const busy = Boolean(job);
  const selected = templates.find((x) => x.id === tplId);

  return (
    <Modal
      title={`Quotation document — ${quote.name || 'customer'}`}
      onClose={close}
      width={1280}
      footer={(
        <>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Btn type="button" $v="ghost" disabled={busy} onClick={() => setJob('pdf')}><FontAwesomeIcon icon={faFilePdf} /> {busy ? 'Preparing…' : 'Download PDF'}</Btn>
            {canShare && <Btn type="button" $v="ghost" disabled={busy} onClick={() => setJob('share')}><FontAwesomeIcon icon={faShareNodes} /> Share</Btn>}
          </div>
          <Btn type="button" onClick={save}><FontAwesomeIcon icon={faFloppyDisk} /> Save quotation</Btn>
        </>
      )}
    >
      {err && <ErrorBox>{err}</ErrorBox>}
      <Tabs>
        <button type="button" className={tab === 'edit' ? 'on' : ''} onClick={() => setTab('edit')}>Edit</button>
        <button type="button" className={tab === 'preview' ? 'on' : ''} onClick={() => setTab('preview')}>Preview</button>
      </Tabs>
      <Layout>
        <Pane $show={tab === 'edit'}>
          <Bar>
            <label htmlFor="q-tpl"><FontAwesomeIcon icon={faLayerGroup} /> Template</label>
            <select id="q-tpl" value={tplId} onChange={(e) => applyTemplate(e.target.value)}>
              <option value="">Start from a template…</option>
              <optgroup label="Built-in">{templates.filter((x) => !x.custom).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</optgroup>
              {templates.some((x) => x.custom) && <optgroup label="Saved by the team">{templates.filter((x) => x.custom).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</optgroup>}
            </select>
            {selected?.custom && <Btn type="button" $v="danger" $sm onClick={deleteTemplate} title="Delete this template"><FontAwesomeIcon icon={faTrash} /></Btn>}
            <Btn type="button" $v="ghost" $sm onClick={saveTemplate}>Save as template</Btn>
          </Bar>

          <FormGrid>
            <Field $full>System title<input value={doc.title} onChange={field('title')} placeholder="e.g. 10KW Premium Hybrid Solar System" /></Field>
            <Field>Proposed to<input value={doc.proposedTo} onChange={field('proposedTo')} placeholder="Mr Farhad Khan" /></Field>
            <Field>Location<input value={doc.location} onChange={field('location')} placeholder="Swat" /></Field>
          </FormGrid>
          <FormGrid $cols={3} style={{ marginTop: 12 }}>
            <Field>Date<input type="date" value={doc.date} onChange={field('date')} /></Field>
            <Field>Ref no<input value={doc.refNo} onChange={field('refNo')} /></Field>
            <Field>Customer ID<input value={doc.customerId} onChange={field('customerId')} placeholder="optional" /></Field>
          </FormGrid>

          {doc.sections.map((sec, si) => (
            <Group key={si}>
              <header>
                <span className="no">{si + 1}</span>
                <input className="title" value={sec.title} onChange={(e) => setSection(si, { title: e.target.value })} placeholder="Section, e.g. Solar Panels" aria-label={`Section ${si + 1} title`} />
                <select value={sec.unit} onChange={(e) => setSection(si, { unit: e.target.value })} aria-label="Unit">
                  {[...new Set([...UNITS, sec.unit].filter(Boolean))].map((u) => <option key={u}>{u}</option>)}
                </select>
                <Icon type="button" disabled={si === 0} onClick={() => setSections((s) => move(s, si, -1))} aria-label="Move section up"><FontAwesomeIcon icon={faArrowUp} /></Icon>
                <Icon type="button" disabled={si === doc.sections.length - 1} onClick={() => setSections((s) => move(s, si, 1))} aria-label="Move section down"><FontAwesomeIcon icon={faArrowDown} /></Icon>
                <Icon type="button" $danger onClick={() => { if (window.confirm(`Remove the “${sec.title || 'untitled'}” section?`)) setSections((s) => removeAt(s, si)); }} aria-label="Remove section"><FontAwesomeIcon icon={faTrash} /></Icon>
              </header>
              <div className="rows">
                <div className="labels"><span>Description</span><span>Warranty</span><span>Unit price</span><span>Qty</span><span style={{ textAlign: 'right' }}>Amount</span><span /></div>
                {sec.items.map((it, ii) => {
                  const setItem = (k) => (e) => setItems(si, (items) => setAt(items, ii, { [k]: e.target.value }));
                  return (
                    <div className="row" key={ii}>
                      <textarea rows={1} value={it.description} onChange={setItem('description')} placeholder="Description" aria-label="Description" />
                      <textarea rows={1} value={it.warranty} onChange={setItem('warranty')} placeholder="Warranty" aria-label="Warranty" />
                      <input type="number" min="0" step="any" value={it.unitPrice ?? ''} onChange={setItem('unitPrice')} placeholder="Price" aria-label="Unit price" />
                      <input type="number" min="0" step="any" value={it.qty ?? ''} onChange={setItem('qty')} placeholder="Qty" aria-label="Quantity" />
                      <div className="amt">{fmtMoney(lineAmount(it)) || '—'}</div>
                      <Icon type="button" $danger onClick={() => setItems(si, (items) => removeAt(items, ii))} aria-label="Remove item"><FontAwesomeIcon icon={faTrash} /></Icon>
                    </div>
                  );
                })}
                <div><Btn type="button" $v="ghost" $sm onClick={() => setItems(si, (items) => [...items, emptyItem()])}><FontAwesomeIcon icon={faPlus} /> Add item</Btn></div>
              </div>
            </Group>
          ))}
          <div style={{ marginTop: 12 }}><Btn type="button" $v="ghost" onClick={() => setSections((s) => [...s, emptySection()])}><FontAwesomeIcon icon={faPlus} /> Add section</Btn></div>

          <Sum>
            <div><span>Subtotal</span><b>{fmtMoney(t.subtotal)}</b></div>
            <div><label htmlFor="q-disc">Discount (PKR)</label><input id="q-disc" type="number" min="0" value={doc.discount ?? ''} onChange={field('discount')} placeholder="0" /></div>
            <div className="grand"><span>Grand total</span><span>{fmtMoney(t.grandTotal)}</span></div>
          </Sum>

          <FormGrid $cols={1} style={{ marginTop: 12 }}>
            <Field>Note under the table<textarea style={{ minHeight: 56 }} value={doc.note} onChange={field('note')} /></Field>
            <Field>Terms &amp; conditions (one per line)
              <textarea style={{ minHeight: 170 }} value={doc.terms.join('\n')} onChange={(e) => change({ terms: e.target.value.split('\n') })} />
            </Field>
          </FormGrid>
          <Check><input type="checkbox" checked={doc.showSeal !== false} onChange={(e) => change({ showSeal: e.target.checked })} /> Show the company seal above “Signature and seal”</Check>
          {msg && <Hint>{msg}</Hint>}
          {dirty && !msg && <Hint>Unsaved changes — saving also updates the quoted amount on the enquiry.</Hint>}
        </Pane>

        <PreviewPane $show={tab === 'preview'}>
          <div className="frame"><ScaledSheet doc={doc} {...assets} /></div>
        </PreviewPane>
      </Layout>
      {job && createPortal(<Offscreen aria-hidden="true"><QuotationSheet ref={exportRef} doc={doc} {...assets} /></Offscreen>, document.body)}
    </Modal>
  );
}
