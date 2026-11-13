/* eslint-disable react/prop-types */
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGraduationCap, faSolarPanel, faLocationDot } from '@fortawesome/free-solid-svg-icons';
import { faLinkedinIn } from '@fortawesome/free-brands-svg-icons';
import { brand, fonts } from '../../styles/variables';
import { ceo, company } from '../../content/company';
import { Section, Container, Eyebrow, Heading, Reveal } from '../ui/primitives';

const Layout = styled.div`
  display: grid;
  grid-template-columns: 0.85fr 1.15fr;
  gap: clamp(32px, 6vw, 80px);
  align-items: center;
  @media (max-width: 900px) { grid-template-columns: 1fr; }
`;

const Portrait = styled.figure`
  position: relative;
  max-width: 440px;
  margin: 0 auto;
  width: 100%;
  &::before { content: ''; position: absolute; inset: 24px -18px -18px 24px; border-radius: 32px;
    background: linear-gradient(135deg, ${brand.gold}, ${brand.orange} 55%, ${brand.red}); }
  img { position: relative; width: 100%; aspect-ratio: 4 / 5; object-fit: cover; object-position: center 30%; border-radius: 28px;
    box-shadow: 0 30px 60px rgba(10,31,77,0.25); }
  figcaption { position: absolute; left: 18px; right: 18px; bottom: 18px; background: rgba(255,255,255,0.95);
    border-radius: 18px; padding: 14px 18px; box-shadow: 0 12px 30px rgba(10,31,77,0.18); }
  figcaption b { display: block; font-family: ${fonts.heading}; font-size: 1.1rem; color: ${brand.ink}; }
  figcaption span { color: ${brand.blue}; font-weight: 600; font-size: 0.88rem; }
`;

const Facts = styled.ul`
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 22px 0 26px;
  li { display: inline-flex; align-items: center; gap: 8px; padding: 9px 14px; border-radius: 12px;
    background: ${brand.bgSoft}; color: ${brand.navy}; font-weight: 600; font-size: 0.9rem; }
  svg { color: ${brand.orange}; }
`;

const Bio = styled.div`
  display: grid;
  gap: 14px;
  color: ${brand.muted};
  font-size: 1.04rem;
`;

const Sign = styled.div`
  margin-top: 26px;
  display: flex;
  align-items: center;
  gap: 16px;
  b { font-family: ${fonts.heading}; color: ${brand.ink}; display: block; }
  span { color: ${brand.muted}; font-size: 0.9rem; }
  a { margin-left: auto; width: 44px; height: 44px; border-radius: 12px; display: grid; place-items: center;
    background: ${brand.blue}; color: #fff; }
`;

function LeadershipSection({ tone }) {
  return (
    <Section id="leadership" $tone={tone}>
      <Container>
        <Layout>
          <Reveal>
            <Portrait>
              <img src={ceo.photo} alt={`${ceo.name}, ${ceo.role} of ${company.name}`} loading="lazy" />
              <figcaption><b>{ceo.name}</b><span>{ceo.role}</span></figcaption>
            </Portrait>
          </Reveal>
          <Reveal delay={0.1}>
            <Eyebrow>Leadership</Eyebrow>
            <Heading>Engineered by people who <span>live and breathe solar</span></Heading>
            <Facts>
              <li><FontAwesomeIcon icon={faGraduationCap} />{ceo.credential}</li>
              <li><FontAwesomeIcon icon={faSolarPanel} />{ceo.experience}</li>
              <li><FontAwesomeIcon icon={faLocationDot} />Peshawar, Pakistan</li>
            </Facts>
            <Bio>{ceo.bio.map((p) => <p key={p.slice(0, 20)}>{p}</p>)}</Bio>
            <Sign>
              <div><b>{ceo.name}</b><span>{ceo.role}, {company.name}</span></div>
              <a href={company.socials.linkedin} target="_blank" rel="noopener noreferrer" aria-label="Noor Electric Renewables on LinkedIn"><FontAwesomeIcon icon={faLinkedinIn} /></a>
            </Sign>
          </Reveal>
        </Layout>
      </Container>
    </Section>
  );
}

export default LeadershipSection;
