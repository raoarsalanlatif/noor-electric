// Small fetch wrapper for our /api routes (cookie session, JSON in/out).
export class ApiError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export async function api(path, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch(`/api/${path}`, {
      method,
      credentials: 'same-origin',
      headers: body !== undefined || method !== 'GET' ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : method !== 'GET' ? '{}' : undefined,
    });
  } catch {
    throw new ApiError(0, 'Network error — check your connection');
  }
  let data = {};
  try { data = await res.json(); } catch { /* empty */ }
  if (!res.ok) throw new ApiError(res.status, data.error || `Request failed (${res.status})`);
  return data;
}

export const get = (p) => api(p);
export const post = (p, body) => api(p, { method: 'POST', body: body ?? {} });
export const patch = (p, body) => api(p, { method: 'PATCH', body: body ?? {} });
export const del = (p) => api(p, { method: 'DELETE', body: {} });
