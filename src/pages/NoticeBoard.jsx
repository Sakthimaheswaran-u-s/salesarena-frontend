import { Pin, Timer, Trophy } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Card, EmptyState, PageHeader, Person, Skeleton } from '../components/ui';
import { daysLeftInQuarter, fmtDayShort, fmtNum, quarterLabel, todayKey } from '../utils/format';

const MEDALS = ['1', '2', '3'];

function Winner({ entry, place, meId, showCalls = false }) {
  return (
    <div className={`winner p${place + 1}`}>
      <span className="winner-medal">{MEDALS[place]}</span>
      <div style={{ minWidth: 0 }}>
        <div className="winner-name">
          {entry.bda.name}
          {entry.bda.id === meId && <span className="you-tag">YOU</span>}
        </div>
        <div className="winner-sub">
          {entry.leadsWon} won · {entry.leadsDropped} dropped
          {showCalls ? ` · ${fmtNum(entry.calls)} calls` : ''}
        </div>
      </div>
      <span className="winner-points">{fmtNum(entry.points)}</span>
    </div>
  );
}

/**
 * Quarterly hall of fame: the top three of every closed three-month cycle,
 * grouped by year. Everyone can see it.
 */
export default function NoticeBoard() {
  const { user } = useAuth();
  const { data } = useApi(() => api.getNoticeBoard(), []);

  if (!data) {
    return (
      <>
        <PageHeader title="Notice board" description="Loading past cycles…" />
        <Skeleton h={280} style={{ borderRadius: 16 }} />
      </>
    );
  }

  const left = daysLeftInQuarter(todayKey());
  const closed = data.years.reduce((n, y) => n + y.cycles.length, 0);

  return (
    <>
      <PageHeader
        title="Notice board"
        description="Top three of every three-month cycle. Standings close on the last day of the quarter and stay up for the year."
        actions={
          data.current && (
            <span className="chip chip-primary chip-lg">
              <Timer size={13} /> Q{data.current.quarter} closes in {left} {left === 1 ? 'day' : 'days'}
            </span>
          )
        }
      />

      {data.current && (
        <div className="grid grid-main-side" style={{ marginBottom: 8 }}>
          <Card
            title={`Q${data.current.quarter} ${data.current.year} · in progress`}
            subtitle={`${quarterLabel(data.current.quarter)} · ${data.current.participants} associates scoring`}
            action={<span className="chip chip-primary">Live</span>}
          >
            <div className="cycle-winners" style={{ padding: 0 }}>
              {data.current.top.map((e, i) => (
                <Winner key={e.bda.id} entry={e} place={i} meId={user.id} showCalls />
              ))}
            </div>
          </Card>
          <div className="running-note">
            <strong>Nothing is final yet.</strong>
            These three only go on the board if they are still on top when the cycle closes on{' '}
            {fmtDayShort(data.current.endsOn)}. Quarters have turned around in the last fortnight before.
          </div>
        </div>
      )}

      <div className="section-label">
        <h2>Past cycles</h2>
        <span className="stamp">{closed} on record</span>
      </div>

      {closed === 0 ? (
        <Card>
          <EmptyState icon={Pin} title="No cycle has closed yet" hint="The first set of winners goes up when this quarter ends." />
        </Card>
      ) : (
        data.years.map((y) => (
          <section className="notice-year" key={y.year}>
            <div className="notice-year-head">
              <h2>{y.year}</h2>
              <span className="stamp">
                {y.cycles.length} {y.cycles.length === 1 ? 'cycle' : 'cycles'}
              </span>
              <span className="rule" />
            </div>
            <div className="cycles">
              {y.cycles.map((c) => (
                <article className="cycle" key={c.id}>
                  <header className="cycle-head">
                    <div>
                      <div className="cycle-q">Q{c.quarter}</div>
                      <div className="cycle-months">{quarterLabel(c.quarter)}</div>
                    </div>
                    <span className="cycle-trophy">
                      <Trophy size={16} />
                    </span>
                  </header>
                  <div className="cycle-winners">
                    {c.top.map((e, i) => (
                      <Winner key={e.bda.id} entry={e} place={i} meId={user.id} />
                    ))}
                  </div>
                  <footer className="cycle-foot">
                    <span>
                      {fmtDayShort(c.from)} – {fmtDayShort(c.to)}
                    </span>
                    <span>{c.participants} scored</span>
                  </footer>
                </article>
              ))}
            </div>
          </section>
        ))
      )}
    </>
  );
}
