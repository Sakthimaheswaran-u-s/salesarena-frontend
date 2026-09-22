import { useMemo, useState } from 'react';
import { LogIn, Target, XCircle, Inbox } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApi } from '../../hooks/useApi';
import { api } from '../../services/api';
import { Card, EmptyState, PageHeader, PointsChip, Segmented, Skeleton } from '../../components/ui';
import { PointsChart } from '../../components/charts';
import { fmtMinutes, fmtNum, fmtSigned, fmtTime, relativeDay } from '../../utils/format';

const FILTERS = [
  { key: 'ALL', label: 'All' },
  { key: 'LEAD_WON', label: 'Leads won' },
  { key: 'LEAD_DROPPED', label: 'Drops' },
  { key: 'LOGIN', label: 'Logins' },
];
const ICON = { LOGIN: { Icon: LogIn, cls: 'primary' }, LEAD_WON: { Icon: Target, cls: 'good' }, LEAD_DROPPED: { Icon: XCircle, cls: 'bad' } };

export default function BdaActivity() {
  const { user } = useAuth();
  const [filter, setFilter] = useState('ALL');
  const [limit, setLimit] = useState(10);
  const { data, loading } = useApi(() => api.getBdaActivity(user.id), [user.id]);

  const days = useMemo(() => {
    if (!data) return [];
    return data.days
      .map((d) => ({ ...d, events: filter === 'ALL' ? d.events : d.events.filter((e) => e.type === filter) }))
      .filter((d) => d.events.length);
  }, [data, filter]);
  const visible = days.slice(0, limit);

  if (!data) {
    return (
      <>
        <PageHeader title="My activity" description="Loading your points ledger…" />
        <Skeleton h={260} style={{ borderRadius: 16 }} />
      </>
    );
  }

  const last30 = data.daily30;
  const net30 = last30.reduce((s, d) => s + d.points, 0);

  return (
    <>
      <PageHeader
        title="My activity"
        description="Every point you have earned or lost, day by day."
        actions={<Segmented options={FILTERS} value={filter} onChange={setFilter} ariaLabel="Filter events" />}
      />
      <div className="stack">
        <Card
          title="Net points · last 30 days"
          subtitle={`${fmtSigned(net30)} pts overall · ${fmtNum(last30.reduce((s, d) => s + d.calls, 0))} calls · ${fmtMinutes(last30.reduce((s, d) => s + d.callMinutes, 0))} talk time`}
        >
          <PointsChart data={last30} loading={loading} height={200} />
        </Card>

        <Card title="Points ledger" subtitle="Most recent first">
          {days.length === 0 ? (
            <EmptyState icon={Inbox} title="Nothing here yet" hint="Events matching this filter will appear as they happen." />
          ) : (
            visible.map((d) => {
              const net = d.events.reduce((s, e) => s + e.points, 0);
              return (
                <div className="day-group" key={d.date}>
                  <div className="day-head">
                    <span>{relativeDay(d.date)}</span>
                    <span className="meta">
                      <span>{d.calls} calls</span>
                      <span>{fmtMinutes(d.callMinutes)}</span>
                      <PointsChip value={net} />
                    </span>
                  </div>
                  <div className="feed">
                    {d.events.map((e) => {
                      const { Icon, cls } = ICON[e.type];
                      return (
                        <div className="feed-item" key={e.id}>
                          <span className={`feed-icon ${cls}`}>
                            <Icon size={15} />
                          </span>
                          <div style={{ minWidth: 0 }}>
                            <div className="feed-title">{e.title}</div>
                            <div className="feed-meta">{fmtTime(e.at)}</div>
                          </div>
                          <PointsChip value={e.points} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
          {days.length > limit && (
            <button className="btn btn-block" style={{ marginTop: 8 }} onClick={() => setLimit((l) => l + 10)}>
              Show {Math.min(10, days.length - limit)} more days
            </button>
          )}
        </Card>
      </div>
    </>
  );
}
