import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/ui/Toast';
import AppShell from './components/layout/AppShell';
import LoginPage from './pages/LoginPage';
import BdaDashboard from './pages/bda/BdaDashboard';
import BdaLeaderboard from './pages/bda/BdaLeaderboard';
import BdaActivity from './pages/bda/BdaActivity';
import NoticeBoard from './pages/NoticeBoard';
import BdmDashboard from './pages/bdm/BdmDashboard';
import BdmLeaderboard from './pages/bdm/BdmLeaderboard';
import BdmDailyReport from './pages/bdm/BdmDailyReport';
import ManageAssociates from './pages/bdm/ManageAssociates';

/** Redirects to login when signed out, or to the user's own portal when the role doesn't match. */
function RequireRole({ role, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={user.role === 'BDA' ? '/bda' : '/bdm'} replace />;
  return children;
}

function Home() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'BDA' ? '/bda' : '/bdm'} replace />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<LoginPage />} />

            <Route path="/bda" element={<RequireRole role="BDA"><AppShell /></RequireRole>}>
              <Route index element={<BdaDashboard />} />
              <Route path="leaderboard" element={<BdaLeaderboard />} />
              <Route path="notice-board" element={<NoticeBoard />} />
              <Route path="activity" element={<BdaActivity />} />
            </Route>

            <Route path="/bdm" element={<RequireRole role="BDM"><AppShell /></RequireRole>}>
              <Route index element={<BdmDashboard />} />
              <Route path="leaderboard" element={<BdmLeaderboard />} />
              <Route path="notice-board" element={<NoticeBoard />} />
              <Route path="daily" element={<BdmDailyReport />} />
              <Route path="associates" element={<ManageAssociates />} />
            </Route>

            <Route path="*" element={<Home />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
