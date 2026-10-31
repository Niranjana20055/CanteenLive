import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../api.js';
import { socket } from '../socket.js';
import { QueueStrip, Notice, waitLevel } from '../components.jsx';

export default function Stalls() {
  const [stalls, setStalls] = useState(null);
  const [note, setNote] = useState(null);

  useEffect(() => {
    api.get('/queue').then((r) => setStalls(r.data)).catch((e) => setNote({ type: 'error', text: errMsg(e) }));

    // live push from the server: change just the stall that changed
    const onUpdate = (u) =>
      setStalls((prev) =>
        prev?.map((s) =>
          s.stall_id === u.stall_id
            ? { ...s, queue_length: u.queue_length, estimated_wait_minutes: u.estimated_wait_minutes }
            : s
        )
      );
    socket.on('queue:update', onUpdate);
    return () => socket.off('queue:update', onUpdate);
  }, []);

  if (!stalls) return <><Notice note={note} />{!note && <p className="muted">Loading stalls...</p>}</>;
  if (stalls.length === 0) return <p className="muted">No stalls yet. Ask the admin to add one.</p>;

  // the fastest stall among the open ones (or among all if none is open)
  const pool = stalls.some((s) => s.is_open) ? stalls.filter((s) => s.is_open) : stalls;
  const best = pool.reduce((a, b) => (b.estimated_wait_minutes < a.estimated_wait_minutes ? b : a));

  return (
    <>
      <h2>Food stalls</h2>
      <p className="muted">Updates appear live - no need to refresh.</p>
      <div className="grid">
        {stalls.map((s) => {
          const level = waitLevel(s.estimated_wait_minutes);
          return (
            <Link key={s.stall_id} to={`/stall/${s.stall_id}`} className={`card stall ${level}`}>
              <div className="stall-head">
                <h3>{s.name}</h3>
                <span className={`badge ${s.is_open ? 'open' : 'closed'}`}>{s.is_open ? 'Open' : 'Closed'}</span>
              </div>
              <p className="muted small">{s.location}</p>
              <div className="wait">
                <span className="wait-num">{s.estimated_wait_minutes}</span>
                <span className="wait-unit">min wait</span>
                {s.stall_id === best.stall_id && <span className="badge fastest">Fastest now</span>}
              </div>
              <QueueStrip length={s.queue_length} level={level} />
              <p className="small muted">{s.queue_length} in queue - {s.active_counters} counter{s.active_counters > 1 ? 's' : ''}</p>
            </Link>
          );
        })}
      </div>
    </>
  );
}
