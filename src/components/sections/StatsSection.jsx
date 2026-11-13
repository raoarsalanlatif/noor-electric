import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPowerOff, faArrowTrendDown, faMoon, faAward, faShieldHalved, faLeaf,
} from '@fortawesome/free-solid-svg-icons';
import { brand } from '../../styles/variables';
import { company } from '../../content/company';
import { Section, Container, Eyebrow, Heading, Lead, Reveal } from '../ui/primitives';

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
  div { background: ${brand.bgSoft}; border-radius: 18px; padding: 18px 16px; }
  b { display: block; font-family: 'Poppins', sans-serif; font-size: clamp(1.5rem, 3vw, 2rem); color: ${brand.blue}; line-height: 1.1; }
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
  i { flex-shrink: 0; width: 48px; height: 48px; border-radius: 14px; display: grid; place-items: center; font-style: normal;
    background: ${brand.gold}22; color: ${brand.orange}; font-size: 1.15rem; }
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
              <div><b>5+</b><span>years of solar engineering</span></div>
              <div><b>{company.facebookFollowers}</b><span>Facebook followers</span></div>
              <div><b>40 kW</b><span>largest recent hybrid upgrade</span></div>
            </Stats>
          </Reveal>
          <Benefits>
            {BENEFITS.map((b, i) => (
              <Reveal key={b.title} delay={(i % 2) * 0.08}>
                <Benefit>
                  <i><FontAwesomeIcon icon={b.icon} /></i>
                  <div><h3>{b.title}</h3><p>{b.text}</p></div>
                </Benefit>
              </Reveal>
            ))}
          </Benefits>
        </Layout>
      </Container>
    </Section>
  );
}

export default StatsSection;
