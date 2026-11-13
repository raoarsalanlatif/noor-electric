import { useState } from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLocationDot, faPhone, faClock, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { brand, fonts } from '../../styles/variables';
import { company, whatsappLink } from '../../content/company';
import { post } from '../../lib/api';
import { Section, Container, Eyebrow, Heading, Lead, ButtonEl } from '../ui/primitives';

const Layout = styled.div`
  display: grid;
  grid-template-columns: 1fr 1.1fr;
  gap: 32px;
  align-items: start;
  @media (max-width: 960px) { grid-template-columns: 1fr; }
`;

const Info = styled.div`
  display: grid;
  gap: 14px;
  margin-top: 28px;
`;

const InfoCard = styled.a`
  display: flex;
  gap: 16px;
  align-items: flex-start;
  padding: 18px 20px;
  border-radius: 18px;
  background: #fff;
  border: 1px solid ${brand.line};
  text-decoration: none;
  color: ${brand.text};
  transition: border-color 0.2s, transform 0.2s;
  &[href]:hover { border-color: ${brand.blue}; transform: translateY(-2px); }
  i { flex-shrink: 0; width: 46px; height: 46px; border-radius: 14px; display: grid; place-items: center; font-style: normal;
    background: ${(p) => p.$tint || brand.blue}; color: #fff; font-size: 1.1rem; }
  small { display: block; color: ${brand.muted}; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600; }
  b { font-family: ${fonts.heading}; font-size: 1.02rem; color: ${brand.ink}; }
`;

const Map = styled.iframe`
  width: 100%;
  height: 240px;
  border: 0;
  border-radius: 18px;
  margin-top: 14px;
`;

const Form = styled.form`
  background: #fff;
  border-radius: 26px;
  padding: clamp(22px, 4vw, 36px);
  box-shadow: 0 30px 70px rgba(10,31,77,0.12);
  border: 1px solid ${brand.line};
  h3 { font-size: 1.4rem; margin-bottom: 6px; }
  > p { color: ${brand.muted}; margin-bottom: 22px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .full { grid-column: 1 / -1; }
  @media (max-width: 560px) { .grid { grid-template-columns: 1fr; } }
  label { display: block; font-size: 0.85rem; font-weight: 600; color: ${brand.text}; margin-bottom: 6px; }
  input, select, textarea {
    width: 100%; padding: 13px 14px; border-radius: 12px; border: 1px solid ${brand.line}; background: ${brand.bgSoft};
    font: inherit; color: ${brand.text}; transition: border-color 0.2s, background 0.2s;
  }
  input:focus, select:focus, textarea:focus { outline: none; border-color: ${brand.blue}; background: #fff; }
  textarea { min-height: 110px; resize: vertical; }
  .err { color: ${brand.red}; font-size: 0.88rem; }
  .note { color: ${brand.muted}; font-size: 0.82rem; margin-top: 10px; text-align: center; }
`;

const SYSTEMS = ['Not sure yet', 'On-grid (net-metering)', 'Hybrid with battery', 'Commercial / industrial', 'Maintenance or upgrade'];

function ContactSection() {
  const [f, setF] = useState({ name: '', phone: '', city: '', system: SYSTEMS[0], bill: '', message: '', website: '' });
  const [err, setErr] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    if (!f.name.trim()) { setErr('Please enter your name.'); return; }
    if (f.phone.replace(/\D/g, '').length < 10) { setErr('Please enter a valid phone number.'); return; }
    setErr('');
    const text = [
      'Hi Noor Electric, I would like a free site survey.',
      `Name: ${f.name}`,
      `Phone: ${f.phone}`,
      f.city && `City / area: ${f.city}`,
      `Interested in: ${f.system}`,
      f.bill && `Average monthly bill: Rs ${f.bill}`,
      f.message && `Message: ${f.message}`,
    ].filter(Boolean).join('\n');
    window.open(whatsappLink(text), '_blank', 'noopener');
    // Also save the request in the admin panel (WhatsApp still opens if this fails).
    post('public/quotes', {
      source: 'contact', name: f.name, phone: f.phone, city: f.city, systemType: f.system,
      monthlyBill: f.bill.replace(/\D/g, ''), message: f.message, website: f.website,
    }).catch(() => {});
  };

  return (
    <Section id="contact" $tone="soft">
      <Container>
        <Layout>
          <div>
            <Eyebrow>Contact us</Eyebrow>
            <Heading>Book your <span>free site survey</span></Heading>
            <Lead>Visit our office in Peshawar, call us, or send your details and an engineer will get back to you on WhatsApp.</Lead>
            <Info>
              <InfoCard href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(company.address.mapQuery)}`} target="_blank" rel="noopener noreferrer">
                <i><FontAwesomeIcon icon={faLocationDot} /></i>
                <span><small>Office</small><b>{company.address.line1}</b><br />{company.address.line2}, {company.address.city}</span>
              </InfoCard>
              <InfoCard href={`tel:${company.phones[0].tel}`} $tint={brand.orange}>
                <i><FontAwesomeIcon icon={faPhone} /></i>
                <span><small>Call</small><b>{company.phones[0].display}</b><br />{company.phones[1].display}</span>
              </InfoCard>
              <InfoCard href={whatsappLink()} target="_blank" rel="noopener noreferrer" $tint="#25d366">
                <i><FontAwesomeIcon icon={faWhatsapp} /></i>
                <span><small>WhatsApp</small><b>Chat with an engineer</b><br />Fastest way to reach us</span>
              </InfoCard>
              <InfoCard as="div" $tint={brand.navy}>
                <i><FontAwesomeIcon icon={faClock} /></i>
                <span><small>Service areas</small><b>{company.serviceAreas.join(' · ')}</b></span>
              </InfoCard>
            </Info>
            <Map
              title="Noor Electric Renewables office location"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://www.google.com/maps?q=${encodeURIComponent(company.address.mapQuery)}&output=embed`}
            />
          </div>

          <Form onSubmit={submit} noValidate>
            <h3>Request a free consultation</h3>
            <p>Takes 30 seconds. We reply on WhatsApp.</p>
            <div className="grid">
              <div><label htmlFor="c-name">Full name</label><input id="c-name" value={f.name} onChange={set('name')} autoComplete="name" /></div>
              <div><label htmlFor="c-phone">Phone / WhatsApp</label><input id="c-phone" value={f.phone} onChange={set('phone')} inputMode="tel" autoComplete="tel" placeholder="03xx xxxxxxx" /></div>
              <div><label htmlFor="c-city">City / area</label><input id="c-city" value={f.city} onChange={set('city')} placeholder="e.g. Hayatabad, Peshawar" /></div>
              <div><label htmlFor="c-bill">Monthly bill (Rs)</label><input id="c-bill" value={f.bill} onChange={set('bill')} inputMode="numeric" placeholder="e.g. 25000" /></div>
              <div className="full">
                <label htmlFor="c-system">I’m interested in</label>
                <select id="c-system" value={f.system} onChange={set('system')}>{SYSTEMS.map((s) => <option key={s}>{s}</option>)}</select>
              </div>
              <div className="full"><label htmlFor="c-msg">Message (optional)</label><textarea id="c-msg" value={f.message} onChange={set('message')} /></div>
              <input type="text" name="website" value={f.website} onChange={set('website')} tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1 }} />
              {err && <div className="full err" role="alert">{err}</div>}
              <div className="full"><ButtonEl type="submit" style={{ width: '100%' }}><FontAwesomeIcon icon={faPaperPlane} /> Send on WhatsApp</ButtonEl></div>
            </div>
            <p className="note">Your details are only used to contact you about your solar enquiry.</p>
          </Form>
        </Layout>
      </Container>
    </Section>
  );
}

export default ContactSection;
