import { useEffect } from 'react';
import { Flame, LogIn, Target, X, XCircle } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { api } from '../../services/api';
import { RANGES } from '../../config/rules';
import { Avatar, PointsChip, RankBadge, Skeleton } from '../../components/ui';
import { CallsChart } from '../../components/charts';
import { fmtMinutes, fmtNum, fmtTime, relativeDay } from '../../utils/format';

const ICON = { LOGIN: { Icon: LogIn, cls: 'primary' }, LEAD_WON: { Icon: Target, cls: 'good' }, LEAD_DROPPED: { Icon: XCircle, cls: 'bad' } };

/** Side panel a BDM opens from any leaderboard row to inspect one associate. */
export default function BdaDetailDrawer({ bda, range, onClose }) {
  const { data } = useApi(() => api.getBdaOverview(bda.id, range), [bda.id, range]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const rangeLabel = RANGES.find((r) => r.key === range)?.label;

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={`${bda.name} details`}>
        <div className="drawer-head">
          <Avatar name={bda.name} id={bda.id} size={40} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{bda.name}</div>
            <div className="small muted">{bda.email}</div>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="drawer-body">
          {!data ? (
            <>
              <Skeleton h={80} />
              <Skeleton h={200} />
            </>
          ) : (
            <>
              <div className="row between wrap">
                <div className="row">
                  <RankBadge rank={data.rank} />
                  <div>
                    <div style={{ fontWeight: 700 }}>#{data.rank} of {data.total}</div>
                    <div className="small muted">{rangeLabel}</div>
                  </div>
                </div>
                <div className="row">
                  <Flame size={16} color={data.streak ? '#ff7a2e' : 'var(--muted)'} />
                  <span style={{ fontWeight: 600 }}>{data.streak}-day streak</span>
                  <span className="small muted">· best {data.bestStreak}</span>
                </div>
              </div>

              <div className="drawer-tiles">
                <div className="drawer-tile">
                  <div className="k">Net points</div>
                  <div className="v">{fmtNum(data.summary.points)}</div>
                </div>
                <div className="drawer-tile">
                  <div className="k">Calls</div>
                  <div className="v">{fmtNum(data.summary.calls)}</div>
                </div>
                <div className="drawer-tile">
                  <div className="k">Leads won</div>
                  <div className="v good-text">{data.summary.leadsWon}</div>
                </div>
                <div className="drawer-tile">
                  <div className="k">Leads dropped</div>
                  <div className={`v ${data.summary.leadsDropped ? 'bad-text' : ''}`}>{data.summary.leadsDropped}</div>
                </div>
                <div className="drawer-tile">
                  <div className="k">Talk time</div>
                  <div className="v">{fmtMinutes(data.summary.callMinutes)}</div>
                </div>
                <div className="drawer-tile">
                  <div className="k">Logins</div>
                  <div className="v">{data.summary.loginDays}</div>
                </div>
              </div>

              <div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Calls · last 14 days</div>
                <CallsChart data={data.daily} height={180} />
              </div>

              <div>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>Recent activity</div>
                <div className="feed">
                  {data.feed.slice(0, 8).map((e) => {
                    const { Icon, cls } = ICON[e.type];
                    return (
                      <div className="feed-item" key={e.id}>
                        <span className={`feed-icon ${cls}`}>
                          <Icon size={15} />
                        </span>
                        <div style={{ minWidth: 0 }}>
                          <div className="feed-title">{e.title}</div>
                          <div className="feed-meta">
                            {relativeDay(e.at.slice(0, 10))} · {fmtTime(e.at)}
                          </div>
                        </div>
                        <PointsChip value={e.points} />
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
