// Turn the rendered quotation pages into a PDF. Reuses the Solar Planner's page capture.
import { capturePages, saveBlob } from '../../planner/report/exportDesign';

export { saveBlob };

/** True when the browser can hand files to the share sheet (mostly phones). */
export const canShareFiles = () => typeof navigator !== 'undefined' && Boolean(navigator.canShare);

export const quotationFileName = (doc) => {
  const safe = (s) => String(s || '').trim().replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '');
  return `${['Noor-Electric-Quotation', safe(doc.refNo), safe(doc.proposedTo)].filter(Boolean).join('-')}.pdf`;
};

/** `root` is the element that holds the `.report-page` pages. */
export async function quotationPdf(root, doc) {
  await document.fonts.ready;
  // give the sheet a moment to settle its page breaks
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  const canvases = await capturePages(root);
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  canvases.forEach((c, i) => {
    if (i > 0) pdf.addPage();
    pdf.addImage(c.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
  });
  pdf.setProperties({ title: `Quotation ${doc.refNo || ''} — ${doc.title || 'Solar system'}`.trim(), author: 'Noor Electric Renewables' });
  return new File([pdf.output('blob')], quotationFileName(doc), { type: 'application/pdf' });
}

/** Open the phone's share sheet (WhatsApp etc.). Returns false when sharing files is not supported. */
export async function sharePdf(file, text) {
  if (!navigator.canShare || !navigator.canShare({ files: [file] })) return false;
  try { await navigator.share({ files: [file], title: file.name, text }); return true; } catch (e) { return e?.name === 'AbortError'; }
}
