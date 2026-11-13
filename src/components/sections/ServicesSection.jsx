/* eslint-disable react/prop-types */
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHouseChimney, faIndustry, faCarBattery, faFileContract, faScrewdriverWrench, faClipboardCheck,
} from '@fortawesome/free-solid-svg-icons';
import { brand, fonts } from '../../styles/variables';
import { brands } from '../../content/company';
import { Section, Container, Eyebrow, Heading, Lead, SectionHead, Grid, Reveal } from '../ui/primitives';

export const SERVICES = [
  { icon: faHouseChimney, title: 'Residential solar', text: 'On-grid and hybrid systems sized to your home’s real load, so you cut bills without overspending on panels you don’t need.' },
  { icon: faIndustry, title: 'Commercial & industrial', text: 'Larger arrays and parallel inverter setups for shops, offices and factories that need dependable daytime power.' },
  { icon: faCarBattery, title: 'Hybrid & battery backup', text: 'Lithium battery banks that keep the lights, fans and ACs running through the evening and during load-shedding.' },
  { icon: faFileContract, title: 'Net-metering & green meter', text: 'We prepare the files and coordinate the application so your extra solar units are credited back to you.' },
  { icon: faClipboardCheck, title: 'Free site survey & design', text: 'An engineer checks your roof, shading and wiring, then designs the system and gives you a clear quote.' },
  { icon: faScrewdriverWrench, title: 'Maintenance & support', text: 'Cleaning, health checks, inverter troubleshooting and upgrades to keep your system producing at its best.' },
];

const Card = styled.article`
  height: 100%;
  background: #fff;
  border: 1px solid ${brand.line};
  border-radius: 22px;
  padding: 30px 26px;
  position: relative;
  overflow: hidden;
  transition: transform 0.25s, box-shadow 0.25s, border-color 0.25s;
  &::after { content: ''; position: absolute; left: 0; right: 0; bottom: 0; height: 4px;
    background: linear-gradient(90deg, ${brand.gold}, ${brand.orange}); transform: scaleX(0); transform-origin: left; transition: transform 0.3s; }
  &:hover { transform: translateY(-6px); box-shadow: 0 24px 48px rgba(10,31,77,0.1); border-color: transparent; }
  &:hover::after { transform: scaleX(1); }
  .ico { width: 58px; height: 58px; border-radius: 16px; display: grid; place-items: center; font-size: 1.4rem;
    background: linear-gradient(135deg, ${brand.blue}, ${brand.blueBright}); color: #fff; margin-bottom: 22px;
    box-shadow: 0 12px 24px ${brand.blue}33; }
  h3 { font-size: 1.2rem; margin-bottom: 10px; }
  p { color: ${brand.muted}; font-size: 0.97rem; }
`;

const BrandRow = styled.div`
  margin-top: 56px;
  padding: 22px 26px;
  border-radius: 20px;
  background: #fff;
  border: 1px solid ${brand.line};
  display: flex;
  align-items: center;
  gap: 18px 32px;
  flex-wrap: wrap;
  justify-content: center;
  small { font-weight: 700; color: ${brand.muted}; letter-spacing: 0.12em; text-transform: uppercase; font-size: 0.74rem; }
  span { font-family: ${fonts.heading}; font-weight: 700; font-size: 1.15rem; color: ${brand.navy}; opacity: 0.75; }
`;

function ServicesSection({ tone = 'soft' }) {
  return (
    <Section id="services" $tone={tone}>
      <Container>
        <SectionHead $center>
          <Eyebrow>What we do</Eyebrow>
          <Heading>End-to-end solar, <span>from survey to switch-on</span></Heading>
          <Lead>One team handles design, equipment, installation and paperwork — so you deal with one company and one point of contact.</Lead>
        </SectionHead>
        <Grid $cols={3}>
          {SERVICES.map((s, i) => (
            <Reveal key={s.title} delay={(i % 3) * 0.08}>
              <Card>
                <div className="ico"><FontAwesomeIcon icon={s.icon} /></div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </Card>
            </Reveal>
          ))}
        </Grid>
        <BrandRow>
          <small>Brands we install</small>
          {brands.map((b) => <span key={b}>{b}</span>)}
        </BrandRow>
      </Container>
    </Section>
  );
}

export default ServicesSection;
