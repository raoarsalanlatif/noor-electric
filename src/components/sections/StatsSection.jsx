import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPowerOff, faArrowTrendDown, faMoon, faAward, faShieldHalved, faLeaf,
} from '@fortawesome/free-solid-svg-icons';
import { brand } from '../../styles/variables';
import { company } from '../../content/company';
import { Section, Container, Eyebrow, Heading, Lead, Reveal, Tilt } from '../ui/primitives';

const Layout = styled.div`
  display: grid;
  grid-template-columns: 0.9fr 1.1fr;
  gap: 56px;
  align-items: center;
  @media (max-width: 960px) { grid-template-columns: 1fr; gap: 36px; }
`;

const Stats = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-top: 32px;
  div { background: linear-gradient(160deg, #fff, ${brand.bgSoft}); border: 1px solid ${brand.line}; border-radius: 18px; padding: 18px 16px;
    box-shadow: 0 14px 30px rgba(10,31,77,0.07), inset 0 1px 0 #fff; }
  b { display: block; font-family: 'Poppins', sans-serif; font-size: clamp(1.5rem, 3vw, 2rem); line-height: 1.1;
    background: linear-gradient(90deg, ${brand.blue}, ${brand.blueBright} 55%, ${brand.orange}); -webkit-background-clip: text; background-clip: text; color: transparent; }
  span { font-size: 0.85rem; color: ${brand.muted}; }
  @media (max-width: 420px) { grid-template-columns: 1fr 1fr; }
`;

const Benefits = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  @media (max-width: 560px) { grid-template-columns: 1fr; }
`;

const Benefit = styled.div`
  height: 100%;
  display: flex;
  gap: 16px;
  padding: 22px;
  border-radius: 20px;
  border: 1px solid ${brand.line};
  background: #fff;
  box-shadow: 0 10px 26px rgba(10,31,77,0.05);
  transition: box-shadow 0.25s, border-color 0.25s;
  &:hover { box-shadow: 0 26px 50px rgba(10,31,77,0.14); border-color: transparent; }
  i { flex-shrink: 0; width: 48px; height: 48px; border-radius: 14px; display: grid; place-items: center; font-style: normal;
    background: linear-gradient(145deg, #ffd25e, ${brand.gold} 55%, ${brand.orange}); color: ${brand.ink}; font-size: 1.15rem;
    box-shadow: 0 10px 20px ${brand.gold}55, 0 3px 0 #c98a0a, inset 0 2px 0 rgba(255,255,255,0.5); }
  h3 { font-size: 1.05rem; margin-bottom: 4px; }
  p { color: ${brand.muted}; font-size: 0.92rem; }
`;

const BENEFITS = [
  { icon: faPowerOff, title: 'No more load-shedding', text: 'Hybrid systems with battery storage keep essentials running when the grid goes down.' },
  { icon: faArrowTrendDown, title: 'Lower electricity bills', text: 'Use your own solar units first and export the surplus through net-metering.' },
  { icon: faMoon, title: 'Solar power day & night', text: 'Store daytime sun in lithium batteries and use it through the evening.' },
  { icon: faAward, title: 'Tier-1 brands', text: 'Trina Solar panels, Solis and Inverex inverters, and quality lithium batteries.' },
  { icon: faShieldHalved, title: 'Expert installation', text: 'Elevated steel structures, neat wiring and safe protection on every job.' },
  { icon: faLeaf, title: 'Clean & renewable', text: 'Every kWh from your roof is one less from fossil-fuel generation.' },
];

function StatsSection() {
  return (
    <Section>
      <Container>
        <Layout>
          <Reveal>
            <Eyebrow>Why Noor Electric</Eyebrow>
            <Heading>Stop being a tenant to the grid. <span>Own your energy.</span></Heading>
            <Lead>Pure savings, zero pollution and total peace of mind — with a local team in Peshawar that picks up the phone after installation.</Lead>
            <Stats>
              <div><b>{company.projectsCompleted}</b><span>domestic &amp; commercial projects</span></div>
              <div><b>{company.yearsInBusiness}</b><span>years in business</span></div>
              <div><b>{company.facebookFollowers}</b><span>Facebook followers</span></div>
            </Stats>
          </Reveal>
          <Benefits>
            {BENEFITS.map((b, i) => (
              <Reveal key={b.title} delay={(i % 2) * 0.08}>
                <Tilt radius={20} max={6}>
                  <Benefit>
                    <i><FontAwesomeIcon icon={b.icon} /></i>
                    <div><h3>{b.title}</h3><p>{b.text}</p></div>
                  </Benefit>
                </Tilt>
              </Reveal>
            ))}
          </Benefits>
        </Layout>
      </Container>
    </Section>
  );
}

export default StatsSection;
