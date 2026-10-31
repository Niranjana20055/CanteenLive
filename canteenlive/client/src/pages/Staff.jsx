import { useEffect, useState, useCallback } from 'react';
import api, { errMsg } from '../api.js';
import { socket } from '../socket.js';
import { useAuth } from '../AuthContext.jsx';
import { Notice, QueueStrip, waitLevel, fmtTime } from '../components.jsx';

export default function Staff() {
  const { user } = useAuth();
  const [stallId, setStallId] = useState(user.stall_id); // staff: fixed. admin: choose below
  const [options, setOptions] = useState([]);
  const [live, setLive] = useState(null);
  const [history, setHistory] = useState([]);
  const [setValue, setSetValue] = useState('');
  const [note, setNote] = useState(null);

  // admin needs the list of stalls to pick from
  useEffect(() => {
    if (user.role !== 'admin') return;
    api.get('/queue').then((r) => {
      setOptions(r.data);
      setStallId((cur) => cur || r.data[0]?.stall_id || null);
    });
  }, [user.role]);

  const load = useCallback(async () => {
    if (!stallId) return;
    try {
      const [l, h] = await Promise.all([api.get(`/queue/${stallId}`), api.get(`/queue/${stallId}/history`)]);
      setLive(l.data);
      setHistory(h.data);
    } catch (e) {
      setNote({ type: 'error', text: errMsg(e) });
    }
  }, [stallId]);

  useEffect(() => {
    load();
    const onUpdate = (u) => {
      if (u.stall_id === stallId) {
        setLive((p) => p && { ...p, queue_length: u.queue_length, estimated_wait_minutes: u.estimated_wait_minutes });
        load(); // refresh history too
      }
    };
    socket.on('queue:update', onUpdate);
    return () => socket.off('queue:update', onUpdate);
  }, [stallId, load]);

  const adjust = async (action, value) => {
    setNote(null);
    try {
      await api.patch(`/queue/${stallId}`, { action, value });
      if (action === 'set') setSetValue('');
    } catch (e) {
      setNote({ type: 'error', text: errMsg(e) });
    }
  };

  if (!stallId) return <p className="muted">No stall assigned to this account.</p>;
  if (!live) return <><Notice note={note} /><p className="muted">Loading...</p></>;
  const level = waitLevel(live.estimated_wait_minutes);

  return (
    <>
      <h2>Queue counter - {live.name}</h2>
      {user.role === 'admin' && (
        <label className="inline">Stall
          <select value={stallId} onChange={(e) => { setLive(null); setStallId(e.target.value); }}>
            {options.map((o) => <option key={o.stall_id} value={o.stall_id}>{o.name}</option>)}
          </select>
        </label>
      )}

      <div className={`card detail ${level}`}>
        <div className="wait big">
          <span className="wait-num">{live.queue_length}</span>
          <span className="wait-unit">in queue - about {live.estimated_wait_minutes} min wait</span>
        </div>
        <QueueStrip length={live.queue_length} level={level} />

        <div className="counter-buttons">
          <button className="btn round" onClick={() => adjust('dec')} aria-label="One person left">-1</button>
          <button className="btn round primary" onClick={() => adjust('inc')} aria-label="One person joined">+1</button>
        </div>

        <form className="set-row" onSubmit={(e) => { e.preventDefault(); adjust('set', parseInt(setValue, 10)); }}>
          <label>Correct the count to what you can see
            <input type="number" min="0" max="500" value={setValue} onChange={(e) => setSetValue(e.target.value)} placeholder="e.g. 13" required />
          </label>
          <button className="btn">Set count</button>
        </form>
        <Notice note={note} />
      </div>

      <section className="card">
        <h3>Recent activity</h3>
        {history.length === 0 && <p className="muted">Nothing yet.</p>}
        <ul className="menu">
          {history.map((e) => (
            <li key={e._id}>
              <span>{e.type.replace('_', ' ').toLowerCase()} {e.type === 'STAFF_SET' && `(${e.previous_length} to ${e.new_length})`}</span>
              <span className="muted">{fmtTime(e.timestamp)}</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
