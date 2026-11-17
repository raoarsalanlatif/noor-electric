/* eslint-disable react/prop-types */
// A "Download PDF" button for a saved quotation. Drop it anywhere a quotation document is at hand:
// it draws the sheet off-screen, turns it into a PDF and downloads it (or opens the share sheet).
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilePdf, faShareNodes } from '@fortawesome/free-solid-svg-icons';
import { img } from '../../../content/company';
import { Btn } from '../ui';
import QuotationSheet from './QuotationSheet';
import { PAGE_W } from './paginate';
import { quotationPdf, sharePdf, saveBlob } from './exportQuotation';

const Offscreen = styled.div`position: fixed; left: -${PAGE_W + 200}px; top: 0; width: ${PAGE_W}px; pointer-events: none; z-index: -1;`;

/**
 * `doc` is the quotation. `share` opens the phone's share sheet instead of downloading
 * (it falls back to a download where sharing is not supported). `label` replaces the default text;
 * pass `label=""` for an icon-only button. `onDone(message)` / `onError(message)` report the result.
 */
export default function QuotationPdfButton({ doc, share = false, label, onDone, onError, ...btn }) {
  const [busy, setBusy] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!busy) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const file = await quotationPdf(ref.current, doc);
        if (cancelled) return;
        if (share && await sharePdf(file, `Quotation from Noor Electric Renewables — ${doc.title || ''}`)) onDone?.('Shared.');
        else { saveBlob(file, file.name); onDone?.('PDF downloaded.'); }
      } catch (e) { onError?.(`Export failed: ${e.message || e}`); } finally { if (!cancelled) setBusy(false); }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busy]);

  const text = label ?? (share ? 'Share' : 'Download PDF');
  return (
    <>
      <Btn type="button" $v="ghost" {...btn} disabled={busy || btn.disabled} aria-label={text || 'Download PDF'} title={text ? undefined : 'Download PDF'} onClick={(e) => { e.stopPropagation(); setBusy(true); }}>
        <FontAwesomeIcon icon={share ? faShareNodes : faFilePdf} />{busy ? (text && ' Preparing…') : (text && ` ${text}`)}
      </Btn>
      {busy && createPortal(<Offscreen aria-hidden="true"><QuotationSheet ref={ref} doc={doc} logo={img('logo.png')} seal={img('quotation-seal.png')} /></Offscreen>, document.body)}
    </>
  );
}
