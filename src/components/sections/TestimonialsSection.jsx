import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQuoteLeft, faThumbsUp, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { faFacebookF } from '@fortawesome/free-brands-svg-icons';
import { brand, fonts } from '../../styles/variables';
import { reviews, company } from '../../content/company';
import { Section, Container, Eyebrow, Heading, Lead, SectionHead, Grid, Reveal } from '../ui/primitives';

const Card = styled.figure`
  height: 100%;
  background: #fff;
  border-radius: 24px;
  padding: 32px;
  border: 1px solid ${brand.line};
  display: flex;
  flex-direction: column;
  position: relative;
  .q { color: ${brand.gold}; font-size: 2rem; margin-bottom: 14px; }
  blockquote { font-size: 1.05rem; color: ${brand.text}; margin-bottom: 24px; flex: 1; }
  figcaption { display: flex; align-items: center; gap: 12px; }
  .av { width: 46px; height: 46px; border-radius: 50%; display: grid; place-items: center; color: #fff; font-family: ${fonts.heading};
    font-weight: 700; background: linear-gradient(135deg, ${brand.blue}, ${brand.sky}); }
  b { display: block; font-family: ${fonts.heading}; color: ${brand.ink}; }
  small { color: ${brand.muted}; display: inline-flex; align-items: center; gap: 6px; }
  small svg { color: #1877f2; }
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

const initials = (n) => n.split(' ').map((p) => p[0]).slice(0, 2).join('');

function TestimonialsSection() {
  return (
    <Section $tone="soft">
      <Container>
        <SectionHead $center>
          <Eyebrow>Customer reviews</Eyebrow>
          <Heading>What our customers <span>say about us</span></Heading>
          <Lead>Recommendations left by our customers on Facebook.</Lead>
        </SectionHead>
        <Grid $cols={2}>
          {reviews.map((r, i) => (
            <Reveal key={r.name} delay={i * 0.1}>
              <Card>
                <div className="q"><FontAwesomeIcon icon={faQuoteLeft} /></div>
                <blockquote>{r.text}</blockquote>
                <figcaption>
                  <div className="av">{initials(r.name)}</div>
                  <div>
                    <b>{r.name}</b>
                    <small><FontAwesomeIcon icon={faThumbsUp} /> Recommends {company.shortName} on <FontAwesomeIcon icon={faFacebookF} /> Facebook</small>
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
