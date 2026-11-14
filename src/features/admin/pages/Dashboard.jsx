import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileInvoiceDollar, faCalendarDays, faTableColumns, faMoneyBillWave, faNewspaper } from '@fortawesome/free-solid-svg-icons';
import { useAuth, useLoad } from '../hooks';
import { a, Card, PageHead, Badge, Empty, ErrorBox, pkr, fmtDateTime, Loading } from '../ui';
import { STAGE_LABELS, QUOTE_LABELS, EVENT_LABELS } from '../labels';

const Kpis = styled.div`
  display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 12px; margin-bottom: 16px;
`;
const Kpi = styled(Card)`
  display: flex; gap: 14px; align-items: center;
  i { width: 44px; height: 44px; border-radius: 12px; display: grid; place-items: center; font-style: normal; background: ${(p) => p.$bg}; color: ${(p) => p.$fg}; font-size: 1.1rem; flex-shrink: 0; }
  small { color: ${a.muted}; font-size: 0.78rem; display: block; }
  b { font-size: 1.35rem; font-family: 'Poppins', sans-serif; color: ${a.text}; }
`;
const Cols = styled.div`
  display: grid; grid-template-columns: 1.2fr 1fr; gap: 16px;
  @media (max-width: 1100px) { grid-template-columns: 1fr; }
  h3 { font-size: 1rem; margin: 0 0 12px; display: flex; justify-content: space-between; align-items: center; }
  h3 a { font-size: 0.82rem; color: ${a.blue}; font-weight: 600; text-decoration: none; }
  ul { list-style: none; margin: 0; padding: 0; }
  li { display: flex; justify-content: space-between; gap: 10px; padding: 10px 0; border-bottom: 1px solid ${a.line}; font-size: 0.9rem; }
  li:last-child { border-bottom: 0; }
  li small { color: ${a.muted}; display: block; }
`;
const Funnel = styled.div`
  display: grid; gap: 8px;
  .row { display: grid; grid-template-columns: 120px 1fr 30px; gap: 10px; align-items: center; font-size: 0.85rem; }
  .bar { height: 10px; background: #eef2f7; border-radius: 99px; overflow: hidden; }
  .bar div { height: 100%; background: linear-gradient(90deg, ${a.blue}, #5aa6dd); border-radius: 99px; }
`;

export default function Dashboard() {
  const { user, isOwner } = useAuth();
  const { data, error, loading } = useLoad('dashboard');
  const maxStage = data ? Math.max(1, ...Object.values(data.byStage)) : 1;
  return (
    <>
      <PageHead><div><h1>Salam, {user.name.split(' ')[0]} 👋</h1><p>Here’s what’s happening at Noor Electric today.</p></div></PageHead>
      {error && <ErrorBox>{error}</ErrorBox>}
      {loading && !data && <Loading label="Loading dashboard…" />}
      {data && (
        <>
          <Kpis>
            <Kpi as={Link} to="/admin/quotes" style={{ textDecoration: 'none' }} $bg="#fffaeb" $fg="#b54708"><i><FontAwesomeIcon icon={faFileInvoiceDollar} /></i><div><small>New quotation requests</small><b>{data.newQuotes}</b></div></Kpi>
            <Kpi as={Link} to="/admin/calendar" style={{ textDecoration: 'none' }} $bg="#eff4ff" $fg="#1d4ed8"><i><FontAwesomeIcon icon={faCalendarDays} /></i><div><small>Visits & jobs this week</small><b>{data.upcoming.length}</b></div></Kpi>
            <Kpi as={Link} to="/admin/projects" style={{ textDecoration: 'none' }} $bg="#ecfdf3" $fg="#027a48"><i><FontAwesomeIcon icon={faTableColumns} /></i><div><small>Active projects · pipeline</small><b>{data.activeProjects}</b> <small style={{ display: 'inline' }}>{pkr(data.pipelineValue)}</small></div></Kpi>
            {isOwner && data.payroll ? (
              <Kpi as={Link} to="/admin/team" style={{ textDecoration: 'none' }} $bg="#f4f3ff" $fg="#5925dc"><i><FontAwesomeIcon icon={faMoneyBillWave} /></i><div><small>Payroll {data.payroll.month} · paid</small><b>{pkr(data.payroll.paid)}</b> <small style={{ display: 'inline' }}>of {pkr(data.payroll.total)}</small></div></Kpi>
            ) : (
              <Kpi as={Link} to="/admin/blog" style={{ textDecoration: 'none' }} $bg="#f0fdf9" $fg="#107569"><i><FontAwesomeIcon icon={faNewspaper} /></i><div><small>Published blog posts</small><b>{data.posts}</b></div></Kpi>
            )}
          </Kpis>
          <Cols>
            <Card>
              <h3>Open quotation requests <Link to="/admin/quotes">View all →</Link></h3>
              {data.openQuotes.length ? (
                <ul>
                  {data.openQuotes.map((q) => (
                    <li key={q._id}>
                      <span><b>{q.name}</b><small>{[q.city, q.systemType || (q.plan?.systemKW && `${q.plan.systemKW} kW design`)].filter(Boolean).join(' · ') || q.phone}</small></span>
                      <Badge $tone={q.status === 'new' ? 'gold' : 'blue'}>{QUOTE_LABELS[q.status]}</Badge>
                    </li>
                  ))}
                </ul>
              ) : <Empty>No open requests.</Empty>}
            </Card>
            <Card>
              <h3>Next 7 days <Link to="/admin/calendar">Calendar →</Link></h3>
              {data.upcoming.length ? (
                <ul>
                  {data.upcoming.map((e) => (
                    <li key={e._id}>
                      <span><b>{e.title}</b><small>{fmtDateTime(e.start)}{e.location ? ` · ${e.location}` : ''}</small></span>
                      <Badge $tone="blue">{EVENT_LABELS[e.type]}</Badge>
                    </li>
                  ))}
                </ul>
              ) : <Empty>Nothing scheduled.</Empty>}
            </Card>
            <Card>
              <h3>Projects by stage <Link to="/admin/projects">Board →</Link></h3>
              <Funnel>
                {Object.entries(data.byStage).map(([s, n]) => (
                  <div className="row" key={s}><span>{STAGE_LABELS[s]}</span><div className="bar"><div style={{ width: `${(n / maxStage) * 100}%` }} /></div><b>{n}</b></div>
                ))}
              </Funnel>
            </Card>
          </Cols>
        </>
      )}
    </>
  );
}
