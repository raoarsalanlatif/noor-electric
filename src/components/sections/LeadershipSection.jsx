/* eslint-disable react/prop-types */
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck, faAward } from '@fortawesome/free-solid-svg-icons';
import { faLinkedinIn } from '@fortawesome/free-brands-svg-icons';
import { brand, fonts } from '../../styles/variables';
import { leaders, company } from '../../content/company';
import { Section, Container, Eyebrow, Heading, Lead, Reveal } from '../ui/primitives';

const Intro = styled.div`
  text-align: center;
  max-width: 720px;
  margin: 0 auto clamp(40px, 6vw, 64px);
`;

const Profile = styled.article`
  display: grid;
  grid-template-columns: 0.8fr 1.2fr;
  gap: clamp(32px, 6vw, 80px);
  align-items: center;
  & + & { margin-top: clamp(64px, 9vw, 110px); }
  ${(p) => p.$flip && `
    grid-template-columns: 1.2fr 0.8fr;
    > :first-child { order: 2; }
  `}
  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    > :first-child { order: 0; }
  }
`;

const Portrait = styled.figure`
  position: relative;
  max-width: 420px;
  margin: 0 auto;
  width: 100%;
  &::before { content: ''; position: absolute; inset: 24px -18px -18px 24px; border-radius: 32px;
    background: ${(p) => (p.$alt
    ? `linear-gradient(135deg, ${brand.blue}, ${brand.navy})`
    : `linear-gradient(135deg, ${brand.gold}, ${brand.orange} 55%, ${brand.red})`)}; }
  img { position: relative; width: 100%; aspect-ratio: 4 / 5; object-fit: cover; border-radius: 28px;
    box-shadow: 0 30px 60px rgba(10,31,77,0.25); background: ${brand.bgSoft}; }
  figcaption { position: absolute; left: 18px; right: 18px; bottom: 18px; background: rgba(255,255,255,0.95);
    border-radius: 18px; padding: 14px 18px; box-shadow: 0 12px 30px rgba(10,31,77,0.18); }
  figcaption b { display: block; font-family: ${fonts.heading}; font-size: 1.1rem; color: ${brand.ink}; }
  figcaption span { color: ${brand.blue}; font-weight: 600; font-size: 0.88rem; }
`;

const Role = styled.p`
  font-family: ${fonts.heading};
  color: ${brand.orange};
  font-weight: 600;
  margin: -6px 0 4px;
`;

const Facts = styled.ul`
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 18px 0 22px;
  li { display: inline-flex; align-items: center; gap: 8px; padding: 8px 13px; border-radius: 12px;
    background: ${brand.bgSoft}; color: ${brand.navy}; font-weight: 600; font-size: 0.86rem; }
  svg { color: ${brand.orange}; }
`;

const Bio = styled.div`
  display: grid;
  gap: 12px;
  color: ${brand.muted};
  font-size: 1rem;
  line-height: 1.7;
`;

const Focus = styled.div`
  margin-top: 22px;
  h3 { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.08em; color: ${brand.navy}; margin-bottom: 10px; }
  ul { list-style: none; display: grid; grid-template-columns: 1fr 1fr; gap: 8px 18px; }
  li { display: flex; gap: 8px; align-items: flex-start; font-size: 0.93rem; color: ${brand.text}; }
  svg { color: ${brand.green}; margin-top: 4px; flex-shrink: 0; }
  @media (max-width: 520px) { ul { grid-template-columns: 1fr; } }
`;

const Sign = styled.div`
  margin-top: 24px;
  padding-top: 18px;
  border-top: 1px solid ${brand.line};
  display: flex;
  align-items: center;
  gap: 16px;
  b { font-family: ${fonts.heading}; color: ${brand.ink}; display: block; }
  span { color: ${brand.muted}; font-size: 0.88rem; }
  a { margin-left: auto; flex-shrink: 0; width: 44px; height: 44px; border-radius: 12px; display: grid; place-items: center;
    background: ${brand.blue}; color: #fff; }
`;

function LeaderProfile({ person, flip, alt }) {
  const link = person.linkedin || company.socials.linkedin;
  return (
    <Profile $flip={flip}>
      <Reveal>
        <Portrait $alt={alt}>
          <img src={person.photo} alt={`${person.name}, ${person.role} at ${company.legalName}`} loading="lazy" style={{ objectPosition: person.photoPosition }} />
          <figcaption><b>{person.name}</b><span>{person.role}</span></figcaption>
        </Portrait>
      </Reveal>
      <Reveal delay={0.1}>
        <Heading as="h3" style={{ fontSize: 'clamp(1.6rem, 3vw, 2.1rem)', marginBottom: 8 }}>{person.name}</Heading>
        <Role>{person.role}</Role>
        <Facts>{person.facts.map((f) => <li key={f}><FontAwesomeIcon icon={faAward} />{f}</li>)}</Facts>
        <Bio>{person.bio.map((p) => <p key={p.slice(0, 24)}>{p}</p>)}</Bio>
        <Focus>
          <h3>Areas of responsibility</h3>
          <ul>{person.focus.map((f) => <li key={f}><FontAwesomeIcon icon={faCircleCheck} />{f}</li>)}</ul>
        </Focus>
        <Sign>
          <div><b>{person.name}</b><span>{person.role}, {company.legalName}</span></div>
          <a href={link} target="_blank" rel="noopener noreferrer" aria-label={`${person.name} on LinkedIn`}><FontAwesomeIcon icon={faLinkedinIn} /></a>
        </Sign>
      </Reveal>
    </Profile>
  );
}

function LeadershipSection({ tone }) {
  return (
    <Section id="leadership" $tone={tone}>
      <Container>
        <Intro>
          <Reveal>
            <Eyebrow>Leadership</Eyebrow>
            <Heading>The team behind <span>{company.projectsCompleted} solar projects</span></Heading>
            <Lead>
              {company.legalName} is led by an engineer and an operator: one sets the technical standard for every system we build,
              the other makes sure the right equipment, technology and financing are in place to deliver it.
            </Lead>
          </Reveal>
        </Intro>
        {leaders.map((p, i) => <LeaderProfile key={p.name} person={p} flip={i % 2 === 1} alt={i % 2 === 1} />)}
      </Container>
    </Section>
  );
}

export default LeadershipSection;
