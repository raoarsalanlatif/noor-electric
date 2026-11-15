// Money and stock, managed from the admin panel:
//   inventory_items – what is in the store (panels, inverters, cable…), with the average purchase cost
//   stock_moves     – every change to stock: purchase in, issue to a project, return from a project, count correction
//   expenses        – office, personal and project expenses
//   finance/projects – cost and profit of each project = contract value − materials issued − project expenses
//
// Who can do what: staff and owners manage stock; expenses, purchase costs and profit are for owners only.
import { getDb, oid } from './db.js';
import { requireUser } from './auth.js';
import { HttpError, bad, notFound, readBody, str, num, oneOf, date } from './http.js';

const OWNER = ['owner'];
const ANY = ['owner', 'staff'];
const now = () => new Date();
const isMonth = (m) => /^\d{4}-(0[1-9]|1[0-2])$/.test(m || '');
const isId = (v) => /^[a-f0-9]{24}$/i.test(String(v || ''));
const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

export const ITEM_CATEGORIES = ['panel', 'inverter', 'battery', 'structure', 'cable', 'protection', 'accessory', 'other'];
export const ITEM_UNITS = ['pcs', 'm', 'ft', 'kg', 'set', 'box', 'roll'];
export const MOVE_TYPES = ['in', 'out', 'return', 'adjust'];
export const EXPENSE_KINDS = ['office', 'personal', 'project'];
export const EXPENSE_CATEGORIES = {
  office: ['rent', 'utilities', 'fuel_transport', 'office_supplies', 'marketing', 'internet_phone', 'maintenance', 'food', 'tax_fees', 'other'],
  personal: ['household', 'family', 'medical', 'education', 'travel', 'other'],
  project: ['labour', 'transport', 'civil_work', 'net_metering', 'direct_material', 'commission', 'other'],
};
export const PAY_METHODS = ['cash', 'bank', 'jazzcash', 'easypaisa', 'cheque', 'card'];

/* ============================= inventory ============================== */
function itemFields(b) {
  return {
    name: str(b.name, 160),
    category: oneOf(b.category, ITEM_CATEGORIES, 'other'),
    sku: str(b.sku, 60),
    unit: oneOf(b.unit, ITEM_UNITS, 'pcs'),
    minQty: num(b.minQty, { min: 0, max: 1e9 }) ?? 0,
    notes: str(b.notes, 2000),
  };
}

/** Staff see stock but not what it cost. */
const forRole = (item, owner) => {
  if (owner) return { ...item, stockValue: round2(item.qty * item.avgCost) };
  const out = { ...item };
  delete out.avgCost;
  return out;
};

async function listItems(req) {
  const user = await requireUser(req, ANY);
  const owner = user.role === 'owner';
  const db = await getDb();
  const items = await db.collection('inventory_items').find({}).sort({ category: 1, name: 1 }).limit(2000).toArray();
  return {
    categories: ITEM_CATEGORIES, units: ITEM_UNITS, canSeeCosts: owner,
    items: items.map((i) => forRole(i, owner)),
  };
}

async function createItem(req) {
  const user = await requireUser(req, ANY);
  const b = await readBody(req);
  const f = itemFields(b);
  if (!f.name) throw bad('Item name is required');
  const db = await getDb();
  const doc = { ...f, qty: 0, avgCost: 0, createdAt: now(), updatedAt: now(), createdBy: user._id };
  const r = await db.collection('inventory_items').insertOne(doc);
  const item = { ...doc, _id: r.insertedId };
  // opening stock entered together with the new item
  const openingQty = num(b.openingQty, { min: 0, max: 1e9 }) || 0;
  if (openingQty > 0) {
    const cost = user.role === 'owner' ? num(b.openingCost, { min: 0 }) || 0 : 0;
    await recordMove(db, user, item, { type: 'in', qty: openingQty, unitCost: cost, note: 'Opening stock', date: now() });
  }
  return { item: forRole(await db.collection('inventory_items').findOne({ _id: item._id }), user.role === 'owner') };
}

async function updateItem(req, id) {
  const user = await requireUser(req, ANY);
  const b = await readBody(req);
  const f = itemFields(b);
  const set = Object.fromEntries(Object.entries(f).filter(([k]) => b[k] !== undefined));
  if (b.name !== undefined && !set.name) throw bad('Item name is required');
  const db = await getDb();
  const r = await db.collection('inventory_items').updateOne({ _id: oid(id) }, { $set: { ...set, updatedAt: now() } });
  if (!r.matchedCount) throw notFound('Item not found');
  return { item: forRole(await db.collection('inventory_items').findOne({ _id: oid(id) }), user.role === 'owner') };
}

async function deleteItem(req, id) {
  await requireUser(req, OWNER);
  const db = await getDb();
  const _id = oid(id);
  // an item with history can not vanish: its issues are part of project costs
  const used = await db.collection('stock_moves').countDocuments({ itemId: _id, projectId: { $ne: null } });
  if (used) throw bad('This item was issued to projects, so it can not be deleted. Set its stock to zero instead.');
  await db.collection('stock_moves').deleteMany({ itemId: _id });
  await db.collection('inventory_items').deleteOne({ _id });
  return { ok: true };
}

/* ============================ stock moves ============================= */
/**
 * Apply one stock change to an item and store it.
 *  in      purchase: stock goes up, average cost is re-weighted with the purchase price
 *  out     issue (usually to a project): stock goes down, valued at the current average cost
 *  return  material coming back from a project: stock goes up at the average cost, project cost goes down
 *  adjust  count correction: `qty` is the signed difference
 */
async function recordMove(db, user, item, m) {
  const have = item.qty || 0; const avg = item.avgCost || 0;
  let qty = have; let avgCost = avg; let unitCost = avg;
  if (m.type === 'in') {
    unitCost = m.unitCost || 0;
    qty = have + m.qty;
    avgCost = qty > 0 ? (have * avg + m.qty * unitCost) / qty : unitCost;
  } else if (m.type === 'out') {
    if (m.qty > have) throw bad(`Only ${have} ${item.unit} of ${item.name} in stock`);
    qty = have - m.qty;
  } else if (m.type === 'return') {
    qty = have + m.qty;
  } else {
    qty = have + m.qty;
    if (qty < 0) throw bad('Stock can not go below zero');
  }
  // only write if nobody changed the item in the meantime
  const r = await db.collection('inventory_items').updateOne(
    { _id: item._id, qty: have },
    { $set: { qty: round2(qty), avgCost: round2(avgCost), updatedAt: now() } },
  );
  if (!r.modifiedCount && round2(qty) !== have) throw new HttpError(409, 'This item was just changed by someone else — please try again');
  const doc = {
    itemId: item._id, type: m.type, qty: m.qty, unitCost: round2(unitCost), value: round2(Math.abs(m.qty) * unitCost),
    projectId: m.projectId || null, supplier: m.supplier || '', note: m.note || '',
    date: m.date || now(), createdAt: now(), createdBy: user._id,
  };
  const ins = await db.collection('stock_moves').insertOne(doc);
  return { ...doc, _id: ins.insertedId };
}

async function createMove(req) {
  const user = await requireUser(req, ANY);
  const b = await readBody(req);
  const type = oneOf(b.type, MOVE_TYPES, '');
  if (!type) throw bad('Choose what kind of stock change this is');
  const db = await getDb();
  const item = await db.collection('inventory_items').findOne({ _id: oid(b.itemId) });
  if (!item) throw notFound('Item not found');

  let qty;
  if (type === 'adjust') {
    const counted = num(b.countedQty, { min: 0, max: 1e9 });
    if (counted == null) throw bad('Enter the quantity you counted');
    qty = round2(counted - (item.qty || 0));
    if (qty === 0) throw bad('The count matches the stock on record — nothing to correct');
  } else {
    qty = num(b.qty, { min: 0, max: 1e9 });
    if (!qty) throw bad('Quantity must be more than zero');
  }
  let projectId = null;
  if (type === 'return' || (type === 'out' && b.projectId)) {
    if (!isId(b.projectId)) throw bad('Choose the project');
    projectId = oid(b.projectId);
    if (!(await db.collection('projects').findOne({ _id: projectId }, { projection: { _id: 1 } }))) throw notFound('Project not found');
  }
  // purchase prices are entered by owners; a purchase recorded by staff keeps the current average cost
  const unitCost = type === 'in' ? (user.role === 'owner' ? num(b.unitCost, { min: 0 }) ?? 0 : item.avgCost || 0) : 0;
  const move = await recordMove(db, user, item, {
    type, qty, unitCost, projectId, supplier: str(b.supplier, 160), note: str(b.note, 500), date: date(b.date) || now(),
  });
  const fresh = await db.collection('inventory_items').findOne({ _id: item._id });
  const owner = user.role === 'owner';
  if (!owner) { delete move.unitCost; delete move.value; }
  return { move, item: forRole(fresh, owner) };
}

async function listMoves(req, q) {
  const user = await requireUser(req, ANY);
  const owner = user.role === 'owner';
  const filter = {};
  if (isId(q.itemId)) filter.itemId = oid(q.itemId);
  if (isId(q.projectId)) filter.projectId = oid(q.projectId);
  const db = await getDb();
  const moves = await db.collection('stock_moves').find(filter).sort({ date: -1, createdAt: -1 }).limit(500).toArray();
  const [items, projects] = await Promise.all([
    db.collection('inventory_items').find({ _id: { $in: [...new Set(moves.map((m) => String(m.itemId)))].map((x) => oid(x)) } }).toArray(),
    db.collection('projects').find({ _id: { $in: [...new Set(moves.filter((m) => m.projectId).map((m) => String(m.projectId)))].map((x) => oid(x)) } }, { projection: { title: 1 } }).toArray(),
  ]);
  const itemBy = Object.fromEntries(items.map((i) => [String(i._id), i]));
  const projBy = Object.fromEntries(projects.map((p) => [String(p._id), p]));
  return {
    items: moves.map((m) => {
      const out = {
        ...m,
        itemName: itemBy[String(m.itemId)]?.name || 'Deleted item', unit: itemBy[String(m.itemId)]?.unit || '',
        projectTitle: m.projectId ? projBy[String(m.projectId)]?.title || 'Deleted project' : '',
      };
      if (!owner) { delete out.unitCost; delete out.value; }
      return out;
    }),
  };
}

/** Undo a stock change (owner): the item's stock goes back to what it was. */
async function deleteMove(req, id) {
  await requireUser(req, OWNER);
  const db = await getDb();
  const m = await db.collection('stock_moves').findOne({ _id: oid(id) });
  if (!m) return { ok: true };
  const item = await db.collection('inventory_items').findOne({ _id: m.itemId });
  if (item) {
    const have = item.qty || 0;
    const delta = m.type === 'out' ? m.qty : -m.qty; // what undoing does to the stock
    const qty = round2(have + delta);
    if (qty < 0) throw bad('This stock has already been used, so the entry can not be undone. Correct the count instead.');
    let { avgCost } = item;
    // take a purchase back out of the average cost
    if (m.type === 'in' && qty > 0) avgCost = Math.max(0, (have * (item.avgCost || 0) - m.qty * (m.unitCost || 0)) / qty);
    await db.collection('inventory_items').updateOne({ _id: item._id }, { $set: { qty, avgCost: round2(avgCost), updatedAt: now() } });
  }
  await db.collection('stock_moves').deleteOne({ _id: m._id });
  return { ok: true };
}

/* ============================== expenses ============================== */
function expenseFields(b) {
  const kind = oneOf(b.kind, EXPENSE_KINDS, 'office');
  return {
    kind,
    category: oneOf(b.category, EXPENSE_CATEGORIES[kind], 'other'),
    amount: num(b.amount, { min: 0, max: 1e11 }),
    date: date(b.date),
    paidTo: str(b.paidTo, 160),
    method: oneOf(b.method, PAY_METHODS, 'cash'),
    projectId: kind === 'project' && isId(b.projectId) ? oid(b.projectId) : null,
    note: str(b.note, 1000),
  };
}

async function checkExpense(db, f) {
  if (!f.amount) throw bad('Amount must be more than zero');
  if (!f.date) throw bad('Date is required');
  if (f.kind === 'project') {
    if (!f.projectId) throw bad('Choose the project this expense belongs to');
    if (!(await db.collection('projects').findOne({ _id: f.projectId }, { projection: { _id: 1 } }))) throw notFound('Project not found');
  }
}

async function listExpenses(req, q) {
  await requireUser(req, OWNER);
  const db = await getDb();
  const filter = {};
  let month = null;
  if (isId(q.projectId)) filter.projectId = oid(q.projectId);
  else {
    month = isMonth(q.month) ? q.month : new Date().toISOString().slice(0, 7);
    const [y, m] = month.split('-').map(Number);
    filter.date = { $gte: new Date(Date.UTC(y, m - 1, 1)), $lt: new Date(Date.UTC(y, m, 1)) };
  }
  if (EXPENSE_KINDS.includes(q.kind)) filter.kind = q.kind;
  const items = await db.collection('expenses').find(filter).sort({ date: -1, createdAt: -1 }).limit(2000).toArray();
  const projects = await db.collection('projects')
    .find({ _id: { $in: [...new Set(items.filter((e) => e.projectId).map((e) => String(e.projectId)))].map((x) => oid(x)) } }, { projection: { title: 1 } }).toArray();
  const projBy = Object.fromEntries(projects.map((p) => [String(p._id), p.title]));
  const totals = { office: 0, personal: 0, project: 0 };
  const byCategory = {};
  items.forEach((e) => {
    totals[e.kind] = (totals[e.kind] || 0) + e.amount;
    const k = `${e.kind}:${e.category}`;
    byCategory[k] = (byCategory[k] || 0) + e.amount;
  });
  return {
    month, kinds: EXPENSE_KINDS, categories: EXPENSE_CATEGORIES, methods: PAY_METHODS, totals, byCategory,
    items: items.map((e) => ({ ...e, projectTitle: e.projectId ? projBy[String(e.projectId)] || 'Deleted project' : '' })),
  };
}

async function createExpense(req) {
  const user = await requireUser(req, OWNER);
  const f = expenseFields(await readBody(req));
  const db = await getDb();
  await checkExpense(db, f);
  const doc = { ...f, createdAt: now(), updatedAt: now(), createdBy: user._id };
  const r = await db.collection('expenses').insertOne(doc);
  return { item: { ...doc, _id: r.insertedId } };
}

async function updateExpense(req, id) {
  await requireUser(req, OWNER);
  const db = await getDb();
  const _id = oid(id);
  const existing = await db.collection('expenses').findOne({ _id });
  if (!existing) throw notFound('Expense not found');
  const b = await readBody(req);
  const f = expenseFields({ ...existing, projectId: existing.projectId ? String(existing.projectId) : '', ...b });
  await checkExpense(db, f);
  await db.collection('expenses').updateOne({ _id }, { $set: { ...f, updatedAt: now() } });
  return { item: { ...existing, ...f } };
}

async function deleteExpense(req, id) {
  await requireUser(req, OWNER);
  const db = await getDb();
  await db.collection('expenses').deleteOne({ _id: oid(id) });
  return { ok: true };
}

/* ======================== project cost and profit ====================== */
/** Material cost per project: issues minus returns, each at the average cost on the day. */
async function materialTotals(db, match = {}) {
  const rows = await db.collection('stock_moves').aggregate([
    { $match: { projectId: { $ne: null }, type: { $in: ['out', 'return'] }, ...match } },
    { $group: { _id: '$projectId', total: { $sum: { $cond: [{ $eq: ['$type', 'out'] }, '$value', { $multiply: ['$value', -1] }] } } } },
  ]).toArray();
  return Object.fromEntries(rows.map((r) => [String(r._id), r.total]));
}

async function expenseTotals(db, match = {}) {
  const rows = await db.collection('expenses').aggregate([
    { $match: { kind: 'project', projectId: { $ne: null }, ...match } },
    { $group: { _id: '$projectId', total: { $sum: '$amount' } } },
  ]).toArray();
  return Object.fromEntries(rows.map((r) => [String(r._id), r.total]));
}

const profitOf = (value, materials, expenses) => {
  const cost = round2(materials + expenses);
  const hasValue = value != null && value > 0;
  return {
    value: hasValue ? value : null, materials: round2(materials), expenses: round2(expenses), cost,
    profit: hasValue ? round2(value - cost) : null,
    margin: hasValue ? round2(((value - cost) / value) * 100) : null,
  };
};

async function projectFinance(req) {
  await requireUser(req, OWNER);
  const db = await getDb();
  const [projects, mat, exp] = await Promise.all([
    db.collection('projects').find({}, { projection: { title: 1, customerName: 1, stage: 1, value: 1, systemKW: 1, updatedAt: 1 } }).sort({ updatedAt: -1 }).limit(1000).toArray(),
    materialTotals(db), expenseTotals(db),
  ]);
  const items = projects.map((p) => ({
    _id: p._id, title: p.title, customerName: p.customerName, stage: p.stage, systemKW: p.systemKW,
    ...profitOf(p.value, mat[String(p._id)] || 0, exp[String(p._id)] || 0),
  }));
  const priced = items.filter((i) => i.value != null);
  const sum = (list, k) => round2(list.reduce((s, i) => s + (i[k] || 0), 0));
  return {
    items,
    totals: {
      value: sum(priced, 'value'), cost: sum(items, 'cost'), materials: sum(items, 'materials'), expenses: sum(items, 'expenses'),
      profit: sum(priced, 'profit'), unpriced: items.length - priced.length,
    },
  };
}

async function projectFinanceDetail(req, id) {
  await requireUser(req, OWNER);
  const db = await getDb();
  const _id = oid(id);
  const project = await db.collection('projects').findOne({ _id });
  if (!project) throw notFound('Project not found');
  const [moves, expenses] = await Promise.all([
    db.collection('stock_moves').find({ projectId: _id, type: { $in: ['out', 'return'] } }).sort({ date: -1 }).limit(1000).toArray(),
    db.collection('expenses').find({ projectId: _id, kind: 'project' }).sort({ date: -1 }).limit(1000).toArray(),
  ]);
  const items = await db.collection('inventory_items').find({ _id: { $in: [...new Set(moves.map((m) => String(m.itemId)))].map((x) => oid(x)) } }).toArray();
  const itemBy = Object.fromEntries(items.map((i) => [String(i._id), i]));
  const materials = moves.reduce((s, m) => s + (m.type === 'out' ? m.value : -m.value), 0);
  const spent = expenses.reduce((s, e) => s + e.amount, 0);
  return {
    project: { _id: project._id, title: project.title, customerName: project.customerName, stage: project.stage, systemKW: project.systemKW },
    ...profitOf(project.value, materials, spent),
    materialLines: moves.map((m) => ({ ...m, itemName: itemBy[String(m.itemId)]?.name || 'Deleted item', unit: itemBy[String(m.itemId)]?.unit || '' })),
    expenseLines: expenses,
    categories: EXPENSE_CATEGORIES.project, methods: PAY_METHODS,
  };
}

/* ------------------------------- routes ------------------------------- */
const R = (method, pattern, handler) => ({ method, re: new RegExp(`^${pattern.replace(/:id/g, '([a-zA-Z0-9-]+)')}$`), handler });

export const financeRoutes = [
  R('GET', 'inventory', (req) => listItems(req)),
  R('POST', 'inventory', (req) => createItem(req)),
  R('PATCH', 'inventory/:id', (req, res, id) => updateItem(req, id)),
  R('DELETE', 'inventory/:id', (req, res, id) => deleteItem(req, id)),

  R('GET', 'stock-moves', (req, res, id, q) => listMoves(req, q)),
  R('POST', 'stock-moves', (req) => createMove(req)),
  R('DELETE', 'stock-moves/:id', (req, res, id) => deleteMove(req, id)),

  R('GET', 'expenses', (req, res, id, q) => listExpenses(req, q)),
  R('POST', 'expenses', (req) => createExpense(req)),
  R('PATCH', 'expenses/:id', (req, res, id) => updateExpense(req, id)),
  R('DELETE', 'expenses/:id', (req, res, id) => deleteExpense(req, id)),

  R('GET', 'finance/projects', (req) => projectFinance(req)),
  R('GET', 'finance/projects/:id', (req, res, id) => projectFinanceDetail(req, id)),
];
