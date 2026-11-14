// Single serverless entry point for the admin + public API.
// vercel.json rewrites /api/<route> to /api/index?route=<route>.
import { routes } from './_lib/routes.js';
import { send, HttpError } from './_lib/http.js';
import { isDbUnavailable, resetClient } from './_lib/db.js';

export default async function handler(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const query = { ...Object.fromEntries(url.searchParams), ...(req.query || {}) };
  const route = String(query.route || url.pathname.replace(/^\/api\/?/, '').replace(/^index\/?/, '')).replace(/^\/+|\/+$/g, '');
  delete query.route;
  const method = req.method === 'HEAD' ? 'GET' : req.method;

  try {
    if (method !== 'GET') {
      // Basic CSRF protection: state-changing requests must be JSON from our own site.
      const ct = String(req.headers['content-type'] || '');
      if (!ct.includes('application/json')) throw new HttpError(415, 'Expected JSON');
      const origin = req.headers.origin;
      if (origin) {
        const host = req.headers['x-forwarded-host'] || req.headers.host;
        if (new URL(origin).host !== host) throw new HttpError(403, 'Cross-site request blocked');
      }
    }
    const match = routes.find((r) => r.method === method && r.re.test(route));
    if (!match) {
      const exists = routes.some((r) => r.re.test(route));
      throw new HttpError(exists ? 405 : 404, exists ? 'Method not allowed' : 'Unknown API route');
    }
    const [, id] = route.match(match.re) || [];
    const data = await match.handler(req, res, id, query);
    send(res, 200, data ?? { ok: true });
  } catch (e) {
    if (isDbUnavailable(e)) {
      // Network/TLS failure talking to MongoDB: reconnect next time and tell the user plainly.
      resetClient();
      console.error(`[api] ${method} ${route}: database unreachable:`, e.message);
      send(res, 503, { error: 'Can’t reach the database right now. Please try again in a minute.' });
      return;
    }
    const status = e instanceof HttpError ? e.status : 500;
    if (status >= 500) console.error(`[api] ${method} ${route}:`, e);
    const message = status >= 500 && !(e instanceof HttpError) ? 'Server error — please try again' : e.message;
    send(res, status, { error: message });
  }
}
