// The quotation maths must match the company's spreadsheet.
import { describe, it, expect } from 'vitest';
import { totals, lineAmount, fmtMoney, fmtNum, fmtLongDate, fromTemplate, toTemplate, move } from './model';
import { paginate } from './paginate';
import { BUILT_IN_TEMPLATES } from './templates';

const tpl = BUILT_IN_TEMPLATES[0];

describe('quotation model', () => {
  it('adds up the 10 kW template exactly like the spreadsheet', () => {
    const doc = fromTemplate(tpl, { name: 'Mr Farhad Khan', city: 'Swat' }, new Date(2026, 10, 17, 9, 5));
    expect(totals(doc)).toEqual({ subtotal: 1857400, discount: 0, grandTotal: 1857400 });
    expect(totals({ ...doc, discount: '57400' }).grandTotal).toBe(1800000);
    expect(doc).toMatchObject({ proposedTo: 'Mr Farhad Khan', location: 'Swat', date: '2026-11-17', refNo: '261117-0905', title: '10KW Premium Hybrid Solar System' });
    expect(doc.sections).toHaveLength(10);
  });

  it('leaves the amount blank until a unit price is entered', () => {
    expect(lineAmount({ unitPrice: 25500, qty: 16 })).toBe(408000);
    expect(lineAmount({ unitPrice: 1.5, qty: 10000 })).toBe(15000);
    expect(lineAmount({ unitPrice: 0, qty: 1 })).toBeNull();
    expect(lineAmount({ unitPrice: '', qty: '' })).toBeNull();
  });

  it('formats money, numbers and dates the way the sheet shows them', () => {
    expect(fmtMoney(1857400)).toBe('PKR 1,857,400');
    expect(fmtMoney(null)).toBe('');
    expect(fmtNum(25500)).toBe('25,500');
    expect(fmtNum(1.5)).toBe('1.5');
    expect(fmtNum('')).toBe('');
    expect(fmtLongDate('2026-11-17')).toBe('November 17, 2026');
  });

  it('templates carry the items but never the customer', () => {
    const doc = fromTemplate(tpl, { name: 'A', city: 'B' });
    const t = toTemplate(doc);
    expect(Object.keys(t).sort()).toEqual(['discount', 'note', 'sections', 'showSeal', 'terms', 'title']);
    t.sections[0].items[0].qty = 99; // a copy, not a reference
    expect(doc.sections[0].items[0].qty).toBe(16);
    expect(tpl.quotation.sections[0].items[0].qty).toBe(16);
  });

  it('reorders without touching the original list', () => {
    const l = ['a', 'b', 'c'];
    expect(move(l, 0, 1)).toEqual(['b', 'a', 'c']);
    expect(move(l, 0, -1)).toBe(l);
    expect(l).toEqual(['a', 'b', 'c']);
  });
});

describe('page breaks', () => {
  const row = (k, extra) => ({ k, type: 'row', ...extra });
  it('starts a new page when a block does not fit and keeps a section title with its first item', () => {
    const blocks = [{ k: 'head', type: 'head' }, row('s0', { keepWithNext: true }), row('i0'), row('s1', { keepWithNext: true }), row('i1'), { k: 'totals', type: 'totals' }];
    const heights = { head: 50, s0: 10, i0: 10, s1: 10, i1: 10, totals: 30 };
    const pages = paginate(blocks, heights, { pageH: 95, theadH: 10, miniH: 5 }).map((p) => p.map((b) => b.k));
    // page 1: 50 + thead 10 + 10 + 10 = 80; s1 (10) + its item (10) would overflow 95, so both move on
    expect(pages).toEqual([['head', 's0', 'i0'], ['s1', 'i1', 'totals']]);
  });
  it('keeps everything on one page when it fits', () => {
    const blocks = [{ k: 'head', type: 'head' }, row('s0'), { k: 'totals', type: 'totals' }];
    expect(paginate(blocks, { head: 10, s0: 10, totals: 10 }, { pageH: 100, theadH: 10, miniH: 5 })).toHaveLength(1);
  });
});
