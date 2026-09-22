# SalesArena — Sales Rewards & Recognition Portal (frontend)

React + Vite frontend for a gamified sales portal. BDAs (sales associates) earn
portal points for logins, streaks and won leads, lose points for dropped leads,
and compete on a live leaderboard. BDMs (managers) get a team dashboard, a
searchable leaderboard and per-day reports.

## Run it

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173  (expects the Go API on :8080, see ../backend)
npm run build      # production build in dist/
```

Set `VITE_USE_MOCK=true` in `frontend/.env` to run against the in-browser mock
instead of the backend. `VITE_API_URL` overrides the API origin for production
builds (in dev, Vite proxies `/api` to `http://localhost:8080`).

### Docker
A single root `Dockerfile` builds both the frontend and Go backend into a unified container image. The Go server directly serves both the API endpoints (`/api/*`) and the frontend single-page application with static asset routing and SPA fallback.

To build and run the full stack:
```bash
# from repository root
docker compose up -d --build
# http://localhost:8080
```

### Demo accounts

| Role | Email | Password |
|------|-------|----------|
| BDA  | priya.sharma@salesarena.io (or any BDA in `src/data/mockData.js`) | `bda123` |
| BDM  | rahul.verma@salesarena.io | `bdm123` |

The login page has one-click buttons that fill these in. "Reset demo data" clears
persisted login streaks and any accounts added through the Associates screen.

In mock mode the sample history covers the last 16 months, so the notice board
opens with several closed quarters on it.

## Scoring rules

Defined once in `src/config/rules.js` — mirror these in the Go backend.

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
  config/rules.js        scoring constants + streak formula (shared contract with backend)
  data/mockData.js       demo users, teams, company names
  services/api.js        picks httpApi (Go backend) or mockApi (VITE_USE_MOCK=true)
  services/httpApi.js    fetch client for the Go API (bearer token, 401 handling)
  services/mockApi.js    in-browser mock with the same surface
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

## Backend contract

`src/services/httpApi.js` maps each call to the Go API (`../backend`); `mockApi.js`
is the standalone in-browser implementation with identical return shapes.

| Function | Endpoint |
|----------|----------|
| `login({ email, password, role })` | `POST /api/auth/login` → `{ user, reward }` |
| `getBdaOverview(bdaId, range)` | `GET /api/bda/:id/overview?range=` |
| `getBdaActivity(bdaId)` | `GET /api/bda/:id/activity` |
| `getLeaderboard({ range, search, team })` | `GET /api/leaderboard?range=&q=&team=` |
| `getTeamOverview(range)` | `GET /api/team/overview?range=` |
| `getDailyReport(date)` | `GET /api/team/daily?date=YYYY-MM-DD` |
| `getNoticeBoard()` | `GET /api/notice-board` |
| `listBdas()` | `GET /api/bdas` (manager only) |
| `createBda({name, email, password})` | `POST /api/bdas` (manager only) |

`range` is one of `today | week | month | all`.
