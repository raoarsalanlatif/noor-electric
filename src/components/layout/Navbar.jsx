import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faXmark, faPhone, faGamepad } from '@fortawesome/free-solid-svg-icons';
import { brand, fonts } from '../../styles/variables';
import { company, img } from '../../content/company';
import { ButtonLink } from '../ui/primitives';

const Bar = styled.header`
  position: fixed;
  inset: 0 0 auto 0;
  z-index: 1000;
  background: rgba(255,255,255,${(p) => (p.$scrolled ? 0.96 : 1)});
  backdrop-filter: saturate(160%) blur(10px);
  border-bottom: 1px solid ${(p) => (p.$scrolled ? brand.line : 'transparent')};
  box-shadow: ${(p) => (p.$scrolled ? '0 6px 24px rgba(10,31,77,0.08)' : 'none')};
  transition: box-shadow 0.25s, border-color 0.25s;
`;

const Inner = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  height: 76px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  @media (max-width: 600px) { padding: 0 16px; height: 68px; }
`;

const NAV_BP = '1180px'; // below this width the links collapse into the menu

const Brand = styled(Link)`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
  text-decoration: none;
  white-space: nowrap;
  img { width: 46px; height: 46px; flex-shrink: 0; }
  strong { display: block; white-space: nowrap; font-family: ${fonts.heading}; font-weight: 800; font-size: 1.12rem; color: ${brand.navy}; line-height: 1.05; }
  small { display: block; font-family: ${fonts.heading}; font-weight: 700; font-size: 0.62rem; letter-spacing: 0.32em; color: #fff;
    background: ${brand.blue}; padding: 2px 6px; border-radius: 3px; margin-top: 3px; width: fit-content; }
  @media (max-width: 380px) { img { width: 40px; height: 40px; } strong { font-size: 1rem; } }
`;

const Links = styled.nav`
  display: flex;
  align-items: center;
  gap: 4px;
  a.link {
    font-weight: 600;
    font-size: 0.95rem;
    color: ${brand.text};
    text-decoration: none;
    padding: 8px 12px;
    border-radius: 8px;
    transition: color 0.2s, background 0.2s;
    white-space: nowrap;
  }
  a.link:hover { color: ${brand.blue}; background: ${brand.bgSoft}; }
  a.link.active { color: ${brand.blue}; }
  a.planner { color: ${brand.orange}; }
  a.play { color: #fff; background: linear-gradient(135deg, ${brand.blue}, ${brand.blueBright}); margin-left: 4px; }
  a.play:hover, a.play.active { color: #fff; background: ${brand.navy}; }

  @media (max-width: 1360px) { a.link { padding: 8px 9px; font-size: 0.92rem; } }

  @media (max-width: ${NAV_BP}) {
    position: fixed;
    top: 76px;
    left: 0;
    right: 0;
    flex-direction: column;
    align-items: stretch;
    gap: 2px;
    padding: 16px;
    background: #fff;
    border-bottom: 1px solid ${brand.line};
    box-shadow: 0 20px 40px rgba(10,31,77,0.12);
    transform: translateY(${(p) => (p.$open ? '0' : '-120%')});
    opacity: ${(p) => (p.$open ? 1 : 0)};
    transition: transform 0.3s ease, opacity 0.3s ease;
    a.link { padding: 14px 12px; font-size: 1.05rem; }
    a.play { margin-left: 0; }
  }
  @media (max-width: 600px) { top: 68px; }
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  .phone { display: flex; align-items: center; gap: 8px; color: ${brand.navy}; font-weight: 700; text-decoration: none; font-size: 0.92rem; white-space: nowrap; }
  .cta { white-space: nowrap; }
  .phone svg { color: ${brand.blue}; }
  @media (max-width: 1360px) { .phone { display: none; } }
  @media (max-width: ${NAV_BP}) { .cta { display: none; } }
`;

const MenuButton = styled.button`
  display: none;
  border: 1px solid ${brand.line};
  background: #fff;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  color: ${brand.navy};
  font-size: 1.2rem;
  cursor: pointer;
  @media (max-width: ${NAV_BP}) { display: grid; place-items: center; }
`;

const MobileCta = styled.div`
  display: none;
  @media (max-width: ${NAV_BP}) { display: flex; gap: 10px; margin-top: 10px; a { flex: 1; } }
`;

const NAV = [
  { to: '/', label: 'Home', end: true },
  { to: '/services', label: 'Services' },
  { to: '/projects', label: 'Projects' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => { setOpen(false); window.scrollTo(0, 0); }, [pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <Bar $scrolled={scrolled || open}>
      <Inner>
        <Brand to="/" aria-label={`${company.name} home`}>
          <img src={img('logo-192.png')} alt="" width="46" height="46" />
          <span><strong>Noor Electric</strong><small>RENEWABLES</small></span>
        </Brand>

        <Links $open={open} aria-label="Main">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className="link">{n.label}</NavLink>
          ))}
          <NavLink to="/planner" className="link planner">Solar Planner</NavLink>
          <NavLink to="/play" className="link play"><FontAwesomeIcon icon={faGamepad} /> Play</NavLink>
          <MobileCta>
            <ButtonLink to="/contact">Free site survey</ButtonLink>
          </MobileCta>
        </Links>

        <Actions>
          <a className="phone" href={`tel:${company.phones[0].tel}`}><FontAwesomeIcon icon={faPhone} />{company.phones[0].display}</a>
          <ButtonLink className="cta" to="/contact">Free site survey</ButtonLink>
          <MenuButton type="button" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen(!open)}>
            <FontAwesomeIcon icon={open ? faXmark : faBars} />
          </MenuButton>
        </Actions>
      </Inner>
    </Bar>
  );
}

export default Navbar;
