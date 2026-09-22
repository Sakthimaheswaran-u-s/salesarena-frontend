/**
 * In-browser mock of the API (no backend needed).
 *
 * Selected when VITE_USE_MOCK=true; see ./api.js. Return shapes are identical
 * to the Go backend's responses.
 *
 * History for the seeded roster is generated deterministically (seeded per
 * associate) so rankings are stable across reloads. Two things are layered on
 * top and persisted in localStorage: portal logins made through the UI (this is
 * how streaks accumulate day to day) and associates created by a manager.
 */
import { USERS, COMPANIES } from '../data/mockData';
import { RULES, RANGES, loginPointsForStreak } from '../config/rules';
import { toDateKey, todayKey, keyToDate, quarterOf, quarterEnd } from '../utils/format';

// 16 months, so the notice board has several closed quarters to show.
const HISTORY_DAYS = 480;
const OVERLAY_KEY = 'srr.logins.v1';
const ROSTER_KEY = 'srr.roster.v1';
const LATENCY_MS = 200;

const sleep = (ms = LATENCY_MS) => new Promise((r) => setTimeout(r, ms));
const pad = (n) => String(n).padStart(2, '0');

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------
function lastNDays(n) {
  const out = [];
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(base);
    d.setDate(base.getDate() - i);
    out.push(toDateKey(d));
  }
  return out;
}

const timeAt = (key, minutesFromMidnight) =>
  `${key}T${pad(Math.floor(minutesFromMidnight / 60) % 24)}:${pad(minutesFromMidnight % 60)}:00`;

const nowLocalIso = () => {
  const d = new Date();
  return `${toDateKey(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

// ---------------------------------------------------------------------------
// Deterministic pseudo-random generation
// ---------------------------------------------------------------------------
function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(a) {
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateRawDays(bda, dates) {
  const rnd = mulberry32(hashSeed(bda.id));
  const pick = () => COMPANIES[Math.floor(rnd() * COMPANIES.length)];
  const out = {};
  dates.forEach((key, idx) => {
    const dow = keyToDate(key).getDay();
    const weekend = dow === 0 || dow === 6;
    const isToday = idx === dates.length - 1;
    const active = isToday ? true : rnd() < (weekend ? 0.2 : 0.93);
    const weekendLogin = rnd() < 0.6;
    const r = [rnd(), rnd(), rnd(), rnd(), rnd()];
    let calls = 0;
    let callMinutes = 0;
    let won = [];
    let dropped = [];
    if (active) {
      const scale = isToday ? 0.55 : 1; // today is still in progress
      const base = weekend ? 6 : 15;
      calls = Math.max(0, Math.round((base + (r[0] - 0.5) * 10) * bda.skill * scale));
      callMinutes = Math.round(calls * (3.5 + r[1] * 4));
      const wonN = Math.min(5, Math.floor(r[2] * 3.4 * bda.skill * scale));
      const dropN = r[3] < 0.28 ? (r[4] < 0.25 ? 2 : 1) : 0;
      won = Array.from({ length: wonN }, pick);
      dropped = Array.from({ length: dropN }, pick);
    }
    // Nobody has "logged in" to the portal today until they actually do.
    out[key] = { loggedIn: isToday ? false : active || (weekend && weekendLogin), calls, callMinutes, won, dropped };
  });
  return out;
}

/** Associates created through the portal start empty. */
function emptyDays(dates) {
  return Object.fromEntries(dates.map((k) => [k, { loggedIn: false, calls: 0, callMinutes: 0, won: [], dropped: [] }]));
}

// ---------------------------------------------------------------------------
// Persisted layers
// ---------------------------------------------------------------------------
function read(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}
function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable – changes simply won't persist */
  }
}

const readOverlay = () => read(OVERLAY_KEY, {});
const writeOverlay = (o) => write(OVERLAY_KEY, o);
const readRoster = () => read(ROSTER_KEY, []);
const writeRoster = (r) => write(ROSTER_KEY, r);

/** Seeded roster + anything a manager has added. */
function allUsers() {
  return [...USERS, ...readRoster()];
}

// ---------------------------------------------------------------------------
// Dataset assembly (memoised on overlay + roster + date)
// ---------------------------------------------------------------------------
let cache = { sig: null, data: null };

function publicUser(u) {
  const { password, skill, ...pub } = u;
  return pub;
}

function dataset() {
  const overlay = readOverlay();
  const roster = readRoster();
  const sig = `${JSON.stringify(overlay)}|${JSON.stringify(roster)}|${todayKey()}`;
  if (cache.sig === sig) return cache.data;

  const dates = lastNDays(HISTORY_DAYS);
  const bdas = allUsers()
    .filter((u) => u.role === 'BDA')
    .map((bda) => {
      const raw = bda.skill ? generateRawDays(bda, dates) : emptyDays(dates);
      let streak = 0;
      const days = dates.map((key) => {
        const r = raw[key];
        const overlayAt = overlay[bda.id]?.[key];
        const loggedIn = r.loggedIn || Boolean(overlayAt);
        streak = loggedIn ? streak + 1 : 0;

        const events = [];
        if (loggedIn) {
          events.push({
            id: `${bda.id}-${key}-login`,
            type: 'LOGIN',
            points: loginPointsForStreak(streak),
            streak,
            at: overlayAt || timeAt(key, 9 * 60 + 5),
            title: `Daily login · streak day ${streak}`,
          });
        }
        r.won.forEach((company, i) =>
          events.push({
            id: `${bda.id}-${key}-won-${i}`,
            type: 'LEAD_WON',
            points: RULES.LEAD_WON,
            company,
            at: timeAt(key, 10 * 60 + 30 + i * 95),
            title: `Lead won · ${company}`,
          }),
        );
        r.dropped.forEach((company, i) =>
          events.push({
            id: `${bda.id}-${key}-drop-${i}`,
            type: 'LEAD_DROPPED',
            points: RULES.LEAD_DROPPED,
            company,
            at: timeAt(key, 14 * 60 + 15 + i * 70),
            title: `Lead dropped · ${company}`,
          }),
        );

        return {
          date: key,
          loggedIn,
          streakDay: loggedIn ? streak : 0,
          calls: r.calls,
          callMinutes: r.callMinutes,
          leadsWon: r.won.length,
          leadsDropped: r.dropped.length,
          events,
          points: events.reduce((s, e) => s + e.points, 0),
        };
      });

      // Current streak: consecutive logins ending today, or ending yesterday if
      // today's login hasn't happened yet (the streak is still alive).
      const n = days.length;
      let current = 0;
      for (let i = days[n - 1].loggedIn ? n - 1 : n - 2; i >= 0 && days[i].loggedIn; i--) current++;
      const bestStreak = days.reduce((m, d) => Math.max(m, d.streakDay), 0);

      return {
        ...publicUser(bda),
        days,
        byDate: Object.fromEntries(days.map((d) => [d.date, d])),
        streak: current,
        bestStreak,
        loggedInToday: days[n - 1].loggedIn,
        joined: bda.joined || dates[0],
      };
    });

  cache = { sig, data: { dates, bdas } };
  return cache.data;
}

// ---------------------------------------------------------------------------
// Aggregation
// ---------------------------------------------------------------------------
function windowKeys(range, dates, offset = 0) {
  const def = RANGES.find((r) => r.key === range) || RANGES[3];
  if (!def.days) return offset ? [] : dates;
  const end = dates.length - offset * def.days;
  return dates.slice(Math.max(0, end - def.days), Math.max(0, end));
}

const emptyAgg = () => ({
  calls: 0, callMinutes: 0, leadsWon: 0, leadsDropped: 0, points: 0,
  loginPoints: 0, leadPoints: 0, penaltyPoints: 0, activeDays: 0, loginDays: 0,
});

function addDay(agg, d) {
  agg.calls += d.calls;
  agg.callMinutes += d.callMinutes;
  agg.leadsWon += d.leadsWon;
  agg.leadsDropped += d.leadsDropped;
  agg.points += d.points;
  if (d.calls > 0) agg.activeDays += 1;
  if (d.loggedIn) agg.loginDays += 1;
  d.events.forEach((e) => {
    if (e.type === 'LOGIN') agg.loginPoints += e.points;
    else if (e.type === 'LEAD_WON') agg.leadPoints += e.points;
    else agg.penaltyPoints += e.points;
  });
  return agg;
}

function aggregate(bda, keys) {
  const agg = emptyAgg();
  keys.forEach((k) => {
    const d = bda.byDate[k];
    if (d) addDay(agg, d);
  });
  return agg;
}

const toEntry = (b) => ({ id: b.id, name: b.name, email: b.email, role: b.role });

function sortEntries(list) {
  return list.sort(
    (a, b) =>
      b.points - a.points ||
      b.leadsWon - a.leadsWon ||
      a.leadsDropped - b.leadsDropped ||
      b.calls - a.calls ||
      a.bda.name.localeCompare(b.bda.name),
  );
}

function rankBdas(bdas, keys) {
  return sortEntries(
    bdas.map((b) => ({ bda: toEntry(b), ...aggregate(b, keys), streak: b.streak, loggedInToday: b.loggedInToday })),
  ).map((e, i) => ({ ...e, rank: i + 1 }));
}

function sumDay(bdas, key) {
  return bdas.reduce(
    (acc, b) => {
      const d = b.byDate[key];
      if (!d) return acc;
      acc.calls += d.calls;
      acc.callMinutes += d.callMinutes;
      acc.leadsWon += d.leadsWon;
      acc.leadsDropped += d.leadsDropped;
      acc.points += d.points;
      acc.active += d.calls > 0 ? 1 : 0;
      acc.loggedIn += d.loggedIn ? 1 : 0;
      return acc;
    },
    { date: key, calls: 0, callMinutes: 0, leadsWon: 0, leadsDropped: 0, points: 0, active: 0, loggedIn: 0 },
  );
}

function computeAchievements(me, monthRank, allTime) {
  const last7 = me.days.slice(-7);
  const cleanWeek = last7.every((d) => d.leadsDropped === 0) && last7.some((d) => d.leadsWon > 0);
  return [
    { id: 'streak-3', title: 'Warm-up', desc: '3-day login streak', earned: me.bestStreak >= 3 },
    { id: 'streak-7', title: 'On fire', desc: '7-day login streak', earned: me.bestStreak >= 7 },
    { id: 'streak-14', title: 'Unstoppable', desc: '14-day login streak', earned: me.bestStreak >= 14 },
    { id: 'closer-10', title: 'Closer', desc: '10 leads won', earned: allTime.leadsWon >= 10 },
    { id: 'closer-50', title: 'Rainmaker', desc: '50 leads won', earned: allTime.leadsWon >= 50 },
    { id: 'dialer-500', title: 'Dialer', desc: '500 calls made', earned: allTime.calls >= 500 },
    { id: 'podium', title: 'Podium', desc: 'Top 3 this month', earned: monthRank <= 3 },
    { id: 'clean-week', title: 'Clean sheet', desc: 'A week with no drops', earned: cleanWeek },
  ];
}

// ---------------------------------------------------------------------------
// Login bookkeeping
// ---------------------------------------------------------------------------
function recordLogin(bdaId) {
  const overlay = readOverlay();
  const key = todayKey();
  const alreadyToday = Boolean(overlay[bdaId]?.[key]);
  if (!alreadyToday) {
    overlay[bdaId] = { ...(overlay[bdaId] || {}), [key]: nowLocalIso() };
    writeOverlay(overlay);
  }
  const me = dataset().bdas.find((b) => b.id === bdaId);
  return {
    streak: me.streak,
    points: loginPointsForStreak(me.streak),
    isNew: !alreadyToday,
    nextPoints: loginPointsForStreak(me.streak + 1),
  };
}

// ---------------------------------------------------------------------------
// Public API — same surface as ./httpApi.js
// ---------------------------------------------------------------------------
export const mockApi = {
  /** POST /api/auth/login */
  async login({ email, password, role }) {
    await sleep(420);
    const user = allUsers().find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user || user.password !== password) throw new Error('Invalid email or password.');
    if (user.role !== role) {
      throw new Error(`This account is a ${user.role} account. Switch to the ${user.role} tab to sign in.`);
    }
    const reward = user.role === 'BDA' ? recordLogin(user.id) : null;
    return { user: publicUser(user), reward };
  },

  async logout() {},

  /** GET /api/bda/:id/overview?range= */
  async getBdaOverview(bdaId, range = 'month') {
    await sleep();
    const { dates, bdas } = dataset();
    const me = bdas.find((b) => b.id === bdaId);
    if (!me) throw new Error('Associate not found');

    const keys = windowKeys(range, dates);
    const board = rankBdas(bdas, keys);
    const mine = board.find((e) => e.bda.id === bdaId);
    const prevKeys = windowKeys(range, dates, 1);
    const prevRank = prevKeys.length ? rankBdas(bdas, prevKeys).find((e) => e.bda.id === bdaId)?.rank : null;
    const monthRank = rankBdas(bdas, windowKeys('month', dates)).find((e) => e.bda.id === bdaId).rank;

    const today = me.byDate[todayKey()];
    const yesterday = me.byDate[dates[dates.length - 2]];
    const allTime = aggregate(me, dates);

    return {
      bda: toEntry(me),
      range,
      summary: mine,
      rank: mine.rank,
      rankChange: prevRank ? prevRank - mine.rank : null,
      total: board.length,
      above: board[mine.rank - 2] || null,
      below: board[mine.rank] || null,
      leaders: board.slice(0, 5),
      today,
      yesterday,
      streak: me.streak,
      bestStreak: me.bestStreak,
      loggedInToday: me.loggedInToday,
      nextLoginPoints: loginPointsForStreak(me.streak + 1),
      last7: me.days.slice(-7).map((d) => ({ date: d.date, loggedIn: d.loggedIn })),
      daily: me.days.slice(-14).map(({ events, ...d }) => d),
      daily30: me.days.slice(-30).map(({ events, ...d }) => d),
      feed: me.days
        .flatMap((d) => d.events)
        .sort((a, b) => b.at.localeCompare(a.at))
        .slice(0, 12),
      achievements: computeAchievements(me, monthRank, allTime),
    };
  },

  /** GET /api/bda/:id/activity */
  async getBdaActivity(bdaId) {
    await sleep();
    const { bdas } = dataset();
    const me = bdas.find((b) => b.id === bdaId);
    if (!me) throw new Error('Associate not found');
    const days = [...me.days]
      .reverse()
      .filter((d) => d.events.length || d.calls)
      .map((d) => ({ ...d, events: [...d.events].sort((a, b) => b.at.localeCompare(a.at)) }));
    return { bda: toEntry(me), days, daily30: me.days.slice(-30).map(({ events, ...d }) => d) };
  },

  /** GET /api/leaderboard?range=&q= */
  async getLeaderboard({ range = 'month', search = '' } = {}) {
    await sleep();
    const { dates, bdas } = dataset();
    const current = rankBdas(bdas, windowKeys(range, dates));
    const prevKeys = windowKeys(range, dates, 1);
    const prevRank = prevKeys.length
      ? Object.fromEntries(rankBdas(bdas, prevKeys).map((e) => [e.bda.id, e.rank]))
      : null;
    const q = search.trim().toLowerCase();
    const entries = current
      .map((e) => ({ ...e, rankChange: prevRank ? prevRank[e.bda.id] - e.rank : null }))
      .filter((e) => !q || e.bda.name.toLowerCase().includes(q) || e.bda.email.toLowerCase().includes(q));
    return { range, total: current.length, entries };
  },

  /** GET /api/team/overview?range= */
  async getTeamOverview(range = 'month') {
    await sleep();
    const { dates, bdas } = dataset();
    const today = sumDay(bdas, dates[dates.length - 1]);
    const yesterday = sumDay(bdas, dates[dates.length - 2]);
    const daily = dates.slice(-14).map((k) => sumDay(bdas, k));
    const period = windowKeys(range, dates).reduce(
      (acc, k) => {
        const d = sumDay(bdas, k);
        acc.calls += d.calls;
        acc.callMinutes += d.callMinutes;
        acc.leadsWon += d.leadsWon;
        acc.leadsDropped += d.leadsDropped;
        acc.points += d.points;
        return acc;
      },
      { calls: 0, callMinutes: 0, leadsWon: 0, leadsDropped: 0, points: 0 },
    );
    const board = rankBdas(bdas, windowKeys(range, dates));
    const watchlist = board
      .map((e) => ({
        ...e,
        dropRate: e.leadsWon + e.leadsDropped ? e.leadsDropped / (e.leadsWon + e.leadsDropped) : 0,
      }))
      .filter((e) => e.leadsDropped >= 2 && e.dropRate >= 0.3)
      .sort((a, b) => b.dropRate - a.dropRate || b.leadsDropped - a.leadsDropped)
      .slice(0, 5);
    const quarter = currentQuarterBoard(bdas, dates);
    return { range, today, yesterday, daily, period, top: board.slice(0, 5), watchlist, quarter, totalBdas: bdas.length };
  },

  /** GET /api/team/daily?date= */
  async getDailyReport(dateKey) {
    await sleep();
    const { dates, bdas } = dataset();
    if (!dates.includes(dateKey)) return { date: dateKey, rows: [], totals: null, available: false, minDate: dates[0] };
    const rows = bdas
      .map((b) => {
        const d = b.byDate[dateKey];
        return { bda: toEntry(b), ...d, events: undefined };
      })
      .sort((a, b) => b.points - a.points || b.leadsWon - a.leadsWon || b.calls - a.calls);
    return { date: dateKey, rows, totals: sumDay(bdas, dateKey), available: true, minDate: dates[0] };
  },

  /** GET /api/notice-board — top 3 of every closed 3-month cycle, newest first. */
  async getNoticeBoard() {
    await sleep();
    const { dates, bdas } = dataset();
    const buckets = new Map();
    dates.forEach((key) => {
      const { year, quarter } = quarterOf(key);
      const id = `${year}-Q${quarter}`;
      if (!buckets.has(id)) buckets.set(id, { year, quarter, keys: [] });
      buckets.get(id).keys.push(key);
    });

    const now = quarterOf(todayKey());
    const cycles = [...buckets.values()]
      .map(({ year, quarter, keys }) => {
        const entries = sortEntries(
          bdas
            .map((b) => ({ bda: toEntry(b), ...aggregate(b, keys) }))
            .filter((e) => e.calls > 0 || e.points !== 0),
        ).map((e, i) => ({ ...e, rank: i + 1 }));
        const totals = entries.reduce(
          (acc, e) => {
            acc.calls += e.calls;
            acc.leadsWon += e.leadsWon;
            acc.leadsDropped += e.leadsDropped;
            acc.points += e.points;
            return acc;
          },
          { calls: 0, leadsWon: 0, leadsDropped: 0, points: 0 },
        );
        const isCurrent = year === now.year && quarter === now.quarter;
        // A quarter only counts once we have its first month of data.
        const partial = !isCurrent && keys.length < 45;
        return {
          id: `${year}-Q${quarter}`,
          year,
          quarter,
          from: keys[0],
          to: keys[keys.length - 1],
          endsOn: quarterEnd(year, quarter),
          status: isCurrent ? 'running' : 'closed',
          partial,
          days: keys.length,
          participants: entries.length,
          top: entries.slice(0, 3),
          totals,
        };
      })
      .filter((c) => c.top.length && !c.partial)
      .sort((a, b) => b.year - a.year || b.quarter - a.quarter);

    // The cycle in progress is returned on its own; `years` holds closed ones.
    const years = [];
    cycles
      .filter((c) => c.status === 'closed')
      .forEach((c) => {
        let y = years.find((x) => x.year === c.year);
        if (!y) years.push((y = { year: c.year, cycles: [] }));
        y.cycles.push(c);
      });
    return { years, current: cycles.find((c) => c.status === 'running') || null };
  },

  /** GET /api/bdas — roster for the manager's admin screen. */
  async listBdas() {
    await sleep();
    const { dates, bdas } = dataset();
    const board = rankBdas(bdas, dates);
    const rankOf = Object.fromEntries(board.map((e) => [e.bda.id, e.rank]));
    const allTime = Object.fromEntries(board.map((e) => [e.bda.id, e]));
    return {
      entries: bdas
        .map((b) => ({
          bda: toEntry(b),
          joined: b.joined,
          streak: b.streak,
          bestStreak: b.bestStreak,
          loggedInToday: b.loggedInToday,
          rank: rankOf[b.id],
          points: allTime[b.id].points,
          calls: allTime[b.id].calls,
          leadsWon: allTime[b.id].leadsWon,
          leadsDropped: allTime[b.id].leadsDropped,
          createdInPortal: readRoster().some((r) => r.id === b.id),
        }))
        .sort((a, b) => a.bda.name.localeCompare(b.bda.name)),
    };
  },

  /** POST /api/bdas — create an associate account. */
  async createBda({ name, email, password }) {
    await sleep(380);
    const cleanName = (name || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();
    if (cleanName.length < 2) throw new Error('Enter the full name.');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(cleanEmail)) throw new Error('Enter a valid work email.');
    if ((password || '').length < 6) throw new Error('Password must be at least 6 characters.');
    if (allUsers().some((u) => u.email.toLowerCase() === cleanEmail)) {
      throw new Error('That email is already registered.');
    }
    const roster = readRoster();
    const user = {
      id: `bda-new-${Date.now()}`,
      role: 'BDA',
      name: cleanName,
      email: cleanEmail,
      password,
      joined: todayKey(),
    };
    writeRoster([...roster, user]);
    cache = { sig: null, data: null };
    return { user: publicUser(user) };
  },

  /** Demo helper: wipe persisted logins and added accounts. */
  async resetDemo() {
    try {
      localStorage.removeItem(OVERLAY_KEY);
      localStorage.removeItem(ROSTER_KEY);
    } catch {
      /* ignore */
    }
    cache = { sig: null, data: null };
  },
};

/** Standings for the quarter in progress (used on the manager overview). */
function currentQuarterBoard(bdas, dates) {
  const { year, quarter } = quarterOf(todayKey());
  const keys = dates.filter((k) => {
    const q = quarterOf(k);
    return q.year === year && q.quarter === quarter;
  });
  const entries = sortEntries(bdas.map((b) => ({ bda: toEntry(b), ...aggregate(b, keys) }))).map((e, i) => ({
    ...e,
    rank: i + 1,
  }));
  return { year, quarter, endsOn: quarterEnd(year, quarter), days: keys.length, top: entries.slice(0, 3) };
}
