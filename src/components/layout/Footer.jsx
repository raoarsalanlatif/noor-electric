import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebookF, faInstagram, faLinkedinIn, faTiktok, faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { faLocationDot, faPhone } from '@fortawesome/free-solid-svg-icons';
import { brand, fonts } from '../../styles/variables';
import { company, img, whatsappLink } from '../../content/company';
import { Container } from '../ui/primitives';

const Wrap = styled.footer`
  background: ${brand.ink};
  color: rgba(255,255,255,0.72);
  padding: 72px 0 0;
  position: relative;
  &::before { content: ''; position: absolute; inset: 0 0 auto 0; height: 4px;
    background: linear-gradient(90deg, ${brand.gold}, ${brand.orange}, ${brand.red}, ${brand.sky}, ${brand.blue}); }
`;

const Cols = styled.div`
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr 1.3fr;
  gap: 40px;
  @media (max-width: 900px) { grid-template-columns: 1fr 1fr; }
  @media (max-width: 560px) { grid-template-columns: 1fr; }
  h4 { color: #fff; font-size: 1rem; margin-bottom: 16px; font-family: ${fonts.heading}; }
  ul { list-style: none; display: grid; gap: 10px; }
  a { text-decoration: none; transition: color 0.2s; }
  a:hover { color: ${brand.gold}; }
`;

const BrandBlock = styled.div`
  .row { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
  .row img { width: 52px; height: 52px; }
  strong { color: #fff; font-family: ${fonts.heading}; font-size: 1.15rem; display: block; }
  em { color: ${brand.gold}; font-style: normal; font-size: 0.85rem; }
  p { font-size: 0.93rem; max-width: 340px; }
`;

const Socials = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 20px;
  a { width: 40px; height: 40px; display: grid; place-items: center; border-radius: 12px; background: rgba(255,255,255,0.08); color: #fff; }
  a:hover { background: ${brand.gold}; color: ${brand.ink}; }
`;

const ContactItem = styled.li`
  display: flex;
  gap: 12px;
  font-size: 0.93rem;
  svg { color: ${brand.gold}; margin-top: 4px; width: 14px; }
`;

const Bottom = styled.div`
  border-top: 1px solid rgba(255,255,255,0.08);
  margin-top: 56px;
  padding: 22px 0;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  font-size: 0.85rem;
`;

export const SOCIALS = [
  { href: company.socials.facebook, icon: faFacebookF, label: 'Facebook' },
  { href: company.socials.instagram, icon: faInstagram, label: 'Instagram' },
  { href: company.socials.linkedin, icon: faLinkedinIn, label: 'LinkedIn' },
  { href: company.socials.tiktok, icon: faTiktok, label: 'TikTok' },
];

function Footer() {
  return (
    <Wrap>
      <Container>
        <Cols>
          <BrandBlock>
            <div className="row">
              <img src={img('logo-192.png')} alt="" width="52" height="52" loading="lazy" />
              <div><strong>{company.name}</strong><em>{company.tagline}</em></div>
            </div>
            <p>{company.bio}</p>
            <Socials>
              {SOCIALS.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}><FontAwesomeIcon icon={s.icon} /></a>
              ))}
            </Socials>
          </BrandBlock>

          <div>
            <h4>Company</h4>
            <ul>
              <li><Link to="/about">About us</Link></li>
              <li><Link to="/projects">Projects</Link></li>
              <li><Link to="/services">Services</Link></li>
              <li><Link to="/blog">Blog</Link></li>
              <li><Link to="/contact">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4>Solutions</h4>
            <ul>
              <li><Link to="/services">Residential solar</Link></li>
              <li><Link to="/services">Commercial solar</Link></li>
              <li><Link to="/services">Hybrid &amp; battery backup</Link></li>
              <li><Link to="/services">Net-metering</Link></li>
              <li><Link to="/planner">Solar Planner</Link></li>
            </ul>
          </div>

          <div>
            <h4>Get in touch</h4>
            <ul>
              <ContactItem><FontAwesomeIcon icon={faLocationDot} /><span>{company.address.line1},<br />{company.address.line2},<br />{company.address.city}</span></ContactItem>
              {company.phones.map((p) => (
                <ContactItem key={p.tel}><FontAwesomeIcon icon={faPhone} /><a href={`tel:${p.tel}`}>{p.display}</a></ContactItem>
              ))}
              <ContactItem><FontAwesomeIcon icon={faWhatsapp} /><a href={whatsappLink()} target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a></ContactItem>
            </ul>
          </div>
        </Cols>
        <Bottom>
          <span>© {new Date().getFullYear()} {company.legalName}. All rights reserved.</span>
          <span>Peshawar · Islamabad · Khyber Pakhtunkhwa · <Link to="/admin" style={{ opacity: 0.6 }}>Staff login</Link></span>
        </Bottom>
      </Container>
    </Wrap>
  );
}

export default Footer;
