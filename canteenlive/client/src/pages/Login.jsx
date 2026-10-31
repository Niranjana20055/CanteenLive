import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import { errMsg } from '../api.js';
import { Notice } from '../components.jsx';

export default function Login() {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [regNo, setRegNo] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [note, setNote] = useState(null);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setNote(null);
    try {
      if (mode === 'login') await login(regNo, password);
      else await register(regNo, name, password);
      navigate('/');
    } catch (err) {
      setNote({ type: 'error', text: errMsg(err) });
    } finally {
      setBusy(false);
    }
  };

  const quickLogin = async (reg, pwd = 'canteen123') => {
    setRegNo(reg);
    setPassword(pwd);
    setBusy(true);
    setNote(null);
    try {
      await login(reg, pwd);
      navigate('/');
    } catch (err) {
      setNote({ type: 'error', text: errMsg(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-wrap">
      <form className="card login" onSubmit={submit}>
        <h1>CanteenLive</h1>
        <p className="muted">See the queue at every food stall before you walk over.</p>

        <label>Register number
          <input value={regNo} onChange={(e) => setRegNo(e.target.value)} placeholder="23BCE0314" required />
        </label>
        {mode === 'register' && (
          <label>Your name
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
        )}
        <label>Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>

        <Notice note={note} />
        <button className="btn primary" disabled={busy}>{mode === 'login' ? 'Log in' : 'Create account'}</button>
        <button type="button" className="link" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setNote(null); }}>
          {mode === 'login' ? 'New student? Create an account' : 'Already registered? Log in'}
        </button>

        <details className="demo-hint" open>
          <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>⚡ 1-Click Demo Personas (Instant Login)</summary>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
            <button type="button" className="btn small" onClick={() => quickLogin('23BCE0314')}>Student: Kashish</button>
            <button type="button" className="btn small" onClick={() => quickLogin('23BCE0780')}>Student: Niranjana</button>
            <button type="button" className="btn small" onClick={() => quickLogin('STAFF001')}>Staff: Burger Point</button>
            <button type="button" className="btn small" onClick={() => quickLogin('STAFF002')}>Staff: South Indian</button>
            <button type="button" className="btn small" onClick={() => quickLogin('ADMIN001')}>Admin: All Stalls</button>
          </div>
          <p style={{ marginTop: '8px', fontSize: '0.8rem', color: '#64748b' }}>Default password for all accounts: <b>canteen123</b></p>
        </details>
      </form>
    </div>
  );
}
