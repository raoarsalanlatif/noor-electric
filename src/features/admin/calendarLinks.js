// "Add to calendar" helpers — no email service needed.
const pad = (n) => String(n).padStart(2, '0');
const utc = (d) => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;

function details(ev) {
  return [
    ev.customerName && `Customer: ${ev.customerName}`,
    ev.customerPhone && `Phone: ${ev.customerPhone}`,
    ev.notes,
    'Noor Electric Renewables',
  ].filter(Boolean).join('\n');
}

export function googleCalendarUrl(ev) {
  const start = new Date(ev.start); const end = new Date(ev.end || start.getTime() + 3600e3);
  const p = new URLSearchParams({ action: 'TEMPLATE', text: ev.title, dates: `${utc(start)}/${utc(end)}`, details: details(ev), location: ev.location || '' });
  return `https://calendar.google.com/calendar/render?${p}`;
}

export function downloadIcs(ev) {
  const start = new Date(ev.start); const end = new Date(ev.end || start.getTime() + 3600e3);
  const escTxt = (s) => String(s || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Noor Electric Renewables//Admin//EN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${ev._id || Date.now()}@noorelectric.org`,
    `DTSTAMP:${utc(new Date())}`, `DTSTART:${utc(start)}`, `DTEND:${utc(end)}`,
    `SUMMARY:${escTxt(ev.title)}`, `LOCATION:${escTxt(ev.location)}`, `DESCRIPTION:${escTxt(details(ev))}`,
    'BEGIN:VALARM', 'TRIGGER:-PT1H', 'ACTION:DISPLAY', 'DESCRIPTION:Reminder', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${String(ev.title).replace(/[^a-z0-9]+/gi, '-').slice(0, 40) || 'event'}.ics`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

export function whatsappInviteUrl(ev, phone) {
  const when = new Date(ev.start).toLocaleString('en-PK', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
  const text = [`📅 ${ev.title}`, `🕒 ${when}`, ev.location && `📍 ${ev.location}`, ev.customerName && `👤 ${ev.customerName} ${ev.customerPhone || ''}`, '', `Add to calendar: ${googleCalendarUrl(ev)}`].filter((x) => x !== false && x !== undefined).join('\n');
  const digits = (phone || '').replace(/\D/g, '').replace(/^0/, '92');
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
