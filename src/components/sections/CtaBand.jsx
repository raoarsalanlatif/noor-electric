import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPhone, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { brand, fonts } from '../../styles/variables';
import { company } from '../../content/company';
import { Container, ButtonLink, ButtonA } from '../ui/primitives';

const Band = styled.section`
  padding: 0 0 clamp(64px, 8vw, 96px);
  background: ${(p) => p.$bg || '#fff'};
`;

const Box = styled.div`
  position: relative;
  overflow: hidden;
  border-radius: 28px;
  padding: clamp(32px, 5vw, 56px);
  background: linear-gradient(120deg, ${brand.gold} 0%, #ffc845 45%, ${brand.orange} 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
  &::after { content: ''; position: absolute; right: -80px; top: -80px; width: 280px; height: 280px; border-radius: 50%;
    border: 40px solid rgba(255,255,255,0.18); }
  h2 { font-size: clamp(1.6rem, 3.2vw, 2.3rem); color: ${brand.ink}; margin-bottom: 6px; position: relative; z-index: 1; }
  p { color: ${brand.navy}; font-weight: 500; position: relative; z-index: 1; }
  .actions { display: flex; gap: 12px; flex-wrap: wrap; position: relative; z-index: 1; }
  .phone { font-family: ${fonts.heading}; }
`;

// eslint-disable-next-line react/prop-types
function CtaBand({ bg }) {
  return (
    <Band $bg={bg}>
      <Container>
        <Box>
          <div>
            <h2>Ready to cut your electricity bill?</h2>
            <p>Book a free site survey — no obligation, no hidden charges.</p>
          </div>
          <div className="actions">
            <ButtonLink to="/contact" $variant="blue">Book free survey <FontAwesomeIcon icon={faArrowRight} /></ButtonLink>
            <ButtonA className="phone" href={`tel:${company.phones[0].tel}`} $variant="outline"><FontAwesomeIcon icon={faPhone} /> {company.phones[0].display}</ButtonA>
          </div>
        </Box>
      </Container>
    </Band>
  );
}

export default CtaBand;
