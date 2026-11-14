// Website content managed from the admin panel:
//   showcase  – completed projects shown on the landing page
//   reviews   – client reviews / testimonials
//   media     – images uploaded from the admin (stored in MongoDB, served with long caching)
import { Binary } from 'mongodb';
import { getDb, oid } from './db.js';
import { requireUser } from './auth.js';
import { HttpError, bad, notFound, readBody, str, num, bool, oneOf, strList } from './http.js';

const ANY = ['owner', 'staff'];
const now = () => new Date();
const ids = (list) => (Array.isArray(list) ? list.slice(0, 200).map(String).filter((x) => /^[a-f0-9]{24}$/i.test(x)) : []);

export const REVIEW_SOURCES = ['facebook', 'google', 'whatsapp', 'website', 'other'];
export const SHOWCASE_CATEGORIES = ['residential', 'commercial', 'industrial', 'agricultural'];

/* ----------------------------- seed data ------------------------------ */
// What the website showed before this content became editable.
const SEED_SHOWCASE = [
  {
    title: '12 kW Hybrid Solar System',
    location: 'Islamabad · Residential',
    category: 'residential',
    image: '/images/install-panels.jpg',
    gallery: ['/images/install-panels.jpg', '/images/install-inverter.jpg', '/images/install-battery.jpg'],
    highlights: ['10.15 kWp solar capacity', '16 kWh battery storage', '24/7 backup power'],
    specs: [
      { label: 'Panels', value: '14 × 725 W Trina Solar N-type bifacial, elevated steel structure' },
      { label: 'Inverter', value: 'Solis 12 kW single-phase hybrid' },
      { label: 'Battery', value: 'Zilo Nexa Smart 51.2 V 314 Ah lithium (16 kWh)' },
    ],
  },
  {
    title: '40 kW Premium Hybrid Upgrade',
    location: 'Commercial-scale hybrid',
    category: 'commercial',
    image: '/images/install-40kw.jpg',
    gallery: ['/images/install-40kw.jpg'],
    highlights: ['4 hybrid inverters in parallel', '2 lithium battery banks', 'Uninterrupted power'],
    specs: [
      { label: 'Inverters', value: '4 × Inverex 6 kW hybrid' },
      { label: 'Battery bank 1', value: '6 × Dongjin 51.2 V 100 Ah' },
      { label: 'Battery bank 2', value: '2 × Narada 48 V 100 Ah' },
    ],
  },
  {
    title: '10 kW On-Grid with Green Meter',
    location: 'Residential · Net-metering',
    category: 'residential',
    image: '',
    gallery: [],
    highlights: ['On-grid system', 'Green meter installed', 'Lower monthly bills'],
    specs: [
      { label: 'Type', value: 'On-grid, net-metered' },
      { label: 'Result', value: 'Customer reports reduced energy bills' },
    ],
  },
];

const SEED_REVIEWS = [
  {
    name: 'Muhammad Awais',
    location: '',
    source: 'facebook',
    rating: 5,
    text: "I recently had the pleasure of working with Noor Electric Renewables to install a 10kw On Grid solar system at my home with Green Meter. Their team was professional, efficient, and knowledgeable. The installation process was seamless, and I'm already seeing the benefits of reduced energy bills. Highly recommend.",
  },
  {
    name: 'Muhammad Usman',
    location: '',
    source: 'facebook',
    rating: 5,
    text: 'I recently had Noor Electric Renewables install a solar system for my home, and I couldn’t be happier with the experience. From start to finish, their team was professional, knowledgeable.',
  },
];

/**
 * Seed a collection exactly once. A marker document in `meta` makes this
 * atomic across serverless instances, and means that if the owner later deletes
 * every item, the defaults do NOT come back.
 */
const seeded = new Set();
async function ensureSeeded(db, name, docs) {
  if (seeded.has(name)) return;
  const r = await db.collection('meta').updateOne({ _id: `seed:${name}` }, { $setOnInsert: { at: now() } }, { upsert: true });
  if (r.upsertedCount === 1 && (await db.collection(name).countDocuments({})) === 0) {
    const t = now();
    await db.collection(name).insertMany(docs.map((d, i) => ({ ...d, published: true, order: i + 1, createdAt: t, updatedAt: t, seeded: true })));
  }
  seeded.add(name);
}
const seedShowcase = (db) => ensureSeeded(db, 'showcase', SEED_SHOWCASE);
const seedReviews = (db) => ensureSeeded(db, 'reviews', SEED_REVIEWS);

/* ----------------------------- validation ----------------------------- */
// Images are either our own static files (/images/…), uploaded media (/api/public/media/<id>) or https URLs.
const imageUrl = (v) => {
  const s = str(v, 500);
  if (!s) return '';
  if (/^\/(images|api\/public\/media)\/[\w./-]+$/.test(s) || /^https:\/\/[^\s"'<>]+$/.test(s)) return s;
  throw bad('Images must be uploaded, or be an https:// link');
};

function showcaseFields(b) {
  const title = str(b.title, 140);
  if (!title) throw bad('Project title is required');
  const gallery = (Array.isArray(b.gallery) ? b.gallery : []).slice(0, 8).map(imageUrl).filter(Boolean);
  const image = imageUrl(b.image) || gallery[0] || '';
  return {
    title,
    location: str(b.location, 140),
    category: oneOf(b.category, SHOWCASE_CATEGORIES, 'residential'),
    image,
    gallery: image && !gallery.includes(image) ? [image, ...gallery].slice(0, 8) : gallery,
    highlights: strList(b.highlights, 6, 60),
    specs: (Array.isArray(b.specs) ? b.specs : []).slice(0, 8)
      .map((s) => ({ label: str(s?.label, 40), value: str(s?.value, 200) }))
      .filter((s) => s.label && s.value),
    published: b.published === undefined ? true : bool(b.published),
  };
}

function reviewFields(b) {
  const name = str(b.name, 80);
  const text = str(b.text, 1500);
  if (!name) throw bad('Client name is required');
  if (!text) throw bad('Review text is required');
  const rating = num(b.rating, { min: 1, max: 5 });
  return {
    name,
    text,
    location: str(b.location, 100),
    source: oneOf(b.source, REVIEW_SOURCES, 'website'),
    rating: rating == null ? null : Math.round(rating),
    published: b.published === undefined ? true : bool(b.published),
  };
}

/* ------------------------------ handlers ------------------------------ */
function crud(name, seed, fields) {
  return {
    async list(req) {
      await requireUser(req, ANY);
      const db = await getDb();
      await seed(db);
      return { items: await db.collection(name).find({}).sort({ order: 1, createdAt: -1 }).toArray() };
    },
    async create(req) {
      const user = await requireUser(req, ANY);
      const b = await readBody(req);
      const db = await getDb();
      await seed(db);
      const last = await db.collection(name).find({}).sort({ order: -1 }).limit(1).toArray();
      const doc = { ...fields(b), order: (last[0]?.order || 0) + 1, createdAt: now(), updatedAt: now(), createdBy: user._id };
      const r = await db.collection(name).insertOne(doc);
      return { item: { ...doc, _id: r.insertedId } };
    },
    async update(req, id) {
      await requireUser(req, ANY);
      const b = await readBody(req);
      const db = await getDb();
      const _id = oid(id);
      const existing = await db.collection(name).findOne({ _id });
      if (!existing) throw notFound();
      // allow a quick show/hide toggle without resending the whole document
      const set = Object.keys(b).length === 1 && 'published' in b
        ? { published: bool(b.published) }
        : fields({ ...existing, ...b });
      await db.collection(name).updateOne({ _id }, { $set: { ...set, updatedAt: now() } });
      return { item: await db.collection(name).findOne({ _id }) };
    },
    async remove(req, id) {
      await requireUser(req, ANY);
      const db = await getDb();
      const _id = oid(id);
      const doc = await db.collection(name).findOne({ _id });
      if (!doc) return { ok: true };
      await db.collection(name).deleteOne({ _id });
      // clean up images that were uploaded for this item
      const mediaIds = [doc.image, ...(doc.gallery || [])]
        .map((u) => /^\/api\/public\/media\/([a-f0-9]{24})$/i.exec(u || '')?.[1]).filter(Boolean);
      if (mediaIds.length) await db.collection('media').deleteMany({ _id: { $in: mediaIds.map((m) => oid(m)) } });
      return { ok: true };
    },
    async reorder(req) {
      await requireUser(req, ANY);
      const b = await readBody(req);
      const list = ids(b.ids);
      const db = await getDb();
      await Promise.all(list.map((id, i) => db.collection(name).updateOne({ _id: oid(id) }, { $set: { order: i + 1 } })));
      return { ok: true };
    },
    async publicList() {
      const db = await getDb();
      await seed(db);
      const items = await db.collection(name).find({ published: true }).sort({ order: 1, createdAt: -1 }).limit(60).toArray();
      return { items: items.map((d) => { const out = { ...d }; delete out.createdBy; return out; }) };
    },
  };
}

const showcase = crud('showcase', seedShowcase, showcaseFields);
const reviews = crud('reviews', seedReviews, reviewFields);

/* ------------------------------- media -------------------------------- */
const MAX_IMAGE_BYTES = 2_500_000;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

async function uploadMedia(req) {
  const user = await requireUser(req, ANY);
  const b = await readBody(req, 4_000_000);
  const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(b.dataUrl || ''));
  if (!m || !IMAGE_TYPES.includes(m[1])) throw bad('Please upload a JPG, PNG or WebP image');
  const buf = Buffer.from(m[2], 'base64');
  if (buf.length > MAX_IMAGE_BYTES) throw new HttpError(413, 'Image is too large (max 2.5 MB)');
  const db = await getDb();
  const r = await db.collection('media').insertOne({ mime: m[1], size: buf.length, data: new Binary(buf), name: str(b.name, 120), createdAt: now(), createdBy: user._id });
  return { id: String(r.insertedId), url: `/api/public/media/${r.insertedId}` };
}

/** Marker so the router knows the response was already written. */
export const HANDLED = Symbol('handled');

async function serveMedia(res, id) {
  const db = await getDb();
  const doc = await db.collection('media').findOne({ _id: oid(id) });
  if (!doc) throw notFound('Image not found');
  const buf = Buffer.from(doc.data.buffer ?? doc.data);
  res.statusCode = 200;
  res.setHeader('Content-Type', doc.mime);
  res.setHeader('Content-Length', String(buf.length));
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.end(buf);
  return HANDLED;
}

/* ------------------------------- routes ------------------------------- */
const R = (method, pattern, handler) => ({ method, re: new RegExp(`^${pattern.replace(/:id/g, '([a-zA-Z0-9-]+)')}$`), handler });

export const contentRoutes = [
  R('GET', 'showcase', (req) => showcase.list(req)),
  R('POST', 'showcase', (req) => showcase.create(req)),
  R('POST', 'showcase/reorder', (req) => showcase.reorder(req)),
  R('PATCH', 'showcase/:id', (req, res, id) => showcase.update(req, id)),
  R('DELETE', 'showcase/:id', (req, res, id) => showcase.remove(req, id)),

  R('GET', 'reviews', (req) => reviews.list(req)),
  R('POST', 'reviews', (req) => reviews.create(req)),
  R('POST', 'reviews/reorder', (req) => reviews.reorder(req)),
  R('PATCH', 'reviews/:id', (req, res, id) => reviews.update(req, id)),
  R('DELETE', 'reviews/:id', (req, res, id) => reviews.remove(req, id)),

  R('POST', 'media', (req) => uploadMedia(req)),

  R('GET', 'public/showcase', () => showcase.publicList()),
  R('GET', 'public/reviews', () => reviews.publicList()),
  R('GET', 'public/media/:id', (req, res, id) => serveMedia(res, id)),
];

/** Test hook. */
export const __resetSeedCache = () => seeded.clear();
