/** Real API client — talks to the Go backend (backend/). */
import { clearToken, request, setToken } from './http';

const qs = (params) => new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null)).toString();

export const httpApi = {
  async login({ email, password, role }) {
    const data = await request('/api/auth/login', { method: 'POST', body: { email, password, role }, auth: false });
    setToken(data.token);
    return { user: data.user, reward: data.reward };
  },

  async logout() {
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } catch {
      /* already signed out */
    } finally {
      clearToken();
    }
  },

  getBdaOverview: (bdaId, range = 'month') => request(`/api/bda/${bdaId}/overview?${qs({ range })}`),
  getBdaActivity: (bdaId) => request(`/api/bda/${bdaId}/activity`),
  getLeaderboard: ({ range = 'month', search = '' } = {}) => request(`/api/leaderboard?${qs({ range, q: search })}`),
  getTeamOverview: (range = 'month') => request(`/api/team/overview?${qs({ range })}`),
  getDailyReport: (date) => request(`/api/team/daily?${qs({ date })}`),
  getNoticeBoard: () => request('/api/notice-board'),

  /** Roster admin (manager only). */
  listBdas: () => request('/api/bdas'),
  createBda: ({ name, email, password }) => request('/api/bdas', { method: 'POST', body: { name, email, password } }),

  /** Ingestion — used by dialer/CRM integrations or a BDM. */
  recordCalls: (bdaId, { calls, minutes, date }) => request(`/api/bda/${bdaId}/calls`, { method: 'POST', body: { calls, minutes, date } }),
  recordLead: (bdaId, { outcome, company, date }) => request(`/api/bda/${bdaId}/leads`, { method: 'POST', body: { outcome, company, date } }),

  resetDemo: () => request('/api/demo/reset', { method: 'POST', auth: false }),
};
