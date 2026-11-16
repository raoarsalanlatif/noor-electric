/* eslint-disable react/prop-types */
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLocationDot, faCircleCheck, faArrowRight, faBolt } from '@fortawesome/free-solid-svg-icons';
import { faFacebookF } from '@fortawesome/free-brands-svg-icons';
import { brand, fonts } from '../../styles/variables';
import { projects, company } from '../../content/company';
import { Section, Container, Eyebrow, Heading, Lead, SectionHead, ButtonA, ButtonLink, Reveal } from '../ui/primitives';
import { usePublicContent, assetUrl } from '../../lib/publicContent';

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
  .placeholder > div { text-align: center; padding: 0 24px; }
  .placeholder span { display: block; font-family: ${fonts.heading}; color: #fff; font-size: 1.45rem; font-weight: 800; text-align: center; margin-top: 10px; line-height: 1.25; }
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
  gap: 12px;
  flex-wrap: wrap;
`;

function ProjectCard({ p }) {
  const image = assetUrl(p.image);
  const gallery = (p.gallery || []).map(assetUrl).filter((g) => g && g !== image);
  const highlights = p.highlights || [];
  const specs = p.specs || [];
  return (
    <Card>
      <Media>
        {image ? (
          <img src={image} alt={`${p.title}${p.location ? ` — ${p.location}` : ''}`} loading="lazy" />
        ) : (
          <div className="placeholder"><div><FontAwesomeIcon icon={faBolt} /><span>{p.title}</span></div></div>
        )}
        <span className="tag"><FontAwesomeIcon icon={faCircleCheck} /> Project completed</span>
        {gallery.length > 0 && (
          <div className="thumbs">
            {gallery.slice(0, 3).map((g) => <img key={g} src={g} alt="" loading="lazy" />)}
          </div>
        )}
      </Media>
      <Body>
        {p.location && <div className="loc"><FontAwesomeIcon icon={faLocationDot} />{p.location}</div>}
        <h3>{p.title}</h3>
        {highlights.length > 0 && <ul className="hl">{highlights.map((h) => <li key={h}>{h}</li>)}</ul>}
        {specs.length > 0 && (
          <dl>
            {specs.map((s) => <div key={s.label}><dt>{s.label}</dt><dd>{s.value}</dd></div>)}
          </dl>
        )}
      </Body>
    </Card>
  );
}

function ProjectsSection({ tone, limit }) {
  const all = usePublicContent('public/showcase', projects);
  const list = limit ? all.slice(0, limit) : all;
  if (!list.length) return null;
  return (
    <Section id="projects" $tone={tone}>
      <Container>
        <SectionHead>
          <Eyebrow>Recent projects</Eyebrow>
          <Heading>Homes and businesses <span>powered by the sun</span></Heading>
          <Lead>Real installations by our team — the same brands and build quality we’ll use on your roof.</Lead>
        </SectionHead>
        <Featured>
          {list.map((p, i) => (
            <Reveal key={p._id || p.id || p.title} delay={(i % 3) * 0.08}><ProjectCard p={p} /></Reveal>
          ))}
        </Featured>
        <More>
          {limit && all.length > limit && (
            <ButtonLink to="/projects">View all {all.length} projects <FontAwesomeIcon icon={faArrowRight} /></ButtonLink>
          )}
          <ButtonA href={company.socials.facebook} target="_blank" rel="noopener noreferrer" $variant="outline">
            <FontAwesomeIcon icon={faFacebookF} /> See more projects on Facebook <FontAwesomeIcon icon={faArrowRight} />
          </ButtonA>
        </More>
      </Container>
    </Section>
  );
}

export default ProjectsSection;
