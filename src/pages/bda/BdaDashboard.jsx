import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Award, Check, ChevronRight, Clock, Flame, Lock, LogIn, Phone, Target, TrendingDown, Trophy, XCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApi } from '../../hooks/useApi';
import { useToast } from '../../components/ui/Toast';
import { api } from '../../services/api';
import { RANGES, RULES, STREAK_MILESTONES, loginPointsForStreak } from '../../config/rules';
import { Card, PageHeader, PointsChip, ProgressBar, Segmented, StatTile, Skeleton } from '../../components/ui';
import { CallsChart, PointsChart } from '../../components/charts';
import { MiniBoard } from '../../components/leaderboard';
import {
  fmtMinutes, fmtNum, fmtSigned, fmtTime, fmtWeekdayLetter, firstName, greeting, ordinal, relativeDay, todayKey,
} from '../../utils/format';

const FEED_ICON = {
  LOGIN: { Icon: LogIn, cls: 'primary' },
  LEAD_WON: { Icon: Target, cls: 'good' },
  LEAD_DROPPED: { Icon: XCircle, cls: 'bad' },
};

export default function BdaDashboard() {
  const { user, consumeLoginReward } = useAuth();
  const toast = useToast();
  const [range, setRange] = useState('month');
  const { data, loading } = useApi(() => api.getBdaOverview(user.id, range), [user.id, range]);

  useEffect(() => {
    const reward = consumeLoginReward();
    if (!reward) return;
    if (reward.isNew) {
      toast.push({
        tone: 'streak',
        title: `Day ${reward.streak} streak · +${reward.points} pts`,
        message: `Login bonus banked. Come back tomorrow for +${reward.nextPoints}.`,
      });
    } else {
      toast.push({ tone: 'info', title: `Welcome back, ${firstName(user.name)}`, message: `Today's login bonus is already in. Streak: ${reward.streak} days.` });
    }
  }, [consumeLoginReward, toast, user.name]);

  const rangeLabel = RANGES.find((r) => r.key === range)?.label;

  if (!data) {
    return (
      <>
        <PageHeader title={`${greeting()}, ${firstName(user.name)}`} description="Loading your scoreboard…" />
        <div className="grid grid-hero">
          <Skeleton h={210} style={{ borderRadius: 16 }} />
          <Skeleton h={210} style={{ borderRadius: 16 }} />
        </div>
      </>
    );
  }

  const {
    summary, today, yesterday, rank, total, above, below, streak, bestStreak, loggedInToday,
    nextLoginPoints, last7, daily, feed, achievements, leaders, rankChange,
  } = data;
  const gapToAbove = above ? above.points - summary.points : 0;
  const leadAhead = below ? summary.points - below.points : 0;
  const nextMilestone = STREAK_MILESTONES.find((m) => m > streak) || STREAK_MILESTONES[STREAK_MILESTONES.length - 1];
  const prevMilestone = [...STREAK_MILESTONES].reverse().find((m) => m <= streak) || 0;
  const breakdownMax = Math.max(Math.abs(summary.loginPoints), Math.abs(summary.leadPoints), Math.abs(summary.penaltyPoints), 1);

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${firstName(user.name)}`}
        description={
          loggedInToday
            ? "Today's login is counted. Here's how the last stretch has gone."
            : 'Sign in each day to keep your streak going.'
        }
        actions={<Segmented options={RANGES} value={range} onChange={setRange} ariaLabel="Time range" />}
      />

      {/* ---- Hero + streak ---- */}
      <div className="grid grid-hero" style={{ opacity: loading ? 0.7 : 1, transition: 'opacity .2s' }}>
        <section className="hero" aria-label="Your points and rank">
          <div className="hero-top">
            <div>
              <div className="hero-greet">Portal points · {rangeLabel}</div>
              <div className="hero-points">
                <span className="hero-value">{fmtNum(summary.points)}</span>
                <span className="hero-unit">pts</span>
                {rankChange !== null && rankChange !== 0 && (
                  <span className={`chip ${rankChange > 0 ? 'chip-good' : 'chip-bad'}`}>
                    {rankChange > 0 ? '▲' : '▼'} {Math.abs(rankChange)} {Math.abs(rankChange) === 1 ? 'place' : 'places'}
                  </span>
                )}
              </div>
            </div>
            <div className="hero-rank">
              <Trophy size={22} />
              <div>
                <div className="big">#{rank}</div>
                <div className="small">of {total} associates</div>
              </div>
            </div>
          </div>

          <div className="hero-next">
            {above ? (
              <>
                <div className="row">
                  <span>
                    <strong>{fmtNum(gapToAbove)} pts</strong> to overtake <strong>{firstName(above.bda.name)}</strong> for #{above.rank}
                  </span>
                  <span style={{ opacity: 0.85 }}>{fmtNum(above.points)} pts</span>
                </div>
                <ProgressBar value={summary.points} max={above.points} onHero />
              </>
            ) : (
              <div className="row">
                <span>
                  <strong>You lead the board.</strong> {below ? `${firstName(below.bda.name)} is ${fmtNum(leadAhead)} pts behind.` : ''}
                </span>
              </div>
            )}
          </div>

          <div className="hero-stats">
            <div>
              <div className="k">Calls</div>
              <div className="v">{fmtNum(summary.calls)}</div>
            </div>
            <div>
              <div className="k">Won</div>
              <div className="v">{summary.leadsWon}</div>
            </div>
            <div>
              <div className="k">Dropped</div>
              <div className="v">{summary.leadsDropped}</div>
            </div>
            <div>
              <div className="k">Talk time</div>
              <div className="v">{fmtMinutes(summary.callMinutes)}</div>
            </div>
          </div>
        </section>

        <Card title="Login streak" subtitle={loggedInToday ? 'Today counted · keep it going' : 'Log in today to keep your streak alive'}>
          <div className="streak-card">
            <div className="streak-top">
              <div className={`streak-flame${streak ? '' : ' cold'}`}>
                <Flame size={26} />
              </div>
              <div>
                <div className="streak-num">
                  {streak} <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--muted)' }}>day{streak === 1 ? '' : 's'}</span>
                </div>
                <div className="streak-label">Best run: {bestStreak} days · tomorrow is worth +{nextLoginPoints}</div>
              </div>
            </div>
            <div className="streak-dots" aria-label="Last 7 days">
              {last7.map((d) => (
                <div key={d.date} className={`streak-dot${d.loggedIn ? ' on' : ''}${d.date === todayKey() ? ' today' : ''}`} title={relativeDay(d.date)}>
                  <i>
                    <Check size={14} />
                  </i>
                  {fmtWeekdayLetter(d.date)}
                </div>
              ))}
            </div>
            <div className="streak-milestones">
              <Award size={15} />
              <span>{nextMilestone > streak ? `${nextMilestone - streak} more to ${nextMilestone}-day badge` : `${nextMilestone}-day badge unlocked`}</span>
              <ProgressBar value={streak - prevMilestone} max={nextMilestone - prevMilestone} />
            </div>
          </div>
        </Card>
      </div>

      {/* ---- Today ---- */}
      <div className="grid grid-tiles section-gap">
        <StatTile label="Calls today" value={fmtNum(today.calls)} icon={Phone} delta={today.calls - yesterday.calls} />
        <StatTile label="Leads won today" value={today.leadsWon} icon={Target} tone="good" points={today.leadsWon * RULES.LEAD_WON} delta={today.leadsWon - yesterday.leadsWon} />
        <StatTile label="Leads dropped today" value={today.leadsDropped} icon={TrendingDown} tone="bad" points={today.leadsDropped * RULES.LEAD_DROPPED} delta={today.leadsDropped - yesterday.leadsDropped} invert />
        <StatTile label="Talk time today" value={fmtMinutes(today.callMinutes)} icon={Clock} tone="neutral" delta={today.callMinutes - yesterday.callMinutes} deltaSuffix="min vs yesterday" />
      </div>

      {/* ---- Charts ---- */}
      <div className="grid grid-2 section-gap">
        <Card title="Calls per day" subtitle="Last 14 days">
          <CallsChart data={daily} loading={loading} />
        </Card>
        <Card title="Net points per day" subtitle="Logins and won leads add, drops subtract">
          <PointsChart data={daily} loading={loading} />
        </Card>
      </div>

      {/* ---- Breakdown / feed / board ---- */}
      <div className="grid grid-3 section-gap">
        <Card title="Points breakdown" subtitle={`${rangeLabel} · ${summary.leadsWon} won · ${summary.leadsDropped} dropped · ${summary.loginDays} logins`}>
          <div className="breakdown">
            <BreakdownRow icon={LogIn} cls="primary" name="Login streaks" meta={`${summary.loginDays} day${summary.loginDays === 1 ? '' : 's'} logged in`} value={summary.loginPoints} max={breakdownMax} color="var(--series-1)" />
            <BreakdownRow icon={Target} cls="good" name="Leads won" meta={`${summary.leadsWon} × ${RULES.LEAD_WON}`} value={summary.leadPoints} max={breakdownMax} color="var(--good)" />
            <BreakdownRow icon={XCircle} cls="bad" name="Leads dropped" meta={`${summary.leadsDropped} × ${RULES.LEAD_DROPPED}`} value={summary.penaltyPoints} max={breakdownMax} color="var(--bad)" />
            <div className="breakdown-total">
              <span>Net points</span>
              <span className={summary.points >= 0 ? 'good-text' : 'bad-text'}>{fmtSigned(summary.points)}</span>
            </div>
            <div className="row" style={{ justifyContent: 'space-between', fontSize: 12.5, color: 'var(--text-2)' }}>
              <span>{fmtNum(summary.calls)} calls · {fmtMinutes(summary.callMinutes)} on calls</span>
            </div>
          </div>
        </Card>

        <Card
          title="Recent activity"
          subtitle="Latest point events"
          action={
            <Link to="/bda/activity" className="btn btn-ghost btn-sm">
              All <ChevronRight size={14} />
            </Link>
          }
        >
          <div className="feed">
            {feed.slice(0, 7).map((e) => {
              const { Icon, cls } = FEED_ICON[e.type];
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
        </Card>

        <Card
          title="Leaderboard"
          subtitle={`You're ${ordinal(rank)} of ${total}`}
          action={
            <Link to="/bda/leaderboard" className="btn btn-ghost btn-sm">
              Full board <ChevronRight size={14} />
            </Link>
          }
        >
          <MiniBoard entries={leaders} meId={user.id} extra={summary} />
        </Card>
      </div>

      {/* ---- Achievements ---- */}
      <div className="section-gap">
        <Card title="Achievements" subtitle={`${achievements.filter((a) => a.earned).length} of ${achievements.length} unlocked`}>
          <div className="achv-grid">
            {achievements.map((a) => (
              <div key={a.id} className={`achv${a.earned ? '' : ' locked'}`} title={a.desc}>
                <i>{a.earned ? <Award size={18} /> : <Lock size={16} />}</i>
                <strong>{a.title}</strong>
                <span>{a.desc}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}

function BreakdownRow({ icon: Icon, cls, name, meta, value, max, color }) {
  return (
    <div className="breakdown-row">
      <span className={`feed-icon ${cls}`} style={{ width: 24, height: 24, borderRadius: 7 }}>
        <Icon size={13} />
      </span>
      <div style={{ minWidth: 0 }}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span className="name">{name}</span>
          <span className="meta">{meta}</span>
        </div>
        <div className="bar">
          <span style={{ width: `${(Math.abs(value) / max) * 100}%`, background: color }} />
        </div>
      </div>
      <PointsChip value={value} />
    </div>
  );
}
