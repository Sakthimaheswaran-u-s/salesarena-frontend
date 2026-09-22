import { useRef, useState } from 'react';
import { Crosshair, Trophy } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApi } from '../../hooks/useApi';
import { api } from '../../services/api';
import { RANGES } from '../../config/rules';
import { Card, PageHeader, RankBadge, Segmented, Skeleton } from '../../components/ui';
import { LeaderboardTable, Podium } from '../../components/leaderboard';
import { firstName, fmtNum, ordinal } from '../../utils/format';

export default function BdaLeaderboard() {
  const { user } = useAuth();
  const [range, setRange] = useState('month');
  const { data, loading } = useApi(() => api.getLeaderboard({ range }), [range]);
  const rowRefs = useRef({});

  const jumpToMe = () => rowRefs.current[user.id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });

  if (!data) {
    return (
      <>
        <PageHeader title="Leaderboard" description="Loading rankings…" />
        <Skeleton h={320} style={{ borderRadius: 16 }} />
      </>
    );
  }

  const entries = data.entries;
  const me = entries.find((e) => e.bda.id === user.id);
  const above = me ? entries[me.rank - 2] : null;

  return (
    <>
      <PageHeader
        title="Leaderboard"
        description="Every associate ranked by net portal points. Ties break on leads won, then on fewest drops."
        actions={<Segmented options={RANGES} value={range} onChange={setRange} ariaLabel="Time range" />}
      />

      <div className="stack" style={{ opacity: loading ? 0.7 : 1, transition: 'opacity .2s' }}>
        {me && (
          <div className="position-bar">
            <div className="lead">
              <RankBadge rank={me.rank} isMe />
              <div>
                <strong>You're {ordinal(me.rank)} of {data.total}</strong>
                <div className="small text-2">
                  {fmtNum(me.points)} pts
                  {above
                    ? ` · ${fmtNum(above.points - me.points)} pts behind ${firstName(above.bda.name)} (#${above.rank})`
                    : ' · top of the board'}
                </div>
              </div>
            </div>
            <button className="btn btn-sm" onClick={jumpToMe}>
              <Crosshair size={14} /> Jump to my row
            </button>
          </div>
        )}

        <div style={{ paddingTop: 14 }}>
          <Podium entries={entries.slice(0, 3)} meId={user.id} />
        </div>

        <Card title="Full rankings" subtitle={`${entries.length} associates`} flush>
          <LeaderboardTable entries={entries} meId={user.id} rowRefs={rowRefs} />
        </Card>
        <div className="legend-note">
          <span>
            <Trophy size={12} style={{ verticalAlign: '-2px' }} /> Trend compares your rank with the previous period of the same length.
          </span>
        </div>
      </div>
    </>
  );
}
