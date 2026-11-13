import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBullseye, faEye, faHandshake } from '@fortawesome/free-solid-svg-icons';
import { brand, fonts } from '../../styles/variables';
import { company, img } from '../../content/company';
import { Section, Container, Eyebrow, Heading, Lead, Reveal } from '../ui/primitives';

const Layout = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: clamp(32px, 6vw, 72px);
  align-items: center;
  @media (max-width: 900px) { grid-template-columns: 1fr; }
`;

const Collage = styled.div`
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  img { width: 100%; height: 100%; object-fit: cover; border-radius: 20px; }
  .tall { grid-row: span 2; aspect-ratio: 3 / 4; }
  .sq { aspect-ratio: 1; }
  .badge { position: absolute; left: 50%; bottom: -26px; transform: translateX(-50%); display: flex; align-items: center; gap: 12px;
    background: #fff; padding: 12px 18px; border-radius: 18px; box-shadow: 0 20px 40px rgba(10,31,77,0.18); white-space: nowrap; }
  .badge img { width: 44px; height: 44px; border-radius: 0; }
  .badge b { font-family: ${fonts.heading}; color: ${brand.ink}; display: block; line-height: 1.1; }
  .badge span { font-size: 0.82rem; color: ${brand.orange}; font-weight: 600; }
`;

const Pillars = styled.div`
  display: grid;
  gap: 14px;
  margin-top: 28px;
  div { display: flex; gap: 14px; }
  i { flex-shrink: 0; width: 44px; height: 44px; border-radius: 12px; display: grid; place-items: center; font-style: normal;
    background: ${brand.blue}14; color: ${brand.blue}; }
  h3 { font-size: 1.02rem; margin-bottom: 2px; }
  p { color: ${brand.muted}; font-size: 0.94rem; }
`;

function AboutSection() {
  return (
    <Section id="about">
      <Container>
        <Layout>
          <Reveal>
            <Collage>
              <img className="tall" src={img('install-battery.jpg')} alt="Lithium battery storage installed by Noor Electric" loading="lazy" />
              <img className="sq" src={img('install-panels.jpg')} alt="Rooftop solar panels at sunset" loading="lazy" />
              <img className="sq" src={img('install-inverter.jpg')} alt="Solis hybrid inverter installation" loading="lazy" />
              <div className="badge">
                <img src={img('logo-192.png')} alt="" />
                <div><b>{company.name}</b><span>{company.tagline}</span></div>
              </div>
            </Collage>
          </Reveal>
          <Reveal delay={0.1}>
            <Eyebrow>About us</Eyebrow>
            <Heading>Your local solar partner in <span>Peshawar</span></Heading>
            <Lead>
              {company.name} designs and installs solar systems for homes and businesses across Khyber Pakhtunkhwa and Islamabad.
              From a single-family rooftop to multi-inverter commercial setups, we focus on honest sizing, quality equipment and clean workmanship.
            </Lead>
            <Pillars>
              <div><i><FontAwesomeIcon icon={faBullseye} /></i><span><h3>Our mission</h3><p>Make reliable, cost-effective solar easy for every home and business.</p></span></div>
              <div><i><FontAwesomeIcon icon={faEye} /></i><span><h3>Our vision</h3><p>A brighter, greener Pakistan where families own their energy instead of renting it from the grid.</p></span></div>
              <div><i><FontAwesomeIcon icon={faHandshake} /></i><span><h3>Our promise</h3><p>Customised packages, transparent quotes and support long after installation.</p></span></div>
            </Pillars>
          </Reveal>
        </Layout>
      </Container>
    </Section>
  );
}

export default AboutSection;
