/* eslint-disable react/prop-types */
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { brand } from '../../styles/variables';
import { company } from '../../content/company';
import { Container, GridPattern } from '../ui/primitives';

const Wrap = styled.header`
  position: relative;
  overflow: hidden;
  padding: clamp(56px, 8vw, 96px) 0 clamp(48px, 6vw, 72px);
  background: linear-gradient(150deg, ${brand.navy}, #10306f 60%, ${brand.blue});
  color: #fff;
  h1 { color: #fff; font-size: clamp(2rem, 4.6vw, 3.2rem); font-weight: 800; margin: 10px 0 12px; }
  p { color: rgba(255,255,255,0.8); max-width: 640px; font-size: 1.08rem; }
  nav { font-size: 0.88rem; color: rgba(255,255,255,0.65); }
  nav a { color: ${brand.gold}; text-decoration: none; }
  &::after { content: ''; position: absolute; left: 0; right: 0; bottom: 0; height: 4px;
    background: linear-gradient(90deg, ${brand.gold}, ${brand.orange}, ${brand.red}); }
`;

/** Banner at the top of inner pages; also sets the document title. */
function PageHeader({ title, subtitle, crumb }) {
  useEffect(() => { document.title = `${crumb || title} | ${company.name}`; }, [title, crumb]);
  return (
    <Wrap>
      <GridPattern />
      <Container style={{ position: 'relative' }}>
        <nav aria-label="Breadcrumb"><Link to="/">Home</Link> / {crumb || title}</nav>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </Container>
    </Wrap>
  );
}

export default PageHeader;
