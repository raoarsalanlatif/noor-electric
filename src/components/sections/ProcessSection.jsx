import styled from 'styled-components';
import { brand, fonts } from '../../styles/variables';
import { Section, Container, Eyebrow, Heading, Lead, SectionHead, Reveal } from '../ui/primitives';

const STEPS = [
  { title: 'Free consultation', text: 'Tell us about your bill, load and goals on a call or WhatsApp.' },
  { title: 'Site survey', text: 'An engineer visits to check roof space, shading, structure and wiring.' },
  { title: 'Design & quote', text: 'You get a system design, equipment list and a clear, itemised price.' },
  { title: 'Installation', text: 'Structure, panels, inverter and batteries installed and tested by our team.' },
  { title: 'Net-metering & support', text: 'We handle the green meter paperwork and stay on call for after-sales support.' },
];

const Track = styled.ol`
  list-style: none;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 18px;
  position: relative;
  &::before { content: ''; position: absolute; top: 28px; left: 8%; right: 8%; height: 2px;
    background: repeating-linear-gradient(90deg, ${brand.blue}55 0 8px, transparent 8px 16px); }
  @media (max-width: 960px) {
    grid-template-columns: 1fr;
    &::before { top: 0; bottom: 0; left: 27px; right: auto; width: 2px; height: auto;
      background: repeating-linear-gradient(180deg, ${brand.blue}55 0 8px, transparent 8px 16px); }
  }
`;

const Step = styled.div`
  position: relative;
  text-align: center;
  .n { width: 56px; height: 56px; margin: 0 auto 16px; border-radius: 50%; display: grid; place-items: center;
    font-family: ${fonts.heading}; font-weight: 800; font-size: 1.2rem; color: ${brand.ink};
    background: ${brand.gold}; box-shadow: 0 0 0 8px ${brand.bgSoft}; position: relative; }
  h3 { font-size: 1.05rem; margin-bottom: 6px; }
  p { color: ${brand.muted}; font-size: 0.92rem; }
  @media (max-width: 960px) {
    text-align: left; display: grid; grid-template-columns: 56px 1fr; gap: 0 18px; align-items: start;
    .n { margin: 0; grid-row: span 2; }
  }
`;

function ProcessSection() {
  return (
    <Section $tone="soft">
      <Container>
        <SectionHead $center>
          <Eyebrow>How it works</Eyebrow>
          <Heading>Going solar in <span>five simple steps</span></Heading>
          <Lead>Clear communication at every stage — no surprises on price, timelines or paperwork.</Lead>
        </SectionHead>
        <Track>
          {STEPS.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.07} as="li">
              <Step>
                <div className="n">{i + 1}</div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </Step>
            </Reveal>
          ))}
        </Track>
      </Container>
    </Section>
  );
}

export default ProcessSection;
