/* eslint-disable react/prop-types */
// The printable quotation: A4 pages laid out like the company's quotation sheet.
// It only draws what it is given (`doc`, `brand`, `logo`, `seal`), so it can be reused for
// previews, PDF export or any other place a quotation needs to be shown.
// Long quotations flow onto extra pages: every block is measured once, then packed page by page.
import { forwardRef, useLayoutEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { PAGE_W, PAGE_H, paginate } from './paginate';
import { QUOTE_BRAND, COLUMNS, lineAmount, totals, fmtNum, fmtMoney, fmtLongDate } from './model';

const PAD_X = 40;
const PAD_TOP = 34;
const FOOT_H = 40;

const Root = styled.div`
  --ink: ${(p) => p.$c.ink}; --accent: ${(p) => p.$c.accent}; --band: ${(p) => p.$c.band}; --label: ${(p) => p.$c.label};
  --hl: ${(p) => p.$c.highlight}; --text: ${(p) => p.$c.text}; --muted: ${(p) => p.$c.muted}; --line: ${(p) => p.$c.line}; --soft: ${(p) => p.$c.soft};
  width: ${PAGE_W}px; position: relative; display: flex; flex-direction: column; gap: ${(p) => p.$gap}px;
  color: var(--text); font-family: Inter, Arial, sans-serif; font-size: 11px; line-height: 1.4; text-align: left;
  * { box-sizing: border-box; }
`;

const Page = styled.div`
  width: ${PAGE_W}px; height: ${PAGE_H}px; background: #fff; position: relative; overflow: hidden;
  padding: ${PAD_TOP}px ${PAD_X}px 0;
  &::before { content: ''; position: absolute; inset: 0 0 auto 0; height: 7px; background: linear-gradient(90deg, #ffd21f, var(--accent) 55%, var(--band)); }
`;

const Measure = styled.div`
  position: absolute; left: 0; top: 0; width: ${PAGE_W}px; height: 0; overflow: hidden; visibility: hidden; pointer-events: none;
  > div { padding: 0 ${PAD_X}px; }
`;

const Letterhead = styled.div`
  padding-bottom: 14px;
  .top { display: flex; align-items: center; gap: 14px; }
  .top img { width: 74px; height: 74px; object-fit: contain; flex-shrink: 0; }
  .co { flex: 1; min-width: 0; }
  .co b { display: block; font-family: Poppins, Inter, sans-serif; font-size: 23px; line-height: 1.15; color: var(--ink); letter-spacing: 0.1px; }
  .co i { display: block; font-style: normal; font-weight: 700; font-size: 13px; color: var(--accent); margin-top: 2px; }
  .co span { display: block; font-weight: 600; font-size: 11px; color: var(--ink); margin-top: 3px; }
  .doc { font-family: Poppins, Inter, sans-serif; font-weight: 700; font-size: 30px; color: var(--label); letter-spacing: 0.3px; }
  h1 { margin: 16px 0 12px; text-align: center; font-family: Poppins, Inter, sans-serif; font-size: 16px; font-weight: 700; color: var(--text);
    background: var(--soft); border: 1px solid var(--line); border-radius: 8px; padding: 8px 12px; }
  .meta { display: flex; justify-content: space-between; gap: 24px; color: var(--ink); font-size: 12.5px; }
  .meta table { border-collapse: collapse; }
  .meta td { padding: 2px 0; vertical-align: top; }
  .meta td:first-child { font-weight: 700; padding-right: 10px; white-space: nowrap; }
  .meta .l td:last-child { font-weight: 700; }
  .meta .r td:first-child { text-align: right; }
`;

const MiniHead = styled.div`
  display: flex; justify-content: space-between; align-items: baseline; padding-bottom: 8px; margin-bottom: 10px; border-bottom: 1px solid var(--line);
  b { font-family: Poppins, Inter, sans-serif; font-size: 13px; color: var(--ink); }
  span { color: var(--muted); font-size: 10.5px; }
`;

const Items = styled.table`
  width: 100%; border-collapse: collapse; table-layout: fixed;
  th { color: var(--accent); font-weight: 700; font-size: 11.5px; padding: 7px 6px; text-align: center; border-top: 2px solid var(--ink); border-bottom: 2px solid var(--ink); white-space: nowrap; }
  th:last-child, td.amt { text-align: right; }
  td { padding: 6px 6px; text-align: center; vertical-align: middle; border-bottom: 1px solid var(--line); overflow-wrap: anywhere; }
  td.desc { text-align: left; padding-left: 10px; }
  td.war { color: var(--muted); font-size: 10.5px; }
  td.amt { font-weight: 700; white-space: nowrap; padding-right: 8px; }
  tr.sec td { background: var(--band); color: #fff; font-weight: 700; font-size: 12px; padding: 5px 6px; border-bottom: 0; }
  tr.sec td.desc { letter-spacing: 0.2px; }
`;

const Totals = styled.div`
  display: flex; gap: 18px; align-items: flex-start; padding-top: 12px;
  .note { flex: 1; font-weight: 700; font-size: 10.5px; color: var(--text); border-left: 3px solid var(--accent); background: var(--soft); padding: 8px 10px; border-radius: 0 6px 6px 0; white-space: pre-wrap; }
  .spacer { flex: 1; }
  .sum { width: 290px; flex-shrink: 0; border: 1px solid var(--line); border-radius: 8px; overflow: hidden; }
  .sum div { display: flex; justify-content: space-between; gap: 10px; padding: 7px 12px; font-size: 12px; color: var(--ink); }
  .sum div + div { border-top: 1px solid var(--line); }
  .sum .disc { background: var(--hl); font-weight: 700; }
  .sum .grand { background: var(--ink); color: #fff; font-weight: 700; font-size: 13.5px; }
`;

const Closing = styled.div`
  display: flex; gap: 18px; align-items: flex-end; padding-top: 16px; color: var(--ink);
  .txt { flex: 1; font-size: 11.5px; }
  .txt p { margin: 0 0 3px; }
  .txt .thanks { font-weight: 700; color: var(--accent); margin-bottom: 8px; }
  .txt .office { color: var(--text); font-size: 10.5px; }
  .sig { width: 200px; flex-shrink: 0; text-align: center; }
  .sig .stamp { height: 120px; display: flex; align-items: flex-end; justify-content: center; }
  .sig img { max-width: 132px; max-height: 120px; object-fit: contain; }
  .sig span { display: block; border-top: 1.5px solid var(--ink); margin-top: 4px; padding-top: 4px; font-weight: 700; font-size: 10.5px; }
`;

const Terms = styled.div`
  padding-top: 14px; font-size: 10px; color: var(--text);
  b { display: block; font-size: 11.5px; color: var(--ink); margin-bottom: 4px; }
`;
const Term = styled.div`
  display: flex; gap: 6px; padding: 1.5px 0; font-size: 10px; color: var(--text);
  &::before { content: '•'; color: var(--accent); font-weight: 700; }
`;

const Foot = styled.div`
  position: absolute; left: ${PAD_X}px; right: ${PAD_X}px; bottom: 0; height: ${FOOT_H}px; border-top: 1px solid var(--line);
  display: flex; align-items: center; justify-content: space-between; color: var(--muted); font-size: 9.5px;
  b { color: var(--ink); }
`;

const Cols = () => (
  <colgroup><col style={{ width: 48 }} /><col /><col style={{ width: 150 }} /><col style={{ width: 78 }} /><col style={{ width: 66 }} /><col style={{ width: 112 }} /></colgroup>
);
const Thead = ({ innerRef }) => (
  <thead ref={innerRef}><tr>{COLUMNS.map((c) => <th key={c}>{c}</th>)}</tr></thead>
);

/** Flatten the quotation into the blocks that get placed on pages. */
function buildBlocks(doc) {
  const out = [{ k: 'head', type: 'head' }];
  (doc.sections || []).forEach((sec, si) => {
    out.push({ k: `s${si}`, type: 'row', keepWithNext: true, sec, no: si + 1 });
    (sec.items || []).forEach((item, ii) => out.push({ k: `s${si}i${ii}`, type: 'row', item }));
  });
  out.push({ k: 'totals', type: 'totals' });
  out.push({ k: 'closing', type: 'closing' });
  const terms = (doc.terms || []).filter((t) => String(t).trim());
  if (terms.length) {
    out.push({ k: 'termsTitle', type: 'termsTitle', keepWithNext: true });
    terms.forEach((t, i) => out.push({ k: `t${i}`, type: 'term', text: t }));
  }
  return out;
}

/** Group consecutive table rows so each run is drawn inside one <table>. */
const runs = (blocks) => blocks.reduce((acc, b) => {
  const last = acc[acc.length - 1];
  if (b.type === 'row' && last?.rows) last.rows.push(b); else acc.push(b.type === 'row' ? { k: `tbl-${b.k}`, rows: [b] } : b);
  return acc;
}, []);

const QuotationSheet = forwardRef(function QuotationSheet({ doc, brand = QUOTE_BRAND, logo, seal, gap = 0 }, ref) {
  const measureRef = useRef(null);
  const theadRef = useRef(null);
  const miniRef = useRef(null);
  const blocks = useMemo(() => buildBlocks(doc), [doc]);
  const [layout, setLayout] = useState(null);
  const [fontTick, setFontTick] = useState(0);
  const t = totals(doc);
  const money = (v) => fmtMoney(v, brand.currency);

  const row = (b) => (b.sec ? (
    <tr className="sec" key={b.k} data-k={b.k}>
      <td>{b.no}</td><td className="desc" colSpan={2}>{b.sec.title}</td><td>{b.sec.unit}</td><td /><td />
    </tr>
  ) : (
    <tr key={b.k} data-k={b.k}>
      <td /><td className="desc">{b.item.description}</td><td className="war">{b.item.warranty}</td>
      <td>{fmtNum(b.item.unitPrice)}</td><td>{fmtNum(b.item.qty)}</td><td className="amt">{money(lineAmount(b.item))}</td>
    </tr>
  ));

  const block = (b) => {
    if (b.type === 'head') {
      return (
        <Letterhead key={b.k} data-k={b.k}>
          <div className="top">
            {logo && <img src={logo} alt="" crossOrigin="anonymous" />}
            <div className="co"><b>{brand.name}</b><i>{brand.tagline}</i><span>{brand.phone}</span></div>
            <div className="doc">{brand.docLabel}</div>
          </div>
          {doc.title && <h1>{doc.title}</h1>}
          <div className="meta" style={doc.title ? undefined : { marginTop: 16 }}>
            <table className="l"><tbody>
              <tr><td>Proposed To:</td><td>{doc.proposedTo}</td></tr>
              <tr><td>Location:</td><td>{doc.location}</td></tr>
            </tbody></table>
            <table className="r"><tbody>
              <tr><td>Date:</td><td>{fmtLongDate(doc.date)}</td></tr>
              <tr><td>Ref No:</td><td>{doc.refNo}</td></tr>
              {doc.customerId && <tr><td>Customer Id:</td><td>{doc.customerId}</td></tr>}
            </tbody></table>
          </div>
        </Letterhead>
      );
    }
    if (b.type === 'totals') {
      return (
        <Totals key={b.k} data-k={b.k}>
          {doc.note ? <div className="note">{doc.note}</div> : <div className="spacer" />}
          <div className="sum">
            <div><span>Subtotal ({brand.currency})</span><span>{money(t.subtotal)}</span></div>
            {t.discount > 0 && <div className="disc"><span>Discount ({brand.currency})</span><span>{money(t.discount)}</span></div>}
            <div className="grand"><span>Grand Total ({brand.currency})</span><span>{money(t.grandTotal)}</span></div>
          </div>
        </Totals>
      );
    }
    if (b.type === 'closing') {
      return (
        <Closing key={b.k} data-k={b.k}>
          <div className="txt">
            <p>{brand.payableTo}</p>
            <p className="thanks">{brand.thanks}</p>
            {brand.offices.map((o) => <p key={o.label} className="office"><b>{o.label} :</b> {o.address}</p>)}
          </div>
          <div className="sig">
            <div className="stamp">{doc.showSeal !== false && seal && <img src={seal} alt="" crossOrigin="anonymous" />}</div>
            <span>{brand.signatureLabel}</span>
          </div>
        </Closing>
      );
    }
    if (b.type === 'termsTitle') return <Terms key={b.k} data-k={b.k}><b>Terms &amp; Conditions</b></Terms>;
    return <Term key={b.k} data-k={b.k}>{b.text}</Term>;
  };

  const mini = (innerRef) => (
    <MiniHead ref={innerRef}><b>{brand.name} — {brand.docLabel}</b><span>{[doc.title, doc.refNo && `Ref ${doc.refNo}`].filter(Boolean).join(' · ')}</span></MiniHead>
  );

  // measure every block at full size, then decide which page each one goes on
  useLayoutEffect(() => {
    const root = measureRef.current;
    if (!root) return;
    const heights = {};
    root.querySelectorAll('[data-k]').forEach((el) => { heights[el.dataset.k] = el.offsetHeight; });
    const miniH = miniRef.current ? miniRef.current.offsetHeight + 10 : 0;
    setLayout(paginate(blocks, heights, { pageH: PAGE_H - PAD_TOP - FOOT_H - 10, theadH: theadRef.current?.offsetHeight || 0, miniH }).map((p) => p.map((b) => b.k)));
  }, [blocks, brand, fontTick, logo, seal]);

  // text is measured again once the web fonts are in, and when the images arrive
  useLayoutEffect(() => {
    let live = true;
    const again = () => { if (live) setFontTick((x) => x + 1); };
    document.fonts?.ready?.then(again);
    const imgs = [...(measureRef.current?.querySelectorAll('img') || [])].filter((i) => !i.complete);
    imgs.forEach((i) => i.addEventListener('load', again, { once: true }));
    return () => { live = false; imgs.forEach((i) => i.removeEventListener('load', again)); };
  }, [logo, seal]);

  const byKey = useMemo(() => Object.fromEntries(blocks.map((b) => [b.k, b])), [blocks]);
  const pages = (layout || [blocks.map((b) => b.k)]).map((keys) => keys.map((k) => byKey[k]).filter(Boolean)).filter((p) => p.length);

  return (
    <Root ref={ref} $c={brand.colors} $gap={gap}>
      <Measure aria-hidden="true" ref={measureRef}>
        <div>
          {mini(miniRef)}
          {runs(blocks).map((r) => (r.rows
            ? <Items key={r.k}><Cols /><Thead innerRef={theadRef} /><tbody>{r.rows.map(row)}</tbody></Items>
            : block(r)))}
        </div>
      </Measure>
      {pages.map((page, pi) => (
        <Page className="report-page" key={pi}>
          {pi > 0 && mini()}
          {runs(page).map((r) => (r.rows
            ? <Items key={r.k}><Cols /><Thead /><tbody>{r.rows.map(row)}</tbody></Items>
            : block(r)))}
          <Foot>
            <span><b>{brand.name}</b> · {brand.phone}{brand.website ? ` · ${brand.website}` : ''}</span>
            <span>Page {pi + 1} of {pages.length}</span>
          </Foot>
        </Page>
      ))}
    </Root>
  );
});

export default QuotationSheet;
