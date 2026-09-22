import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AlertCircle, BarChart3, Briefcase, Flame, Headset, Loader2, Pin, Timer, Trophy, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Brand } from '../components/layout/AppShell';
import { RULES } from '../config/rules';
import { api } from '../services/api';
import { daysLeftInQuarter, quarterOf, todayKey } from '../utils/format';

const DEMO = {
  BDA: { email: 'priya.sharma@salesarena.io', password: 'bda123' },
  BDM: { email: 'rahul.verma@salesarena.io', password: 'bdm123' },
};

// Short notes so the team can see what moved since they last logged in.
const CHANGES = [
  ['Sep', 'Notice board: top three of every quarter, kept on record.'],
  ['Aug', 'Managers can add associate accounts from the Associates tab.'],
  ['Jul', 'Teams retired — everyone is ranked as an individual.'],
];

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('BDA');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={user.role === 'BDA' ? '/bda' : '/bdm'} replace />;

  const { year, quarter } = quarterOf(todayKey());
  const left = daysLeftInQuarter(todayKey());

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const u = await login({ email, password, role });
      navigate(u.role === 'BDA' ? '/bda' : '/bdm', { replace: true });
    } catch (err) {
      setError(err.message || 'Unable to sign in.');
    } finally {
      setBusy(false);
    }
  };

  const fillDemo = (r) => {
    setRole(r);
    setEmail(DEMO[r].email);
    setPassword(DEMO[r].password);
    setError('');
    setNotice('');
  };

  return (
    <div className="login">
      <aside className="login-hero">
        <Brand />
        <div>
          <span className="login-cycle">
            <Timer size={14} />
            Q{quarter} {year} · {left} {left === 1 ? 'day' : 'days'} left
          </span>
          <h2 className="login-headline">Every call counts. Every quarter gets a winner.</h2>
          <p className="login-sub">
            Calls, leads and talk time are scored daily. Show up, keep your pipeline clean, and finish the
            three-month cycle in the top three to make the notice board.
          </p>
          <div className="login-features">
            <div className="login-feature">
              <i><Zap size={18} /></i>
              <div>
                <strong>+{RULES.LEAD_WON} a win, {RULES.LEAD_DROPPED} a drop</strong>
                <span>Chasing dead leads costs you as much as closing wins.</span>
              </div>
            </div>
            <div className="login-feature">
              <i><Flame size={18} /></i>
              <div>
                <strong>Streaks that build up</strong>
                <span>+{RULES.LOGIN_BASE} for signing in, growing 5 a day while the run holds.</span>
              </div>
            </div>
            <div className="login-feature">
              <i><Pin size={18} /></i>
              <div>
                <strong>The notice board</strong>
                <span>Quarterly top three, on the record for the whole year.</span>
              </div>
            </div>
          </div>
        </div>
        <div className="login-foot">
          Numbers refresh through the day as calls and leads are logged.
          <br />© {new Date().getFullYear()} SalesArena · internal use only
        </div>
      </aside>

      <main className="login-panel">
        <form className="login-form" onSubmit={submit} noValidate>
          <div>
            <h1>Welcome back</h1>
            <p className="lede">Sign in to see where you stand today.</p>
          </div>

          <div className="role-switch" role="tablist" aria-label="Sign in as">
            <button type="button" role="tab" aria-selected={role === 'BDA'} className={`role-option${role === 'BDA' ? ' active' : ''}`} onClick={() => setRole('BDA')}>
              <i><Headset size={16} /></i>
              <div>
                <strong>BDA</strong>
                <span>Sales associate</span>
              </div>
            </button>
            <button type="button" role="tab" aria-selected={role === 'BDM'} className={`role-option${role === 'BDM' ? ' active' : ''}`} onClick={() => setRole('BDM')}>
              <i><Briefcase size={16} /></i>
              <div>
                <strong>BDM</strong>
                <span>Manager</span>
              </div>
            </button>
          </div>

          <div className="field">
            <label className="label" htmlFor="email">Work email</label>
            <input id="email" className="input" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@salesarena.io" required />
          </div>
          <div className="field">
            <label className="label" htmlFor="password">Password</label>
            <input id="password" className="input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>

          {error && (
            <div className="form-error" role="alert">
              <AlertCircle size={16} style={{ flex: 'none', marginTop: 1 }} />
              {error}
            </div>
          )}
          {notice && <div className="form-ok">{notice}</div>}

          <button className="btn btn-primary btn-block" type="submit" disabled={busy || !email || !password}>
            {busy ? <Loader2 size={16} className="spin" /> : <BarChart3 size={16} />}
            {busy ? 'Signing in…' : `Sign in as ${role}`}
          </button>

          <div className="demo-box">
            <strong style={{ color: 'var(--text)' }}>Demo accounts</strong> — BDAs use <code>bda123</code>, the manager uses <code>bdm123</code>.
            <div className="row">
              <button type="button" className="btn btn-sm" onClick={() => fillDemo('BDA')}>Use BDA demo</button>
              <button type="button" className="btn btn-sm" onClick={() => fillDemo('BDM')}>Use BDM demo</button>
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={async () => {
                  setError('');
                  setNotice('');
                  try {
                    await api.resetDemo();
                    setNotice('Sample data reset. Streaks and added accounts are cleared.');
                  } catch (err) {
                    setError(err.message);
                  }
                }}
                title="Clears login streaks and any accounts added in this session"
              >
                Reset demo data
              </button>
            </div>
          </div>

          <div className="changelog">
            <span className="k">Recent changes</span>
            {CHANGES.map(([month, text]) => (
              <div className="changelog-row" key={text}>
                <b>{month}</b>
                <span>{text}</span>
              </div>
            ))}
            <span className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>
              Running on sample data
            </span>
          </div>
        </form>
      </main>
    </div>
  );
}
