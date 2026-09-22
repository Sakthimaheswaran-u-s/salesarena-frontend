import { Flame, Phone, Target } from 'lucide-react';
import { Avatar, Person, RankBadge, TrendPill } from '../ui';
import { fmtMinutes, fmtNum } from '../../utils/format';

export function Podium({ entries, meId }) {
  const [first, second, third] = entries;
  const slots = [
    { e: second, cls: 'second', n: 2 },
    { e: first, cls: 'first', n: 1 },
    { e: third, cls: 'third', n: 3 },
  ];
  return (
    <div className="podium">
      {slots.map(({ e, cls, n }) =>
        e ? (
          <div key={n} className={`podium-card ${cls}`}>
            <span className="podium-medal">{n}</span>
            <Avatar name={e.bda.name} id={e.bda.id} size={n === 1 ? 64 : 52} ring={e.bda.id === meId} />
            <div>
              <div className="podium-name">
                {e.bda.name}
                {e.bda.id === meId && <span className="you-tag">YOU</span>}
              </div>
              <div className="podium-sub">{e.bda.email.split('@')[0]}</div>
            </div>
            <div className="podium-points">{fmtNum(e.points)} pts</div>
            <div className="podium-stats">
              <span>
                <Target size={12} style={{ verticalAlign: '-2px' }} /> {e.leadsWon} won
              </span>
              <span>
                <Phone size={12} style={{ verticalAlign: '-2px' }} /> {fmtNum(e.calls)} calls
              </span>
              <span>
                <Flame size={12} style={{ verticalAlign: '-2px' }} /> {e.streak}d
              </span>
            </div>
          </div>
        ) : (
          <div key={n} />
        ),
      )}
    </div>
  );
}

export function LeaderboardTable({ entries, meId, onSelect, rowRefs }) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th style={{ width: 64 }}>Rank</th>
            <th>Associate</th>
            <th className="r">Points</th>
            <th className="r">Won</th>
            <th className="r">Dropped</th>
            <th className="r col-md">Calls</th>
            <th className="r col-md">Talk time</th>
            <th className="r col-sm">Streak</th>
            <th className="r">Trend</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => {
            const isMe = e.bda.id === meId;
            return (
              <tr
                key={e.bda.id}
                ref={rowRefs ? (el) => (rowRefs.current[e.bda.id] = el) : undefined}
                className={`${isMe ? 'row-me' : ''} ${onSelect ? 'clickable' : ''}`}
                onClick={onSelect ? () => onSelect(e) : undefined}
                tabIndex={onSelect ? 0 : undefined}
                onKeyDown={onSelect ? (ev) => ev.key === 'Enter' && onSelect(e) : undefined}
              >
                <td>
                  <RankBadge rank={e.rank} isMe={isMe} />
                </td>
                <td>
                  <Person name={e.bda.name} id={e.bda.id} meta={e.bda.email} isMe={isMe} size={34} />
                </td>
                <td className="r points-cell num">{fmtNum(e.points)}</td>
                <td className="r">
                  <span className="chip chip-good">+{e.leadsWon}</span>
                </td>
                <td className="r">
                  <span className={`chip ${e.leadsDropped ? 'chip-bad' : 'chip-neutral'}`}>{e.leadsDropped ? `−${e.leadsDropped}` : '0'}</span>
                </td>
                <td className="r num col-md">{fmtNum(e.calls)}</td>
                <td className="r num col-md">{fmtMinutes(e.callMinutes)}</td>
                <td className="r col-sm">
                  <span className="row" style={{ justifyContent: 'flex-end', gap: 4 }}>
                    <Flame size={13} color={e.streak ? '#ff7a2e' : 'var(--muted)'} />
                    <span className="num">{e.streak}</span>
                  </span>
                </td>
                <td className="r">
                  <TrendPill change={e.rankChange} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function MiniBoard({ entries, meId, extra, onSelect }) {
  const list = [...entries];
  const appended = extra && !list.some((e) => e.bda.id === extra.bda.id);
  if (appended) list.push(extra);
  const Row = onSelect ? 'button' : 'div';
  return (
    <div className="mini-board">
      {list.map((e, i) => {
        const isMe = e.bda.id === meId;
        return (
          <div key={e.bda.id}>
            {appended && i === list.length - 1 && <div className="mini-gap">···</div>}
            <Row
              className={`mini-row${isMe ? ' me' : ''}`}
              type={onSelect ? 'button' : undefined}
              onClick={onSelect ? () => onSelect(e) : undefined}
            >
              <RankBadge rank={e.rank} isMe={isMe} />
              <Person name={e.bda.name} id={e.bda.id} meta={`${e.leadsWon} won · ${fmtNum(e.calls)} calls`} isMe={isMe} size={30} />
              <span className="pts">{fmtNum(e.points)}</span>
            </Row>
          </div>
        );
      })}
    </div>
  );
}
