/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilePdf, faImage, faCube, faShareNodes, faFileArrowDown } from '@fortawesome/free-solid-svg-icons';
import { Card, CardTitle, TextInput, Label, t } from './ui';
import DesignReport, { PAGE_W } from './report/DesignReport';
import { ensureUrduFont, capturePages, makePdfBlob, makeImageBlob, saveBlob, saveDataUrl, shareFiles } from './report/exportDesign';
import { img } from '../../content/company';

const Grid = styled.div`
  display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin-bottom: 12px;
  @media (max-width: 640px) { grid-template-columns: 1fr; }
`;

const Actions = styled.div`
  display: flex; flex-wrap: wrap; gap: 8px;
  button { display: inline-flex; align-items: center; gap: 8px; border-radius: 11px; padding: 10px 14px; font-weight: 700; font-size: 0.88rem; cursor: pointer;
    border: 1px solid ${t.line}; background: ${t.cardHi}; color: ${t.text}; }
  button:hover:not(:disabled) { border-color: ${t.orange}; }
  button.primary { background: ${t.orange}; color: #111; border-color: ${t.orange}; }
  button:disabled { opacity: 0.6; cursor: progress; }
`;

const Ur = styled.span`font-family: 'Noto Nastaliq Urdu', 'Noto Naskh Arabic', serif; direction: rtl; font-weight: 400; margin-left: 8px; font-size: 0.85em;`;
const Msg = styled.p`margin: 10px 0 0; font-size: 0.82rem; color: ${(p) => (p.$err ? '#fca5a5' : t.muted)};`;

// The report is laid out off-screen at A4 size and captured from there.
const Offscreen = styled.div`position: fixed; left: -${PAGE_W + 200}px; top: 0; width: ${PAGE_W}px; pointer-events: none; z-index: -1;`;

const pad = (n) => String(n).padStart(2, '0');

export default function ExportCard({ plan, roof, load, takeShot, disabled }) {
  const [customer, setCustomer] = useState({ name: '', area: '' });
  const [job, setJob] = useState(null); // { kind, shot, designNo, date }
  const [msg, setMsg] = useState({ text: '', err: false });
  const reportRef = useRef(null);
  const canShare = typeof navigator !== 'undefined' && Boolean(navigator.canShare);
  useEffect(() => { ensureUrduFont(); }, []);

  const start = async (kind) => {
    setMsg({ text: 'Preparing your design… / ڈیزائن تیار ہو رہا ہے', err: false });
    const now = new Date();
    const designNo = `NE-${String(now.getFullYear()).slice(2)}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
    let shot = null;
    try { shot = await takeShot(); } catch { shot = null; }
    if (kind === '3d') {
      if (shot) { saveDataUrl(shot, `Noor-Electric-3D-${designNo}.jpg`); setMsg({ text: '3D picture downloaded.', err: false }); } else setMsg({ text: 'Could not capture the 3D view — please try again.', err: true });
      return;
    }
    await ensureUrduFont();
    setJob({ kind, shot, designNo, date: now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) });
  };

  useEffect(() => {
    if (!job) return undefined;
    let cancelled = false;
    (async () => {
      try {
        // let the report render and its images load
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        const canvases = await capturePages(reportRef.current);
        if (cancelled) return;
        const base = `Noor-Electric-Solar-Design-${job.designNo}`;
        if (job.kind === 'pdf') {
          saveBlob(await makePdfBlob(canvases), `${base}.pdf`);
          setMsg({ text: 'PDF downloaded. / پی ڈی ایف ڈاؤن لوڈ ہو گئی', err: false });
        } else if (job.kind === 'image') {
          saveBlob(await makeImageBlob(canvases), `${base}.png`);
          setMsg({ text: 'Image downloaded. / تصویر ڈاؤن لوڈ ہو گئی', err: false });
        } else if (job.kind === 'share') {
          const pdf = new File([await makePdfBlob(canvases)], `${base}.pdf`, { type: 'application/pdf' });
          const shared = await shareFiles([pdf], 'My solar system design from Noor Electric');
          if (!shared) saveBlob(pdf, `${base}.pdf`);
          setMsg({ text: shared ? 'Shared.' : 'Sharing is not supported here — the PDF was downloaded instead.', err: false });
        }
      } catch (e) {
        setMsg({ text: `Export failed: ${e.message || e}`, err: true });
      } finally {
        if (!cancelled) setJob(null);
      }
    })();
    return () => { cancelled = true; };
  }, [job]);

  const busy = Boolean(job);
  return (
    <Card>
      <CardTitle><FontAwesomeIcon icon={faFileArrowDown} /> &nbsp;Download your design <Ur>اپنا ڈیزائن ڈاؤن لوڈ کریں</Ur></CardTitle>
      <p style={{ margin: '0 0 12px', color: t.muted, fontSize: '0.88rem' }}>
        A 3-page report in English and Urdu with the 3D view, roof plan with dimensions, panels required, structure, your load and costs.
      </p>
      <Grid>
        <div><Label htmlFor="ex-name">Your name (optional)</Label><TextInput id="ex-name" value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} placeholder="e.g. Ahmed Khan" /></div>
        <div><Label htmlFor="ex-area">Area (optional)</Label><TextInput id="ex-area" value={customer.area} onChange={(e) => setCustomer({ ...customer, area: e.target.value })} placeholder="e.g. Hayatabad Phase 5" /></div>
      </Grid>
      <Actions>
        <button type="button" className="primary" disabled={busy || disabled} onClick={() => start('pdf')}><FontAwesomeIcon icon={faFilePdf} /> PDF</button>
        <button type="button" disabled={busy || disabled} onClick={() => start('image')}><FontAwesomeIcon icon={faImage} /> Image (PNG)</button>
        <button type="button" disabled={busy || disabled} onClick={() => start('3d')}><FontAwesomeIcon icon={faCube} /> 3D picture</button>
        {canShare && <button type="button" disabled={busy || disabled} onClick={() => start('share')}><FontAwesomeIcon icon={faShareNodes} /> Share</button>}
      </Actions>
      {disabled && <Msg>Finish editing the roof (press Done) to download.</Msg>}
      {msg.text && <Msg $err={msg.err}>{msg.text}</Msg>}
      {job && createPortal(
        <Offscreen aria-hidden="true">
          <DesignReport ref={reportRef} plan={plan} roof={roof} load={load} customer={customer} shot={job.shot} designNo={job.designNo} date={job.date} logo={img('logo.png')} />
        </Offscreen>,
        document.body,
      )}
    </Card>
  );
}
