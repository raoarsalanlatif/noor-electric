// Quotation documents (the itemised quote built in the admin panel) and the team's saved templates.
// A quotation is stored on its enquiry in the `quotes` collection; templates live in `quoteTemplates`.
import { getDb, oid } from './db.js';
import { requireUser } from './auth.js';
import { bad, readBody, str, num } from './http.js';

const ANY = ['owner', 'staff'];
const MAX_SECTIONS = 40;
const MAX_ITEMS = 60;
const MAX_TERMS = 40;
const list = (v, max) => (Array.isArray(v) ? v.slice(0, max) : []);

/** Keep only the known fields, with sane sizes, so nothing unexpected is stored. */
export function cleanQuotation(q) {
  const b = q && typeof q === 'object' ? q : {};
  return {
    title: str(b.title, 160),
    proposedTo: str(b.proposedTo, 120),
    location: str(b.location, 200),
    date: /^\d{4}-\d{2}-\d{2}$/.test(b.date || '') ? b.date : '',
    refNo: str(b.refNo, 40),
    customerId: str(b.customerId, 40),
    sections: list(b.sections, MAX_SECTIONS).map((s) => ({
      title: str(s?.title, 160),
      unit: str(s?.unit, 20),
      items: list(s?.items, MAX_ITEMS).map((it) => ({
        description: str(it?.description, 600),
        warranty: str(it?.warranty, 300),
        unitPrice: num(it?.unitPrice, { min: 0 }),
        qty: num(it?.qty, { min: 0 }),
      })),
    })),
    discount: num(b.discount, { min: 0 }),
    note: str(b.note, 600),
    terms: list(b.terms, MAX_TERMS).map((t) => str(t, 700)).filter(Boolean),
    showSeal: b.showSeal !== false,
  };
}

/** Same sums as the sheet: a line counts once it has a unit price. */
export function quotationTotals(q) {
  const subtotal = (q.sections || []).reduce((s, sec) => s + sec.items.reduce((t, it) => t + (it.unitPrice > 0 ? it.unitPrice * (it.qty || 0) : 0), 0), 0);
  const discount = q.discount || 0;
  return { subtotal, discount, grandTotal: subtotal - discount };
}

/** A template is a quotation without the customer-specific fields. */
function cleanTemplate(q) {
  const { title, sections, discount, note, terms, showSeal } = cleanQuotation(q);
  return { title, sections, discount, note, terms, showSeal };
}

async function listTemplates(req) {
  await requireUser(req, ANY);
  const db = await getDb();
  return { items: await db.collection('quoteTemplates').find({}).sort({ name: 1 }).limit(200).toArray() };
}

async function createTemplate(req) {
  const user = await requireUser(req, ANY);
  const b = await readBody(req);
  const name = str(b.name, 80);
  if (!name) throw bad('Template name is required');
  const quotation = cleanTemplate(b.quotation);
  if (!quotation.sections.length) throw bad('Add at least one section before saving a template');
  const db = await getDb();
  const col = db.collection('quoteTemplates');
  const now = new Date();
  // saving under an existing name updates that template
  const existing = await col.findOne({ name });
  if (existing) {
    await col.updateOne({ _id: existing._id }, { $set: { quotation, updatedAt: now } });
    return { item: { ...existing, quotation, updatedAt: now } };
  }
  const doc = { name, quotation, createdBy: String(user._id), createdAt: now, updatedAt: now };
  const r = await col.insertOne(doc);
  return { item: { ...doc, _id: r.insertedId } };
}

async function deleteTemplate(req, id) {
  await requireUser(req, ANY);
  const db = await getDb();
  await db.collection('quoteTemplates').deleteOne({ _id: oid(id) });
  return { ok: true };
}

const R = (method, pattern, handler) => ({ method, re: new RegExp(`^${pattern.replace(/:id/g, '([a-zA-Z0-9-]+)')}$`), handler });

export const quotationRoutes = [
  R('GET', 'quote-templates', (req) => listTemplates(req)),
  R('POST', 'quote-templates', (req) => createTemplate(req)),
  R('DELETE', 'quote-templates/:id', (req, res, id) => deleteTemplate(req, id)),
];
