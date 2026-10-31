import { useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { errMsg } from '../api.js';
import { socket } from '../socket.js';
import { useAuth } from '../AuthContext.jsx';
import { QueueStrip, Notice, waitLevel } from '../components.jsx';

export default function StallDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const canQueue = ['student', 'admin'].includes(user.role);

  const [live, setLive] = useState(null);   // queue numbers (Redis + Mongo)
  const [stall, setStall] = useState(null); // menu + hours (MongoDB)
  const [mine, setMine] = useState(null);   // the stall I'm currently checked in at
  const [note, setNote] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [l, s] = await Promise.all([api.get(`/queue/${id}`), api.get(`/stalls/${id}`)]);
      setLive(l.data);
      setStall(s.data);
      if (canQueue) setMine((await api.get('/queue/me')).data.stall_id);
    } catch (e) {
      setNote({ type: 'error', text: errMsg(e) });
    }
  }, [id, canQueue]);

  useEffect(() => {
    load();
    const onUpdate = (u) => {
      if (u.stall_id === id) setLive((p) => p && { ...p, queue_length: u.queue_length, estimated_wait_minutes: u.estimated_wait_minutes });
    };
    socket.on('queue:update', onUpdate);
    return () => socket.off('queue:update', onUpdate);
  }, [id, load]);

  const act = async (fn, okText) => {
    setBusy(true);
    setNote(null);
    try {
      await fn();
      setNote({ type: 'ok', text: okText });
      setMine((await api.get('/queue/me')).data.stall_id);
    } catch (e) {
      setNote({ type: 'error', text: errMsg(e) });
    } finally {
      setBusy(false);
    }
  };

  if (!live || !stall) return <><Notice note={note} /><p className="muted">Loading...</p></>;
  const level = waitLevel(live.estimated_wait_minutes);
  const here = mine === id;

  return (
    <>
      <Link to="/" className="back">All stalls</Link>
      <div className={`card detail ${level}`}>
        <div className="stall-head">
          <h2>{stall.name}</h2>
          <span className={`badge ${live.is_open ? 'open' : 'closed'}`}>{live.is_open ? 'Open' : 'Closed'}</span>
        </div>
        <p className="muted">{stall.location}</p>

        <div className="wait big">
          <span className="wait-num">{live.estimated_wait_minutes}</span>
          <span className="wait-unit">min estimated wait</span>
        </div>
        <QueueStrip length={live.queue_length} level={level} />
        <p className="small muted">
          {live.queue_length} in queue - {live.avg_service_time} min per person - {live.active_counters} counter{live.active_counters > 1 ? 's' : ''}
        </p>

        <Notice note={note} />
        {canQueue && (
          <div className="actions">
            {here ? (
              <button className="btn primary" disabled={busy} onClick={() => act(() => api.post('/queue/checkout'), 'You left the queue.')}>
                Check out (I was served / I left)
              </button>
            ) : (
              <button className="btn primary" disabled={busy || (mine && !here)}
                onClick={() => act(() => api.post(`/queue/${id}/checkin`), 'You joined the queue.')}>
                Check in - I am joining this queue
              </button>
            )}
            {mine && !here && <p className="small muted">You are checked in at another stall ({mine}). Check out there first.</p>}
            {here && <p className="small">You are in this queue.</p>}
          </div>
        )}
      </div>

      <div className="two-col">
        <section className="card">
          <h3>Menu</h3>
          {stall.menu.length === 0 && <p className="muted">No items listed.</p>}
          <ul className="menu">
            {stall.menu.map((m) => (
              <li key={m.item_id} className={m.available ? '' : 'off'}>
                <span>{m.name}</span>
                <span>{m.available ? `Rs ${m.price}` : 'Not available'}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="card">
          <h3>Opening hours</h3>
          <ul className="menu">
            {Object.entries(stall.hours).map(([day, h]) => (
              <li key={day}><span className="cap">{day}</span><span>{h.open} - {h.close}</span></li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
