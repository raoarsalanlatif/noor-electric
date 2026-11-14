export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export const bad = (msg) => new HttpError(400, msg);
export const notFound = (msg = 'Not found') => new HttpError(404, msg);

export function send(res, status, data, headers = {}) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v));
  res.end(JSON.stringify(data));
}

/** Parse a JSON body (Vercel may have parsed it already). Limits size to ~200 KB. */
export async function readBody(req, limit = 200_000) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') { try { return JSON.parse(req.body || '{}'); } catch { throw bad('Invalid JSON'); } }
  const chunks = []; let size = 0;
  for await (const c of req) {
    size += c.length;
    if (size > limit) throw new HttpError(413, 'Request too large');
    chunks.push(c);
  }
  if (!chunks.length) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw bad('Invalid JSON'); }
}

export const clientIp = (req) => (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || 'unknown';

/** Tiny best-effort rate limiter (per serverless instance). */
const buckets = new Map();
export function rateLimit(key, max, windowMs) {
  const now = Date.now();
  const b = buckets.get(key) || { n: 0, reset: now + windowMs };
  if (now > b.reset) { b.n = 0; b.reset = now + windowMs; }
  b.n += 1;
  buckets.set(key, b);
  if (b.n > max) throw new HttpError(429, 'Too many requests, please try again later');
}

/* ---------- input cleaning ---------- */
export const str = (v, max = 500) => (v == null ? '' : String(v).trim().slice(0, max));
export const num = (v, { min = -1e12, max = 1e12 } = {}) => {
  if (v === '' || v == null) return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.min(max, Math.max(min, n));
};
export const bool = (v) => v === true || v === 'true';
export const oneOf = (v, list, dflt) => (list.includes(v) ? v : dflt);
export const date = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};
export const strList = (v, maxItems = 30, maxLen = 80) => (Array.isArray(v) ? v.slice(0, maxItems).map((x) => str(x, maxLen)).filter(Boolean) : []);
