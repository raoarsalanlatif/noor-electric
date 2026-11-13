/* eslint-disable react/prop-types, react-refresh/only-export-components */
import { useEffect } from 'react';
import styled, { css, keyframes } from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';

export const a = {
  bg: '#f3f5fa', card: '#ffffff', line: '#e4e8f0', text: '#18202f', muted: '#667085',
  navy: '#0a1f4d', blue: '#1a4fb4', gold: '#f7b31b', orange: '#f47b20', green: '#16a34a', red: '#dc2626', amber: '#d97706',
};

export const PageHead = styled.div`
  display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; flex-wrap: wrap;
  margin-bottom: 20px;
  h1 { font-size: 1.55rem; color: ${a.text}; margin: 0; font-family: 'Poppins', sans-serif; }
  p { color: ${a.muted}; margin: 4px 0 0; font-size: 0.92rem; }
  .actions { display: flex; gap: 8px; flex-wrap: wrap; }
`;

export const Card = styled.div`
  background: ${a.card}; border: 1px solid ${a.line}; border-radius: 14px; padding: ${(p) => p.$pad || '18px'};
  box-shadow: 0 1px 2px rgba(16,24,40,0.04);
`;

export const Btn = styled.button`
  display: inline-flex; align-items: center; justify-content: center; gap: 7px;
  border-radius: 10px; padding: ${(p) => (p.$sm ? '6px 10px' : '9px 15px')}; font-size: ${(p) => (p.$sm ? '0.8rem' : '0.9rem')};
  font-weight: 600; cursor: pointer; border: 1px solid transparent; white-space: nowrap; text-decoration: none;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
  ${(p) => {
    if (p.$v === 'ghost') return css`background: #fff; color: ${a.text}; border-color: ${a.line}; &:hover { border-color: ${a.blue}; color: ${a.blue}; }`;
    if (p.$v === 'danger') return css`background: #fff; color: ${a.red}; border-color: #fecaca; &:hover { background: #fef2f2; }`;
    if (p.$v === 'gold') return css`background: ${a.gold}; color: ${a.navy}; &:hover { background: #ffc43d; }`;
    if (p.$v === 'green') return css`background: #25d366; color: #fff; &:hover { background: #1fb457; }`;
    return css`background: ${a.blue}; color: #fff; &:hover { background: ${a.navy}; }`;
  }}
  &:disabled { opacity: 0.55; cursor: not-allowed; }
`;

export const Field = styled.label`
  display: flex; flex-direction: column; gap: 5px; font-size: 0.8rem; font-weight: 600; color: ${a.muted};
  grid-column: ${(p) => (p.$full ? '1 / -1' : 'auto')};
  input, select, textarea {
    font: inherit; font-weight: 400; font-size: 0.92rem; color: ${a.text};
    border: 1px solid ${a.line}; border-radius: 10px; padding: 9px 11px; background: #fff; width: 100%;
  }
  textarea { min-height: 90px; resize: vertical; }
  input:focus, select:focus, textarea:focus { outline: 2px solid ${a.blue}33; border-color: ${a.blue}; }
`;

export const FormGrid = styled.div`
  display: grid; grid-template-columns: repeat(${(p) => p.$cols || 2}, minmax(0, 1fr)); gap: 12px;
  @media (max-width: 640px) { grid-template-columns: 1fr; }
`;

const tones = {
  gray: ['#f2f4f7', '#344054'], blue: ['#eff4ff', '#1d4ed8'], green: ['#ecfdf3', '#027a48'], gold: ['#fffaeb', '#b54708'],
  red: ['#fef3f2', '#b42318'], purple: ['#f4f3ff', '#5925dc'], teal: ['#f0fdf9', '#107569'],
};
export const Badge = styled.span`
  display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px; border-radius: 999px; font-size: 0.74rem; font-weight: 600;
  background: ${(p) => (tones[p.$tone] || tones.gray)[0]}; color: ${(p) => (tones[p.$tone] || tones.gray)[1]}; white-space: nowrap;
`;

export const Table = styled.div`
  overflow-x: auto;
  table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
  th { text-align: left; font-size: 0.74rem; text-transform: uppercase; letter-spacing: 0.05em; color: ${a.muted}; font-weight: 600; padding: 10px 12px; border-bottom: 1px solid ${a.line}; white-space: nowrap; }
  td { padding: 11px 12px; border-bottom: 1px solid ${a.line}; color: ${a.text}; vertical-align: top; }
  tr:last-child td { border-bottom: 0; }
  tbody tr:hover td { background: #fafbfd; }
  td input { width: 100px; border: 1px solid ${a.line}; border-radius: 8px; padding: 5px 7px; font: inherit; }
`;

export const Empty = styled.div`
  text-align: center; color: ${a.muted}; padding: 36px 12px; font-size: 0.92rem;
  svg { font-size: 1.8rem; color: #c3cad6; margin-bottom: 10px; }
`;

export const ErrorBox = styled.div`
  background: #fef3f2; color: #b42318; border: 1px solid #fecdca; border-radius: 10px; padding: 10px 12px; font-size: 0.88rem; margin-bottom: 12px;
`;

const fade = keyframes`from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; }`;
const Backdrop = styled.div`
  position: fixed; inset: 0; z-index: 2000; background: rgba(10,20,40,0.45); display: grid; place-items: center; padding: 16px;
`;
const Dialog = styled.div`
  width: min(${(p) => p.$w || 640}px, 100%); max-height: calc(100vh - 32px); overflow-y: auto;
  background: #fff; border-radius: 16px; box-shadow: 0 30px 80px rgba(0,0,0,0.25); animation: ${fade} 0.18s ease;
  .head { display: flex; align-items: center; justify-content: space-between; padding: 16px 18px; border-bottom: 1px solid ${a.line}; position: sticky; top: 0; background: #fff; z-index: 1; }
  .head h3 { margin: 0; font-size: 1.08rem; font-family: 'Poppins', sans-serif; }
  .head button { border: 0; background: none; font-size: 1.1rem; cursor: pointer; color: ${a.muted}; }
  .body { padding: 18px; }
  .foot { display: flex; justify-content: space-between; gap: 8px; padding: 14px 18px; border-top: 1px solid ${a.line}; flex-wrap: wrap; position: sticky; bottom: 0; background: #fff; }
`;

export function Modal({ title, onClose, children, footer, width }) {
  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <Backdrop onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <Dialog $w={width} role="dialog" aria-modal="true" aria-label={title}>
        <div className="head"><h3>{title}</h3><button type="button" onClick={onClose} aria-label="Close"><FontAwesomeIcon icon={faXmark} /></button></div>
        <div className="body">{children}</div>
        {footer && <div className="foot">{footer}</div>}
      </Dialog>
    </Backdrop>
  );
}

export const pkr = (n) => (n == null || n === '' ? '—' : `Rs ${Math.round(Number(n)).toLocaleString('en-PK')}`);
export const fmtDate = (d, opts = { day: 'numeric', month: 'short', year: 'numeric' }) => (d ? new Date(d).toLocaleDateString('en-PK', opts) : '—');
export const fmtDateTime = (d) => (d ? new Date(d).toLocaleString('en-PK', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '—');
export const toLocalInput = (d) => {
  if (!d) return '';
  const x = new Date(d); const off = x.getTimezoneOffset();
  return new Date(x.getTime() - off * 60000).toISOString().slice(0, 16);
};
export const toDateInput = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');
export const waLink = (phone, text = '') => `https://wa.me/${String(phone || '').replace(/\D/g, '').replace(/^0/, '92')}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
