# SalesArena — Sales Rewards & Recognition Portal (frontend)

React + Vite frontend for a gamified sales portal. BDAs (sales associates) earn
portal points for logins, streaks and won leads, lose points for dropped leads,
and compete on a live leaderboard. BDMs (managers) get a team dashboard, a
searchable leaderboard and per-day reports.

The app is fully self-contained — there is no server and no configuration. All
data comes from an in-browser sample API (`src/services/mockApi.js`) that
generates a deterministic 16-month history and persists your own logins and any
accounts you create in `localStorage`.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
```

`dist/` is plain static output — any static host or web server will serve it,
as long as unknown paths fall back to `index.html` for react-router.

### Demo accounts

| Role | Email | Password |
|------|-------|----------|
| BDA  | priya.sharma@salesarena.io (or any BDA in `src/data/mockData.js`) | `bda123` |
| BDM  | rahul.verma@salesarena.io | `bdm123` |

The login page has one-click buttons that fill these in. "Reset demo data" clears
persisted login streaks and any accounts added through the Associates screen.

The sample history covers the last 16 months, so the notice board opens with
several closed quarters on it.

## Scoring rules

Defined once in `src/config/rules.js`.

| Event | Points |
|-------|--------|
| Lead won | **+50** |
| Lead dropped | **−50** |
| Daily login | **+10** base, **+5** per consecutive day (bonus capped at +50) |

Login points for streak day *N* = `10 + min((N − 1) × 5, 50)`, so day 1 = +10,
day 5 = +30, day 11+ = +60. A streak survives until the end of the next day;
missing a day resets it to zero.

Tracked metrics per BDA per day: calls, talk time (minutes), leads won,
leads dropped, portal login.

## Features

Everyone is ranked as an individual — there are no teams.

**BDA portal** (`/bda`)
- Hero card with points, rank out of all associates, and points needed to overtake the next person
- Login-streak card with 7-day history, next-login value and milestone progress
- Today's tiles (calls / leads won / leads dropped / talk time) with vs-yesterday deltas
- Calls-per-day and net-points-per-day charts (last 14 days)
- Points breakdown (streaks vs leads vs penalties), recent activity feed, top-5 leaderboard with your row pinned
- Achievements strip
- `/bda/leaderboard` — podium + full table, "Jump to my row"
- `/bda/notice-board` — quarterly hall of fame (see below)
- `/bda/activity` — full points ledger grouped by day with filters

**BDM portal** (`/bdm`)
- Today's team tiles (calls, won, dropped, talk time, active associates)
- Team calls-per-day and won-vs-dropped charts
- Period totals, top performers, "needs attention" (high drop rate), team ranking
- `/bdm/leaderboard` — search by name / team / email, team filter, click any row for a detail drawer
- `/bdm/notice-board` — quarterly hall of fame (see below)
- `/bdm/daily` — per-associate report for any day, sortable columns, CSV export
- `/bdm/associates` — **create BDA accounts** (name, work email auto-filled from the name, generated temporary password) and review the full roster with all-time totals

**Notice board** (both roles)
The year is split into three-month cycles (Q1–Q4). The top three of every *closed*
cycle stay on the board, grouped by year; the cycle in progress is shown separately
and marked as not final. Ranking uses the same rules as the leaderboard.

Time-range switcher (Today / 7 days / 30 days / All time) on every ranking view.
Light and dark themes (toggle in the top bar, follows the OS by default).
Responsive: sidebar on desktop, bottom tab bar on tablet/mobile.

## Project layout

```
src/
  config/rules.js        scoring constants + streak formula
  data/mockData.js       demo users, teams, company names
  services/api.js        re-exports the sample API as `api`
  services/mockApi.js    in-browser sample API (deterministic history + localStorage overlay)
  hooks/useApi.js        async loader that keeps stale data on screen while refetching
  context/               AuthContext (session), ThemeContext (light/dark)
  components/ui          Card, StatTile, chips, Avatar, RankBadge, Segmented, SearchInput…
  components/charts      Recharts wrappers (CallsChart, LeadsChart, PointsChart)
  components/leaderboard Podium, LeaderboardTable, MiniBoard
  components/layout      AppShell (sidebar / topbar / bottom nav)
  pages/LoginPage.jsx
  pages/NoticeBoard.jsx  quarterly hall of fame (shared by both roles)
  pages/bda/             BdaDashboard, BdaLeaderboard, BdaActivity
  pages/bdm/             BdmDashboard, BdmLeaderboard, BdmDailyReport, ManageAssociates, BdaDetailDrawer
  styles/global.css      design tokens (light + dark), layout, components
```

## Sample API

Every screen goes through `api` from `src/services/api.js`, which is the
in-browser implementation in `mockApi.js`. All methods are async and resolve
after a short simulated delay.

| Function | Returns |
|----------|---------|
| `login({ email, password, role })` | `{ user, reward }` — BDAs also earn the day's login points |
| `logout()` | — |
| `getBdaOverview(bdaId, range)` | dashboard data for one associate |
| `getBdaActivity(bdaId)` | full points ledger for one associate |
| `getLeaderboard({ range, search })` | ranked associates, optionally filtered by search text |
| `getTeamOverview(range)` | manager dashboard data across all associates |
| `getDailyReport(date)` | per-associate report for one `YYYY-MM-DD` |
| `getNoticeBoard()` | top 3 of every closed 3-month cycle |
| `listBdas()` | roster for the manager's admin screen |
| `createBda({ name, email, password })` | create an associate account (persisted in `localStorage`) |
| `resetDemo()` | wipe persisted logins and added accounts |

`range` is one of `today | week | month | all`.
