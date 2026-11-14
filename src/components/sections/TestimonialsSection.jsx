/* eslint-disable react/prop-types */
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQuoteLeft, faThumbsUp, faArrowRight, faStar, faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { faGoogle, faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { brand, fonts } from '../../styles/variables';
import { reviews, company } from '../../content/company';
import { Section, Container, Eyebrow, Heading, Lead, SectionHead, Grid, Reveal } from '../ui/primitives';
import { usePublicContent } from '../../lib/publicContent';

const Card = styled.figure`
  height: 100%;
  background: #fff;
  border-radius: 24px;
  padding: 32px;
  border: 1px solid ${brand.line};
  display: flex;
  flex-direction: column;
  position: relative;
  .q { color: ${brand.gold}; font-size: 2rem; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center; }
  .stars { display: inline-flex; gap: 3px; font-size: 0.95rem; color: ${brand.gold}; }
  .stars .off { color: ${brand.line}; }
  blockquote { font-size: 1.05rem; color: ${brand.text}; margin-bottom: 24px; flex: 1; }
  figcaption { display: flex; align-items: center; gap: 12px; }
  .av { width: 46px; height: 46px; border-radius: 50%; display: grid; place-items: center; color: #fff; font-family: ${fonts.heading};
    font-weight: 700; background: linear-gradient(135deg, ${brand.blue}, ${brand.sky}); }
  b { display: block; font-family: ${fonts.heading}; color: ${brand.ink}; }
  small { color: ${brand.muted}; display: inline-flex; align-items: center; gap: 6px; }
  small svg { color: ${brand.blue}; }
  small svg.facebook { color: #1877f2; }
  small svg.google { color: #ea4335; }
  small svg.whatsapp { color: #25d366; }
`;

const Link = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-top: 28px;
  color: ${brand.blue};
  font-weight: 700;
  text-decoration: none;
  &:hover { text-decoration: underline; }
`;

const initials = (n) => n.split(' ').filter(Boolean).map((p) => p[0]).slice(0, 2).join('').toUpperCase();

function SourceLine({ r }) {
  const where = r.location ? ` · ${r.location}` : '';
  if (r.source === 'facebook' || !r.source) {
    return <small><FontAwesomeIcon icon={faThumbsUp} className="facebook" /> Recommends {company.shortName} on Facebook{where}</small>;
  }
  if (r.source === 'google') return <small><FontAwesomeIcon icon={faGoogle} className="google" /> Google review{where}</small>;
  if (r.source === 'whatsapp') return <small><FontAwesomeIcon icon={faWhatsapp} className="whatsapp" /> Verified customer via WhatsApp{where}</small>;
  return <small><FontAwesomeIcon icon={faCircleCheck} /> Verified customer{where}</small>;
}

function Stars({ n }) {
  if (!n) return null;
  return (
    <span className="stars" role="img" aria-label={`${n} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => <FontAwesomeIcon key={i} icon={faStar} className={i <= n ? '' : 'off'} />)}
    </span>
  );
}

function TestimonialsSection() {
  const list = usePublicContent('public/reviews', reviews);
  if (!list.length) return null;
  return (
    <Section $tone="soft">
      <Container>
        <SectionHead $center>
          <Eyebrow>Customer reviews</Eyebrow>
          <Heading>What our customers <span>say about us</span></Heading>
          <Lead>Feedback from homeowners and businesses we’ve powered with solar.</Lead>
        </SectionHead>
        <Grid $cols={list.length >= 3 ? 3 : 2}>
          {list.map((r, i) => (
            <Reveal key={r._id || r.name} delay={(i % 3) * 0.1}>
              <Card>
                <div className="q"><FontAwesomeIcon icon={faQuoteLeft} /><Stars n={r.rating} /></div>
                <blockquote>{r.text}</blockquote>
                <figcaption>
                  <div className="av">{initials(r.name)}</div>
                  <div>
                    <b>{r.name}</b>
                    <SourceLine r={r} />
                  </div>
                </figcaption>
              </Card>
            </Reveal>
          ))}
        </Grid>
        <div style={{ textAlign: 'center' }}>
          <Link href={`${company.socials.facebook}/reviews`} target="_blank" rel="noopener noreferrer">
            Read all reviews on Facebook <FontAwesomeIcon icon={faArrowRight} />
          </Link>
        </div>
      </Container>
    </Section>
  );
}

export default TestimonialsSection;
