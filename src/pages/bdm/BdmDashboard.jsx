import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ChevronRight, Clock, Phone, Target, TrendingDown, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApi } from '../../hooks/useApi';
import { api } from '../../services/api';
import { RANGES, RULES } from '../../config/rules';
import { Card, EmptyState, PageHeader, Person, Skeleton, Segmented, StatTile } from '../../components/ui';
import { CallsChart, ChartLegend, LeadsChart } from '../../components/charts';
import { MiniBoard } from '../../components/leaderboard';
import { daysLeftInQuarter, firstName, fmtDayLong, fmtMinutes, fmtNum, fmtPct, quarterLabel, todayKey } from '../../utils/format';
import BdaDetailDrawer from './BdaDetailDrawer';

const MEDALS = ['1', '2', '3'];

export default function BdmDashboard() {
  const { user } = useAuth();
  const [range, setRange] = useState('month');
  const [selected, setSelected] = useState(null);
  const { data, loading } = useApi(() => api.getTeamOverview(range), [range]);

  if (!data) {
    return (
      <>
        <PageHeader title="Team overview" description="Loading team metrics…" />
        <div className="grid grid-tiles">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} h={104} style={{ borderRadius: 16 }} />
          ))}
        </div>
      </>
    );
  }

  const { today, yesterday, daily, period, top, watchlist, quarter, totalBdas } = data;
  const rangeLabel = RANGES.find((r) => r.key === range)?.label;
  const conversion = period.leadsWon + period.leadsDropped ? period.leadsWon / (period.leadsWon + period.leadsDropped) : 0;
  const left = daysLeftInQuarter(todayKey());

  return (
    <>
      <PageHeader
        title={`${firstName(user.name)}'s overview`}
        description={`${fmtDayLong(todayKey())} · ${totalBdas} associates, ${today.active} of them on calls today.`}
        actions={<Segmented options={RANGES} value={range} onChange={setRange} ariaLabel="Time range" />}
      />

      {/* ---- Today ---- */}
      <div className="grid grid-tiles">
        <StatTile label="Calls today" value={fmtNum(today.calls)} icon={Phone} delta={today.calls - yesterday.calls} />
        <StatTile label="Leads won today" value={today.leadsWon} icon={Target} tone="good" delta={today.leadsWon - yesterday.leadsWon} />
        <StatTile label="Leads dropped today" value={today.leadsDropped} icon={TrendingDown} tone="bad" delta={today.leadsDropped - yesterday.leadsDropped} invert />
        <StatTile label="Talk time today" value={fmtMinutes(today.callMinutes)} icon={Clock} tone="neutral" sub={`${today.active ? Math.round(today.callMinutes / today.active) : 0} min avg per active BDA`} />
        <StatTile label="Signed in today" value={`${today.loggedIn}/${totalBdas}`} icon={Users} tone="warn" sub={`${today.active} making calls`} />
      </div>

      {/* ---- Charts ---- */}
      <div className="grid grid-2 section-gap">
        <Card title="Calls per day" subtitle="Everyone combined · last 14 days">
          <CallsChart data={daily} loading={loading} height={240} />
        </Card>
        <Card title="Leads per day" subtitle="Won against dropped · last 14 days">
          <ChartLegend items={[{ label: 'Won', color: 'var(--series-1)' }, { label: 'Dropped', color: 'var(--series-8)' }]} />
          <LeadsChart data={daily} loading={loading} height={212} />
        </Card>
      </div>

      {/* ---- Period summary ---- */}
      <div className="grid grid-tiles section-gap" style={{ opacity: loading ? 0.7 : 1, transition: 'opacity .2s' }}>
        <StatTile label={`Calls · ${rangeLabel}`} value={fmtNum(period.calls)} icon={Phone} sub={`${fmtMinutes(period.callMinutes)} on calls`} />
        <StatTile label={`Leads won · ${rangeLabel}`} value={fmtNum(period.leadsWon)} icon={Target} tone="good" points={period.leadsWon * RULES.LEAD_WON} />
        <StatTile label={`Leads dropped · ${rangeLabel}`} value={fmtNum(period.leadsDropped)} icon={TrendingDown} tone="bad" points={period.leadsDropped * RULES.LEAD_DROPPED} />
        <StatTile label="Win rate" value={fmtPct(conversion)} icon={Target} tone="neutral" sub="won ÷ (won + dropped)" />
      </div>

      {/* ---- Leaders / watchlist / quarter ---- */}
      <div className="grid grid-3 section-gap" style={{ opacity: loading ? 0.7 : 1, transition: 'opacity .2s' }}>
        <Card
          title="Top performers"
          subtitle={rangeLabel}
          action={
            <Link to="/bdm/leaderboard" className="btn btn-ghost btn-sm">
              Full board <ChevronRight size={14} />
            </Link>
          }
        >
          <MiniBoard entries={top} onSelect={(e) => setSelected(e.bda)} />
        </Card>

        <Card title="Needs attention" subtitle="Dropping 30% or more of their leads">
          {watchlist.length === 0 ? (
            <EmptyState icon={AlertTriangle} title="All clear" hint="Nobody is dropping an unusual share of leads right now." />
          ) : (
            <div className="mini-board">
              {watchlist.map((e) => (
                <button key={e.bda.id} className="mini-row" style={{ gridTemplateColumns: '1fr auto' }} onClick={() => setSelected(e.bda)}>
                  <Person name={e.bda.name} id={e.bda.id} meta={`${e.leadsDropped} dropped · ${e.leadsWon} won`} size={30} />
                  <span className="chip chip-bad">{fmtPct(e.dropRate)} drop</span>
                </button>
              ))}
            </div>
          )}
        </Card>

        <Card
          title={`Q${quarter.quarter} ${quarter.year} so far`}
          subtitle={`${quarterLabel(quarter.quarter)} · closes in ${left} ${left === 1 ? 'day' : 'days'}`}
          action={
            <Link to="/bdm/notice-board" className="btn btn-ghost btn-sm">
              Notice board <ChevronRight size={14} />
            </Link>
          }
        >
          <div className="cycle-winners" style={{ padding: 0 }}>
            {quarter.top.map((e, i) => (
              <div className={`winner p${i + 1}`} key={e.bda.id}>
                <span className="winner-medal">{MEDALS[i]}</span>
                <div style={{ minWidth: 0 }}>
                  <div className="winner-name">{e.bda.name}</div>
                  <div className="winner-sub">
                    {e.leadsWon} won · {e.leadsDropped} dropped
                  </div>
                </div>
                <span className="winner-points">{fmtNum(e.points)}</span>
              </div>
            ))}
          </div>
          <p className="small muted" style={{ marginTop: 12 }}>
            These three go up on the notice board if they hold on until the cycle closes.
          </p>
        </Card>
      </div>

      {selected && <BdaDetailDrawer bda={selected} range={range} onClose={() => setSelected(null)} />}
    </>
  );
}
