/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from 'react';
import styled, { css } from 'styled-components';
import { Link } from 'react-router-dom';
import { brand, fonts } from '../../styles/variables';

export const Section = styled.section`
  padding: clamp(64px, 9vw, 112px) 0;
  background: ${(p) => (p.$tone === 'soft' ? brand.bgSoft : p.$tone === 'dark' ? brand.navy : brand.bg)};
  color: ${(p) => (p.$tone === 'dark' ? '#fff' : brand.text)};
  position: relative;
  overflow: hidden;
  scroll-margin-top: 80px;
`;

export const Container = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  @media (max-width: 600px) { padding: 0 16px; }
`;

export const Eyebrow = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: ${fonts.heading};
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: ${(p) => (p.$light ? brand.gold : brand.blue)};
  margin-bottom: 14px;
  &::before { content: ''; width: 22px; height: 3px; border-radius: 3px; background: ${brand.gold}; }
`;

export const Heading = styled.h2`
  font-size: clamp(1.8rem, 3.6vw, 2.75rem);
  font-weight: 800;
  color: ${(p) => (p.$light ? '#fff' : brand.ink)};
  margin-bottom: 16px;
  max-width: ${(p) => p.$max || '760px'};
  span { color: ${(p) => (p.$light ? brand.gold : brand.blue)}; }
`;

export const Lead = styled.p`
  font-size: 1.08rem;
  color: ${(p) => (p.$light ? 'rgba(255,255,255,0.78)' : brand.muted)};
  max-width: ${(p) => p.$max || '640px'};
`;

export const SectionHead = styled.div`
  margin-bottom: clamp(32px, 5vw, 56px);
  ${(p) => p.$center && css`text-align: center; display: flex; flex-direction: column; align-items: center;`}
`;

const buttonStyles = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 14px 24px;
  border-radius: 999px;
  font-family: ${fonts.heading};
  font-weight: 600;
  font-size: 0.98rem;
  text-decoration: none;
  cursor: pointer;
  border: 2px solid transparent;
  transition: transform 0.2s, box-shadow 0.2s, background 0.2s, color 0.2s, border-color 0.2s;
  white-space: nowrap;
  &:hover { transform: translateY(-2px); }
  ${(p) => (p.$variant === 'outline'
    ? css`background: transparent; color: ${p.$light ? '#fff' : brand.blue}; border-color: ${p.$light ? 'rgba(255,255,255,0.5)' : brand.blue};
        &:hover { background: ${p.$light ? '#fff' : brand.blue}; color: ${p.$light ? brand.navy : '#fff'}; }`
    : p.$variant === 'blue'
      ? css`background: ${brand.blue}; color: #fff; box-shadow: 0 10px 24px ${brand.blue}40; &:hover { background: ${brand.navy}; }`
      : p.$variant === 'whatsapp'
        ? css`background: #25d366; color: #fff; box-shadow: 0 10px 24px #25d36640;`
        : css`background: ${brand.gold}; color: ${brand.ink}; box-shadow: 0 10px 24px ${brand.gold}55; &:hover { background: #ffc43d; }`)}
`;

export const ButtonLink = styled(Link)`${buttonStyles}`;
export const ButtonA = styled.a`${buttonStyles}`;
export const ButtonEl = styled.button`${buttonStyles}`;

export const Grid = styled.div`
  display: grid;
  gap: ${(p) => p.$gap || '24px'};
  grid-template-columns: repeat(${(p) => p.$cols || 3}, minmax(0, 1fr));
  @media (max-width: 960px) { grid-template-columns: repeat(${(p) => Math.min(p.$cols || 3, 2)}, minmax(0, 1fr)); }
  @media (max-width: 640px) { grid-template-columns: minmax(0, 1fr); }
`;

const RevealBox = styled.div`
  opacity: ${(p) => (p.$shown ? 1 : 0)};
  transform: translateY(${(p) => (p.$shown ? 0 : '24px')});
  transition: opacity 0.7s ease ${(p) => p.$delay}s, transform 0.7s ease ${(p) => p.$delay}s;
  height: 100%;
`;

/** Fades content up the first time it scrolls into view. */
export function Reveal({ children, delay = 0, as }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') { setShown(true); return undefined; }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setShown(true); io.disconnect(); }
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <RevealBox ref={ref} as={as} $shown={shown} $delay={delay}>{children}</RevealBox>;
}

/** Subtle solar-cell grid used on dark backgrounds, echoing the brand creatives. */
export const GridPattern = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image:
    linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px);
  background-size: 56px 56px;
  mask-image: radial-gradient(ellipse at 70% 30%, #000 30%, transparent 75%);
`;
