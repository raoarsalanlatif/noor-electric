// Loads editable website content (projects, reviews) from the public API.
// Shows the last copy this visitor saw (or the built-in defaults) instantly,
// then swaps in fresh data — so the page never renders empty, even if the API is down.
import { useEffect, useState } from 'react';
import { get } from './api';

const KEY = (path) => `ne-content:${path}`;

function readCache(path) {
  try {
    const raw = localStorage.getItem(KEY(path));
    const v = raw ? JSON.parse(raw) : null;
    return Array.isArray(v) ? v : null;
  } catch { return null; }
}

export function usePublicContent(path, fallback) {
  const [items, setItems] = useState(() => readCache(path) || fallback);
  useEffect(() => {
    let alive = true;
    get(path)
      .then((r) => {
        if (!alive || !Array.isArray(r.items)) return;
        setItems(r.items);
        try { localStorage.setItem(KEY(path), JSON.stringify(r.items)); } catch { /* storage unavailable */ }
      })
      .catch(() => { /* keep cached/fallback content */ });
    return () => { alive = false; };
  }, [path]);
  return items;
}

/** Resolve stored image paths: our static /images/ files respect the deploy base path. */
export function assetUrl(u) {
  if (!u) return '';
  if (u.startsWith('/images/')) return `${import.meta.env.BASE_URL}${u.slice(1)}`;
  return u;
}
