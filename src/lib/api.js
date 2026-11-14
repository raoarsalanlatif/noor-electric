// Small fetch wrapper for our /api routes (cookie session, JSON in/out).
// - every request has a timeout so the UI can never hang forever
// - in-flight requests are tracked so the admin can show a progress bar / saving state
// - server failures come back as clear, human messages

export class ApiError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

const TIMEOUT_MS = 20000;

// ---- activity tracking ---------------------------------------------------
const activity = { reads: 0, writes: 0 };
const listeners = new Set();
const errorListeners = new Set();
const emit = () => listeners.forEach((fn) => fn({ ...activity }));

/** Subscribe to { reads, writes } in-flight counts. Returns an unsubscribe fn. */
export function onActivity(fn) { listeners.add(fn); fn({ ...activity }); return () => listeners.delete(fn); }
/** Subscribe to failed requests (for a global toast). */
export function onApiError(fn) { errorListeners.add(fn); return () => errorListeners.delete(fn); }

function friendly(status, serverMsg) {
  if (status === 503) return serverMsg || 'The database is not reachable right now. Please try again in a minute.';
  if (status === 504 || status === 502) return 'The server took too long to respond. Please try again.';
  if (status >= 500) return serverMsg && !/^Server error/.test(serverMsg) ? serverMsg : 'Something went wrong on the server. Please try again.';
  return serverMsg || `Request failed (${status})`;
}

export async function api(path, { method = 'GET', body, timeout = TIMEOUT_MS } = {}) {
  const kind = method === 'GET' ? 'reads' : 'writes';
  activity[kind] += 1; emit();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  try {
    let res;
    try {
      res = await fetch(`/api/${path}`, {
        method,
        credentials: 'same-origin',
        signal: ctrl.signal,
        headers: body !== undefined || method !== 'GET' ? { 'Content-Type': 'application/json' } : undefined,
        body: body !== undefined ? JSON.stringify(body) : method !== 'GET' ? '{}' : undefined,
      });
    } catch (e) {
      throw new ApiError(0, e?.name === 'AbortError'
        ? 'The request timed out. Please check your connection and try again.'
        : 'Network error — check your internet connection.');
    }
    let data = {};
    try { data = await res.json(); } catch { /* non-JSON (e.g. platform timeout page) */ }
    if (!res.ok) throw new ApiError(res.status, friendly(res.status, data.error));
    return data;
  } catch (e) {
    if (e instanceof ApiError && e.status !== 401) errorListeners.forEach((fn) => fn(e, { method, path }));
    throw e;
  } finally {
    clearTimeout(timer);
    activity[kind] -= 1; emit();
  }
}

export const get = (p) => api(p);
export const post = (p, body) => api(p, { method: 'POST', body: body ?? {} });
export const patch = (p, body) => api(p, { method: 'PATCH', body: body ?? {} });
export const del = (p) => api(p, { method: 'DELETE', body: {} });
