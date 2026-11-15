// In-memory stand-in for the MongoDB driver, good enough to exercise the API handlers.
// Queries and aggregations are evaluated by mingo; ObjectIds are compared by their hex string.
import { ObjectId } from 'mongodb';
import { Query, Aggregator } from 'mingo';
import 'mingo/init/system';

const enc = (v) => {
  if (v instanceof ObjectId) return `oid:${v.toHexString()}`;
  if (v instanceof Date || v == null || typeof v !== 'object' || Buffer.isBuffer(v)) return v;
  if (Array.isArray(v)) return v.map(enc);
  return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, enc(x)]));
};
const dec = (v) => {
  if (typeof v === 'string' && /^oid:[a-f0-9]{24}$/.test(v)) return new ObjectId(v.slice(4));
  if (v == null || typeof v !== 'object' || v instanceof Date || Buffer.isBuffer(v)) return v;
  if (Array.isArray(v)) return v.map(dec);
  return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, dec(x)]));
};
const get = (o, path) => path.split('.').reduce((x, k) => (x == null ? x : x[k]), o);
const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

class Cursor {
  constructor(rows, projection) { this.rows = rows; this.projection = projection; }
  sort(spec) { const keys = Object.entries(spec); this.rows = [...this.rows].sort((a, b) => { for (const [k, d] of keys) { const c = cmp(get(a, k), get(b, k)); if (c) return c * d; } return 0; }); return this; }
  limit(n) { this.rows = this.rows.slice(0, n); return this; }
  async toArray() {
    return this.rows.map((r) => {
      if (!this.projection) return dec(r);
      const out = { _id: r._id }; Object.keys(this.projection).forEach((k) => { if (this.projection[k] && r[k] !== undefined) out[k] = r[k]; });
      return dec(out);
    });
  }
}
class Collection {
  constructor() { this.docs = []; }
  match(filter) { const q = new Query(enc(filter || {})); return this.docs.filter((d) => q.test(d)); }
  find(filter, opts = {}) { return new Cursor(this.match(filter), opts.projection); }
  async findOne(filter, opts = {}) { const [r] = await new Cursor(this.match(filter).slice(0, 1), opts.projection).toArray(); return r || null; }
  async countDocuments(filter) { return this.match(filter).length; }
  async insertOne(doc) { const _id = doc._id || new ObjectId(); this.docs.push(enc({ ...doc, _id })); return { insertedId: _id }; }
  async updateOne(filter, update) {
    const [d] = this.match(filter); if (!d) return { matchedCount: 0, modifiedCount: 0 };
    const before = JSON.stringify(d);
    Object.assign(d, enc(update.$set || {}));
    if (update.$inc) Object.entries(update.$inc).forEach(([k, v]) => { d[k] = (d[k] || 0) + v; });
    return { matchedCount: 1, modifiedCount: JSON.stringify(d) === before ? 0 : 1 };
  }
  async updateMany(filter, update) { const m = this.match(filter); m.forEach((d) => Object.assign(d, enc(update.$set || {}))); return { modifiedCount: m.length }; }
  async deleteOne(filter) { const [d] = this.match(filter); if (d) this.docs.splice(this.docs.indexOf(d), 1); return { deletedCount: d ? 1 : 0 }; }
  async deleteMany(filter) { const m = this.match(filter); this.docs = this.docs.filter((d) => !m.includes(d)); return { deletedCount: m.length }; }
  aggregate(pipeline) { const rows = new Aggregator(enc(pipeline)).run(this.docs); return { toArray: async () => dec(rows) }; }
  async createIndex() { return 'ok'; }
}
export function fakeDb() {
  const cols = new Map();
  return { collection: (n) => { if (!cols.has(n)) cols.set(n, new Collection()); return cols.get(n); } };
}
