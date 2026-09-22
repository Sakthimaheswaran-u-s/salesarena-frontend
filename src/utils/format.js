const pad = (n) => String(n).padStart(2, '0');

export const toDateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayKey = () => toDateKey(new Date());
export const keyToDate = (key) => new Date(`${key}T00:00:00`);

export const fmtNum = (n) => (n ?? 0).toLocaleString('en-US');
export const fmtSigned = (n) => (n > 0 ? `+${fmtNum(n)}` : fmtNum(n));
export const fmtMinutes = (m) => {
  const h = Math.floor((m ?? 0) / 60);
  const mm = Math.round((m ?? 0) % 60);
  return h ? `${h}h ${pad(mm)}m` : `${mm}m`;
};
export const fmtPct = (n) => `${Math.round((n ?? 0) * 100)}%`;

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const fmtDayShort = (key) => {
  const d = keyToDate(key);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
};
export const fmtMonthYear = (key) => {
  const d = keyToDate(key);
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};
export const fmtDayLong = (key) => {
  const d = keyToDate(key);
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};
export const fmtWeekdayLetter = (key) => WEEKDAYS[keyToDate(key).getDay()][0];
export const fmtTime = (iso) => {
  const d = new Date(iso);
  const h = d.getHours();
  const suffix = h >= 12 ? 'PM' : 'AM';
  return `${((h + 11) % 12) + 1}:${pad(d.getMinutes())} ${suffix}`;
};
export const relativeDay = (key) => {
  const t = todayKey();
  if (key === t) return 'Today';
  const y = new Date();
  y.setDate(y.getDate() - 1);
  if (key === toDateKey(y)) return 'Yesterday';
  return fmtDayLong(key);
};

export const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');

export const firstName = (name = '') => name.split(' ')[0];

export const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

export const ordinal = (n) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
};

// ---------------------------------------------------------------------------
// Quarters (the notice board runs on 3-month cycles)
// ---------------------------------------------------------------------------
export const QUARTER_MONTHS = [
  { q: 1, label: 'Jan – Mar' },
  { q: 2, label: 'Apr – Jun' },
  { q: 3, label: 'Jul – Sep' },
  { q: 4, label: 'Oct – Dec' },
];

export const quarterOf = (key) => {
  const d = keyToDate(key);
  return { year: d.getFullYear(), quarter: Math.floor(d.getMonth() / 3) + 1 };
};

export const quarterLabel = (q) => QUARTER_MONTHS[q - 1].label;

/** Last day of a quarter, as a date key. */
export const quarterEnd = (year, q) => toDateKey(new Date(year, q * 3, 0));

/** Days left in the quarter that contains `key`. */
export const daysLeftInQuarter = (key) => {
  const { year, quarter } = quarterOf(key);
  const end = keyToDate(quarterEnd(year, quarter));
  return Math.max(0, Math.round((end - keyToDate(key)) / 86400000));
};

export const toCsv = (rows, columns) => {
  const esc = (v) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const head = columns.map((c) => esc(c.label)).join(',');
  const body = rows.map((r) => columns.map((c) => esc(c.value(r))).join(',')).join('\n');
  return `${head}\n${body}`;
};
