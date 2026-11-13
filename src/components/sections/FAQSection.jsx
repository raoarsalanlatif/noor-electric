import { useState } from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { brand, fonts } from '../../styles/variables';
import { Section, Container, Eyebrow, Heading, Lead, SectionHead } from '../ui/primitives';

const FAQS = [
  {
    q: 'What size solar system do I need?',
    a: 'It depends on what you run and for how long — mainly ACs, motors and geysers. Try our Solar Planner for an instant estimate, then we confirm the exact size during the free site survey.',
  },
  {
    q: 'What is the difference between on-grid and hybrid?',
    a: 'An on-grid system works with WAPDA and net-metering to cut your bill, but switches off during load-shedding. A hybrid system adds batteries so your home keeps running when the grid is down.',
  },
  {
    q: 'Do you handle net-metering and the green meter?',
    a: 'Yes. We prepare the documents and coordinate the net-metering application with your distribution company, so surplus solar units can be credited against your bill.',
  },
  {
    q: 'Which brands do you install?',
    a: 'We work with established brands such as Trina Solar panels, Solis and Inverex inverters, and lithium batteries from Zilo, Dongjin and Narada. We recommend the best fit for your budget and load.',
  },
  {
    q: 'How long does installation take?',
    a: 'Most homes are installed within a few days once equipment is on site. Larger commercial systems take longer — we give you a timeline with your quote.',
  },
  {
    q: 'Is there a warranty?',
    a: 'Panels, inverters and batteries carry their manufacturers’ warranties, and we stand behind our installation workmanship. Ask us for the exact terms for the equipment in your quote.',
  },
];

const List = styled.div`
  max-width: 860px;
  margin: 0 auto;
  display: grid;
  gap: 12px;
`;

const Item = styled.div`
  border: 1px solid ${(p) => (p.$open ? `${brand.blue}55` : brand.line)};
  border-radius: 18px;
  background: #fff;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-shadow: ${(p) => (p.$open ? '0 16px 36px rgba(10,31,77,0.08)' : 'none')};
  button {
    width: 100%;
    text-align: left;
    background: none;
    border: 0;
    padding: 20px 22px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    cursor: pointer;
    font-family: ${fonts.heading};
    font-weight: 600;
    font-size: 1.05rem;
    color: ${brand.ink};
  }
  .icon { flex-shrink: 0; width: 34px; height: 34px; border-radius: 10px; display: grid; place-items: center;
    background: ${(p) => (p.$open ? brand.gold : brand.bgSoft)}; color: ${brand.navy};
    transform: rotate(${(p) => (p.$open ? '45deg' : '0')}); transition: transform 0.25s, background 0.25s; }
  .answer { display: grid; grid-template-rows: ${(p) => (p.$open ? '1fr' : '0fr')}; transition: grid-template-rows 0.3s ease; }
  .answer > div { overflow: hidden; }
  .answer p { padding: 0 22px 22px; color: ${brand.muted}; }
`;

function FAQSection() {
  const [open, setOpen] = useState(0);
  return (
    <Section id="faq">
      <Container>
        <SectionHead $center>
          <Eyebrow>FAQ</Eyebrow>
          <Heading>Questions we <span>hear every day</span></Heading>
          <Lead>Still unsure? Message us on WhatsApp — an engineer will answer.</Lead>
        </SectionHead>
        <List>
          {FAQS.map((f, i) => (
            <Item key={f.q} $open={open === i}>
              <button type="button" aria-expanded={open === i} onClick={() => setOpen(open === i ? -1 : i)}>
                {f.q}
                <span className="icon"><FontAwesomeIcon icon={faPlus} /></span>
              </button>
              <div className="answer"><div><p>{f.a}</p></div></div>
            </Item>
          ))}
        </List>
      </Container>
    </Section>
  );
}

export default FAQSection;
