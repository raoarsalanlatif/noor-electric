import { getDb, oid } from './db.js';
import { contentRoutes } from './content.js';
import { requireUser, issueSession, clearSession, hashPassword, checkPassword, publicUser } from './auth.js';
import {
  HttpError, bad, notFound, readBody, clientIp, rateLimit, str, num, bool, oneOf, date, strList,
} from './http.js';

export const STAGES = ['lead', 'survey', 'quotation', 'approved', 'installation', 'net_metering', 'completed'];
export const QUOTE_STATUSES = ['new', 'contacted', 'survey_booked', 'quoted', 'won', 'lost'];
export const EVENT_TYPES = ['site_visit', 'installation', 'commitment', 'meeting', 'other'];
const OWNER = ['owner'];
const ANY = ['owner', 'staff'];

const now = () => new Date();
const ids = (list) => (Array.isArray(list) ? list.slice(0, 30).map((x) => String(x)).filter((x) => /^[a-f0-9]{24}$/i.test(x)) : []);
const slugify = (s) => str(s, 200).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 90) || 'post';
const isMonth = (m) => /^\d{4}-(0[1-9]|1[0-2])$/.test(m || '');

/* =============================== auth ================================ */
async function login(req, res) {
  rateLimit(`login:${clientIp(req)}`, 10, 15 * 60 * 1000);
  const body = await readBody(req);
  const email = str(body.email, 200).toLowerCase();
  const password = String(body.password || '');
  if (!email || !password) throw bad('Email and password are required');
  const db = await getDb();
  const users = db.collection('users');
  let user = await users.findOne({ email });

  // First run: create the owner account from the ADMIN_EMAIL / ADMIN_PASSWORD environment variables.
  if (!user && (await users.countDocuments({})) === 0) {
    const envEmail = (process.env.ADMIN_EMAIL || '').toLowerCase().trim();
    const envPass = process.env.ADMIN_PASSWORD || '';
    if (envEmail && envPass && email === envEmail && password === envPass) {
      const doc = { name: 'Owner', email, passwordHash: await hashPassword(password), role: 'owner', active: true, createdAt: now() };
      const r = await users.insertOne(doc);
      user = { ...doc, _id: r.insertedId };
    }
  }
  if (!user || user.active === false || !(await checkPassword(password, user.passwordHash))) {
    throw new HttpError(401, 'Wrong email or password');
  }
  await issueSession(res, user);
  return { user: publicUser(user) };
}

async function me(req) {
  const user = await requireUser(req);
  return { user: publicUser(user) };
}

async function changePassword(req) {
  const user = await requireUser(req);
  const body = await readBody(req);
  if (!(await checkPassword(String(body.current || ''), user.passwordHash))) throw bad('Current password is wrong');
  const next = String(body.next || '');
  if (next.length < 8) throw bad('New password must be at least 8 characters');
  const db = await getDb();
  await db.collection('users').updateOne({ _id: user._id }, { $set: { passwordHash: await hashPassword(next) } });
  return { ok: true };
}

/* =============================== users =============================== */
async function listUsers(req) {
  await requireUser(req, OWNER);
  const db = await getDb();
  const list = await db.collection('users').find({}).sort({ createdAt: 1 }).toArray();
  return { items: list.map(publicUser) };
}

async function createUser(req) {
  await requireUser(req, OWNER);
  const b = await readBody(req);
  const email = str(b.email, 200).toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw bad('Enter a valid email');
  const password = String(b.password || '');
  if (password.length < 8) throw bad('Password must be at least 8 characters');
  const db = await getDb();
  if (await db.collection('users').findOne({ email })) throw bad('A user with this email already exists');
  const doc = { name: str(b.name, 100) || email, email, role: oneOf(b.role, ['owner', 'staff'], 'staff'), active: true, passwordHash: await hashPassword(password), createdAt: now() };
  const r = await db.collection('users').insertOne(doc);
  return { item: publicUser({ ...doc, _id: r.insertedId }) };
}

async function updateUser(req, id) {
  const me_ = await requireUser(req, OWNER);
  const b = await readBody(req);
  const set = {};
  if (b.name !== undefined) set.name = str(b.name, 100);
  if (b.role !== undefined) set.role = oneOf(b.role, ['owner', 'staff'], 'staff');
  if (b.active !== undefined) set.active = bool(b.active);
  if (b.password) {
    if (String(b.password).length < 8) throw bad('Password must be at least 8 characters');
    set.passwordHash = await hashPassword(String(b.password));
  }
  if (String(me_._id) === id && (set.active === false || set.role === 'staff')) throw bad('You cannot disable or demote your own account');
  const db = await getDb();
  await db.collection('users').updateOne({ _id: oid(id) }, { $set: set });
  return { ok: true };
}

async function deleteUser(req, id) {
  const me_ = await requireUser(req, OWNER);
  if (String(me_._id) === id) throw bad('You cannot delete your own account');
  const db = await getDb();
  await db.collection('users').deleteOne({ _id: oid(id) });
  return { ok: true };
}

/* ============================ employees ============================== */
function employeeFields(b) {
  return {
    name: str(b.name, 100),
    title: str(b.title, 100),
    phone: str(b.phone, 30),
    email: str(b.email, 200),
    cnic: str(b.cnic, 20),
    joinDate: date(b.joinDate),
    baseSalary: num(b.baseSalary, { min: 0 }) ?? 0,
    allowances: num(b.allowances, { min: 0 }) ?? 0,
    bank: str(b.bank, 200),
    active: b.active === undefined ? true : bool(b.active),
    notes: str(b.notes, 2000),
  };
}

async function listEmployees(req) {
  await requireUser(req, OWNER);
  const db = await getDb();
  return { items: await db.collection('employees').find({}).sort({ active: -1, name: 1 }).toArray() };
}

async function team(req) {
  await requireUser(req, ANY);
  const db = await getDb();
  const list = await db.collection('employees').find({ active: true }).sort({ name: 1 }).toArray();
  return { items: list.map((e) => ({ _id: e._id, name: e.name, title: e.title, phone: e.phone })) };
}

async function createEmployee(req) {
  await requireUser(req, OWNER);
  const f = employeeFields(await readBody(req));
  if (!f.name) throw bad('Name is required');
  const db = await getDb();
  const doc = { ...f, createdAt: now() };
  const r = await db.collection('employees').insertOne(doc);
  return { item: { ...doc, _id: r.insertedId } };
}

async function updateEmployee(req, id) {
  await requireUser(req, OWNER);
  const b = await readBody(req);
  const f = employeeFields(b);
  const set = Object.fromEntries(Object.entries(f).filter(([k]) => b[k] !== undefined));
  const db = await getDb();
  await db.collection('employees').updateOne({ _id: oid(id) }, { $set: set });
  return { ok: true };
}

async function deleteEmployee(req, id) {
  await requireUser(req, OWNER);
  const db = await getDb();
  await db.collection('employees').deleteOne({ _id: oid(id) });
  return { ok: true };
}

/* ============================== payroll ============================== */
const netPay = (p) => (p.base || 0) + (p.allowances || 0) + (p.bonus || 0) - (p.deductions || 0);

async function listPayroll(req, q) {
  await requireUser(req, OWNER);
  const month = isMonth(q.month) ? q.month : new Date().toISOString().slice(0, 7);
  const db = await getDb();
  const items = await db.collection('payroll').find({ month }).toArray();
  const emps = await db.collection('employees').find({}).toArray();
  const byId = Object.fromEntries(emps.map((e) => [String(e._id), e]));
  return {
    month,
    items: items.map((p) => ({ ...p, employeeName: byId[String(p.employeeId)]?.name || 'Former employee', title: byId[String(p.employeeId)]?.title || '' }))
      .sort((a, b) => a.employeeName.localeCompare(b.employeeName)),
  };
}

async function generatePayroll(req) {
  await requireUser(req, OWNER);
  const { month } = await readBody(req);
  if (!isMonth(month)) throw bad('Month must look like 2026-11');
  const db = await getDb();
  const emps = await db.collection('employees').find({ active: true }).toArray();
  let created = 0;
  for (const e of emps) {
    const exists = await db.collection('payroll').findOne({ month, employeeId: e._id });
    if (exists) continue;
    const doc = { month, employeeId: e._id, base: e.baseSalary || 0, allowances: e.allowances || 0, bonus: 0, deductions: 0, status: 'pending', paidOn: null, method: '', note: '', createdAt: now() };
    doc.net = netPay(doc);
    await db.collection('payroll').insertOne(doc);
    created += 1;
  }
  return { created };
}

async function updatePayroll(req, id) {
  await requireUser(req, OWNER);
  const b = await readBody(req);
  const db = await getDb();
  const cur = await db.collection('payroll').findOne({ _id: oid(id) });
  if (!cur) throw notFound();
  const set = {};
  ['base', 'allowances', 'bonus', 'deductions'].forEach((k) => { if (b[k] !== undefined) set[k] = num(b[k], { min: 0 }) ?? 0; });
  if (b.status !== undefined) {
    set.status = oneOf(b.status, ['pending', 'paid'], 'pending');
    set.paidOn = set.status === 'paid' ? (date(b.paidOn) || now()) : null;
  }
  if (b.method !== undefined) set.method = str(b.method, 60);
  if (b.note !== undefined) set.note = str(b.note, 500);
  set.net = netPay({ ...cur, ...set });
  await db.collection('payroll').updateOne({ _id: cur._id }, { $set: set });
  return { ok: true, net: set.net };
}

async function deletePayroll(req, id) {
  await requireUser(req, OWNER);
  const db = await getDb();
  await db.collection('payroll').deleteOne({ _id: oid(id) });
  return { ok: true };
}

/* =============================== events ============================== */
function eventFields(b) {
  const start = date(b.start);
  const end = date(b.end);
  return {
    title: str(b.title, 160),
    type: oneOf(b.type, EVENT_TYPES, 'site_visit'),
    start,
    end: end && start && end > start ? end : (start ? new Date(start.getTime() + 60 * 60 * 1000) : null),
    location: str(b.location, 300),
    customerName: str(b.customerName, 100),
    customerPhone: str(b.customerPhone, 30),
    assignees: ids(b.assignees),
    notes: str(b.notes, 2000),
    status: oneOf(b.status, ['scheduled', 'done', 'cancelled'], 'scheduled'),
    quoteId: b.quoteId && /^[a-f0-9]{24}$/i.test(b.quoteId) ? b.quoteId : null,
    projectId: b.projectId && /^[a-f0-9]{24}$/i.test(b.projectId) ? b.projectId : null,
  };
}

async function listEvents(req, q) {
  await requireUser(req, ANY);
  const from = date(q.from) || new Date(Date.now() - 45 * 864e5);
  const to = date(q.to) || new Date(Date.now() + 120 * 864e5);
  const db = await getDb();
  return { items: await db.collection('events').find({ start: { $gte: from, $lte: to } }).sort({ start: 1 }).limit(500).toArray() };
}

async function createEvent(req) {
  const user = await requireUser(req, ANY);
  const f = eventFields(await readBody(req));
  if (!f.title) throw bad('Title is required');
  if (!f.start) throw bad('Start date/time is required');
  const db = await getDb();
  const doc = { ...f, createdBy: user.name, createdAt: now() };
  const r = await db.collection('events').insertOne(doc);
  if (f.quoteId && f.type === 'site_visit') {
    await db.collection('quotes').updateOne({ _id: oid(f.quoteId) }, { $set: { status: 'survey_booked', updatedAt: now() } });
  }
  return { item: { ...doc, _id: r.insertedId } };
}

async function updateEvent(req, id) {
  await requireUser(req, ANY);
  const b = await readBody(req);
  const f = eventFields(b);
  const set = Object.fromEntries(Object.entries(f).filter(([k]) => b[k] !== undefined));
  if (b.start !== undefined && !set.start) throw bad('Invalid start date');
  if (b.start !== undefined && b.end === undefined) delete set.end;
  const db = await getDb();
  await db.collection('events').updateOne({ _id: oid(id) }, { $set: { ...set, updatedAt: now() } });
  return { ok: true };
}

async function deleteEvent(req, id) {
  await requireUser(req, ANY);
  const db = await getDb();
  await db.collection('events').deleteOne({ _id: oid(id) });
  return { ok: true };
}

/* ============================== projects ============================= */
function projectFields(b) {
  return {
    title: str(b.title, 160),
    customerName: str(b.customerName, 100),
    customerPhone: str(b.customerPhone, 30),
    location: str(b.location, 300),
    systemKW: num(b.systemKW, { min: 0, max: 100000 }),
    value: num(b.value, { min: 0 }),
    stage: oneOf(b.stage, STAGES, 'lead'),
    priority: oneOf(b.priority, ['low', 'normal', 'high'], 'normal'),
    assignees: ids(b.assignees),
    dueDate: date(b.dueDate),
    checklist: Array.isArray(b.checklist) ? b.checklist.slice(0, 40).map((c) => ({ text: str(c.text, 200), done: bool(c.done) })).filter((c) => c.text) : [],
    labels: strList(b.labels, 8, 30),
    notes: str(b.notes, 4000),
  };
}

async function listProjects(req) {
  await requireUser(req, ANY);
  const db = await getDb();
  return { stages: STAGES, items: await db.collection('projects').find({}).sort({ stage: 1, order: 1 }).limit(1000).toArray() };
}

async function createProject(req) {
  await requireUser(req, ANY);
  const f = projectFields(await readBody(req));
  if (!f.title) throw bad('Title is required');
  const db = await getDb();
  const last = await db.collection('projects').find({ stage: f.stage }).sort({ order: -1 }).limit(1).toArray();
  const doc = { ...f, order: (last[0]?.order ?? 0) + 1, createdAt: now(), updatedAt: now() };
  const r = await db.collection('projects').insertOne(doc);
  return { item: { ...doc, _id: r.insertedId } };
}

async function updateProject(req, id) {
  await requireUser(req, ANY);
  const b = await readBody(req);
  const f = projectFields(b);
  const set = Object.fromEntries(Object.entries(f).filter(([k]) => b[k] !== undefined));
  const db = await getDb();
  await db.collection('projects').updateOne({ _id: oid(id) }, { $set: { ...set, updatedAt: now() } });
  return { ok: true };
}

/** Save the order of cards in one column after a drag & drop. */
async function reorderProjects(req) {
  await requireUser(req, ANY);
  const b = await readBody(req);
  const stage = oneOf(b.stage, STAGES, null);
  if (!stage) throw bad('Unknown stage');
  const list = ids(b.ids);
  const db = await getDb();
  await Promise.all(list.map((id, i) => db.collection('projects').updateOne({ _id: oid(id) }, { $set: { stage, order: i + 1, updatedAt: now() } })));
  return { ok: true };
}

async function deleteProject(req, id) {
  await requireUser(req, ANY);
  const db = await getDb();
  await db.collection('projects').deleteOne({ _id: oid(id) });
  return { ok: true };
}

/* =============================== blogs =============================== */
function blogFields(b) {
  return {
    title: str(b.title, 200),
    slug: b.slug ? slugify(b.slug) : undefined,
    excerpt: str(b.excerpt, 400),
    content: str(b.content, 60000),
    coverUrl: /^https?:\/\//.test(str(b.coverUrl, 600)) || str(b.coverUrl, 600).startsWith('/') ? str(b.coverUrl, 600) : '',
    tags: strList(b.tags, 10, 30),
    status: oneOf(b.status, ['draft', 'published'], 'draft'),
  };
}

async function uniqueSlug(db, base, exceptId) {
  let slug = base; let n = 1;
   
  while (await db.collection('blogs').findOne(exceptId ? { slug, _id: { $ne: exceptId } } : { slug })) { n += 1; slug = `${base}-${n}`; }
  return slug;
}

async function listBlogs(req) {
  await requireUser(req, ANY);
  const db = await getDb();
  return { items: await db.collection('blogs').find({}).sort({ updatedAt: -1 }).limit(300).toArray() };
}

async function createBlog(req) {
  const user = await requireUser(req, ANY);
  const f = blogFields(await readBody(req));
  if (!f.title) throw bad('Title is required');
  const db = await getDb();
  const slug = await uniqueSlug(db, f.slug || slugify(f.title));
  const doc = { ...f, slug, authorName: user.name, publishedAt: f.status === 'published' ? now() : null, createdAt: now(), updatedAt: now() };
  const r = await db.collection('blogs').insertOne(doc);
  return { item: { ...doc, _id: r.insertedId } };
}

async function updateBlog(req, id) {
  await requireUser(req, ANY);
  const b = await readBody(req);
  const f = blogFields(b);
  const db = await getDb();
  const cur = await db.collection('blogs').findOne({ _id: oid(id) });
  if (!cur) throw notFound();
  const set = Object.fromEntries(Object.entries(f).filter(([k, v]) => b[k] !== undefined && v !== undefined));
  if (set.slug) set.slug = await uniqueSlug(db, set.slug, cur._id);
  if (set.status === 'published' && !cur.publishedAt) set.publishedAt = now();
  await db.collection('blogs').updateOne({ _id: cur._id }, { $set: { ...set, updatedAt: now() } });
  return { ok: true, slug: set.slug || cur.slug };
}

async function deleteBlog(req, id) {
  await requireUser(req, ANY);
  const db = await getDb();
  await db.collection('blogs').deleteOne({ _id: oid(id) });
  return { ok: true };
}

/* ============================== quotes =============================== */
function quoteFields(b) {
  const plan = b.plan && typeof b.plan === 'object' ? b.plan : null;
  return {
    name: str(b.name, 100),
    phone: str(b.phone, 30),
    email: str(b.email, 200),
    city: str(b.city, 100),
    area: str(b.area, 200),
    systemType: str(b.systemType, 80),
    monthlyBill: num(b.monthlyBill, { min: 0, max: 1e8 }),
    preferredDate: str(b.preferredDate, 20),
    message: str(b.message, 3000),
    plan: plan ? {
      summary: str(plan.summary, 3000),
      systemKW: num(plan.systemKW, { min: 0 }),
      panels: num(plan.panels, { min: 0 }),
      inverterKW: num(plan.inverterKW, { min: 0 }),
      batteryKWh: num(plan.batteryKWh, { min: 0 }),
      dailyKWh: num(plan.dailyKWh, { min: 0 }),
      status: str(plan.status, 20),
      estimatedCost: num(plan.estimatedCost, { min: 0 }),
    } : null,
  };
}

async function publicCreateQuote(req) {
  rateLimit(`quote:${clientIp(req)}`, 8, 60 * 60 * 1000);
  const b = await readBody(req);
  if (b.website) return { ok: true }; // honeypot: bots fill hidden fields
  const f = quoteFields(b);
  if (!f.name || f.phone.replace(/\D/g, '').length < 10) throw bad('Name and a valid phone number are required');
  const db = await getDb();
  await db.collection('quotes').insertOne({
    ...f, source: oneOf(b.source, ['contact', 'planner'], 'contact'), status: 'new', quotedAmount: null, notes: '', assignedTo: null,
    createdAt: now(), updatedAt: now(),
  });
  return { ok: true };
}

async function listQuotes(req, q) {
  await requireUser(req, ANY);
  const filter = QUOTE_STATUSES.includes(q.status) ? { status: q.status } : {};
  const db = await getDb();
  return { statuses: QUOTE_STATUSES, items: await db.collection('quotes').find(filter).sort({ createdAt: -1 }).limit(500).toArray() };
}

async function createQuote(req) {
  await requireUser(req, ANY);
  const b = await readBody(req);
  const f = quoteFields(b);
  if (!f.name) throw bad('Customer name is required');
  const db = await getDb();
  const doc = { ...f, source: 'manual', status: oneOf(b.status, QUOTE_STATUSES, 'new'), quotedAmount: num(b.quotedAmount, { min: 0 }), notes: str(b.notes, 3000), assignedTo: null, createdAt: now(), updatedAt: now() };
  const r = await db.collection('quotes').insertOne(doc);
  return { item: { ...doc, _id: r.insertedId } };
}

async function updateQuote(req, id) {
  await requireUser(req, ANY);
  const b = await readBody(req);
  const set = {};
  if (b.status !== undefined) set.status = oneOf(b.status, QUOTE_STATUSES, 'new');
  if (b.quotedAmount !== undefined) set.quotedAmount = num(b.quotedAmount, { min: 0 });
  if (b.notes !== undefined) set.notes = str(b.notes, 3000);
  if (b.assignedTo !== undefined) set.assignedTo = /^[a-f0-9]{24}$/i.test(b.assignedTo || '') ? b.assignedTo : null;
  ['name', 'phone', 'email', 'city', 'area', 'systemType', 'message'].forEach((k) => { if (b[k] !== undefined) set[k] = quoteFields(b)[k]; });
  const db = await getDb();
  await db.collection('quotes').updateOne({ _id: oid(id) }, { $set: { ...set, updatedAt: now() } });
  return { ok: true };
}

async function deleteQuote(req, id) {
  await requireUser(req, ANY);
  const db = await getDb();
  await db.collection('quotes').deleteOne({ _id: oid(id) });
  return { ok: true };
}

/** Turn a quotation request into a project card on the board. */
async function convertQuote(req, id) {
  await requireUser(req, ANY);
  const db = await getDb();
  const qd = await db.collection('quotes').findOne({ _id: oid(id) });
  if (!qd) throw notFound();
  const existing = await db.collection('projects').findOne({ quoteId: String(qd._id) });
  if (existing) return { item: existing, existed: true };
  const stage = qd.status === 'won' ? 'approved' : qd.status === 'quoted' ? 'quotation' : qd.status === 'survey_booked' ? 'survey' : 'lead';
  const last = await db.collection('projects').find({ stage }).sort({ order: -1 }).limit(1).toArray();
  const doc = {
    title: `${qd.plan?.systemKW ? `${qd.plan.systemKW} kW ` : ''}${qd.systemType && !/not sure/i.test(qd.systemType) ? qd.systemType : 'Solar system'} — ${qd.name}`,
    customerName: qd.name, customerPhone: qd.phone, location: [qd.area, qd.city].filter(Boolean).join(', '),
    systemKW: qd.plan?.systemKW ?? null, value: qd.quotedAmount ?? qd.plan?.estimatedCost ?? null,
    stage, priority: 'normal', assignees: [], dueDate: null, checklist: [], labels: [qd.source],
    notes: [qd.message, qd.plan?.summary].filter(Boolean).join('\n\n'), quoteId: String(qd._id),
    order: (last[0]?.order ?? 0) + 1, createdAt: now(), updatedAt: now(),
  };
  const r = await db.collection('projects').insertOne(doc);
  return { item: { ...doc, _id: r.insertedId } };
}

/* ============================= dashboard ============================= */
async function dashboard(req) {
  const user = await requireUser(req, ANY);
  const db = await getDb();
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const in7 = new Date(start.getTime() + 8 * 864e5);
  const [newQuotes, openQuotes, upcoming, projects, posts] = await Promise.all([
    db.collection('quotes').countDocuments({ status: 'new' }),
    db.collection('quotes').find({ status: { $in: ['new', 'contacted', 'survey_booked', 'quoted'] } }).sort({ createdAt: -1 }).limit(6).toArray(),
    db.collection('events').find({ start: { $gte: start, $lte: in7 }, status: { $ne: 'cancelled' } }).sort({ start: 1 }).limit(8).toArray(),
    db.collection('projects').find({}).toArray(),
    db.collection('blogs').countDocuments({ status: 'published' }),
  ]);
  const byStage = Object.fromEntries(STAGES.map((s) => [s, projects.filter((p) => p.stage === s).length]));
  const pipelineValue = projects.filter((p) => !['completed'].includes(p.stage)).reduce((a, p) => a + (p.value || 0), 0);
  let payroll = null;
  if (user.role === 'owner') {
    const month = new Date().toISOString().slice(0, 7);
    const rows = await db.collection('payroll').find({ month }).toArray();
    payroll = { month, total: rows.reduce((a, r) => a + (r.net || 0), 0), paid: rows.filter((r) => r.status === 'paid').reduce((a, r) => a + (r.net || 0), 0), count: rows.length };
  }
  return { newQuotes, openQuotes, upcoming, byStage, pipelineValue, activeProjects: projects.filter((p) => p.stage !== 'completed').length, posts, payroll };
}

/* ============================ public blog ============================ */
async function publicBlogs() {
  const db = await getDb();
  const items = await db.collection('blogs').find({ status: 'published' }).sort({ publishedAt: -1 }).limit(60).toArray();
  return { items: items.map(({ content, ...rest }) => ({ ...rest, readMinutes: Math.max(1, Math.round((content || '').split(/\s+/).length / 200)) })) };
}

async function publicBlog(slug) {
  const db = await getDb();
  const item = await db.collection('blogs').findOne({ slug: slugify(slug), status: 'published' });
  if (!item) throw notFound('Post not found');
  return { item };
}

/* ============================== router =============================== */
const R = (method, pattern, handler) => ({ method, re: new RegExp(`^${pattern.replace(/:id/g, '([a-zA-Z0-9-]+)')}$`), handler });

export const routes = [
  R('POST', 'auth/login', (req, res) => login(req, res)),
  R('POST', 'auth/logout', (req, res) => { clearSession(res); return { ok: true }; }),
  R('GET', 'auth/me', (req) => me(req)),
  R('POST', 'auth/password', (req) => changePassword(req)),

  R('GET', 'users', (req) => listUsers(req)),
  R('POST', 'users', (req) => createUser(req)),
  R('PATCH', 'users/:id', (req, res, id) => updateUser(req, id)),
  R('DELETE', 'users/:id', (req, res, id) => deleteUser(req, id)),

  R('GET', 'team', (req) => team(req)),
  R('GET', 'employees', (req) => listEmployees(req)),
  R('POST', 'employees', (req) => createEmployee(req)),
  R('PATCH', 'employees/:id', (req, res, id) => updateEmployee(req, id)),
  R('DELETE', 'employees/:id', (req, res, id) => deleteEmployee(req, id)),

  R('GET', 'payroll', (req, res, id, q) => listPayroll(req, q)),
  R('POST', 'payroll/generate', (req) => generatePayroll(req)),
  R('PATCH', 'payroll/:id', (req, res, id) => updatePayroll(req, id)),
  R('DELETE', 'payroll/:id', (req, res, id) => deletePayroll(req, id)),

  R('GET', 'events', (req, res, id, q) => listEvents(req, q)),
  R('POST', 'events', (req) => createEvent(req)),
  R('PATCH', 'events/:id', (req, res, id) => updateEvent(req, id)),
  R('DELETE', 'events/:id', (req, res, id) => deleteEvent(req, id)),

  R('GET', 'projects', (req) => listProjects(req)),
  R('POST', 'projects', (req) => createProject(req)),
  R('POST', 'projects/reorder', (req) => reorderProjects(req)),
  R('PATCH', 'projects/:id', (req, res, id) => updateProject(req, id)),
  R('DELETE', 'projects/:id', (req, res, id) => deleteProject(req, id)),

  R('GET', 'blogs', (req) => listBlogs(req)),
  R('POST', 'blogs', (req) => createBlog(req)),
  R('PATCH', 'blogs/:id', (req, res, id) => updateBlog(req, id)),
  R('DELETE', 'blogs/:id', (req, res, id) => deleteBlog(req, id)),

  R('GET', 'quotes', (req, res, id, q) => listQuotes(req, q)),
  R('POST', 'quotes', (req) => createQuote(req)),
  R('PATCH', 'quotes/:id', (req, res, id) => updateQuote(req, id)),
  R('DELETE', 'quotes/:id', (req, res, id) => deleteQuote(req, id)),
  R('POST', 'quotes/:id/convert', (req, res, id) => convertQuote(req, id)),

  R('GET', 'dashboard', (req) => dashboard(req)),

  R('POST', 'public/quotes', (req) => publicCreateQuote(req)),
  R('GET', 'public/blogs', () => publicBlogs()),
  R('GET', 'public/blogs/:id', (req, res, slug) => publicBlog(slug)),

  ...contentRoutes,
];
