// API tests for quotation documents and saved templates (in-memory database, see fakedb.js).
import http from 'node:http';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { __setDb } from '../db.js';
import handler from '../../index.js';
import { fakeDb } from './fakedb.js';
import { cleanQuotation, quotationTotals } from '../quotation.js';

let server; let base;
beforeAll(async () => {
  process.env.JWT_SECRET = 'test-secret-test-secret-test-secret';
  process.env.ADMIN_EMAIL = 'owner@test.local'; process.env.ADMIN_PASSWORD = 'owner-pass-123';
  __setDb(fakeDb());
  server = http.createServer((req, res) => handler(req, res));
  await new Promise((r) => { server.listen(0, r); });
  base = `http://localhost:${server.address().port}/api/`;
});
afterAll(() => { server.close(); __setDb(null); });

const client = () => {
  let cookie = '';
  return async (method, route, body) => {
    const r = await fetch(base + route, { method, headers: { 'Content-Type': 'application/json', cookie }, body: method === 'GET' ? undefined : JSON.stringify(body || {}) });
    const sc = r.headers.getSetCookie?.() || [];
    if (sc.length) cookie = sc.map((c) => c.split(';')[0]).join('; ');
    return { status: r.status, data: await r.json() };
  };
};

const quotation = {
  title: '10KW Premium Hybrid Solar System', proposedTo: 'Mr Farhad Khan', location: 'Swat', date: '2026-11-17', refNo: '1312', customerId: '233',
  sections: [
    { title: 'Solar Panels', unit: 'Nos.', items: [{ description: 'Canadian N Type 620w', warranty: '12 Years', unitPrice: 25500, qty: 16 }] },
    { title: 'Net Metering', unit: 'Job', items: [{ description: 'Net metering services', warranty: '', unitPrice: 0, qty: 1 }, { description: 'Monitoring', unitPrice: '', qty: '' }] },
  ],
  discount: 8000, note: 'Prices exclude taxes', terms: ['One', '', 'Two'], showSeal: true,
};

describe('quotation documents', () => {
  it('cleans unknown fields and bad numbers', () => {
    const q = cleanQuotation({ ...quotation, hacked: true, date: 'yesterday', discount: -5, sections: [{ title: 'X', items: [{ description: 'a', unitPrice: 'abc', qty: -2, extra: 1 }] }, 'junk'] });
    expect(q.hacked).toBeUndefined();
    expect(q.date).toBe('');
    expect(q.discount).toBe(0);
    expect(q.sections[0].items[0]).toEqual({ description: 'a', warranty: '', unitPrice: null, qty: 0 });
    expect(q.sections[1]).toEqual({ title: '', unit: '', items: [] });
    expect(quotationTotals(cleanQuotation(quotation))).toEqual({ subtotal: 408000, discount: 8000, grandTotal: 400000 });
    expect(cleanQuotation(null).sections).toEqual([]);
  });

  it('saves a quotation on an enquiry and sets the quoted amount from it', async () => {
    const owner = client(); const anon = client();
    expect((await owner('POST', 'auth/login', { email: 'owner@test.local', password: 'owner-pass-123' })).status).toBe(200);
    const made = await owner('POST', 'quotes', { name: 'Mr Farhad Khan', phone: '03421946568', city: 'Swat' });
    expect(made.status).toBe(200);
    const id = made.data.item._id;

    expect((await anon('PATCH', `quotes/${id}`, { quotation })).status).toBe(401);
    const saved = await owner('PATCH', `quotes/${id}`, { quotation });
    expect(saved.data).toEqual({ ok: true, quotedAmount: 400000 });

    const row = (await owner('GET', 'quotes')).data.items.find((x) => x._id === id);
    expect(row.quotedAmount).toBe(400000);
    expect(row.quotation.terms).toEqual(['One', 'Two']);
    expect(row.quotation.sections[1].items[1]).toEqual({ description: 'Monitoring', warranty: '', unitPrice: null, qty: null });

    // other edits leave the document alone
    await owner('PATCH', `quotes/${id}`, { status: 'quoted' });
    expect((await owner('GET', 'quotes')).data.items.find((x) => x._id === id).quotation.refNo).toBe('1312');
  });

  it('stores reusable templates without customer details', async () => {
    const owner = client(); const anon = client();
    await owner('POST', 'auth/login', { email: 'owner@test.local', password: 'owner-pass-123' });
    expect((await anon('GET', 'quote-templates')).status).toBe(401);
    expect((await owner('POST', 'quote-templates', { name: '', quotation })).status).toBe(400);
    expect((await owner('POST', 'quote-templates', { name: 'Empty', quotation: { sections: [] } })).status).toBe(400);

    const t = await owner('POST', 'quote-templates', { name: '10 kW hybrid', quotation });
    expect(t.status).toBe(200);
    expect(t.data.item.quotation.proposedTo).toBeUndefined();
    expect(t.data.item.quotation.sections).toHaveLength(2);

    // same name again updates instead of duplicating
    await owner('POST', 'quote-templates', { name: '10 kW hybrid', quotation: { ...quotation, title: 'Updated' } });
    const all = (await owner('GET', 'quote-templates')).data.items;
    expect(all).toHaveLength(1);
    expect(all[0].quotation.title).toBe('Updated');

    expect((await owner('DELETE', `quote-templates/${all[0]._id}`)).status).toBe(200);
    expect((await owner('GET', 'quote-templates')).data.items).toHaveLength(0);
  });
});
