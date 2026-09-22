import { useState } from 'react';
import { SearchX } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { api } from '../../services/api';
import { RANGES } from '../../config/rules';
import { Card, EmptyState, PageHeader, SearchInput, Segmented, Skeleton } from '../../components/ui';
import { LeaderboardTable, Podium } from '../../components/leaderboard';
import BdaDetailDrawer from './BdaDetailDrawer';

export default function BdmLeaderboard() {
  const [range, setRange] = useState('month');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const { data, loading } = useApi(() => api.getLeaderboard({ range, search }), [range, search]);

  return (
    <>
      <PageHeader
        title="Leaderboard"
        description="Search for anyone, switch the period, click a row to open their record."
        actions={<Segmented options={RANGES} value={range} onChange={setRange} ariaLabel="Time range" />}
      />

      <div className="row wrap" style={{ marginBottom: 14, gap: 8 }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Name or email" style={{ flex: '1 1 240px', maxWidth: 340 }} />
        {search && (
          <button className="btn btn-sm btn-ghost" onClick={() => setSearch('')}>
            Clear
          </button>
        )}
      </div>

      {!data ? (
        <Skeleton h={300} />
      ) : (
        <div className="stack" style={{ opacity: loading ? 0.65 : 1, transition: 'opacity .2s' }}>
          {!search && <Podium entries={data.entries.slice(0, 3)} />}
          <Card
            title={search ? 'Matches' : 'Full rankings'}
            subtitle={search ? `${data.entries.length} of ${data.total} · ranks are board-wide` : `${data.total} associates`}
            flush
          >
            {data.entries.length === 0 ? (
              <EmptyState icon={SearchX} title="Nobody matches that" hint="Try part of a name or email." />
            ) : (
              <LeaderboardTable entries={data.entries} onSelect={(e) => setSelected(e.bda)} />
            )}
          </Card>
        </div>
      )}

      {selected && <BdaDetailDrawer bda={selected} range={range} onClose={() => setSelected(null)} />}
    </>
  );
}
