import styled, { keyframes } from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSolarPanel, faBolt, faShieldHalved, faArrowRight, faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { brand, fonts } from '../../styles/variables';
import { company, img, whatsappLink } from '../../content/company';
import { Container, ButtonLink, ButtonA, GridPattern } from '../ui/primitives';

const float = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
`;

const Hero = styled.section`
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(900px 500px at 85% 10%, ${brand.blue}aa 0%, transparent 60%),
    radial-gradient(700px 400px at 0% 100%, ${brand.blueBright}40 0%, transparent 60%),
    linear-gradient(160deg, ${brand.navy} 0%, #0d2a6b 55%, ${brand.blue} 100%);
  color: #fff;
  padding: clamp(56px, 8vw, 104px) 0 clamp(72px, 9vw, 120px);
`;

const Swoosh = styled.svg`
  position: absolute;
  right: -10%;
  bottom: -30%;
  width: 70%;
  max-width: 900px;
  opacity: 0.9;
  pointer-events: none;
  @media (max-width: 900px) { width: 140%; right: -50%; bottom: -12%; opacity: 0.5; }
`;

const Layout = styled.div`
  position: relative;
  display: grid;
  grid-template-columns: 1.05fr 1fr;
  gap: clamp(32px, 5vw, 64px);
  align-items: center;
  @media (max-width: 960px) { grid-template-columns: 1fr; }
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

const Visual = styled.div`
  position: relative;
  min-height: 460px;
  @media (max-width: 960px) { min-height: 0; margin-top: 8px; }
`;

const MainPhoto = styled.figure`
  position: relative;
  border-radius: 28px;
  overflow: hidden;
  border: 6px solid rgba(255,255,255,0.12);
  box-shadow: 0 40px 80px rgba(0,0,0,0.35);
  aspect-ratio: 16 / 11;
  img { width: 100%; height: 100%; object-fit: cover; }
  figcaption {
    position: absolute; left: 0; right: 0; bottom: 0;
    padding: 40px 20px 16px;
    background: linear-gradient(transparent, rgba(6,18,46,0.92));
    font-size: 0.9rem;
  }
  figcaption b { display: block; font-family: ${fonts.heading}; font-size: 1.05rem; }
`;

const FloatCard = styled.div`
  position: absolute;
  background: #fff;
  color: ${brand.ink};
  border-radius: 18px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.25);
  animation: ${float} 5s ease-in-out infinite;
  animation-delay: ${(p) => p.$delay || '0s'};
  i { width: 42px; height: 42px; border-radius: 12px; display: grid; place-items: center; font-style: normal;
    background: ${(p) => p.$tint || brand.gold}; color: ${(p) => (p.$tint ? '#fff' : brand.ink)}; font-size: 1.1rem; }
  b { display: block; font-family: ${fonts.heading}; font-size: 1.1rem; line-height: 1.1; }
  small { color: ${brand.muted}; font-size: 0.78rem; }
  @media (max-width: 960px) { position: static; animation: none; flex: 1 1 200px; }
`;

const SmallPhoto = styled.img`
  position: absolute;
  width: 34%;
  aspect-ratio: 3 / 4;
  object-fit: cover;
  border-radius: 20px;
  border: 5px solid #fff;
  box-shadow: 0 24px 48px rgba(0,0,0,0.35);
  right: -18px;
  top: -40px;
  width: 30%;
  @media (max-width: 960px) { display: none; }
`;

const MobileCards = styled.div`
  @media (max-width: 960px) { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 16px; }
`;

function HeroSection() {
  return (
    <Hero>
      <GridPattern />
      <Swoosh viewBox="0 0 800 600" aria-hidden="true">
        <defs>
          <linearGradient id="sw" x1="0" x2="1">
            <stop offset="0" stopColor={brand.gold} />
            <stop offset="0.6" stopColor={brand.orange} />
            <stop offset="1" stopColor={brand.red} />
          </linearGradient>
        </defs>
        <path d="M40 560 C 240 360, 520 300, 800 120 L 800 170 C 560 330, 300 400, 110 600 Z" fill="url(#sw)" opacity="0.85" />
        <path d="M0 600 C 200 470, 460 420, 800 300 L 800 316 C 470 440, 220 500, 30 600 Z" fill="#fff" opacity="0.12" />
      </Swoosh>
      <Container>
        <Layout>
          <div>
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
          </div>

          <Visual>
            <MainPhoto>
              <img src={img('install-40kw.jpg')} alt="Hybrid inverters and lithium battery banks installed by Noor Electric" width="886" height="510" />
              <figcaption><b>40 kW premium hybrid upgrade</b>4 × Inverex hybrid inverters · 2 lithium battery banks</figcaption>
            </MainPhoto>
            <SmallPhoto src={img('install-panels.jpg')} alt="Trina Solar bifacial panels on an elevated structure in Islamabad" loading="lazy" />
            <MobileCards>
              <FloatCard style={{ top: -22, left: -26 }}>
                <i><FontAwesomeIcon icon={faSolarPanel} /></i>
                <div><b>{company.projectsCompleted} projects</b><small>Homes &amp; businesses</small></div>
              </FloatCard>
              <FloatCard style={{ top: '46%', left: -40 }} $delay="1.2s" $tint={brand.blue}>
                <i><FontAwesomeIcon icon={faBolt} /></i>
                <div><b>24/7 backup</b><small>No more load-shedding</small></div>
              </FloatCard>
              <FloatCard style={{ bottom: -30, left: '22%' }} $delay="2.2s" $tint={brand.green}>
                <i><FontAwesomeIcon icon={faShieldHalved} /></i>
                <div><b>Full warranty</b><small>Expert installation</small></div>
              </FloatCard>
            </MobileCards>
          </Visual>
        </Layout>
      </Container>
    </Hero>
  );
}

export default HeroSection;
