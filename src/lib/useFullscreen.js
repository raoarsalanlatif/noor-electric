// Full-screen for one element (the 3D planner view, the game).
// Uses the browser's Fullscreen API; where that isn't available (e.g. iPhone Safari)
// it falls back to stretching the element over the whole window.
// Esc (or the button again) exits in both cases.
import { useCallback, useEffect, useState } from 'react';

const fsElement = () => document.fullscreenElement || document.webkitFullscreenElement || null;

export function useFullscreen(ref) {
  const [native, setNative] = useState(false);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const sync = () => setNative(Boolean(ref.current) && fsElement() === ref.current);
    document.addEventListener('fullscreenchange', sync);
    document.addEventListener('webkitfullscreenchange', sync);
    return () => {
      document.removeEventListener('fullscreenchange', sync);
      document.removeEventListener('webkitfullscreenchange', sync);
    };
  }, [ref]);

  useEffect(() => {
    if (!fallback) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setFallback(false); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [fallback]);

  const enter = useCallback(async () => {
    const el = ref.current;
    if (!el) return;
    const request = el.requestFullscreen || el.webkitRequestFullscreen;
    if (request) {
      try { await request.call(el, { navigationUI: 'hide' }); return; } catch { /* fall back below */ }
    }
    setFallback(true);
  }, [ref]);

  const exit = useCallback(async () => {
    if (fallback) { setFallback(false); return; }
    const leave = document.exitFullscreen || document.webkitExitFullscreen;
    if (leave && fsElement()) { try { await leave.call(document); } catch { /* already closed */ } }
  }, [fallback]);

  const active = native || fallback;
  const toggle = useCallback(() => (active ? exit() : enter()), [active, enter, exit]);
  return { active, enter, exit, toggle };
}

/** CSS for the element while full-screen (works for both the real and the fallback mode). */
export const fullscreenCss = `
  position: fixed !important; inset: 0 !important; z-index: 10000 !important;
  width: 100vw !important; height: 100vh !important; height: 100dvh !important;
  min-height: 0 !important; max-height: none !important;
  border-radius: 0 !important; margin: 0 !important;
`;
