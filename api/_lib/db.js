import { MongoClient, ObjectId } from 'mongodb';
import { HttpError } from './http.js';

let clientPromise = null;
let clientRef = null;
let indexesReady = null;

const NETWORK_ERRORS = new Set([
  'MongoServerSelectionError', 'MongoNetworkError', 'MongoNetworkTimeoutError',
  'MongoTopologyClosedError', 'MongoNotConnectedError', 'MongoPoolClearedError',
]);

/** True when an error means the database could not be reached (not a bug in the request). */
export function isDbUnavailable(e) {
  return Boolean(e && (NETWORK_ERRORS.has(e.name) || NETWORK_ERRORS.has(e.cause?.name)));
}

/** Drop the cached connection so the next request reconnects from scratch. */
export function resetClient() {
  const c = clientRef;
  clientPromise = null; clientRef = null; indexesReady = null;
  if (c) c.close(true).catch(() => {});
}

export function getClient() {
  // tolerate values pasted with surrounding quotes, whitespace or a leading "DB_URL="
  const uri = String(process.env.DB_URL || process.env.MONGODB_URI || '')
    .trim().replace(/^['"]|['"]$/g, '').trim()
    .replace(/^(DB_URL|MONGODB_URI)\s*=\s*/, '').replace(/^['"]|['"]$/g, '').trim();
  if (!uri) throw new HttpError(500, 'Database is not configured (DB_URL missing)');
  if (!/^mongodb(\+srv)?:\/\//.test(uri)) throw new HttpError(500, 'Database URL is invalid — it must start with mongodb+srv://');
  if (!clientPromise) {
    // Short timeouts: a serverless request must fail fast (and clearly) rather than hang.
    const client = new MongoClient(uri, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      socketTimeoutMS: 20000,
      maxIdleTimeMS: 60000,
    });
    clientRef = client;
    clientPromise = client.connect().catch((e) => { clientPromise = null; clientRef = null; throw e; });
  }
  return clientPromise;
}

/** Test hook: inject a fake db. */
let injected = null;
export const __setDb = (db) => { injected = db; indexesReady = null; };

export async function getDb() {
  if (injected) return injected;
  const client = await getClient();
  const db = client.db(process.env.DB_NAME || 'noor_electric');
  if (!indexesReady) {
    indexesReady = Promise.all([
      db.collection('users').createIndex({ email: 1 }, { unique: true }),
      db.collection('blogs').createIndex({ slug: 1 }, { unique: true }),
      db.collection('blogs').createIndex({ status: 1, publishedAt: -1 }),
      db.collection('quotes').createIndex({ createdAt: -1 }),
      db.collection('events').createIndex({ start: 1 }),
      db.collection('projects').createIndex({ stage: 1, order: 1 }),
      db.collection('payroll').createIndex({ month: 1, employeeId: 1 }, { unique: true }),
    ]).catch((e) => { indexesReady = null; console.error('index error', e.message); });
  }
  return db;
}

export function oid(id) {
  try { return new ObjectId(String(id)); } catch { throw new HttpError(400, 'Invalid id'); }
}

export { ObjectId };
