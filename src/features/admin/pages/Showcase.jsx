/* eslint-disable react/prop-types */
import { useRef, useState } from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus, faTrash, faArrowUp, faArrowDown, faEye, faEyeSlash, faPen, faImage, faXmark, faStar, faArrowUpRightFromSquare,
} from '@fortawesome/free-solid-svg-icons';
import { post, patch, del } from '../../../lib/api';
import { assetUrl } from '../../../lib/publicContent';
import { useLoad } from '../hooks';
import { uploadImage } from '../imageUpload';
import { a, Card, PageHead, Btn, Badge, Empty, ErrorBox, Modal, Field, FormGrid, Loading, LoadFailed, Spinner } from '../ui';

const List = styled.div`display: grid; gap: 12px;`;

const Row = styled(Card)`
  display: grid; grid-template-columns: 112px 1fr auto; gap: 16px; align-items: center; padding: 12px;
  opacity: ${(p) => (p.$hidden ? 0.6 : 1)};
  .thumb { width: 112px; height: 84px; border-radius: 10px; object-fit: cover; background: linear-gradient(135deg, ${a.navy}, ${a.blue});
    display: grid; place-items: center; color: ${a.gold}; font-size: 1.4rem; overflow: hidden; }
  .thumb img { width: 100%; height: 100%; object-fit: cover; }
  h3 { margin: 0 0 4px; font-size: 1rem; color: ${a.text}; }
  p { margin: 0; color: ${a.muted}; font-size: 0.85rem; }
  .meta { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; }
  .acts { display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }
  @media (max-width: 720px) {
    grid-template-columns: 84px 1fr;
    .thumb { width: 84px; height: 66px; }
    .acts { grid-column: 1 / -1; justify-content: flex-start; }
  }
`;

const Photos = styled.div`
  display: flex; gap: 10px; flex-wrap: wrap;
  .ph { position: relative; width: 120px; height: 90px; border-radius: 10px; overflow: hidden; border: 2px solid ${a.line}; background: #f8fafc; }
  .ph.cover { border-color: ${a.gold}; }
  .ph img { width: 100%; height: 100%; object-fit: cover; }
  .ph .x { position: absolute; top: 4px; right: 4px; width: 24px; height: 24px; border-radius: 50%; border: 0; background: rgba(0,0,0,0.6); color: #fff; cursor: pointer; }
  .ph .cv { position: absolute; left: 4px; bottom: 4px; border: 0; border-radius: 6px; font-size: 0.68rem; font-weight: 700; padding: 3px 6px; cursor: pointer;
    background: rgba(255,255,255,0.92); color: ${a.navy}; }
  .ph.cover .cv { background: ${a.gold}; }
  .add { width: 120px; height: 90px; border-radius: 10px; border: 2px dashed ${a.line}; background: #fff; color: ${a.muted}; cursor: pointer;
    display: grid; place-items: center; font-size: 0.8rem; font-weight: 600; gap: 4px; }
  .add:hover { border-color: ${a.blue}; color: ${a.blue}; }
`;

const SpecRow = styled.div`
  display: grid; grid-template-columns: 160px 1fr 36px; gap: 8px; margin-bottom: 8px;
  input { font: inherit; font-size: 0.9rem; border: 1px solid ${a.line}; border-radius: 10px; padding: 8px 10px; }
  button { border: 1px solid ${a.line}; background: #fff; border-radius: 10px; cursor: pointer; color: ${a.muted}; }
  @media (max-width: 560px) { grid-template-columns: 1fr 1fr 36px; }
`;

const Help = styled.span`font-size: 0.76rem; color: ${a.muted}; font-weight: 400;`;

const CATEGORIES = { residential: 'Residential', commercial: 'Commercial', industrial: 'Industrial', agricultural: 'Agricultural' };

function ProjectForm({ item, onClose, onSaved }) {
  const isNew = !item._id;
  const [f, setF] = useState({
    title: '', location: '', category: 'residential', published: true,
    ...item,
    gallery: item.gallery?.length ? item.gallery : item.image ? [item.image] : [],
    highlightsText: (item.highlights || []).join('\n'),
    specs: item.specs?.length ? item.specs : [{ label: 'Panels', value: '' }, { label: 'Inverter', value: '' }],
  });
  const [err, setErr] = useState('');
  const [uploading, setUploading] = useState(0);
  const fileRef = useRef(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const addPhotos = async (files) => {
    setErr('');
    const list = Array.from(files || []).slice(0, 8 - f.gallery.length);
    setUploading(list.length);
    for (const file of list) {
      try {
        const url = await uploadImage(file);
        setF((cur) => ({ ...cur, gallery: [...cur.gallery, url], image: cur.image || url }));
      } catch (e) { setErr(e.message); }
      setUploading((n) => n - 1);
    }
    if (fileRef.current) fileRef.current.value = '';
  };
  const removePhoto = (u) => setF((cur) => {
    const gallery = cur.gallery.filter((g) => g !== u);
    return { ...cur, gallery, image: cur.image === u ? gallery[0] || '' : cur.image };
  });

  const save = async () => {
    setErr('');
    const body = {
      title: f.title, location: f.location, category: f.category, published: f.published,
      image: f.image || f.gallery[0] || '',
      gallery: f.gallery,
      highlights: f.highlightsText.split('\n').map((s) => s.trim()).filter(Boolean),
      specs: f.specs.filter((s) => s.label.trim() && s.value.trim()),
    };
    try {
      if (isNew) await post('showcase', body); else await patch(`showcase/${item._id}`, body);
      onSaved();
    } catch (e) { setErr(e.message); }
  };

  return (
    <Modal
      title={isNew ? 'Add project to website' : `Edit — ${item.title}`}
      onClose={onClose}
      width={760}
      footer={(
        <>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem' }}>
            <input type="checkbox" checked={f.published} onChange={set('published')} /> Show on website
          </label>
          <Btn type="button" onClick={save} disabled={uploading > 0 || !f.title.trim()}>{isNew ? 'Add project' : 'Save changes'}</Btn>
        </>
      )}
    >
      {err && <ErrorBox>{err}</ErrorBox>}
      <FormGrid>
        <Field $full>Project title<input value={f.title} onChange={set('title')} placeholder="e.g. 15 kW Hybrid Solar System" /></Field>
        <Field>Location / type<input value={f.location} onChange={set('location')} placeholder="e.g. Hayatabad, Peshawar · Residential" /></Field>
        <Field>Category
          <select value={f.category} onChange={set('category')}>{Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        </Field>
        <Field as="div" $full>
          <span>Photos <Help>· up to 8 · the gold one is the cover photo</Help></span>
          <Photos>
            {f.gallery.map((u) => (
              <div key={u} className={`ph${u === f.image ? ' cover' : ''}`}>
                <img src={assetUrl(u)} alt="" />
                <button type="button" className="x" onClick={() => removePhoto(u)} aria-label="Remove photo"><FontAwesomeIcon icon={faXmark} /></button>
                <button type="button" className="cv" onClick={() => setF({ ...f, image: u })}>{u === f.image ? <><FontAwesomeIcon icon={faStar} /> Cover</> : 'Make cover'}</button>
              </div>
            ))}
            {Array.from({ length: uploading }).map((_, i) => <div key={`u${i}`} className="ph" style={{ display: 'grid', placeItems: 'center' }}><Spinner /></div>)}
            {f.gallery.length + uploading < 8 && (
              <button type="button" className="add" onClick={() => fileRef.current?.click()}>
                <span><FontAwesomeIcon icon={faImage} /><br />Add photos</span>
              </button>
            )}
          </Photos>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => addPhotos(e.target.files)} />
        </Field>
        <Field $full>
          <span>Highlights <Help>· one per line, shown as tags (max 6)</Help></span>
          <textarea value={f.highlightsText} onChange={set('highlightsText')} rows={3} placeholder={'15 kWp solar capacity\n20 kWh battery storage\nNet-metering approved'} />
        </Field>
        <Field as="div" $full>
          <span>Specifications <Help>· e.g. Panels, Inverter, Battery, Structure</Help></span>
          {f.specs.map((s, i) => (
            <SpecRow key={i}>
              <input value={s.label} placeholder="Label" aria-label="Specification label" onChange={(e) => setF({ ...f, specs: f.specs.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} />
              <input value={s.value} placeholder="Details" aria-label="Specification details" onChange={(e) => setF({ ...f, specs: f.specs.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)) })} />
              <button type="button" onClick={() => setF({ ...f, specs: f.specs.filter((_, j) => j !== i) })} aria-label="Remove specification"><FontAwesomeIcon icon={faXmark} /></button>
            </SpecRow>
          ))}
          {f.specs.length < 8 && <div><Btn type="button" $v="ghost" $sm onClick={() => setF({ ...f, specs: [...f.specs, { label: '', value: '' }] })}><FontAwesomeIcon icon={faPlus} /> Add specification</Btn></div>}
        </Field>
      </FormGrid>
    </Modal>
  );
}

export default function Showcase() {
  const { data, error, loading, reload, setData } = useLoad('showcase');
  const [open, setOpen] = useState(null);
  const [err, setErr] = useState('');
  const items = data?.items || [];

  const move = async (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = items.slice();
    [next[i], next[j]] = [next[j], next[i]];
    setData((d) => ({ ...d, items: next }));
    try { await post('showcase/reorder', { ids: next.map((p) => p._id) }); } catch (e) { setErr(e.message); reload(); }
  };
  const toggle = async (p) => {
    setData((d) => ({ ...d, items: d.items.map((x) => (x._id === p._id ? { ...x, published: !p.published } : x)) }));
    try { await patch(`showcase/${p._id}`, { published: !p.published }); } catch (e) { setErr(e.message); reload(); }
  };
  const remove = async (p) => {
    if (!window.confirm(`Delete “${p.title}” from the website? This cannot be undone.`)) return;
    try { await del(`showcase/${p._id}`); reload(); } catch (e) { setErr(e.message); }
  };

  return (
    <>
      <PageHead>
        <div><h1>Website projects</h1><p>Completed installations shown on the home and Projects pages. The first three appear on the home page.</p></div>
        <div className="actions">
          <Btn as="a" $v="ghost" href="/projects" target="_blank" rel="noopener noreferrer"><FontAwesomeIcon icon={faArrowUpRightFromSquare} /> View on site</Btn>
          <Btn type="button" onClick={() => setOpen({})}><FontAwesomeIcon icon={faPlus} /> Add project</Btn>
        </div>
      </PageHead>
      {(error || err) && <ErrorBox>{error || err}</ErrorBox>}
      {items.length ? (
        <List>
          {items.map((p, i) => (
            <Row key={p._id} $hidden={!p.published}>
              <div className="thumb">{p.image ? <img src={assetUrl(p.image)} alt="" /> : <FontAwesomeIcon icon={faImage} />}</div>
              <div>
                <h3>{p.title}</h3>
                <p>{p.location || '—'}</p>
                <div className="meta">
                  <Badge $tone="blue">{CATEGORIES[p.category] || 'Project'}</Badge>
                  {i < 3 && p.published && <Badge $tone="gold">On home page</Badge>}
                  {!p.published && <Badge $tone="gray">Hidden</Badge>}
                  <Badge $tone="gray">{(p.gallery || []).length} photo{(p.gallery || []).length === 1 ? '' : 's'}</Badge>
                </div>
              </div>
              <div className="acts">
                <Btn type="button" $sm $v="ghost" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up"><FontAwesomeIcon icon={faArrowUp} /></Btn>
                <Btn type="button" $sm $v="ghost" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Move down"><FontAwesomeIcon icon={faArrowDown} /></Btn>
                <Btn type="button" $sm $v="ghost" onClick={() => toggle(p)}><FontAwesomeIcon icon={p.published ? faEyeSlash : faEye} /> {p.published ? 'Hide' : 'Show'}</Btn>
                <Btn type="button" $sm $v="ghost" onClick={() => setOpen(p)}><FontAwesomeIcon icon={faPen} /> Edit</Btn>
                <Btn type="button" $sm $v="danger" onClick={() => remove(p)} aria-label="Delete project"><FontAwesomeIcon icon={faTrash} /></Btn>
              </div>
            </Row>
          ))}
        </List>
      ) : (
        <Card $pad="0">
          {loading ? <Loading label="Loading projects…" /> : error && !data ? <LoadFailed onRetry={reload} /> : <Empty><FontAwesomeIcon icon={faImage} /><br />No projects on the website yet.</Empty>}
        </Card>
      )}
      {open && <ProjectForm item={open} onClose={() => setOpen(null)} onSaved={() => { setOpen(null); reload(); }} />}
    </>
  );
}
