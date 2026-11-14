// Turn the off-screen report into a PDF or images. Libraries are loaded only when needed.

let fontPromise = null;

/** Load the Urdu Nastaliq font (bundled with the site, loaded once on first export). */
export function ensureUrduFont() {
  if (fontPromise) return fontPromise;
  fontPromise = Promise.all([
    import('@fontsource/noto-nastaliq-urdu/arabic-400.css'),
    import('@fontsource/noto-nastaliq-urdu/arabic-700.css'),
  ])
    .then(() => Promise.all([
      document.fonts.load('400 16px "Noto Nastaliq Urdu"', 'اردو سولر'),
      document.fonts.load('700 16px "Noto Nastaliq Urdu"', 'اردو سولر'),
    ]))
    .catch(() => { /* fall back to a system Urdu font */ });
  return fontPromise;
}

const waitImages = (root) => Promise.all([...root.querySelectorAll('img')].map((img) => (img.complete ? null : new Promise((r) => { img.onload = r; img.onerror = r; }))));

/** Render each `.report-page` to a canvas. */
export async function capturePages(root, scale = 2) {
  const { default: html2canvas } = await import('html2canvas');
  await document.fonts.ready;
  await waitImages(root);
  const pages = [...root.querySelectorAll('.report-page')];
  const out = [];
  for (const el of pages) {
    // eslint-disable-next-line no-await-in-loop
    out.push(await html2canvas(el, { scale, backgroundColor: '#ffffff', useCORS: true, logging: false }));
  }
  return out;
}

function download(href, filename) {
  const a = document.createElement('a');
  a.href = href; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
}

export async function makePdfBlob(canvases) {
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  canvases.forEach((c, i) => {
    if (i > 0) pdf.addPage();
    pdf.addImage(c.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
  });
  pdf.setProperties({ title: 'Noor Electric — Solar System Design', author: 'Noor Electric Renewables', creator: 'noorelectric.org Solar Planner' });
  return pdf.output('blob');
}

/** All pages stacked into one tall image. */
export function makeImageBlob(canvases, type = 'image/png') {
  const w = Math.max(...canvases.map((c) => c.width));
  const gap = 24;
  const h = canvases.reduce((s, c) => s + c.height, 0) + gap * (canvases.length - 1);
  const out = document.createElement('canvas');
  out.width = w; out.height = h;
  const g = out.getContext('2d');
  g.fillStyle = '#e5e7eb'; g.fillRect(0, 0, w, h);
  let y = 0;
  canvases.forEach((c) => { g.drawImage(c, 0, y); y += c.height + gap; });
  return new Promise((resolve) => out.toBlob(resolve, type, 0.92));
}

export function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  download(url, filename);
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

export const saveDataUrl = download;

/** Share files with the phone's share sheet (WhatsApp etc.) when the browser supports it. */
export async function shareFiles(files, text) {
  if (!navigator.canShare || !navigator.canShare({ files })) return false;
  try { await navigator.share({ files, title: 'Solar System Design — Noor Electric', text }); return true; } catch (e) { return e?.name === 'AbortError'; }
}
