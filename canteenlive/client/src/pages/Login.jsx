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

        <details className="demo-hint">
          <summary>Demo accounts (development data)</summary>
          <p>Student <b>23BCE0314</b> - Staff <b>STAFF001</b> to <b>STAFF005</b> - Admin <b>ADMIN001</b><br />Password for all: <b>canteen123</b></p>
        </details>
      </form>
    </div>
  );
}
