import { Routes, Route, Navigate, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import Login from './pages/Login.jsx';
import Stalls from './pages/Stalls.jsx';
import StallDetail from './pages/StallDetail.jsx';
import Staff from './pages/Staff.jsx';
import Manage from './pages/Manage.jsx';
import Analytics from './pages/Analytics.jsx';

function Protected({ roles, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function Layout() {
  const { user, logout } = useAuth();
  const isStaff = ['staff', 'admin'].includes(user.role);
  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <NavLink to="/" className="brand">CanteenLive</NavLink>
          <nav>
            <NavLink to="/" end>Stalls</NavLink>
            {isStaff && <NavLink to="/staff">Queue counter</NavLink>}
            {isStaff && <NavLink to="/manage">Manage</NavLink>}
            {isStaff && <NavLink to="/analytics">Analytics</NavLink>}
          </nav>
          <div className="who">
            <span>{user.name} <em>({user.role})</em></span>
            <button className="btn ghost small" onClick={logout}>Log out</button>
          </div>
        </div>
      </header>
      <main className="container"><Outlet /></main>
    </>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Protected><Layout /></Protected>}>
        <Route index element={<Stalls />} />
        <Route path="stall/:id" element={<StallDetail />} />
        <Route path="staff" element={<Protected roles={['staff', 'admin']}><Staff /></Protected>} />
        <Route path="manage" element={<Protected roles={['staff', 'admin']}><Manage /></Protected>} />
        <Route path="analytics" element={<Protected roles={['staff', 'admin']}><Analytics /></Protected>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
