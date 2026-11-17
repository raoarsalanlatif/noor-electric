// The quotation document: its shape, the maths and the formatting.
// Pure functions only (no React), so the editor, the printable sheet and the tests all share them.
//
// A quotation looks like this:
// {
//   title, proposedTo, location, date ('YYYY-MM-DD'), refNo, customerId,
//   sections: [{ title, unit, items: [{ description, warranty, unitPrice, qty }] }],
//   discount, note, terms: [string], showSeal,
// }
import { company } from '../../../content/company';

/** Letterhead, colours and footer text. Pass a different object to <QuotationSheet brand={...}> to restyle it. */
export const QUOTE_BRAND = {
  name: company.name,
  tagline: 'Sunny Skies, Happy Wallets',
  phone: 'Cell +92 342 1946568',
  website: company.website,
  docLabel: 'Quotation',
  currency: 'PKR',
  payableTo: `Make all checks payable to ${company.name}`,
  thanks: 'Thank you for your business!',
  offices: [
    { label: 'Peshawar Office', address: 'Office no#3 first floor, Cantt Mall, Sadder Rd, Peshawar Cantonment, Peshawar, 25000' },
    { label: 'Islamabad Office', address: 'Bani Gala Road, Islamabad, 44000' },
  ],
  signatureLabel: 'Signature and seal',
  colors: { ink: '#2D4E52', accent: '#F06E3D', band: '#65A0D0', label: '#5597CD', highlight: '#FFC000', text: '#262626', muted: '#6b7785', line: '#dfe5ea', soft: '#f4f8fb' },
};

export const UNITS = ['Nos.', 'Meters', 'Job', 'Set', 'Lot', 'kW'];
export const COLUMNS = ['Sr. No', 'Description', 'Warranty', 'Unit/Price', 'Quantity', 'Amount(PKR)'];

const n = (v) => { const x = Number(v); return Number.isFinite(x) ? x : 0; };

/** Amount of one line. Blank (null) until a unit price is entered, like the spreadsheet. */
export const lineAmount = (item) => (n(item?.unitPrice) > 0 ? n(item.unitPrice) * n(item.qty) : null);

export function totals(doc) {
  const subtotal = (doc?.sections || []).reduce((s, sec) => s + (sec.items || []).reduce((t, it) => t + (lineAmount(it) || 0), 0), 0);
  const discount = Math.max(0, n(doc?.discount));
  return { subtotal, discount, grandTotal: subtotal - discount };
}

export const fmtNum = (v) => (v === '' || v == null ? '' : n(v).toLocaleString('en-US', { maximumFractionDigits: 2 }));
export const fmtMoney = (v, currency = QUOTE_BRAND.currency) => (v == null ? '' : `${currency} ${Math.round(n(v)).toLocaleString('en-US')}`);

const pad = (x) => String(x).padStart(2, '0');
export const todayISO = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
/** '2026-11-17' -> 'November 17, 2026' */
export function fmtLongDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
  if (!m) return '';
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}
export const newRefNo = (d = new Date()) => `${String(d.getFullYear()).slice(2)}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;

export const emptyItem = () => ({ description: '', warranty: '', unitPrice: '', qty: 1 });
export const emptySection = () => ({ title: '', unit: 'Nos.', items: [emptyItem()] });

const copy = (x) => JSON.parse(JSON.stringify(x));

/** Start a quotation for an enquiry from a template (customer details come from the enquiry). */
export function fromTemplate(template, quote = {}, now = new Date()) {
  const t = copy(template?.quotation || template || {});
  return {
    title: t.title || quote.systemType || '',
    proposedTo: quote.name || '',
    location: [quote.area, quote.city].filter(Boolean).join(', '),
    date: todayISO(now),
    refNo: newRefNo(now),
    customerId: '',
    sections: Array.isArray(t.sections) && t.sections.length ? t.sections : [emptySection()],
    discount: t.discount ?? '',
    note: t.note ?? '',
    terms: Array.isArray(t.terms) ? t.terms : [],
    showSeal: t.showSeal !== false,
  };
}

/** The reusable part of a quotation (everything except who it is for). */
export function toTemplate(doc) {
  const { title, sections, discount, note, terms, showSeal } = copy(doc);
  return { title, sections, discount, note, terms, showSeal };
}

/** Immutable helpers the editor uses to change sections and items. */
export const move = (list, i, dir) => {
  const j = i + dir;
  if (j < 0 || j >= list.length) return list;
  const out = [...list]; [out[i], out[j]] = [out[j], out[i]]; return out;
};
export const setAt = (list, i, patch) => list.map((x, k) => (k === i ? { ...x, ...patch } : x));
export const removeAt = (list, i) => list.filter((_, k) => k !== i);
