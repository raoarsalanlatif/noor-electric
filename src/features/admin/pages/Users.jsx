/* eslint-disable react/prop-types */
import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { post, patch, del } from '../../../lib/api';
import { useAuth, useLoad } from '../hooks';
import { a, Card, PageHead, Btn, Badge, Table, ErrorBox, Modal, Field, FormGrid, fmtDate } from '../ui';

function UserModal({ u, onClose, onSaved }) {
  const isNew = !u._id;
  const [f, setF] = useState({ role: 'staff', active: true, ...u, password: '' });
  const [err, setErr] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = async () => {
    setErr('');
    try {
      if (isNew) await post('users', f);
      else await patch(`users/${u._id}`, { name: f.name, role: f.role, active: f.active, ...(f.password ? { password: f.password } : {}) });
      onSaved();
    } catch (e) { setErr(e.message); }
  };
  return (
    <Modal title={isNew ? 'Add admin user' : u.email} onClose={onClose} width={520} footer={<><span /><Btn type="button" onClick={save}>Save</Btn></>}>
      {err && <ErrorBox>{err}</ErrorBox>}
      <FormGrid>
        <Field>Name<input value={f.name || ''} onChange={set('name')} /></Field>
        <Field>Email<input type="email" value={f.email || ''} onChange={set('email')} disabled={!isNew} /></Field>
        <Field>Role
          <select value={f.role} onChange={set('role')}><option value="staff">Staff — no salaries or users</option><option value="owner">Owner — full access</option></select>
        </Field>
        <Field>Status<select value={f.active ? 'true' : 'false'} onChange={(e) => setF({ ...f, active: e.target.value === 'true' })}><option value="true">Active</option><option value="false">Disabled</option></select></Field>
        <Field $full>{isNew ? 'Password (8+ characters)' : 'New password (leave empty to keep)'}<input type="password" autoComplete="new-password" value={f.password} onChange={set('password')} /></Field>
      </FormGrid>
      <p style={{ color: a.muted, fontSize: '0.82rem', marginBottom: 0 }}>Share the password with the person directly and ask them to change it after signing in.</p>
    </Modal>
  );
}

export default function Users() {
  const { user } = useAuth();
  const { data, error, reload } = useLoad('users');
  const [open, setOpen] = useState(null);
  const [err, setErr] = useState('');
  const remove = async (u) => {
    if (!window.confirm(`Remove ${u.email}? They will no longer be able to sign in.`)) return;
    try { await del(`users/${u._id}`); reload(); } catch (e) { setErr(e.message); }
  };
  return (
    <>
      <PageHead>
        <div><h1>Admin users</h1><p>Who can sign in to this panel. Staff can manage quotations, calendar, projects and blog — not salaries.</p></div>
        <div className="actions"><Btn type="button" onClick={() => setOpen({})}><FontAwesomeIcon icon={faPlus} /> Add user</Btn></div>
      </PageHead>
      {(error || err) && <ErrorBox>{error || err}</ErrorBox>}
      <Card $pad="0">
        <Table>
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Added</th><th /></tr></thead>
            <tbody>
              {(data?.items || []).map((u) => (
                <tr key={u._id}>
                  <td><b>{u.name}</b>{u._id === user._id && <Badge $tone="blue" style={{ marginLeft: 6 }}>you</Badge>}</td>
                  <td>{u.email}</td>
                  <td><Badge $tone={u.role === 'owner' ? 'purple' : 'gray'}>{u.role}</Badge></td>
                  <td><Badge $tone={u.active ? 'green' : 'red'}>{u.active ? 'Active' : 'Disabled'}</Badge></td>
                  <td>{fmtDate(u.createdAt)}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <Btn type="button" $sm $v="ghost" onClick={() => setOpen(u)}>Edit</Btn>{' '}
                    {u._id !== user._id && <Btn type="button" $sm $v="danger" onClick={() => remove(u)} aria-label="Remove user"><FontAwesomeIcon icon={faTrash} /></Btn>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Table>
      </Card>
      {open && <UserModal u={open} onClose={() => setOpen(null)} onSaved={() => { setOpen(null); reload(); }} />}
    </>
  );
}
