import { useState } from 'react';
import { AlertCircle, Check, Flame, Info, UserPlus } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { api } from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import { Card, PageHeader, Person, SearchInput, Skeleton } from '../../components/ui';
import { fmtMonthYear, fmtNum } from '../../utils/format';

/** Work addresses follow firstname.lastname@ — save the manager the typing. */
const suggestEmail = (name) => {
  const parts = name.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!parts.length) return '';
  return `${parts.slice(0, 2).join('.')}@salesarena.io`;
};

const randomPassword = () => {
  const words = ['river', 'copper', 'ladder', 'ember', 'quartz', 'harbor', 'cedar', 'lantern'];
  return `${words[Math.floor(Math.random() * words.length)]}-${Math.floor(1000 + Math.random() * 9000)}`;
};

export default function ManageAssociates() {
  const toast = useToast();
  const [reload, setReload] = useState(0);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [touchedEmail, setTouchedEmail] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState(null);
  const [busy, setBusy] = useState(false);

  const { data, loading } = useApi(() => api.listBdas(), [reload]);

  const setName = (name) => setForm((f) => ({ ...f, name, email: touchedEmail ? f.email : suggestEmail(name) }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const { user } = await api.createBda(form);
      setCreated({ ...user, password: form.password });
      toast.push({ tone: 'success', title: `${user.name} added`, message: 'They can sign in as a BDA straight away.' });
      setForm({ name: '', email: '', password: '' });
      setTouchedEmail(false);
      setReload((n) => n + 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const q = search.trim().toLowerCase();
  const rows = (data?.entries || []).filter(
    (r) => !q || r.bda.name.toLowerCase().includes(q) || r.bda.email.toLowerCase().includes(q),
  );

  return (
    <>
      <PageHeader
        title="Associates"
        description="Create portal accounts and keep an eye on the roster. Everyone competes as an individual."
        actions={data && <span className="chip chip-neutral chip-lg">{data.entries.length} accounts</span>}
      />

      <div className="grid grid-main-side">
        <Card title="Roster" subtitle="All-time totals across every cycle" flush>
          <div style={{ padding: '16px 20px 8px' }}>
            <SearchInput value={search} onChange={setSearch} placeholder="Find an associate" style={{ maxWidth: 320 }} />
          </div>
          {!data ? (
            <div style={{ padding: 20 }}>
              <Skeleton h={220} style={{ borderRadius: 12 }} />
            </div>
          ) : (
            <div className="table-wrap" style={{ opacity: loading ? 0.6 : 1, transition: 'opacity .2s' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Associate</th>
                    <th className="r">Rank</th>
                    <th className="r">Points</th>
                    <th className="r col-md">Calls</th>
                    <th className="r col-md">Won</th>
                    <th className="r col-sm">Streak</th>
                    <th className="r col-md">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.bda.id}>
                      <td>
                        <Person name={r.bda.name} id={r.bda.id} meta={r.bda.email} size={32} />
                      </td>
                      <td className="r num">{r.points ? `#${r.rank}` : '—'}</td>
                      <td className="r points-cell num">{fmtNum(r.points)}</td>
                      <td className="r num col-md">{fmtNum(r.calls)}</td>
                      <td className="r col-md">
                        <span className="chip chip-good">+{r.leadsWon}</span>
                      </td>
                      <td className="r col-sm">
                        <span className="row" style={{ justifyContent: 'flex-end', gap: 4 }}>
                          <Flame size={13} color={r.streak ? '#ff7a2e' : 'var(--muted)'} />
                          <span className="num">{r.streak}</span>
                        </span>
                      </td>
                      <td className="r num col-md">{r.joined ? fmtMonthYear(r.joined) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title="Add an associate" subtitle="They join today's board on zero points">
          <form onSubmit={submit} className="stack" style={{ gap: 14 }} noValidate>
            <div className="field">
              <label className="label" htmlFor="new-name">Full name</label>
              <input id="new-name" className="input" value={form.name} onChange={(e) => setName(e.target.value)} placeholder="Ravi Kumar" required />
            </div>
            <div className="field">
              <label className="label" htmlFor="new-email">Work email</label>
              <input
                id="new-email"
                className="input"
                type="email"
                value={form.email}
                onChange={(e) => {
                  setTouchedEmail(true);
                  setForm((f) => ({ ...f, email: e.target.value }));
                }}
                placeholder="ravi.kumar@salesarena.io"
                required
              />
              <span className="hint">Filled in from the name — edit it if theirs is different.</span>
            </div>
            <div className="field">
              <label className="label" htmlFor="new-pass">Temporary password</label>
              <div className="row" style={{ gap: 8 }}>
                <input id="new-pass" className="input" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder="At least 6 characters" required />
                <button type="button" className="btn btn-sm" onClick={() => setForm((f) => ({ ...f, password: randomPassword() }))}>
                  Generate
                </button>
              </div>
            </div>

            {error && (
              <div className="form-error" role="alert">
                <AlertCircle size={16} style={{ flex: 'none', marginTop: 1 }} />
                {error}
              </div>
            )}

            <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
              <UserPlus size={16} />
              {busy ? 'Creating…' : 'Create account'}
            </button>

            {created && (
              <div className="form-ok">
                <Check size={16} style={{ flex: 'none', marginTop: 1 }} />
                <span>
                  <b>{created.name}</b> is set up. Sign-in: <code>{created.email}</code> / <code>{created.password}</code> — pass it on and
                  ask them to change it.
                </span>
              </div>
            )}

            <div className="form-note">
              <Info size={14} style={{ verticalAlign: '-2px', marginRight: 6 }} />
              New accounts start with no history, so they sit at the bottom of the board until their first calls
              and leads come in. Their first sign-in begins a streak.
            </div>
          </form>
        </Card>
      </div>
    </>
  );
}
