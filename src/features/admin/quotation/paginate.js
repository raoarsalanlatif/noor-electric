// Page size and the rule that decides which block goes on which page.

export const PAGE_W = 794; // A4 at 96 dpi
export const PAGE_H = 1123;

/** Greedy packing: fill a page, start a new one when the next block does not fit. */
export function paginate(blocks, heights, { pageH, theadH, miniH }) {
  const pages = [];
  let page = []; let used = 0; let hasTable = false;
  const flush = () => { if (page.length) pages.push(page); page = []; used = pages.length ? miniH : 0; hasTable = false; };
  blocks.forEach((b, i) => {
    const h = heights[b.k] || 0;
    const tableCost = b.type === 'row' && !hasTable ? theadH : 0;
    const next = b.keepWithNext && blocks[i + 1] ? heights[blocks[i + 1].k] || 0 : 0;
    if (page.length && used + tableCost + h + next > pageH) flush();
    if (b.type === 'row' && !hasTable) { used += theadH; hasTable = true; }
    if (b.type !== 'row') hasTable = false;
    page.push(b); used += h;
  });
  if (page.length) pages.push(page);
  return pages;
}
