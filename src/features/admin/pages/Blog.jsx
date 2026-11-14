/* eslint-disable react/prop-types */
import { useMemo, useState } from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faNewspaper, faTrash, faEye, faPen, faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';
import { post, patch, del } from '../../../lib/api';
import { markdownToHtml } from '../../../lib/markdown';
import { useLoad } from '../hooks';
import Prose from '../../../components/ui/Prose';
import { a, Card, PageHead, Btn, Badge, Table, Empty, ErrorBox, Modal, Field, FormGrid, fmtDate, Loading, LoadFailed } from '../ui';


const Help = styled.p`
  font-size: 0.78rem; color: ${a.muted}; margin: 4px 0 0; font-weight: 400;
  code { background: #f1f5f9; padding: 1px 5px; border-radius: 4px; }
`;

const TEMPLATE = `## Why go solar now?

Electricity tariffs keep rising, and load-shedding is still part of life. A properly sized system pays for itself in a few years.

## What we installed

- 14 × 725 W Trina Solar bifacial panels
- Solis 12 kW hybrid inverter
- 16 kWh lithium battery

> Book a free site survey and we’ll design the right system for your roof.
`;

function Editor({ post: initial, onClose, onSaved }) {
  const isNew = !initial._id;
  const [f, setF] = useState({ status: 'draft', tags: [], content: isNew ? TEMPLATE : '', ...initial });
  const [tab, setTab] = useState('write');
  const [err, setErr] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const html = useMemo(() => markdownToHtml(f.content || ''), [f.content]);

  const save = async (status) => {
    setErr('');
    const body = { title: f.title, slug: f.slug, excerpt: f.excerpt, content: f.content, coverUrl: f.coverUrl, tags: f.tags, status: status || f.status };
    try {
      if (isNew) await post('blogs', body); else await patch(`blogs/${initial._id}`, body);
      onSaved();
    } catch (e) { setErr(e.message); }
  };
  const remove = async () => {
    if (!window.confirm('Delete this post permanently?')) return;
    try { await del(`blogs/${initial._id}`); onSaved(); } catch (e) { setErr(e.message); }
  };

  return (
    <Modal
      title={isNew ? 'New blog post' : 'Edit post'}
      onClose={onClose}
      width={900}
      footer={(
        <>
          {!isNew ? <Btn type="button" $v="danger" onClick={remove}><FontAwesomeIcon icon={faTrash} /> Delete</Btn> : <span />}
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn type="button" $v="ghost" onClick={() => save('draft')}>Save draft</Btn>
            <Btn type="button" $v="gold" onClick={() => save('published')}>{f.status === 'published' ? 'Update post' : 'Publish'}</Btn>
          </div>
        </>
      )}
    >
      {err && <ErrorBox>{err}</ErrorBox>}
      <FormGrid>
        <Field $full>Title<input value={f.title || ''} onChange={set('title')} placeholder="e.g. Net-metering in Peshawar: a step-by-step guide" /></Field>
        <Field>Web address (optional)<input value={f.slug || ''} onChange={set('slug')} placeholder="auto from title" /></Field>
        <Field>Tags (comma separated)<input value={(f.tags || []).join(', ')} onChange={(e) => setF({ ...f, tags: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) })} /></Field>
        <Field $full>Cover image URL (optional)<input value={f.coverUrl || ''} onChange={set('coverUrl')} placeholder="https://… or /images/project-12kw.jpg" /></Field>
        <Field $full>Short summary (shown on the blog list)<textarea style={{ minHeight: 60 }} value={f.excerpt || ''} onChange={set('excerpt')} /></Field>
        <Field as="div" $full>
          <span style={{ display: 'flex', justifyContent: 'space-between' }}>
            Article
            <span style={{ display: 'flex', gap: 6 }}>
              <Btn type="button" $sm $v={tab === 'write' ? undefined : 'ghost'} onClick={() => setTab('write')}><FontAwesomeIcon icon={faPen} /> Write</Btn>
              <Btn type="button" $sm $v={tab === 'preview' ? undefined : 'ghost'} onClick={() => setTab('preview')}><FontAwesomeIcon icon={faEye} /> Preview</Btn>
            </span>
          </span>
          {tab === 'write'
            ? <textarea style={{ minHeight: 320, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: '0.88rem' }} value={f.content || ''} onChange={set('content')} />
            : <Card style={{ minHeight: 320 }}><Prose dangerouslySetInnerHTML={{ __html: html }} /></Card>}
          <Help>Formatting: <code>## Heading</code> · <code>**bold**</code> · <code>*italic*</code> · <code>- list item</code> · <code>[link](https://…)</code> · <code>![photo](https://…)</code> · <code>&gt; quote</code></Help>
        </Field>
      </FormGrid>
    </Modal>
  );
}

export default function Blog() {
  const { data, error, loading, reload } = useLoad('blogs');
  const [open, setOpen] = useState(null);
  const items = data?.items || [];
  return (
    <>
      <PageHead>
        <div><h1>Blog</h1><p>Write articles and project stories. Published posts appear on noorelectric.org/blog.</p></div>
        <div className="actions">
          <Btn as="a" $v="ghost" href="/blog" target="_blank" rel="noopener noreferrer"><FontAwesomeIcon icon={faArrowUpRightFromSquare} /> View blog</Btn>
          <Btn type="button" onClick={() => setOpen({})}><FontAwesomeIcon icon={faPlus} /> New post</Btn>
        </div>
      </PageHead>
      {error && <ErrorBox>{error}</ErrorBox>}
      <Card $pad="0">
        {items.length ? (
          <Table>
            <table>
              <thead><tr><th>Title</th><th>Status</th><th>Author</th><th>Updated</th><th /></tr></thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p._id} style={{ cursor: 'pointer' }} onClick={() => setOpen(p)}>
                    <td><b>{p.title}</b><br /><span style={{ color: a.muted, fontSize: '0.8rem' }}>/blog/{p.slug}</span></td>
                    <td><Badge $tone={p.status === 'published' ? 'green' : 'gray'}>{p.status}</Badge></td>
                    <td>{p.authorName}</td>
                    <td>{fmtDate(p.updatedAt)}</td>
                    <td>{p.status === 'published' && <a href={`/blog/${p.slug}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ color: a.blue }}>Open ↗</a>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Table>
        ) : loading && !data ? <Loading label="Loading posts…" /> : error && !data ? <LoadFailed onRetry={reload} /> : <Empty><FontAwesomeIcon icon={faNewspaper} /><br />No posts yet — write your first article.</Empty>}
      </Card>
      {open && <Editor post={open} onClose={() => setOpen(null)} onSaved={() => { setOpen(null); reload(); }} />}
    </>
  );
}
