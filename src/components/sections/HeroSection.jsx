/* eslint-disable react/prop-types */
// Landing-page hero: headline on the left, a live 3D solar house on a floating island on the right.
// The 3D scene is loaded on demand; browsers without WebGL, and people who ask for reduced motion,
// get the installation photo instead.
import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSolarPanel, faBolt, faShieldHalved, faArrowRight, faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { brand, fonts } from '../../styles/variables';
import { company, img, whatsappLink } from '../../content/company';
import { Container, ButtonLink, ButtonA } from '../ui/primitives';

const HeroScene = lazy(() => import('../../features/landing3d/HeroScene'));

const float = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
`;
const drift = keyframes`from { background-position: 0 0; } to { background-position: 0 64px; }`;
const appear = keyframes`from { opacity: 0; } to { opacity: 1; }`;

const Hero = styled.section`
  position: relative;
  overflow: hidden;
  isolation: isolate;
  min-height: min(820px, calc(100vh - 76px));
  display: flex;
  align-items: center;
  background:
    radial-gradient(720px 520px at 74% 38%, ${brand.blue}66 0%, transparent 62%),
    radial-gradient(520px 380px at 80% 30%, ${brand.gold}26 0%, transparent 60%),
    radial-gradient(900px 600px at -10% 110%, ${brand.blueBright}33 0%, transparent 60%),
    linear-gradient(165deg, #050b1f 0%, ${brand.navy} 52%, #0b2a6e 100%);
  color: #fff;
  padding: clamp(48px, 6vw, 88px) 0 clamp(72px, 9vw, 120px);
  @media (max-width: 960px) { min-height: 0; padding-bottom: 40px; display: block; }
`;

/** A grid floor running to the horizon: gives the hero depth before the 3D scene has even loaded. */
const Floor = styled.div`
  position: absolute; left: -25%; right: -25%; bottom: 0; height: 42%; z-index: 0; pointer-events: none;
  transform: perspective(520px) rotateX(64deg); transform-origin: 50% 100%;
  background-image:
    linear-gradient(rgba(120,170,255,0.4) 1.5px, transparent 1.5px),
    linear-gradient(90deg, rgba(120,170,255,0.4) 1.5px, transparent 1.5px);
  background-size: 64px 64px;
  mask-image: linear-gradient(to top, #000 0%, transparent 82%);
  animation: ${drift} 5s linear infinite;
`;

const Copy = styled.div`
  position: relative; z-index: 2;
  max-width: 580px;
  @media (max-width: 1180px) { max-width: 500px; }
  @media (max-width: 960px) { max-width: none; }
`;

const Pill = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 7px 14px 7px 8px;
  border-radius: 999px;
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.18);
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 22px;
  i { width: 26px; height: 26px; border-radius: 50%; display: grid; place-items: center; background: ${brand.gold}; color: ${brand.ink}; font-size: 0.75rem; font-style: normal; }
`;

const Title = styled.h1`
  color: #fff;
  font-size: clamp(2.3rem, 5.4vw, 4rem);
  font-weight: 800;
  line-height: 1.06;
  margin-bottom: 20px;
  span {
    background: linear-gradient(90deg, ${brand.gold}, #ffd25e 40%, ${brand.orange});
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
`;

const Sub = styled.p`
  font-size: clamp(1.02rem, 1.6vw, 1.15rem);
  color: rgba(255,255,255,0.82);
  max-width: 560px;
  margin-bottom: 32px;
`;

const Ctas = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 36px;
  @media (max-width: 480px) { a { flex: 1 1 100%; } }
`;

const Checks = styled.ul`
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 10px 22px;
  font-size: 0.92rem;
  color: rgba(255,255,255,0.85);
  li { display: flex; align-items: center; gap: 8px; }
  svg { color: ${brand.gold}; }
`;

/** Where the 3D scene lives: the whole right side of the hero on wide screens, a band under the text on phones. */
const Stage = styled.div`
  position: absolute; top: 0; bottom: 0; right: 0; width: 62%; z-index: 1;
  canvas { animation: ${appear} 1.2s ease both; }
  @media (max-width: 960px) { position: relative; width: auto; padding: 0 16px; }
`;

const StageFill = styled.div`
  position: absolute; inset: 0;
  @media (max-width: 960px) { position: relative; height: 360px; margin: 0 -16px 6px; }
`;

const Poster = styled.figure`
  position: absolute; inset: 18% 6% 18% 26%;
  border-radius: 28px; overflow: hidden;
  border: 6px solid rgba(255,255,255,0.12);
  box-shadow: 0 40px 80px rgba(0,0,0,0.45);
  img { width: 100%; height: 100%; object-fit: cover; }
  figcaption { position: absolute; left: 0; right: 0; bottom: 0; padding: 40px 20px 16px; background: linear-gradient(transparent, rgba(6,18,46,0.92)); font-size: 0.9rem; }
  figcaption b { display: block; font-family: ${fonts.heading}; font-size: 1.05rem; }
  @media (max-width: 960px) { position: relative; inset: auto; aspect-ratio: 16 / 11; margin: 24px 0 14px; }
`;

/** Frosted-glass fact cards floating in front of the scene. */
const Chip = styled.div`
  position: absolute; z-index: 2;
  display: flex; align-items: center; gap: 12px;
  padding: 12px 16px 12px 12px; border-radius: 18px;
  background: rgba(12, 26, 62, 0.55); border: 1px solid rgba(255,255,255,0.16);
  backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
  box-shadow: 0 18px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.12);
  animation: ${float} 6s ease-in-out infinite; animation-delay: ${(p) => p.$delay || '0s'};
  i { width: 40px; height: 40px; border-radius: 12px; display: grid; place-items: center; font-style: normal; font-size: 1.05rem;
    background: ${(p) => p.$tint || brand.gold}; color: ${(p) => (p.$tint ? '#fff' : brand.ink)}; box-shadow: 0 8px 18px ${(p) => p.$tint || brand.gold}55; }
  b { display: block; font-family: ${fonts.heading}; font-size: 1.02rem; line-height: 1.15; color: #fff; }
  small { color: rgba(255,255,255,0.7); font-size: 0.76rem; }
  @media (max-width: 960px) { position: static; animation: none; flex: 1 1 200px; }
`;

const Chips = styled.div`
  @media (max-width: 960px) { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 4px; }
`;

/** True when the browser can draw WebGL and the visitor has not asked for reduced motion. */
function useCan3D() {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    try {
      const c = document.createElement('canvas');
      setOk(Boolean(c.getContext('webgl2') || c.getContext('webgl')));
    } catch { setOk(false); }
  }, []);
  return ok;
}

function HeroSection() {
  const can3D = useCan3D();
  const stage = useRef(null);
  const [inView, setInView] = useState(true);
  // stop drawing the scene once the hero has scrolled off the screen
  useEffect(() => {
    const el = stage.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.02 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const poster = (
    <Poster>
      <img src={img('install-40kw.jpg')} alt="Hybrid inverters and lithium battery banks installed by Noor Electric" width="886" height="510" />
      <figcaption><b>40 kW premium hybrid upgrade</b>4 × Inverex hybrid inverters · 2 lithium battery banks</figcaption>
    </Poster>
  );
  return (
    <Hero>
      <Floor />
      <Container>
        <Copy>
            <Pill><i><FontAwesomeIcon icon={faSolarPanel} /></i>{company.projectsCompleted} projects · {company.yearsInBusiness} years powering KP &amp; Islamabad</Pill>
            <Title>Reliable <span>solar solutions</span> for your home &amp; business</Title>
            <Sub>{company.bio}</Sub>
            <Ctas>
              <ButtonLink to="/planner">Design my solar system <FontAwesomeIcon icon={faArrowRight} /></ButtonLink>
              <ButtonA href={whatsappLink()} target="_blank" rel="noopener noreferrer" $variant="outline" $light>
                <FontAwesomeIcon icon={faWhatsapp} /> Free consultation
              </ButtonA>
            </Ctas>
            <Checks>
              <li><FontAwesomeIcon icon={faCircleCheck} />Free site survey</li>
              <li><FontAwesomeIcon icon={faCircleCheck} />Tier-1 panels &amp; inverters</li>
              <li><FontAwesomeIcon icon={faCircleCheck} />Net-metering handled</li>
            </Checks>
        </Copy>
      </Container>
      <Stage ref={stage}>
        {can3D ? (
          <StageFill aria-hidden="true"><Suspense fallback={null}><HeroScene active={inView} /></Suspense></StageFill>
        ) : poster}
        <Chips>
          <Chip style={{ top: '13%', left: '10%' }}>
            <i><FontAwesomeIcon icon={faSolarPanel} /></i>
            <div><b>{company.projectsCompleted} projects</b><small>Homes &amp; businesses</small></div>
          </Chip>
          <Chip style={{ top: '47%', right: '6%' }} $delay="1.4s" $tint={brand.blue}>
            <i><FontAwesomeIcon icon={faBolt} /></i>
            <div><b>Power day &amp; night</b><small>No more load-shedding</small></div>
          </Chip>
          <Chip style={{ bottom: '12%', left: '22%' }} $delay="2.6s" $tint={brand.green}>
            <i><FontAwesomeIcon icon={faShieldHalved} /></i>
            <div><b>Full warranty</b><small>Expert installation</small></div>
          </Chip>
        </Chips>
      </Stage>
    </Hero>
  );
}

export default HeroSection;
