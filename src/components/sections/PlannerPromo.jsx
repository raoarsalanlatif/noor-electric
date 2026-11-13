import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faPlug, faRulerCombined, faCubes, faChartLine } from '@fortawesome/free-solid-svg-icons';
import { brand, fonts } from '../../styles/variables';
import { Section, Container, Eyebrow, Heading, Lead, ButtonLink, GridPattern, Reveal } from '../ui/primitives';

const Layout = styled.div`
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
  align-items: center;
  @media (max-width: 900px) { grid-template-columns: 1fr; }
`;

const Steps = styled.ol`
  list-style: none;
  display: grid;
  gap: 12px;
  margin: 28px 0 32px;
  li { display: flex; gap: 14px; align-items: flex-start; color: rgba(255,255,255,0.85); }
  i { flex-shrink: 0; width: 38px; height: 38px; border-radius: 12px; display: grid; place-items: center;
    background: rgba(255,255,255,0.1); color: ${brand.gold}; font-style: normal; }
  b { color: #fff; display: block; font-family: ${fonts.heading}; }
`;

const Mock = styled.div`
  background: #0b1220;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 24px;
  padding: 20px;
  box-shadow: 0 40px 80px rgba(0,0,0,0.35);
  .top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
  .badge { padding: 6px 12px; border-radius: 10px; font-weight: 700; font-size: 0.8rem; border: 1px solid; }
  .ok { color: #6ee7b7; border-color: #34d39966; background: #34d39914; }
  .bad { color: #fca5a5; border-color: #ef444466; background: #ef444414; }
  .kpis { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px; }
  .kpi { background: #111827; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 10px 12px; }
  .kpi small { color: #94a3b8; font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.06em; }
  .kpi b { display: block; color: #fff; font-family: ${fonts.heading}; font-size: 1.15rem; }
  svg.chart { width: 100%; height: auto; display: block; }
`;

function PlannerPromo() {
  return (
    <Section $tone="dark">
      <GridPattern />
      <Container>
        <Layout>
          <Reveal>
            <Eyebrow $light>Interactive tool</Eyebrow>
            <Heading $light>See your solar system <span>before we build it</span></Heading>
            <Lead $light>Our Solar Planner turns your appliances and roof size into a live system design — and shows you honestly if it won’t fit.</Lead>
            <Steps>
              <li><i><FontAwesomeIcon icon={faPlug} /></i><span><b>Add your load</b>ACs, fans, fridge, motor — and how long they run.</span></li>
              <li><i><FontAwesomeIcon icon={faRulerCombined} /></i><span><b>Enter your roof</b>We calculate how many panels safely fit.</span></li>
              <li><i><FontAwesomeIcon icon={faCubes} /></i><span><b>Watch it build in 3D</b>Day and night simulation, battery and bill savings.</span></li>
            </Steps>
            <ButtonLink to="/planner">Open the Solar Planner <FontAwesomeIcon icon={faArrowRight} /></ButtonLink>
          </Reveal>
          <Reveal delay={0.1}>
            <Mock aria-hidden="true">
              <div className="top">
                <span className="badge ok">Doable — this system works</span>
                <FontAwesomeIcon icon={faChartLine} color={brand.gold} />
              </div>
              <div className="kpis">
                <div className="kpi"><small>System</small><b>8.8 kW</b></div>
                <div className="kpi"><small>Panels</small><b>16 / 24</b></div>
                <div className="kpi"><small>Payback</small><b>2.4 yrs</b></div>
              </div>
              <svg className="chart" viewBox="0 0 320 120">
                <defs>
                  <linearGradient id="ps" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={brand.gold} stopOpacity="0.7" /><stop offset="1" stopColor={brand.gold} stopOpacity="0" /></linearGradient>
                  <linearGradient id="pl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={brand.sky} stopOpacity="0.5" /><stop offset="1" stopColor={brand.sky} stopOpacity="0" /></linearGradient>
                </defs>
                <path d="M0 110 L80 110 C120 110 130 20 160 20 C190 20 200 110 240 110 L320 110 Z" fill="url(#ps)" stroke={brand.gold} strokeWidth="2" />
                <path d="M0 60 L40 62 L60 90 L100 92 L130 70 L170 74 L200 40 L250 42 L280 80 L320 60 L320 120 L0 120 Z" fill="url(#pl)" stroke={brand.sky} strokeWidth="2" />
              </svg>
            </Mock>
          </Reveal>
        </Layout>
      </Container>
    </Section>
  );
}

export default PlannerPromo;
