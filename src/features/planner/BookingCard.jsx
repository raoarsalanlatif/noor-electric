/* eslint-disable react/prop-types */
import { useState } from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarCheck, faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { Card, CardTitle, TextInput, Button, Label, t } from './ui';
import { PLANNER_CONFIG } from './config';
import { post } from '../../lib/api';

const Form = styled.form`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  @media (max-width: 600px) { grid-template-columns: 1fr; }
  .full { grid-column: 1 / -1; }
`;

const Done = styled.div`
  text-align: center;
  padding: 18px 8px;
  color: ${t.text};
  svg { color: ${t.green}; font-size: 2.2rem; margin-bottom: 10px; }
  p { color: ${t.muted}; margin: 6px 0 0; }
`;

const Error = styled.div` color: #fca5a5; font-size: 0.85rem; `;


function summary(plan, form) {
  const lines = [
    'Site visit request — Noor Electric Solar Planner',
    `Name: ${form.name}`,
    `Phone: ${form.phone}`,
    `Area: ${form.area}`,
    `Preferred date: ${form.date || 'any'}`,
    '',
    `City: ${plan.city.name}`,
    `Daily use: ${plan.dailyKWh.toFixed(1)} kWh, peak ${(plan.peakW / 1000).toFixed(1)} kW`,
    `Roof: ${Math.round(plan.layout.roofArea)} m² (fits ${plan.layout.maxPanels} panels)`,
    `Design: ${plan.chosen.panels} × ${plan.panel.watts} W, ${plan.chosen.inverterKW} kW inverter, ${plan.chosen.batteryKWh} kWh battery`,
    `Status: ${plan.status.toUpperCase()}${plan.issues.length ? ` — ${plan.issues.map((i) => i.title).join(', ')}` : ''}`,
  ];
  return lines.join('\n');
}

export default function BookingCard({ plan }) {
  const [form, setForm] = useState({ name: '', phone: '', area: '', date: '' });
  const [err, setErr] = useState('');
  const [sent, setSent] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    const digits = form.phone.replace(/\D/g, '');
    if (!form.name.trim()) return setErr('Please enter your name.');
    if (digits.length < 10) return setErr('Please enter a valid phone number.');
    setErr('');
    const text = summary(plan, form);
    window.open(`https://wa.me/${PLANNER_CONFIG.whatsappNumber}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
    // Save the request with the full design in the admin panel (WhatsApp still opens if this fails).
    post('public/quotes', {
      source: 'planner',
      name: form.name,
      phone: form.phone,
      area: form.area,
      city: plan.city.name,
      preferredDate: form.date,
      systemType: `${plan.systemKW.toFixed(1)} kW ${plan.chosen.batteryKWh ? 'hybrid' : 'on-grid'}`,
      monthlyBill: Math.round(plan.billBefore),
      plan: {
        summary: text,
        systemKW: Number(plan.systemKW.toFixed(2)),
        panels: plan.chosen.panels,
        inverterKW: plan.chosen.inverterKW,
        batteryKWh: plan.chosen.batteryKWh,
        dailyKWh: Number(plan.dailyKWh.toFixed(1)),
        status: plan.status,
        estimatedCost: Math.round(plan.cost),
      },
    }).catch(() => {});
    setSent(true);
    return undefined;
  };

  return (
    <Card id="book" style={{ borderColor: `${t.orange}55` }}>
      <CardTitle><FontAwesomeIcon icon={faCalendarCheck} /> &nbsp;Book a free site visit</CardTitle>
      {sent ? (
        <Done>
          <FontAwesomeIcon icon={faCircleCheck} />
          <h3>Request ready on WhatsApp</h3>
          <p>We’ve received your request with your design. Send the WhatsApp message too and our engineer will confirm your visit.</p>
        </Done>
      ) : (
        <>
          <p style={{ color: t.muted, fontSize: '0.9rem', marginTop: 0 }}>
            These numbers are an indicative estimate. Shading, roof strength and wiring are confirmed on site — free of charge.
          </p>
          <Form onSubmit={submit} noValidate>
            <div><Label htmlFor="b-name">Name</Label><TextInput id="b-name" value={form.name} onChange={set('name')} autoComplete="name" /></div>
            <div><Label htmlFor="b-phone">Phone / WhatsApp</Label><TextInput id="b-phone" value={form.phone} onChange={set('phone')} inputMode="tel" autoComplete="tel" placeholder="03xx xxxxxxx" /></div>
            <div><Label htmlFor="b-area">Area / address</Label><TextInput id="b-area" value={form.area} onChange={set('area')} placeholder="e.g. DHA Phase 5" /></div>
            <div><Label htmlFor="b-date">Preferred date</Label><TextInput id="b-date" type="date" value={form.date} onChange={set('date')} /></div>
            {err && <Error className="full">{err}</Error>}
            <div className="full"><Button type="submit" style={{ width: '100%' }}>Book my site visit</Button></div>
          </Form>
        </>
      )}
    </Card>
  );
}
