/* eslint-disable react/prop-types */
// The home page. Black and off-white, very large type, one object: a solar panel.
// "Noor" means light — the page says what we do with it, shows the work, and gets out of the way.
import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { fonts } from '../../styles/variables';
import { company, projects, reviews, whatsappLink } from '../../content/company';
import { usePublicContent, assetUrl } from '../../lib/publicContent';
import { SERVICES } from '../../components/sections/ServicesSection';
import { STEPS } from '../../components/sections/ProcessSection';
import { FAQS } from '../../components/sections/FAQSection';

const PanelStage = lazy(() => import('./PanelStage'));

const INK = '#0a0a0a'; const PAPER = '#f6f5f1'; const SUN = '#ff8a1f'; const DIM = 'rgba(10,10,10,0.55)';
const MONO = "ui-monospace, 'SF Mono', Menlo, Consolas, monospace";
const display = `font-family: ${fonts.heading}; font-weight: 600; letter-spacing: -0.045em; line-height: 0.98;`;

const rise = keyframes`from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; }`;

const Page = styled.div`
  background: ${PAPER}; color: ${INK};
  margin-top: -76px; /* the menu floats over the hero on this page */
  @media (max-width: 600px) { margin-top: -68px; }
  a { color: inherit; }
`;

const Wrap = styled.div`max-width: 1480px; margin: 0 auto; padding: 0 clamp(18px, 3vw, 40px);`;

/* --------------------------------- hero ---------------------------------- */
const Hero = styled.section`
  position: relative; overflow: hidden; background: ${INK}; color: #fff;
  height: 100svh; min-height: 620px; max-height: 1100px;
  display: flex; align-items: flex-end;
  /* a low sun behind the panel */
  &::before { content: ''; position: absolute; width: min(64vw, 820px); aspect-ratio: 1; border-radius: 50%;
    left: 62%; top: 44%; transform: translate(-50%, -50%);
    background: radial-gradient(circle, ${SUN}8c 0%, ${SUN}33 36%, transparent 68%); filter: blur(12px); }
  @media (max-width: 760px) { &::before { left: 50%; top: 34%; width: 110vw; } }
`;
const Stage = styled.div`position: absolute; inset: 0; canvas { animation: ${rise} 1.4s ease both; }`;
const HeroCopy = styled.div`
  position: relative; width: 100%; padding-bottom: clamp(26px, 4vw, 52px);
  h1 { ${display} color: #fff; font-size: clamp(6.2rem, 25vw, 23rem); line-height: 0.8; margin: 0 0 clamp(14px, 2vw, 30px) -0.05em; animation: ${rise} 0.9s ease both; }
  p { ${display} line-height: 1.08; font-size: clamp(1.35rem, 3.1vw, 2.9rem); max-width: 22em; animation: ${rise} 0.9s 0.15s ease both; }
  p a { text-decoration: underline; text-decoration-thickness: 0.07em; text-underline-offset: 0.12em; }
  p a:hover { color: ${SUN}; }
  @media (max-width: 760px) { p { padding-right: 56px; } } /* room for the WhatsApp button */
`;

/* ------------------------------ panel field ------------------------------ */
const Reel = styled.section`background: ${INK}; padding: 0 clamp(12px, 2vw, 28px) clamp(12px, 2vw, 28px);`;
const ReelCard = styled.div`
  position: relative; overflow: hidden; border-radius: clamp(18px, 2.4vw, 34px);
  height: clamp(340px, 62vh, 720px); background: #141414; border: 1px solid rgba(255,255,255,0.14);
  .fill { position: absolute; inset: 0; }
  a.pill { position: absolute; left: 50%; top: clamp(18px, 3vw, 34px); transform: translateX(-50%); white-space: nowrap;
    padding: 14px 26px; border-radius: 999px; text-decoration: none; font-family: ${fonts.heading}; font-weight: 600; font-size: 1rem; color: #fff;
    background: rgba(255,255,255,0.14); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.2); transition: background 0.2s, color 0.2s; }
  a.pill:hover { background: #fff; color: ${INK}; }
  .cap { position: absolute; left: clamp(16px, 2.4vw, 32px); bottom: clamp(14px, 2vw, 28px); color: #fff; }
  .cap b { display: block; font-family: ${fonts.heading}; font-size: clamp(1.1rem, 1.8vw, 1.5rem); letter-spacing: -0.02em; }
  .cap span { font-family: ${MONO}; font-size: 0.78rem; letter-spacing: 0.04em; text-transform: uppercase; opacity: 0.75; }
`;

/* ------------------------------- statement ------------------------------- */
const Block = styled.section`padding: clamp(72px, 11vw, 170px) 0 ${(p) => (p.$tight ? 'clamp(36px, 5vw, 70px)' : 'clamp(72px, 11vw, 170px)')};`;
const Big = styled.h2`
  ${display} color: ${INK}; font-size: clamp(2.7rem, 8.2vw, 7.6rem); max-width: 12em; margin: 0;
  em { font-style: normal; color: ${SUN}; }
`;
const Links = styled.ul`
  list-style: none; margin: clamp(40px, 6vw, 90px) 0 0; padding: 0; display: grid; gap: 6px;
  a { ${display} line-height: 1.2; font-size: clamp(1.25rem, 2.3vw, 2rem); text-decoration: none; display: inline-flex; align-items: center; gap: 0.5em; }
  a::after { content: '→'; font-weight: 400; transition: transform 0.2s; }
  a:hover { color: ${SUN}; } a:hover::after { transform: translateX(8px); }
`;

const Label = styled.div`
  font-family: ${MONO}; font-size: 0.8rem; letter-spacing: 0.06em; text-transform: uppercase; color: ${(p) => (p.$light ? 'rgba(255,255,255,0.6)' : DIM)};
  padding-top: 14px; border-top: 1px solid ${(p) => (p.$light ? 'rgba(255,255,255,0.2)' : 'rgba(10,10,10,0.16)')}; margin-bottom: clamp(20px, 3vw, 40px);
`;

/* -------------------------------- numbers -------------------------------- */
const Numbers = styled.div`
  display: grid; grid-template-columns: repeat(3, 1fr); gap: clamp(16px, 3vw, 48px);
  div { border-top: 1px solid rgba(10,10,10,0.16); padding-top: 14px; }
  b { ${display} display: block; font-size: clamp(3rem, 9vw, 8.5rem); }
  span { display: block; margin-top: 8px; font-size: clamp(0.95rem, 1.3vw, 1.15rem); color: ${DIM}; max-width: 16em; }
  @media (max-width: 640px) { grid-template-columns: 1fr; }
`;

/* --------------------------------- work ---------------------------------- */
const Work = styled.div`display: grid; gap: clamp(10px, 1.4vw, 18px);`;
const Shot = styled(Link)`
  position: relative; display: block; overflow: hidden; border-radius: clamp(18px, 2.4vw, 34px); aspect-ratio: 16 / 9; background: #1b1b1b; color: #fff; text-decoration: none;
  img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 1.2s cubic-bezier(0.2, 0.7, 0.2, 1); }
  &:hover img { transform: scale(1.04); }
  &::after { content: ''; position: absolute; inset: 40% 0 0; background: linear-gradient(transparent, rgba(0,0,0,0.72)); }
  .cap { position: absolute; z-index: 1; left: clamp(16px, 2.4vw, 32px); right: 16px; bottom: clamp(14px, 2vw, 28px); color: #fff; }
  .cap b { display: block; font-family: ${fonts.heading}; font-weight: 600; font-size: clamp(1.2rem, 2.4vw, 2.1rem); letter-spacing: -0.03em; color: #fff; }
  .cap span { font-family: ${MONO}; font-size: clamp(0.7rem, 1vw, 0.82rem); letter-spacing: 0.04em; text-transform: uppercase; opacity: 0.8; }
  @media (max-width: 640px) { aspect-ratio: 4 / 5; }
`;

/* ----------------------------- lists of rows ----------------------------- */
const Rows = styled.ol`
  list-style: none; margin: 0; padding: 0;
  li { display: grid; grid-template-columns: 5.5rem minmax(0, 1fr) minmax(0, 1.15fr); gap: clamp(12px, 3vw, 48px); align-items: baseline;
    padding: clamp(18px, 2.4vw, 32px) 0; border-top: 1px solid rgba(10,10,10,0.16); }
  li:last-child { border-bottom: 1px solid rgba(10,10,10,0.16); }
  i { font-style: normal; font-family: ${MONO}; font-size: 0.82rem; color: ${DIM}; }
  h3 { ${display} line-height: 1.05; font-size: clamp(1.45rem, 3.2vw, 2.9rem); color: ${INK}; margin: 0; transition: color 0.2s; }
  p { color: ${DIM}; font-size: clamp(0.98rem, 1.25vw, 1.15rem); line-height: 1.5; margin: 0; max-width: 34em; }
  li:hover h3 { color: ${SUN}; }
  @media (max-width: 760px) { li { grid-template-columns: 2.6rem minmax(0, 1fr); } p { grid-column: 2; } }
`;

const Steps = styled.ol`
  list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: clamp(14px, 2vw, 32px);
  li { border-top: 1px solid rgba(10,10,10,0.16); padding-top: 14px; }
  b { ${display} display: block; font-size: clamp(2.6rem, 5vw, 4.6rem); color: ${INK}; }
  h3 { font-family: ${fonts.heading}; font-weight: 600; letter-spacing: -0.02em; font-size: 1.15rem; margin: 14px 0 6px; color: ${INK}; }
  p { color: ${DIM}; font-size: 0.96rem; line-height: 1.5; margin: 0; }
  @media (max-width: 960px) { grid-template-columns: 1fr 1fr; }
  @media (max-width: 520px) { grid-template-columns: 1fr; }
`;

/* -------------------------------- voices --------------------------------- */
const Voices = styled.div`
  display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: clamp(24px, 4vw, 72px);
  blockquote { margin: 0; ${display} line-height: 1.16; letter-spacing: -0.03em; font-size: clamp(1.25rem, 2.3vw, 2rem); color: ${INK};
    display: -webkit-box; -webkit-line-clamp: 7; -webkit-box-orient: vertical; overflow: hidden; }
  figure { margin: 0; border-top: 1px solid rgba(10,10,10,0.16); padding-top: 18px; }
  figcaption { margin-top: 18px; font-family: ${MONO}; font-size: 0.78rem; letter-spacing: 0.04em; text-transform: uppercase; color: ${DIM}; }
  @media (max-width: 760px) { grid-template-columns: 1fr; }
`;

/* --------------------------------- close --------------------------------- */
const Close = styled.section`
  background: ${INK}; color: #fff; padding: clamp(72px, 11vw, 170px) 0 clamp(40px, 6vw, 80px);
  h2 { ${display} color: #fff; font-size: clamp(4rem, 17vw, 16rem); line-height: 0.82; margin: 0 0 clamp(28px, 4vw, 60px) -0.04em; }
  .grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: clamp(16px, 3vw, 48px); }
  .grid div { border-top: 1px solid rgba(255,255,255,0.2); padding-top: 14px; }
  small { display: block; font-family: ${MONO}; font-size: 0.78rem; letter-spacing: 0.06em; text-transform: uppercase; color: rgba(255,255,255,0.6); margin-bottom: 10px; }
  .grid a, .grid span { ${display} line-height: 1.15; font-size: clamp(1.2rem, 2.2vw, 1.9rem); text-decoration: none; display: block; }
  .grid a:hover { color: ${SUN}; }
  @media (max-width: 760px) { .grid { grid-template-columns: 1fr; } }
`;

/** True when the browser can draw WebGL and the visitor has not asked for reduced motion. */
function useCan3D() {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    try { const c = document.createElement('canvas'); setOk(Boolean(c.getContext('webgl2') || c.getContext('webgl'))); } catch { setOk(false); }
  }, []);
  return ok;
}

/** Tells a 3D stage whether it is on screen, so it only draws when someone can see it. */
function useOnScreen() {
  const ref = useRef(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') { setOn(true); return undefined; }
    const io = new IntersectionObserver(([e]) => setOn(e.isIntersecting), { threshold: 0.02 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, on];
}

const num = (i) => String(i + 1).padStart(2, '0');

export default function Landing() {
  const can3D = useCan3D();
  const [heroRef, heroOn] = useOnScreen();
  const [reelRef, reelOn] = useOnScreen();
  const work = usePublicContent('public/showcase', projects).filter((p) => p.image).slice(0, 3);
  const voices = usePublicContent('public/reviews', reviews).slice(0, 2);
  useEffect(() => { document.title = `${company.name} | Solar for homes & businesses`; }, []);

  return (
    <Page>
      <Hero ref={heroRef}>
        {can3D && <Stage aria-hidden="true"><Suspense fallback={null}><PanelStage active={heroOn} /></Suspense></Stage>}
        <Wrap style={{ width: '100%' }}>
          <HeroCopy>
            <h1>Noor.</h1>
            <p>It means light. We turn it into power for your home and business. <Link to="/contact">Book a free site survey</Link></p>
          </HeroCopy>
        </Wrap>
      </Hero>

      <Reel>
        <ReelCard ref={reelRef}>
          {can3D && <div className="fill" aria-hidden="true"><Suspense fallback={null}><PanelStage field active={reelOn} /></Suspense></div>}
          <Link className="pill" to="/planner">Design your system in 3D</Link>
          <div className="cap"><b>Solar Planner</b><span>Your roof, your load, your numbers — live</span></div>
        </ReelCard>
      </Reel>

      <Block $tight>
        <Wrap>
          <Big>We make electricity bills <em>disappear.</em></Big>
          <Links>
            <li><Link to="/planner">Design my solar system</Link></li>
            <li><Link to="/projects">See what we have built</Link></li>
            <li><a href={whatsappLink()} target="_blank" rel="noopener noreferrer">Talk to us on WhatsApp</a></li>
          </Links>
        </Wrap>
      </Block>

      <Block>
        <Wrap>
          <Numbers>
            <div><b>{company.projectsCompleted}</b><span>solar systems installed for homes and businesses</span></div>
            <div><b>{company.yearsInBusiness}</b><span>years designing, installing and looking after them</span></div>
            <div><b>24/7</b><span>power with hybrid systems, through load-shedding and after dark</span></div>
          </Numbers>
        </Wrap>
      </Block>

      {work.length > 0 && (
        <Block $tight style={{ paddingTop: 0 }}>
          <Wrap>
            <Label>Selected work</Label>
            <Work>
              {work.map((p) => (
                <Shot key={p._id || p.id || p.title} to="/projects">
                  <img src={assetUrl(p.image)} alt={`${p.title}${p.location ? ` — ${p.location}` : ''}`} loading="lazy" />
                  <div className="cap"><b>{p.title}</b><span>{[p.location, (p.highlights || [])[0]].filter(Boolean).join(' · ')}</span></div>
                </Shot>
              ))}
            </Work>
            <Links style={{ marginTop: 'clamp(24px, 3vw, 44px)' }}><li><Link to="/projects">All projects</Link></li></Links>
          </Wrap>
        </Block>
      )}

      <Block>
        <Wrap>
          <Label>What we do</Label>
          <Rows>
            {SERVICES.map((s, i) => <li key={s.title}><i>{num(i)}</i><h3>{s.title}</h3><p>{s.text}</p></li>)}
          </Rows>
        </Wrap>
      </Block>

      <Block style={{ paddingTop: 0 }}>
        <Wrap>
          <Big style={{ marginBottom: 'clamp(40px, 6vw, 90px)' }}>From first call to <em>switch-on</em> in five steps.</Big>
          <Steps>
            {STEPS.map((s, i) => <li key={s.title}><b>{i + 1}</b><h3>{s.title}</h3><p>{s.text}</p></li>)}
          </Steps>
        </Wrap>
      </Block>

      {voices.length > 0 && (
        <Block style={{ paddingTop: 0 }}>
          <Wrap>
            <Label>In our clients’ words</Label>
            <Voices>
              {voices.map((v) => (
                <figure key={v._id || v.name}>
                  <blockquote>“{v.text}”</blockquote>
                  <figcaption>{[v.name, v.location].filter(Boolean).join(' · ')}</figcaption>
                </figure>
              ))}
            </Voices>
          </Wrap>
        </Block>
      )}

      <Block style={{ paddingTop: 0 }}>
        <Wrap>
          <Label>Questions people ask</Label>
          <Rows>
            {FAQS.map((f, i) => <li key={f.q}><i>{num(i)}</i><h3 style={{ fontSize: 'clamp(1.2rem, 2.1vw, 1.8rem)' }}>{f.q}</h3><p>{f.a}</p></li>)}
          </Rows>
        </Wrap>
      </Block>

      <Close>
        <Wrap>
          <h2>Let’s talk.</h2>
          <div className="grid">
            <div><small>Call or WhatsApp</small><a href={`tel:${company.phones[0].tel}`}>{company.phones[0].display}</a><a href={`tel:${company.phones[1].tel}`}>{company.phones[1].display}</a></div>
            <div><small>Visit</small><span>{company.address.line1}</span><span>{company.address.line2}</span></div>
            <div><small>Start here</small><Link to="/contact">Book a free site survey →</Link><Link to="/planner">Open the Solar Planner →</Link></div>
          </div>
        </Wrap>
      </Close>
    </Page>
  );
}
