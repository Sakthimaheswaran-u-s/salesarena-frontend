import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { fmtDayShort, fmtDayLong, fmtMinutes, fmtSigned, fmtNum } from '../../utils/format';

const axisTick = { fill: 'var(--muted)', fontSize: 11.5, fontFamily: 'inherit' };
const gridProps = { vertical: false, stroke: 'var(--grid)', strokeWidth: 1 };
const cursorFill = { fill: 'var(--hover)' };
const BAR_RADIUS = [4, 4, 0, 0];

function ChartTooltip({ active, payload, label, rows }) {
  if (!active || !payload?.length) return null;
  const datum = payload[0].payload;
  return (
    <div className="chart-tip">
      <div className="tip-title">{fmtDayLong(label)}</div>
      {rows(datum).map((r) => (
        <div className="tip-row" key={r.label}>
          <span>
            {r.color && <i style={{ background: r.color }} />}
            {r.label}
          </span>
          <b className={r.className}>{r.value}</b>
        </div>
      ))}
    </div>
  );
}

export function ChartLegend({ items }) {
  return (
    <div className="chart-legend" aria-hidden="true">
      {items.map((it) => (
        <span key={it.label}>
          <i style={{ background: it.color }} />
          {it.label}
        </span>
      ))}
    </div>
  );
}

function Frame({ children, loading, height = 220 }) {
  return (
    <div className={`chart${loading ? ' loading' : ''}`} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}

/** Calls per day — one series, slot 1. */
export function CallsChart({ data, loading, height, showMinutes = true }) {
  return (
    <Frame loading={loading} height={height}>
      <BarChart data={data} barCategoryGap="32%" margin={{ top: 8, right: 4, left: -10, bottom: 0 }}>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="date" tickFormatter={fmtDayShort} tick={axisTick} tickLine={false} axisLine={{ stroke: 'var(--axis)' }} interval="preserveStartEnd" minTickGap={24} />
        <YAxis tick={axisTick} tickLine={false} axisLine={false} allowDecimals={false} width={44} />
        <Tooltip
          cursor={cursorFill}
          content={
            <ChartTooltip
              rows={(d) => [
                { label: 'Calls', value: fmtNum(d.calls), color: 'var(--series-1)' },
                ...(showMinutes ? [{ label: 'Talk time', value: fmtMinutes(d.callMinutes) }] : []),
              ]}
            />
          }
        />
        <Bar dataKey="calls" fill="var(--series-1)" radius={BAR_RADIUS} maxBarSize={30} isAnimationActive={false} />
      </BarChart>
    </Frame>
  );
}

/** Leads won vs dropped — polarity pair (blue / red), grouped. */
export function LeadsChart({ data, loading, height }) {
  return (
    <Frame loading={loading} height={height}>
      <BarChart data={data} barCategoryGap="28%" barGap={2} margin={{ top: 8, right: 4, left: -10, bottom: 0 }}>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="date" tickFormatter={fmtDayShort} tick={axisTick} tickLine={false} axisLine={{ stroke: 'var(--axis)' }} interval="preserveStartEnd" minTickGap={24} />
        <YAxis tick={axisTick} tickLine={false} axisLine={false} allowDecimals={false} width={44} />
        <Tooltip
          cursor={cursorFill}
          content={
            <ChartTooltip
              rows={(d) => [
                { label: 'Won', value: fmtNum(d.leadsWon), color: 'var(--series-1)' },
                { label: 'Dropped', value: fmtNum(d.leadsDropped), color: 'var(--series-8)' },
              ]}
            />
          }
        />
        <Bar dataKey="leadsWon" name="Won" fill="var(--series-1)" radius={BAR_RADIUS} maxBarSize={22} isAnimationActive={false} />
        <Bar dataKey="leadsDropped" name="Dropped" fill="var(--series-8)" radius={BAR_RADIUS} maxBarSize={22} isAnimationActive={false} />
      </BarChart>
    </Frame>
  );
}

/** Net points per day — diverging: positive blue, negative red. */
export function PointsChart({ data, loading, height }) {
  return (
    <Frame loading={loading} height={height}>
      <BarChart data={data} barCategoryGap="32%" margin={{ top: 8, right: 4, left: -10, bottom: 0 }}>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="date" tickFormatter={fmtDayShort} tick={axisTick} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={24} />
        <YAxis tick={axisTick} tickLine={false} axisLine={false} width={44} />
        <ReferenceLine y={0} stroke="var(--axis)" />
        <Tooltip
          cursor={cursorFill}
          content={
            <ChartTooltip
              rows={(d) => [
                {
                  label: 'Net points',
                  value: fmtSigned(d.points),
                  className: d.points > 0 ? 'good-text' : d.points < 0 ? 'bad-text' : '',
                },
                { label: 'Leads won', value: fmtNum(d.leadsWon) },
                { label: 'Leads dropped', value: fmtNum(d.leadsDropped) },
                { label: 'Logged in', value: d.loggedIn ? 'Yes' : 'No' },
              ]}
            />
          }
        />
        <Bar dataKey="points" radius={BAR_RADIUS} maxBarSize={30} isAnimationActive={false}>
          {data.map((d) => (
            <Cell key={d.date} fill={d.points >= 0 ? 'var(--series-1)' : 'var(--series-8)'} />
          ))}
        </Bar>
      </BarChart>
    </Frame>
  );
}
