/* eslint-disable react/prop-types */
import { useState } from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus, faTrash, faArrowUp, faArrowDown, faEye, faEyeSlash, faPen, faStar, faComments, faArrowUpRightFromSquare,
} from '@fortawesome/free-solid-svg-icons';
import { post, patch, del } from '../../../lib/api';
import { useLoad } from '../hooks';
import { a, Card, PageHead, Btn, Badge, Empty, ErrorBox, Modal, Field, FormGrid, Loading, LoadFailed } from '../ui';

const SOURCES = { facebook: 'Facebook', google: 'Google', whatsapp: 'WhatsApp', website: 'Website / in person', other: 'Other' };

const List = styled.div`display: grid; gap: 12px;`;
const Row = styled(Card)`
  display: grid; grid-template-columns: 1fr auto; gap: 16px; align-items: start;
  opacity: ${(p) => (p.$hidden ? 0.6 : 1)};
  h3 { margin: 0; font-size: 1rem; color: ${a.text}; }
  blockquote { margin: 8px 0 10px; color: ${a.muted}; font-size: 0.9rem; line-height: 1.55;
    display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
  .meta { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
  .stars { color: ${a.gold}; font-size: 0.8rem; display: inline-flex; gap: 2px; }
  .acts { display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }
  @media (max-width: 720px) { grid-template-columns: 1fr; .acts { justify-content: flex-start; } }
`;

const StarPick = styled.div`
  display: flex; gap: 4px; align-items: center;
  button { border: 0; background: none; font-size: 1.3rem; cursor: pointer; color: #d0d5dd; padding: 2px; }
  button.on { color: ${a.gold}; }
  .clear { font-size: 0.8rem; color: ${a.muted}; margin-left: 8px; text-decoration: underline; }
`;

function ReviewForm({ item, onClose, onSaved }) {
  const isNew = !item._id;
  const [f, setF] = useState({ name: '', location: '', text: '', source: 'facebook', rating: 5, published: true, ...item });
  const [err, setErr] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const save = async () => {
    setErr('');
    const body = { name: f.name, location: f.location, text: f.text, source: f.source, rating: f.rating || null, published: f.published };
    try {
      if (isNew) await post('reviews', body); else await patch(`reviews/${item._id}`, body);
      onSaved();
    } catch (e) { setErr(e.message); }
  };
  return (
    <Modal
      title={isNew ? 'Add client review' : `Edit review — ${item.name}`}
      onClose={onClose}
      footer={(
        <>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem' }}>
            <input type="checkbox" checked={f.published} onChange={set('published')} /> Show on website
          </label>
          <Btn type="button" onClick={save} disabled={!f.name.trim() || !f.text.trim()}>{isNew ? 'Add review' : 'Save changes'}</Btn>
        </>
      )}
    >
      {err && <ErrorBox>{err}</ErrorBox>}
      <FormGrid>
        <Field>Client name<input value={f.name} onChange={set('name')} placeholder="e.g. Ahmed Khan" /></Field>
        <Field>Location (optional)<input value={f.location} onChange={set('location')} placeholder="e.g. Hayatabad, Peshawar" /></Field>
        <Field>Where was it posted?
          <select value={f.source} onChange={set('source')}>{Object.entries(SOURCES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        </Field>
        <Field as="div">Rating
          <StarPick>
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" className={n <= (f.rating || 0) ? 'on' : ''} onClick={() => setF({ ...f, rating: n })} aria-label={`${n} star${n > 1 ? 's' : ''}`}><FontAwesomeIcon icon={faStar} /></button>
            ))}
            {f.rating ? <button type="button" className="clear" onClick={() => setF({ ...f, rating: null })}>no rating</button> : <span className="clear" style={{ textDecoration: 'none' }}>no rating</span>}
          </StarPick>
        </Field>
        <Field $full>Review
          <textarea value={f.text} onChange={set('text')} rows={6} maxLength={1500} placeholder="Paste the client’s words exactly as they wrote them." />
        </Field>
      </FormGrid>
      <p style={{ fontSize: '0.8rem', color: a.muted, marginTop: 10 }}>Only publish genuine reviews, with the client’s permission and in their own words.</p>
    </Modal>
  );
}

export default function Reviews() {
  const { data, error, loading, reload, setData } = useLoad('reviews');
  const [open, setOpen] = useState(null);
  const [err, setErr] = useState('');
  const items = data?.items || [];

  const move = async (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = items.slice();
    [next[i], next[j]] = [next[j], next[i]];
    setData((d) => ({ ...d, items: next }));
    try { await post('reviews/reorder', { ids: next.map((r) => r._id) }); } catch (e) { setErr(e.message); reload(); }
  };
  const toggle = async (r) => {
    setData((d) => ({ ...d, items: d.items.map((x) => (x._id === r._id ? { ...x, published: !r.published } : x)) }));
    try { await patch(`reviews/${r._id}`, { published: !r.published }); } catch (e) { setErr(e.message); reload(); }
  };
  const remove = async (r) => {
    if (!window.confirm(`Delete the review from ${r.name}? This cannot be undone.`)) return;
    try { await del(`reviews/${r._id}`); reload(); } catch (e) { setErr(e.message); }
  };

  return (
    <>
      <PageHead>
        <div><h1>Client reviews</h1><p>Testimonials shown on the home and Projects pages, in this order.</p></div>
        <div className="actions">
          <Btn as="a" $v="ghost" href="/projects" target="_blank" rel="noopener noreferrer"><FontAwesomeIcon icon={faArrowUpRightFromSquare} /> View on site</Btn>
          <Btn type="button" onClick={() => setOpen({})}><FontAwesomeIcon icon={faPlus} /> Add review</Btn>
        </div>
      </PageHead>
      {(error || err) && <ErrorBox>{error || err}</ErrorBox>}
      {items.length ? (
        <List>
          {items.map((r, i) => (
            <Row key={r._id} $hidden={!r.published}>
              <div>
                <h3>{r.name}{r.location ? <span style={{ color: a.muted, fontWeight: 400 }}> · {r.location}</span> : null}</h3>
                <blockquote>“{r.text}”</blockquote>
                <div className="meta">
                  {r.rating ? <span className="stars">{Array.from({ length: r.rating }).map((_, k) => <FontAwesomeIcon key={k} icon={faStar} />)}</span> : null}
                  <Badge $tone="blue">{SOURCES[r.source] || 'Other'}</Badge>
                  {!r.published && <Badge $tone="gray">Hidden</Badge>}
                </div>
              </div>
              <div className="acts">
                <Btn type="button" $sm $v="ghost" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up"><FontAwesomeIcon icon={faArrowUp} /></Btn>
                <Btn type="button" $sm $v="ghost" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Move down"><FontAwesomeIcon icon={faArrowDown} /></Btn>
                <Btn type="button" $sm $v="ghost" onClick={() => toggle(r)}><FontAwesomeIcon icon={r.published ? faEyeSlash : faEye} /> {r.published ? 'Hide' : 'Show'}</Btn>
                <Btn type="button" $sm $v="ghost" onClick={() => setOpen(r)}><FontAwesomeIcon icon={faPen} /> Edit</Btn>
                <Btn type="button" $sm $v="danger" onClick={() => remove(r)} aria-label="Delete review"><FontAwesomeIcon icon={faTrash} /></Btn>
              </div>
            </Row>
          ))}
        </List>
      ) : (
        <Card $pad="0">
          {loading ? <Loading label="Loading reviews…" /> : error && !data ? <LoadFailed onRetry={reload} /> : <Empty><FontAwesomeIcon icon={faComments} /><br />No reviews yet — add your first client review.</Empty>}
        </Card>
      )}
      {open && <ReviewForm item={open} onClose={() => setOpen(null)} onSaved={() => { setOpen(null); reload(); }} />}
    </>
  );
}
