import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Activity, CalendarDays, LayoutDashboard, LogOut, Moon, Pin, Sun, Trophy, UserPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Avatar } from '../ui';
import { daysLeftInQuarter, fmtDayLong, quarterOf, todayKey } from '../../utils/format';

const NAV = {
  BDA: [
    { to: '/bda', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/bda/leaderboard', label: 'Leaderboard', icon: Trophy },
    { to: '/bda/notice-board', label: 'Notice board', short: 'Notice', icon: Pin },
    { to: '/bda/activity', label: 'My activity', short: 'Activity', icon: Activity },
  ],
  BDM: [
    { to: '/bdm', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/bdm/leaderboard', label: 'Leaderboard', icon: Trophy },
    { to: '/bdm/notice-board', label: 'Notice board', short: 'Notice', icon: Pin },
    { to: '/bdm/daily', label: 'Daily report', short: 'Daily', icon: CalendarDays },
    { to: '/bdm/associates', label: 'Associates', icon: UserPlus },
  ],
};

export function Brand({ compact = false }) {
  return (
    <div className="brand">
      <span className="brand-mark">
        <Trophy size={18} />
      </span>
      {!compact && (
        <div>
          <div className="brand-name">SalesArena</div>
          <div className="brand-sub">Rewards &amp; Recognition</div>
        </div>
      )}
    </div>
  );
}

export default function AppShell() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const items = NAV[user.role] || [];
  const { year, quarter } = quarterOf(todayKey());
  const left = daysLeftInQuarter(todayKey());

  const onLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="shell">
      <aside className="sidebar">
        <Brand />
        <nav className="nav" aria-label="Primary">
          <div className="nav-section">{user.role === 'BDA' ? 'Sales associate' : 'Manager'}</div>
          {items.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className="nav-link">
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-spacer" />
        <div className="sidebar-note">
          <strong>
            Q{quarter} {year} closes in {left} {left === 1 ? 'day' : 'days'}
          </strong>
          Whoever is top three on the last day goes up on the notice board.
        </div>
        <div className="sidebar-user">
          <Avatar name={user.name} id={user.id} size={34} />
          <div className="who">
            <strong>{user.name}</strong>
            <span>{user.email}</span>
          </div>
          <button className="icon-btn" onClick={onLogout} title="Sign out" aria-label="Sign out">
            <LogOut size={17} />
          </button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="topbar-left">
            <span className="role-pill">{user.role}</span>
            <span className="topbar-title">{user.role === 'BDA' ? 'Sales Associate Portal' : 'Manager Portal'}</span>
          </div>
          <div className="topbar-right">
            <span className="stamp col-md">{fmtDayLong(todayKey())}</span>
            <button className="icon-btn" onClick={toggle} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} aria-label="Toggle theme">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="icon-btn" onClick={onLogout} title="Sign out" aria-label="Sign out">
              <LogOut size={18} />
            </button>
            <Avatar name={user.name} id={user.id} size={32} />
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>

      <nav className="bottom-nav" aria-label="Primary">
        {items.map(({ to, label, short, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className="nav-link" title={label}>
            <Icon size={19} />
            {short || label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
