import { MongoClient, ObjectId } from 'mongodb';
import { HttpError } from './http.js';

let clientPromise = null;
let indexesReady = null;

export function getClient() {
  const uri = process.env.DB_URL || process.env.MONGODB_URI;
  if (!uri) throw new HttpError(500, 'Database is not configured (DB_URL missing)');
  if (!clientPromise) {
    const client = new MongoClient(uri, { maxPoolSize: 5, serverSelectionTimeoutMS: 8000 });
    clientPromise = client.connect().catch((e) => { clientPromise = null; throw e; });
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
