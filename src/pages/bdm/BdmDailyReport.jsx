import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, CalendarX, Check, ChevronLeft, ChevronRight, Download, Minus } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { api } from '../../services/api';
import { Card, EmptyState, PageHeader, Person, PointsChip, Skeleton, StatTile } from '../../components/ui';
import { Clock, Phone, Target, TrendingDown } from 'lucide-react';
import { fmtDayLong, fmtMinutes, fmtNum, keyToDate, toCsv, toDateKey, todayKey } from '../../utils/format';
import BdaDetailDrawer from './BdaDetailDrawer';

const COLUMNS = [
  { key: 'name', label: 'Associate', value: (r) => r.bda.name, sort: (r) => r.bda.name, align: 'l' },
  { key: 'loggedIn', label: 'Portal login', value: (r) => (r.loggedIn ? 'Yes' : 'No'), sort: (r) => (r.loggedIn ? 1 : 0), align: 'l' },
  { key: 'calls', label: 'Calls', value: (r) => r.calls, sort: (r) => r.calls },
  { key: 'callMinutes', label: 'Talk time', value: (r) => fmtMinutes(r.callMinutes), sort: (r) => r.callMinutes, cls: 'col-md' },
  { key: 'leadsWon', label: 'Won', value: (r) => r.leadsWon, sort: (r) => r.leadsWon },
  { key: 'leadsDropped', label: 'Dropped', value: (r) => r.leadsDropped, sort: (r) => r.leadsDropped },
  { key: 'points', label: 'Net points', value: (r) => r.points, sort: (r) => r.points },
];

const shift = (key, n) => {
  const d = keyToDate(key);
  d.setDate(d.getDate() + n);
  return toDateKey(d);
};

export default function BdmDailyReport() {
  const [date, setDate] = useState(todayKey);
  const [sort, setSort] = useState({ key: 'points', dir: 'desc' });
  const [selected, setSelected] = useState(null);
  const { data, loading } = useApi(() => api.getDailyReport(date), [date]);

  const rows = useMemo(() => {
    if (!data) return [];
    const col = COLUMNS.find((c) => c.key === sort.key);
    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...data.rows].sort((a, b) => {
      const av = col.sort(a);
      const bv = col.sort(b);
      return (typeof av === 'string' ? av.localeCompare(bv) : av - bv) * dir;
    });
  }, [data, sort]);

  const toggleSort = (key) => setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key === 'name' ? 'asc' : 'desc' }));

  const download = () => {
    const csv = toCsv(rows, COLUMNS);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `daily-report-${date}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const isToday = date === todayKey();

  return (
    <>
      <PageHeader
        title="Daily report"
        description="One day, every associate. Sort by any column, export if you need it in a sheet."
        actions={
          <>
            <button className="icon-btn" onClick={() => setDate((d) => shift(d, -1))} aria-label="Previous day" disabled={data?.minDate && date <= data.minDate}>
              <ChevronLeft size={18} />
            </button>
            <input className="input" type="date" value={date} max={todayKey()} min={data?.minDate} onChange={(e) => e.target.value && setDate(e.target.value)} style={{ width: 170 }} aria-label="Report date" />
            <button className="icon-btn" onClick={() => setDate((d) => shift(d, 1))} aria-label="Next day" disabled={isToday}>
              <ChevronRight size={18} />
            </button>
            {!isToday && (
              <button className="btn btn-sm" onClick={() => setDate(todayKey())}>Today</button>
            )}
            <button className="btn btn-sm" onClick={download} disabled={!rows.length}>
              <Download size={14} /> CSV
            </button>
          </>
        }
      />

      {!data ? (
        <Skeleton h={320} style={{ borderRadius: 16 }} />
      ) : !data.available ? (
        <Card>
          <EmptyState icon={CalendarX} title="No data for this date" hint="The demo dataset covers the last 60 days." />
        </Card>
      ) : (
        <div className="stack" style={{ opacity: loading ? 0.7 : 1, transition: 'opacity .2s' }}>
          <div className="grid grid-tiles">
            <StatTile label="Calls" value={fmtNum(data.totals.calls)} icon={Phone} sub={`${data.totals.active} active associates`} />
            <StatTile label="Talk time" value={fmtMinutes(data.totals.callMinutes)} icon={Clock} tone="neutral" />
            <StatTile label="Leads won" value={data.totals.leadsWon} icon={Target} tone="good" />
            <StatTile label="Leads dropped" value={data.totals.leadsDropped} icon={TrendingDown} tone="bad" />
          </div>

          <Card title={fmtDayLong(date)} subtitle={`${data.rows.length} associates · ${data.totals.loggedIn} portal logins · click a column to sort`} flush>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    {COLUMNS.map((c) => (
                      <th
                        key={c.key}
                        className={`sortable ${c.align === 'l' ? '' : 'r'} ${sort.key === c.key ? 'sorted' : ''} ${c.cls || ''}`}
                        onClick={() => toggleSort(c.key)}
                        aria-sort={sort.key === c.key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
                      >
                        {c.label}
                        {sort.key === c.key && (sort.dir === 'asc' ? <ArrowUp size={11} style={{ marginLeft: 4 }} /> : <ArrowDown size={11} style={{ marginLeft: 4 }} />)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.bda.id} className="clickable" onClick={() => setSelected(r.bda)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setSelected(r.bda)}>
                      <td>
                        <Person name={r.bda.name} id={r.bda.id} meta={r.bda.email} size={32} />
                      </td>
                      <td>
                        {r.loggedIn ? (
                          <span className="chip chip-primary"><Check size={12} /> Day {r.streakDay}</span>
                        ) : (
                          <span className="chip chip-neutral"><Minus size={12} /> No</span>
                        )}
                      </td>
                      <td className="r num">{fmtNum(r.calls)}</td>
                      <td className="r num col-md">{fmtMinutes(r.callMinutes)}</td>
                      <td className="r"><span className="chip chip-good">+{r.leadsWon}</span></td>
                      <td className="r"><span className={`chip ${r.leadsDropped ? 'chip-bad' : 'chip-neutral'}`}>{r.leadsDropped ? `−${r.leadsDropped}` : '0'}</span></td>
                      <td className="r"><PointsChip value={r.points} /></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td>Total</td>
                    <td>{data.totals.loggedIn} logged in</td>
                    <td className="r num">{fmtNum(data.totals.calls)}</td>
                    <td className="r num col-md">{fmtMinutes(data.totals.callMinutes)}</td>
                    <td className="r">{data.totals.leadsWon}</td>
                    <td className="r">{data.totals.leadsDropped}</td>
                    <td className="r"><PointsChip value={data.totals.points} /></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        </div>
      )}

      {selected && <BdaDetailDrawer bda={selected} range="month" onClose={() => setSelected(null)} />}
    </>
  );
}
