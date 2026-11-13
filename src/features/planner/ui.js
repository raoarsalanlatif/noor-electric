import styled, { css } from 'styled-components';

export const t = {
  bg: '#0a0f1a',
  card: '#111827',
  cardHi: '#172033',
  line: 'rgba(255,255,255,0.08)',
  text: '#e5e7eb',
  muted: '#94a3b8',
  orange: '#f9a633',
  blue: '#619dcf',
  green: '#34d399',
  amber: '#f59e0b',
  red: '#ef4444',
};

export const statusColor = { ok: t.green, warn: t.amber, fail: t.red };

export const Card = styled.div`
  background: ${t.card};
  border: 1px solid ${t.line};
  border-radius: 16px;
  padding: 18px;
`;

export const CardTitle = styled.h3`
  font-size: 0.8rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${t.muted};
  margin: 0 0 12px;
  font-weight: 600;
`;

export const Row = styled.div`
  display: flex;
  align-items: center;
  gap: ${(p) => p.$gap || '10px'};
  justify-content: ${(p) => p.$justify || 'flex-start'};
  flex-wrap: ${(p) => (p.$wrap ? 'wrap' : 'nowrap')};
`;

export const Label = styled.label`
  display: block;
  font-size: 0.85rem;
  color: ${t.muted};
  margin-bottom: 6px;
`;

export const Range = styled.input.attrs({ type: 'range' })`
  width: 100%;
  accent-color: ${t.orange};
`;

export const NumberInput = styled.input.attrs({ type: 'number' })`
  width: 70px;
  background: ${t.bg};
  border: 1px solid ${t.line};
  color: ${t.text};
  border-radius: 8px;
  padding: 6px 8px;
  font-size: 0.9rem;
`;

export const Select = styled.select`
  width: 100%;
  background: ${t.bg};
  border: 1px solid ${t.line};
  color: ${t.text};
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 0.95rem;
`;

export const TextInput = styled.input`
  width: 100%;
  background: ${t.bg};
  border: 1px solid ${t.line};
  color: ${t.text};
  border-radius: 10px;
  padding: 11px 12px;
  font-size: 0.95rem;
  &:focus { outline: 2px solid ${t.orange}55; border-color: ${t.orange}; }
`;

export const Segmented = styled.div`
  display: flex;
  background: ${t.bg};
  border: 1px solid ${t.line};
  border-radius: 10px;
  padding: 3px;
  gap: 3px;
`;

export const Seg = styled.button`
  flex: 1;
  border: 0;
  border-radius: 8px;
  padding: 8px 6px;
  font-size: 0.85rem;
  cursor: pointer;
  color: ${(p) => (p.$active ? '#111' : t.muted)};
  background: ${(p) => (p.$active ? t.orange : 'transparent')};
  font-weight: ${(p) => (p.$active ? 700 : 500)};
  transition: background 0.2s;
`;

export const Button = styled.button`
  border: 0;
  border-radius: 12px;
  padding: 12px 18px;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s, background 0.2s;
  ${(p) => (p.$ghost
    ? css`background: transparent; color: ${t.text}; border: 1px solid ${t.line}; &:hover { border-color: ${t.orange}; }`
    : css`background: linear-gradient(135deg, ${t.orange}, #ff7a18); color: #111;
      box-shadow: 0 6px 20px ${t.orange}44; &:hover { transform: translateY(-1px); box-shadow: 0 10px 26px ${t.orange}66; }`)}
  &:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
`;

export const Toggle = styled.label`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  cursor: pointer;
  font-size: 0.92rem;
  color: ${t.text};
  padding: 8px 0;
  input { appearance: none; width: 42px; height: 24px; border-radius: 99px; background: #334155; position: relative; cursor: pointer; transition: background .2s; flex-shrink: 0; }
  input::after { content: ''; position: absolute; top: 3px; left: 3px; width: 18px; height: 18px; border-radius: 50%; background: #fff; transition: left .2s; }
  input:checked { background: ${t.orange}; }
  input:checked::after { left: 21px; }
  small { display: block; color: ${t.muted}; font-size: 0.78rem; }
`;
