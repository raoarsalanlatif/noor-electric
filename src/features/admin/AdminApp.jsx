/* eslint-disable react/prop-types */
import { useCallback, useEffect, useState } from 'react';
import { NavLink, Navigate, Route, Routes, Link } from 'react-router-dom';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faGauge, faFileInvoiceDollar, faCalendarDays, faTableColumns, faNewspaper, faUsers, faUserShield,
  faRightFromBracket, faBars, faXmark, faKey, faArrowUpRightFromSquare,
} from '@fortawesome/free-solid-svg-icons';
import { get, post, ApiError } from '../../lib/api';
import { img } from '../../content/company';
import { a, Btn, Field, ErrorBox, Modal, ActivityIndicator, Loading, Spinner } from './ui';
import { AuthCtx } from './hooks';
import Dashboard from './pages/Dashboard';
import Quotes from './pages/Quotes';
import CalendarPage from './pages/CalendarPage';
import Board from './pages/Board';
import Blog from './pages/Blog';
import Team from './pages/Team';
import Users from './pages/Users';


const Shell = styled.div`
  min-height: 100vh;
  display: grid;
  grid-template-columns: 240px 1fr;
  background: ${a.bg};
  font-family: 'Inter', system-ui, sans-serif;
  @media (max-width: 900px) { grid-template-columns: 1fr; }
`;

const Side = styled.aside`
  background: ${a.navy};
  color: #cbd5e1;
  padding: 18px 12px;
  position: sticky; top: 0; height: 100vh;
  display: flex; flex-direction: column; gap: 4px;
  .brand { display: flex; align-items: center; gap: 10px; padding: 4px 8px 18px; color: #fff; text-decoration: none; }
  .brand img { width: 38px; height: 38px; }
  .brand b { display: block; font-family: 'Poppins', sans-serif; font-size: 1rem; line-height: 1.1; }
  .brand small { color: ${a.gold}; font-size: 0.7rem; letter-spacing: 0.12em; text-transform: uppercase; }
  a.nav { display: flex; align-items: center; gap: 11px; padding: 10px 12px; border-radius: 10px; color: #cbd5e1; text-decoration: none; font-size: 0.92rem; font-weight: 500; }
  a.nav svg { width: 16px; }
  a.nav:hover { background: rgba(255,255,255,0.06); color: #fff; }
  a.nav.active { background: rgba(247,179,27,0.14); color: ${a.gold}; }
  .group { font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.12em; color: #64748b; padding: 14px 12px 4px; }
  .bottom { margin-top: auto; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 12px; }
  .me { padding: 6px 12px 10px; font-size: 0.82rem; }
  .me b { color: #fff; display: block; }
  .bottom button, .bottom a { width: 100%; display: flex; align-items: center; gap: 10px; padding: 9px 12px; border-radius: 10px; border: 0; background: none; color: #cbd5e1; cursor: pointer; font: inherit; font-size: 0.88rem; text-decoration: none; }
  .bottom button:hover, .bottom a:hover { background: rgba(255,255,255,0.06); color: #fff; }
  @media (max-width: 900px) {
    position: fixed; z-index: 1500; width: 260px; left: ${(p) => (p.$open ? '0' : '-300px')}; transition: left 0.25s; box-shadow: ${(p) => (p.$open ? '20px 0 50px rgba(0,0,0,0.3)' : 'none')};
  }
`;

const TopBar = styled.div`
  display: none;
  @media (max-width: 900px) {
    display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: ${a.navy}; color: #fff; position: sticky; top: 0; z-index: 1000;
    button { background: none; border: 0; color: #fff; font-size: 1.2rem; cursor: pointer; }
    b { font-family: 'Poppins', sans-serif; }
  }
`;

const Main = styled.main`
  padding: 26px clamp(16px, 3vw, 34px) 60px;
  min-width: 0;
  /* while a change is being saved, lock other buttons so nothing is sent twice */
  body.ne-saving & button, body.ne-saving & a[role='button'] { pointer-events: none; opacity: 0.6; cursor: progress; }
`;

const LoginWrap = styled.div`
  min-height: 100vh; display: grid; place-items: center; padding: 16px;
  background: radial-gradient(900px 400px at 80% 0%, #1a4fb455, transparent 60%), linear-gradient(160deg, ${a.navy}, #0d2a6b);
  font-family: 'Inter', system-ui, sans-serif;
  form { width: min(400px, 100%); background: #fff; border-radius: 20px; padding: 30px; box-shadow: 0 40px 100px rgba(0,0,0,0.35); display: grid; gap: 14px; }
  .logo { display: flex; align-items: center; gap: 12px; margin-bottom: 4px; }
  .logo img { width: 46px; height: 46px; }
  h1 { font-size: 1.3rem; margin: 0; font-family: 'Poppins', sans-serif; color: ${a.text}; }
  p { margin: 0; color: ${a.muted}; font-size: 0.88rem; }
  a { color: ${a.blue}; font-size: 0.85rem; text-align: center; }
`;

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try { const r = await post('auth/login', { email, password }); onLogin(r.user); } catch (ex) { setErr(ex.message); } finally { setBusy(false); }
  };
  return (
    <LoginWrap>
      <form onSubmit={submit}>
        <div className="logo"><img src={img('logo-192.png')} alt="" /><div><h1>Noor Electric Admin</h1><p>Sign in to manage the business</p></div></div>
        {err && <ErrorBox>{err}</ErrorBox>}
        <Field>Email<input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required /></Field>
        <Field>Password<input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></Field>
        <Btn type="submit" disabled={busy}>{busy ? <><Spinner $light $size={16} />Signing in…</> : 'Sign in'}</Btn>
        <Link to="/">← Back to website</Link>
      </form>
    </LoginWrap>
  );
}

function PasswordModal({ onClose }) {
  const [f, setF] = useState({ current: '', next: '' });
  const [msg, setMsg] = useState(''); const [err, setErr] = useState('');
  const save = async () => {
    setErr(''); setMsg('');
    try { await post('auth/password', f); setMsg('Password changed.'); setF({ current: '', next: '' }); } catch (e) { setErr(e.message); }
  };
  return (
    <Modal title="Change password" onClose={onClose} width={420} footer={<><span /><Btn type="button" onClick={save}>Save</Btn></>}>
      {err && <ErrorBox>{err}</ErrorBox>}
      {msg && <p style={{ color: a.green }}>{msg}</p>}
      <div style={{ display: 'grid', gap: 12 }}>
        <Field>Current password<input type="password" value={f.current} onChange={(e) => setF({ ...f, current: e.target.value })} /></Field>
        <Field>New password (8+ characters)<input type="password" value={f.next} onChange={(e) => setF({ ...f, next: e.target.value })} /></Field>
      </div>
    </Modal>
  );
}

const NAV = [
  { to: '', label: 'Dashboard', icon: faGauge, end: true },
  { to: 'quotes', label: 'Quotations', icon: faFileInvoiceDollar },
  { to: 'calendar', label: 'Calendar', icon: faCalendarDays },
  { to: 'projects', label: 'Projects', icon: faTableColumns },
  { to: 'blog', label: 'Blog', icon: faNewspaper },
  { to: 'team', label: 'Team & salaries', icon: faUsers, owner: true },
  { to: 'users', label: 'Admin users', icon: faUserShield, owner: true },
];

export default function AdminApp() {
  const [user, setUser] = useState(undefined);
  const [open, setOpen] = useState(false);
  const [pw, setPw] = useState(false);
  const [bootErr, setBootErr] = useState('');

  useEffect(() => {
    document.title = 'Admin | Noor Electric Renewables';
    get('auth/me').then((r) => setUser(r.user)).catch((e) => {
      if (e instanceof ApiError && e.status === 401) setUser(null);
      else { setUser(null); setBootErr(e.message); }
    });
  }, []);

  const logout = useCallback(async () => { try { await post('auth/logout'); } catch { /* ignore */ } setUser(null); }, []);

  if (user === undefined) return <LoginWrap><div style={{ background: '#fff', borderRadius: 16, padding: '10px 40px' }}><Loading label="Loading admin…" /></div></LoginWrap>;
  if (!user) {
    return (
      <>
        {bootErr && <div style={{ position: 'fixed', top: 12, left: 12, right: 12, zIndex: 10 }}><ErrorBox>{bootErr}</ErrorBox></div>}
        <Login onLogin={setUser} />
      </>
    );
  }
  const isOwner = user.role === 'owner';

  return (
    <AuthCtx.Provider value={{ user, isOwner, logout }}>
      <ActivityIndicator />
      <TopBar>
        <button type="button" onClick={() => setOpen(true)} aria-label="Open menu"><FontAwesomeIcon icon={faBars} /></button>
        <b>Noor Electric Admin</b>
        <span />
      </TopBar>
      <Shell>
        <Side $open={open}>
          <Link to="/admin" className="brand" onClick={() => setOpen(false)}>
            <img src={img('logo-192.png')} alt="" />
            <span><b>Noor Electric</b><small>Admin</small></span>
          </Link>
          {open && <button type="button" onClick={() => setOpen(false)} style={{ position: 'absolute', right: 14, top: 18, background: 'none', border: 0, color: '#fff', fontSize: '1.1rem' }} aria-label="Close menu"><FontAwesomeIcon icon={faXmark} /></button>}
          {NAV.filter((n) => !n.owner || isOwner).map((n, i) => (
            <span key={n.label}>
              {i === 5 && <div className="group">Owner only</div>}
              <NavLink to={n.to === '' ? '/admin' : `/admin/${n.to}`} end={n.end} className="nav" onClick={() => setOpen(false)}>
                <FontAwesomeIcon icon={n.icon} />{n.label}
              </NavLink>
            </span>
          ))}
          <div className="bottom">
            <div className="me"><b>{user.name}</b>{user.email} · {user.role}</div>
            <a href="/" target="_blank" rel="noopener noreferrer"><FontAwesomeIcon icon={faArrowUpRightFromSquare} />View website</a>
            <button type="button" onClick={() => setPw(true)}><FontAwesomeIcon icon={faKey} />Change password</button>
            <button type="button" onClick={logout}><FontAwesomeIcon icon={faRightFromBracket} />Sign out</button>
          </div>
        </Side>
        <Main>
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="quotes" element={<Quotes />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="projects" element={<Board />} />
            <Route path="blog" element={<Blog />} />
            {isOwner && <Route path="team" element={<Team />} />}
            {isOwner && <Route path="users" element={<Users />} />}
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </Main>
      </Shell>
      {pw && <PasswordModal onClose={() => setPw(false)} />}
    </AuthCtx.Provider>
  );
}
