import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);
const SESSION_KEY = 'srr.session';

function readSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readSession);
  const rewardRef = useRef(null);

  const login = useCallback(async (credentials) => {
    const { user: u, reward } = await api.login(credentials);
    rewardRef.current = reward;
    setUser(u);
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(u));
    } catch {
      /* ignore */
    }
    return u;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    rewardRef.current = null;
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
    api.logout();
  }, []);

  /** Returns the pending login reward once, then clears it. */
  const consumeLoginReward = useCallback(() => {
    const r = rewardRef.current;
    rewardRef.current = null;
    return r;
  }, []);

  const value = useMemo(() => ({ user, login, logout, consumeLoginReward }), [user, login, logout, consumeLoginReward]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
