// API tests for inventory, expenses and project profit.
// They run the real request handler against an in-memory stand-in for MongoDB (see fakedb.js),
// so they check the rules and the arithmetic, not MongoDB itself.
import http from 'node:http';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { __setDb } from '../db.js';
import handler from '../../index.js';
import { fakeDb } from './fakedb.js';

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

/** A signed-in (or anonymous) caller that keeps its session cookie. */
const client = () => {
  let cookie = '';
  return async (method, route, body) => {
    const r = await fetch(base + route, { method, headers: { 'Content-Type': 'application/json', cookie }, body: method === 'GET' ? undefined : JSON.stringify(body || {}) });
    const sc = r.headers.getSetCookie?.() || [];
    if (sc.length) cookie = sc.map((c) => c.split(';')[0]).join('; ');
    return { status: r.status, data: await r.json() };
  };
};

describe('inventory, expenses and project profit', () => {
  it('follows a project from purchase to profit, with owner-only money', async () => {
    const ok = (name, cond, extra = '') => expect(cond, `${name} ${extra}`).toBe(true);
    const owner = client(); const staff = client(); const anon = client();
    ok('login', (await owner('POST', 'auth/login', { email: 'owner@test.local', password: 'owner-pass-123' })).status === 200);
    const su = await owner('POST', 'users', { name: 'Staff', email: 'staff@test.local', password: 'staff-pass-123', role: 'staff' });
    ok('create staff', su.status === 200, JSON.stringify(su.data));
    ok('staff login', (await staff('POST', 'auth/login', { email: 'staff@test.local', password: 'staff-pass-123' })).status === 200);
    ok('anon blocked', (await anon('GET', 'inventory')).status === 401);

    const proj = (await owner('POST', 'projects', { title: '10 kW Hayatabad', value: 1500000, stage: 'installation' })).data.item;
    const proj2 = (await owner('POST', 'projects', { title: 'No price yet' })).data.item;

    // --- inventory
    let r = await owner('POST', 'inventory', { name: 'Panel 585 W', category: 'panel', unit: 'pcs', minQty: 10, openingQty: 20, openingCost: 30000 });
    ok('create item with opening stock', r.status === 200 && r.data.item.qty === 20 && r.data.item.avgCost === 30000, JSON.stringify(r.data));
    const panel = r.data.item;
    r = await owner('POST', 'stock-moves', { itemId: panel._id, type: 'in', qty: 10, unitCost: 36000, supplier: 'ABC Traders' });
    ok('purchase re-weights average cost', r.data.item.qty === 30 && r.data.item.avgCost === 32000, JSON.stringify(r.data.item));
    const purchase = r.data.move;
    r = await owner('POST', 'stock-moves', { itemId: panel._id, type: 'out', qty: 18, projectId: proj._id });
    ok('issue to project', r.data.item.qty === 12 && r.data.move.value === 576000, JSON.stringify(r.data));
    r = await owner('POST', 'stock-moves', { itemId: panel._id, type: 'out', qty: 50, projectId: proj._id });
    ok('cannot issue more than stock', r.status === 400, JSON.stringify(r.data));
    r = await owner('POST', 'stock-moves', { itemId: panel._id, type: 'return', qty: 2, projectId: proj._id });
    ok('return from project', r.data.item.qty === 14 && r.data.item.avgCost === 32000);
    r = await owner('POST', 'stock-moves', { itemId: panel._id, type: 'return', qty: 2 });
    ok('return needs a project', r.status === 400);
    r = await owner('POST', 'stock-moves', { itemId: panel._id, type: 'adjust', countedQty: 13 });
    ok('count correction', r.data.item.qty === 13 && r.data.move.qty === -1, JSON.stringify(r.data));
    r = await owner('POST', 'stock-moves', { itemId: panel._id, type: 'adjust', countedQty: 13 });
    ok('no-op correction rejected', r.status === 400);
    r = await owner('GET', 'inventory');
    ok('list items with value', r.data.items[0].stockValue === 13 * 32000 && r.data.canSeeCosts === true);
    r = await owner('GET', `stock-moves?itemId=${panel._id}`);
    ok('history', r.data.items.length === 5 && r.data.items.some((m) => m.projectTitle === '10 kW Hayatabad'), String(r.data.items.length));

    // --- staff: can manage stock, cannot see costs or money pages
    r = await staff('GET', 'inventory');
    ok('staff sees stock, no costs', r.status === 200 && r.data.items[0].avgCost === undefined && r.data.items[0].stockValue === undefined && r.data.canSeeCosts === false, JSON.stringify(r.data.items[0]));
    r = await staff('POST', 'stock-moves', { itemId: panel._id, type: 'in', qty: 5, unitCost: 1 });
    ok('staff purchase keeps average cost', r.status === 200 && r.data.move.unitCost === undefined && r.data.item.qty === 18, JSON.stringify(r.data));
    r = await owner('GET', 'inventory');
    ok('average unchanged by staff purchase', r.data.items[0].avgCost === 32000, String(r.data.items[0].avgCost));
    r = await staff('GET', `stock-moves?itemId=${panel._id}`);
    ok('staff history has no costs', r.data.items.every((m) => m.value === undefined && m.unitCost === undefined));
    ok('staff blocked from expenses', (await staff('GET', 'expenses')).status === 403);
    ok('staff blocked from profit', (await staff('GET', 'finance/projects')).status === 403);
    ok('staff blocked from profit detail', (await staff('GET', `finance/projects/${proj._id}`)).status === 403);
    ok('staff cannot undo a move', (await staff('DELETE', `stock-moves/${purchase._id}`)).status === 403);
    ok('staff cannot delete item', (await staff('DELETE', `inventory/${panel._id}`)).status === 403);
    ok('staff cannot add expense', (await staff('POST', 'expenses', { kind: 'office', amount: 5, date: '2026-11-10' })).status === 403);

    // --- expenses
    r = await owner('POST', 'expenses', { kind: 'office', category: 'rent', amount: 80000, date: '2026-11-03', paidTo: 'Landlord', method: 'bank' });
    ok('office expense', r.status === 200);
    const rent = r.data.item;
    r = await owner('POST', 'expenses', { kind: 'personal', category: 'household', amount: 25000, date: '2026-11-05' });
    ok('personal expense', r.status === 200);
    r = await owner('POST', 'expenses', { kind: 'project', category: 'labour', amount: 60000, date: '2026-11-08', projectId: proj._id });
    ok('project expense', r.status === 200);
    r = await owner('POST', 'expenses', { kind: 'project', category: 'labour', amount: 60000, date: '2026-11-08' });
    ok('project expense needs project', r.status === 400);
    r = await owner('POST', 'expenses', { kind: 'office', category: 'rent', amount: 0, date: '2026-11-08' });
    ok('zero amount rejected', r.status === 400);
    r = await owner('POST', 'expenses', { kind: 'office', category: 'household', amount: 10, date: '2026-10-08' });
    ok('category of another kind falls back to other', r.data.item.category === 'other');
    r = await owner('GET', 'expenses?month=2026-11');
    ok('month totals', r.data.totals.office === 80000 && r.data.totals.personal === 25000 && r.data.totals.project === 60000 && r.data.items.length === 3, JSON.stringify(r.data.totals));
    ok('category totals', r.data.byCategory['office:rent'] === 80000);
    r = await owner('GET', 'expenses?month=2026-11&kind=personal');
    ok('filter by kind', r.data.items.length === 1 && r.data.items[0].kind === 'personal');
    r = await owner('PATCH', `expenses/${rent._id}`, { amount: 85000 });
    ok('edit expense keeps other fields', r.data.item.amount === 85000 && r.data.item.category === 'rent' && r.data.item.paidTo === 'Landlord', JSON.stringify(r.data.item));

    // --- project cost and profit
    r = await owner('GET', 'finance/projects');
    const p = r.data.items.find((x) => x._id === proj._id); const p2 = r.data.items.find((x) => x._id === proj2._id);
    // materials: 18 issued − 2 returned at 32,000 = 512,000; expenses 60,000; value 1,500,000
    ok('project materials', p.materials === 512000, String(p.materials));
    ok('project cost and profit', p.cost === 572000 && p.profit === 928000 && Math.abs(p.margin - 61.87) < 0.01, JSON.stringify(p));
    ok('project without a price has no profit', p2.profit === null && p2.cost === 0);
    ok('totals', r.data.totals.profit === 928000 && r.data.totals.unpriced === 1, JSON.stringify(r.data.totals));
    r = await owner('GET', `finance/projects/${proj._id}`);
    ok('detail lines', r.data.materialLines.length === 2 && r.data.expenseLines.length === 1 && r.data.profit === 928000);

    // --- undo and delete rules
    r = await owner('DELETE', `stock-moves/${purchase._id}`);
    r = await owner('GET', 'inventory');
    ok('undo purchase lowers stock and average', r.data.items[0].qty === 8 && r.data.items[0].avgCost < 32000, JSON.stringify(r.data.items[0]));
    r = await owner('DELETE', `inventory/${panel._id}`);
    ok('item issued to a project cannot be deleted', r.status === 400);
    const cable = (await owner('POST', 'inventory', { name: 'DC cable 6 mm', category: 'cable', unit: 'm' })).data.item;
    ok('unused item can be deleted', (await owner('DELETE', `inventory/${cable._id}`)).status === 200);
    ok('delete expense', (await owner('DELETE', `expenses/${rent._id}`)).status === 200);
  });
});
