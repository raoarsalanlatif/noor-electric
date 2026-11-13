import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { HttpError } from './http.js';
import { getDb, oid } from './db.js';

const COOKIE = 'ne_session';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 24) throw new HttpError(500, 'JWT_SECRET is not configured (min 24 characters)');
  return new TextEncoder().encode(s);
}

export const hashPassword = (pw) => bcrypt.hash(pw, 10);
export const checkPassword = (pw, hash) => bcrypt.compare(pw, hash || '');

export async function issueSession(res, user) {
  const token = await new SignJWT({ sub: String(user._id), role: user.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
  const secure = process.env.NODE_ENV === 'development' ? '' : ' Secure;';
  res.setHeader('Set-Cookie', `${COOKIE}=${token}; Path=/; HttpOnly;${secure} SameSite=Lax; Max-Age=${MAX_AGE}`);
}

export function clearSession(res) {
  res.setHeader('Set-Cookie', `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
}

function readCookie(req) {
  const raw = req.headers.cookie || '';
  const m = raw.split(';').map((p) => p.trim()).find((p) => p.startsWith(`${COOKIE}=`));
  return m ? decodeURIComponent(m.slice(COOKIE.length + 1)) : null;
}

/** Returns the signed-in user or throws 401/403. roles: list of allowed roles. */
export async function requireUser(req, roles = ['owner', 'staff']) {
  const token = readCookie(req);
  if (!token) throw new HttpError(401, 'Please sign in');
  let payload;
  try { ({ payload } = await jwtVerify(token, secret())); } catch { throw new HttpError(401, 'Session expired, please sign in again'); }
  const db = await getDb();
  const user = await db.collection('users').findOne({ _id: oid(payload.sub) });
  if (!user || user.active === false) throw new HttpError(401, 'Account not found or disabled');
  if (!roles.includes(user.role)) throw new HttpError(403, 'You do not have access to this section');
  return user;
}

export const publicUser = (u) => ({ _id: u._id, name: u.name, email: u.email, role: u.role, active: u.active !== false, createdAt: u.createdAt });
