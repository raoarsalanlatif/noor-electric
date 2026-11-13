/* eslint-disable react/prop-types */
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLocationDot, faCircleCheck, faArrowRight, faBolt } from '@fortawesome/free-solid-svg-icons';
import { faFacebookF } from '@fortawesome/free-brands-svg-icons';
import { brand, fonts } from '../../styles/variables';
import { projects, company } from '../../content/company';
import { Section, Container, Eyebrow, Heading, Lead, SectionHead, ButtonA, Reveal } from '../ui/primitives';

const Featured = styled.div`
  display: grid;
  grid-template-columns: 1.15fr 1fr 1fr;
  gap: 24px;
  @media (max-width: 1024px) { grid-template-columns: 1fr 1fr; }
  @media (max-width: 680px) { grid-template-columns: 1fr; }
`;

const Card = styled.article`
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid ${brand.line};
  border-radius: 24px;
  overflow: hidden;
  transition: transform 0.25s, box-shadow 0.25s;
  &:hover { transform: translateY(-6px); box-shadow: 0 30px 60px rgba(10,31,77,0.12); }
  ${(p) => p.$wide && '@media (min-width: 1025px) { grid-row: span 1; }'}
`;

const Media = styled.div`
  position: relative;
  aspect-ratio: 4 / 3;
  background: linear-gradient(135deg, ${brand.navy}, ${brand.blue});
  overflow: hidden;
  img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.6s; }
  ${Card}:hover & img { transform: scale(1.05); }
  .tag { position: absolute; top: 14px; left: 14px; background: ${brand.gold}; color: ${brand.ink};
    font-weight: 700; font-size: 0.75rem; padding: 6px 12px; border-radius: 999px; letter-spacing: 0.04em; }
  .thumbs { position: absolute; right: 12px; bottom: 12px; display: flex; gap: 6px; }
  .thumbs img { width: 52px; height: 52px; border-radius: 10px; border: 2px solid #fff; object-fit: cover; }
  .placeholder { position: absolute; inset: 0; display: grid; place-items: center; color: ${brand.gold}; font-size: 3.4rem; }
  .placeholder span { display: block; font-family: ${fonts.heading}; color: #fff; font-size: 1.6rem; font-weight: 800; text-align: center; }
`;

const Body = styled.div`
  padding: 22px 24px 26px;
  display: flex;
  flex-direction: column;
  flex: 1;
  .loc { display: flex; align-items: center; gap: 8px; color: ${brand.muted}; font-size: 0.85rem; margin-bottom: 6px; }
  .loc svg { color: ${brand.orange}; }
  h3 { font-size: 1.25rem; margin-bottom: 14px; }
  ul.hl { list-style: none; display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
  ul.hl li { background: ${brand.bgSoft}; color: ${brand.navy}; font-weight: 600; font-size: 0.8rem; padding: 6px 10px; border-radius: 8px; }
  dl { display: grid; gap: 8px; margin-top: auto; padding-top: 14px; border-top: 1px dashed ${brand.line}; }
  dl div { display: grid; grid-template-columns: 110px 1fr; gap: 10px; font-size: 0.88rem; }
  dt { color: ${brand.muted}; }
  dd { color: ${brand.text}; font-weight: 500; }
`;

const More = styled.div`
  margin-top: 40px;
  display: flex;
  justify-content: center;
`;

function ProjectCard({ p }) {
  return (
    <Card>
      <Media>
        {p.image ? (
          <img src={p.image} alt={`${p.title} — ${p.location}`} loading="lazy" />
        ) : (
          <div className="placeholder"><div><FontAwesomeIcon icon={faBolt} /><span>10 kW<br />On-Grid</span></div></div>
        )}
        <span className="tag"><FontAwesomeIcon icon={faCircleCheck} /> Project completed</span>
        {p.gallery.length > 1 && (
          <div className="thumbs">
            {p.gallery.slice(1).map((g) => <img key={g} src={g} alt="" loading="lazy" />)}
          </div>
        )}
      </Media>
      <Body>
        <div className="loc"><FontAwesomeIcon icon={faLocationDot} />{p.location}</div>
        <h3>{p.title}</h3>
        <ul className="hl">{p.highlights.map((h) => <li key={h}>{h}</li>)}</ul>
        <dl>
          {p.specs.map((s) => <div key={s.label}><dt>{s.label}</dt><dd>{s.value}</dd></div>)}
        </dl>
      </Body>
    </Card>
  );
}

function ProjectsSection({ tone }) {
  return (
    <Section id="projects" $tone={tone}>
      <Container>
        <SectionHead>
          <Eyebrow>Recent projects</Eyebrow>
          <Heading>Homes and businesses <span>powered by the sun</span></Heading>
          <Lead>Real installations by our team — the same brands and build quality we’ll use on your roof.</Lead>
        </SectionHead>
        <Featured>
          {projects.map((p, i) => (
            <Reveal key={p.id} delay={i * 0.08}><ProjectCard p={p} /></Reveal>
          ))}
        </Featured>
        <More>
          <ButtonA href={company.socials.facebook} target="_blank" rel="noopener noreferrer" $variant="outline">
            <FontAwesomeIcon icon={faFacebookF} /> See more projects on Facebook <FontAwesomeIcon icon={faArrowRight} />
          </ButtonA>
        </More>
      </Container>
    </Section>
  );
}

export default ProjectsSection;
