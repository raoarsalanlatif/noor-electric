 
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faClock, faNewspaper } from '@fortawesome/free-solid-svg-icons';
import { get } from '../lib/api';
import { markdownToHtml } from '../lib/markdown';
import { brand, fonts } from '../styles/variables';
import { company, img } from '../content/company';
import PageHeader from '../components/layout/PageHeader';
import Prose from '../components/ui/Prose';
import CtaBand from '../components/sections/CtaBand';
import { Section, Container, Grid, Reveal, ButtonLink } from '../components/ui/primitives';

const PostCard = styled(Link)`
  display: flex; flex-direction: column; height: 100%;
  background: #fff; border: 1px solid ${brand.line}; border-radius: 20px; overflow: hidden; text-decoration: none; color: inherit;
  transition: transform 0.25s, box-shadow 0.25s;
  &:hover { transform: translateY(-5px); box-shadow: 0 24px 50px rgba(10,31,77,0.1); }
  .cover { aspect-ratio: 16 / 9; background: linear-gradient(135deg, ${brand.navy}, ${brand.blue}); display: grid; place-items: center; color: ${brand.gold}; font-size: 2rem; }
  .cover img { width: 100%; height: 100%; object-fit: cover; }
  .body { padding: 20px 22px 24px; display: flex; flex-direction: column; flex: 1; }
  .meta { font-size: 0.8rem; color: ${brand.muted}; margin-bottom: 8px; display: flex; gap: 10px; flex-wrap: wrap; }
  h3 { font-size: 1.2rem; margin-bottom: 8px; }
  p { color: ${brand.muted}; font-size: 0.95rem; flex: 1; }
  .more { color: ${brand.blue}; font-weight: 700; margin-top: 14px; font-size: 0.9rem; }
`;

const Tag = styled.span`
  background: ${brand.bgSoft}; color: ${brand.navy}; font-weight: 600; font-size: 0.72rem; padding: 3px 9px; border-radius: 999px;
`;

const Article = styled.article`
  max-width: 760px; margin: 0 auto;
  .back { display: inline-flex; gap: 8px; align-items: center; color: ${brand.blue}; font-weight: 600; text-decoration: none; margin-bottom: 22px; }
  .cover { width: 100%; border-radius: 20px; margin-bottom: 28px; max-height: 420px; object-fit: cover; }
  .byline { display: flex; align-items: center; gap: 12px; margin-bottom: 26px; color: ${brand.muted}; font-size: 0.9rem; }
  .byline img { width: 40px; height: 40px; }
  .byline b { color: ${brand.ink}; display: block; font-family: ${fonts.heading}; }
`;

const Message = styled.div`
  text-align: center; color: ${brand.muted}; padding: 50px 0;
  svg { font-size: 2.4rem; color: ${brand.line}; margin-bottom: 12px; }
`;

const fmt = (d) => (d ? new Date(d).toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' }) : '');

export function BlogList() {
  const [state, setState] = useState({ items: null, error: '' });
  useEffect(() => {
    document.title = `Blog | ${company.name}`;
    get('public/blogs').then((r) => setState({ items: r.items, error: '' })).catch((e) => setState({ items: [], error: e.message }));
  }, []);
  return (
    <>
      <PageHeader title="Solar insights & project stories" crumb="Blog" subtitle="Guides on net-metering, batteries and saving on your bill — plus the latest installations from our team." />
      <Section $tone="soft">
        <Container>
          {state.items === null && <Message>Loading articles…</Message>}
          {state.items && !state.items.length && (
            <Message>
              <FontAwesomeIcon icon={faNewspaper} /><br />
              {state.error ? 'Articles are not available right now.' : 'Our first articles are coming soon.'}
              <div style={{ marginTop: 18 }}><ButtonLink to="/planner">Try the Solar Planner meanwhile</ButtonLink></div>
            </Message>
          )}
          {state.items?.length > 0 && (
            <Grid $cols={3}>
              {state.items.map((p, i) => (
                <Reveal key={p._id} delay={(i % 3) * 0.07}>
                  <PostCard to={`/blog/${p.slug}`}>
                    <div className="cover">{p.coverUrl ? <img src={p.coverUrl} alt="" loading="lazy" /> : <FontAwesomeIcon icon={faNewspaper} />}</div>
                    <div className="body">
                      <div className="meta"><span>{fmt(p.publishedAt)}</span><span><FontAwesomeIcon icon={faClock} /> {p.readMinutes} min read</span></div>
                      <h3>{p.title}</h3>
                      <p>{p.excerpt}</p>
                      {p.tags?.length > 0 && <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>{p.tags.slice(0, 3).map((t) => <Tag key={t}>{t}</Tag>)}</div>}
                      <span className="more">Read article →</span>
                    </div>
                  </PostCard>
                </Reveal>
              ))}
            </Grid>
          )}
        </Container>
      </Section>
      <CtaBand bg="#f3f6fc" />
    </>
  );
}

export function BlogPost() {
  const { slug } = useParams();
  const [state, setState] = useState({ item: null, error: '' });
  useEffect(() => {
    setState({ item: null, error: '' });
    get(`public/blogs/${encodeURIComponent(slug)}`)
      .then((r) => { setState({ item: r.item, error: '' }); document.title = `${r.item.title} | ${company.name}`; })
      .catch((e) => setState({ item: null, error: e.status === 404 ? 'This article was not found.' : e.message }));
  }, [slug]);
  const html = useMemo(() => markdownToHtml(state.item?.content || ''), [state.item]);
  const p = state.item;
  return (
    <>
      <PageHeader title={p ? p.title : state.error ? 'Article not found' : 'Loading…'} crumb="Blog" subtitle={p?.excerpt} />
      <Section>
        <Container>
          <Article>
            <Link to="/blog" className="back"><FontAwesomeIcon icon={faArrowLeft} /> All articles</Link>
            {state.error && <Message>{state.error}</Message>}
            {p && (
              <>
                {p.coverUrl && <img className="cover" src={p.coverUrl} alt="" />}
                <div className="byline">
                  <img src={img('logo-192.png')} alt="" />
                  <span><b>{p.authorName || company.name}</b>{fmt(p.publishedAt)}</span>
                  {p.tags?.length > 0 && <span style={{ marginLeft: 'auto', display: 'flex', gap: 6, flexWrap: 'wrap' }}>{p.tags.map((t) => <Tag key={t}>{t}</Tag>)}</span>}
                </div>
                <Prose dangerouslySetInnerHTML={{ __html: html }} />
              </>
            )}
          </Article>
        </Container>
      </Section>
      <CtaBand />
    </>
  );
}
