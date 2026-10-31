import { useEffect, useState, useCallback } from 'react';
import api, { errMsg } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import { Notice } from '../components.jsx';

// This page demonstrates CRUD on the MongoDB "stalls" collection.
export default function Manage() {
  const { user } = useAuth();
  const isAdmin = user.role === 'admin';

  const [list, setList] = useState([]);       // READ  all stalls
  const [stallId, setStallId] = useState(isAdmin ? null : user.stall_id);
  const [stall, setStall] = useState(null);
  const [note, setNote] = useState(null);

  const [settings, setSettings] = useState({ avg_service_time: '', active_counters: '' });
  const [newItem, setNewItem] = useState({ name: '', price: '' });
  const [newStall, setNewStall] = useState({ name: '', location: '', avg_service_time: '3' });

  const loadList = useCallback(async () => {
    const r = await api.get('/stalls');
    setList(r.data);
    setStallId((cur) => cur ?? r.data[0]?._id ?? null);
  }, []);

  const loadStall = useCallback(async () => {
    if (!stallId) return setStall(null);
    try {
      const s = (await api.get(`/stalls/${stallId}`)).data;
      setStall(s);
      setSettings({ avg_service_time: s.avg_service_time, active_counters: s.active_counters });
    } catch (e) {
      setStall(null);
      setNote({ type: 'error', text: errMsg(e) });
    }
  }, [stallId]);

  useEffect(() => { loadList().catch((e) => setNote({ type: 'error', text: errMsg(e) })); }, [loadList]);
  useEffect(() => { loadStall(); }, [loadStall]);

  // run any API call, show the result, reload the data
  const run = async (fn, okText, after) => {
    setNote(null);
    try {
      await fn();
      setNote({ type: 'ok', text: okText });
      if (after) await after(); else await loadStall();
    } catch (e) {
      setNote({ type: 'error', text: errMsg(e) });
    }
  };

  const saveSettings = (e) => {
    e.preventDefault();
    run(() => api.patch(`/stalls/${stallId}`, {
      avg_service_time: Number(settings.avg_service_time),
      active_counters: parseInt(settings.active_counters, 10),
    }), 'Stall settings updated.');                                                        // UPDATE
  };
  const addItem = (e) => {
    e.preventDefault();
    run(() => api.post(`/stalls/${stallId}/menu`, { name: newItem.name, price: Number(newItem.price) }), 'Menu item added.',
      async () => { setNewItem({ name: '', price: '' }); await loadStall(); });             // CREATE
  };
  const toggle = (m) => run(() => api.patch(`/stalls/${stallId}/menu/${m.item_id}`, { available: !m.available }), 'Availability changed.'); // UPDATE
  const changePrice = (m) => {
    const p = window.prompt(`New price for ${m.name}`, m.price);
    if (p !== null && p.trim() !== '') run(() => api.patch(`/stalls/${stallId}/menu/${m.item_id}`, { price: Number(p) }), 'Price updated.');
  };
  const removeItem = (m) => window.confirm(`Delete ${m.name}?`) &&
    run(() => api.delete(`/stalls/${stallId}/menu/${m.item_id}`), 'Menu item deleted.');    // DELETE

  const addStall = (e) => {
    e.preventDefault();
    run(async () => {
      const r = await api.post('/stalls', { name: newStall.name, location: newStall.location, avg_service_time: Number(newStall.avg_service_time) }); // CREATE
      setStallId(r.data._id);
    }, 'Stall created.', async () => { setNewStall({ name: '', location: '', avg_service_time: '3' }); await loadList(); });
  };
  const removeStall = () => window.confirm(`Delete the whole stall "${stall.name}"?`) &&
    run(() => api.delete(`/stalls/${stallId}`), 'Stall deleted.', async () => { setStallId(null); await loadList(); }); // DELETE

  return (
    <>
      <h2>Manage stall data</h2>
      <Notice note={note} />

      {isAdmin && (
        <label className="inline">Stall
          <select value={stallId ?? ''} onChange={(e) => setStallId(e.target.value)}>
            {list.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
        </label>
      )}

      {stall && (
        <>
          <form className="card form-row" onSubmit={saveSettings}>
            <h3>Settings for {stall.name}</h3>
            <label>Average service time (minutes per person)
              <input type="number" step="0.5" min="0.5" max="60" required value={settings.avg_service_time}
                onChange={(e) => setSettings({ ...settings, avg_service_time: e.target.value })} />
            </label>
            <label>Active counters
              <input type="number" min="1" max="10" required value={settings.active_counters}
                onChange={(e) => setSettings({ ...settings, active_counters: e.target.value })} />
            </label>
            <button className="btn primary">Save settings</button>
          </form>

          <section className="card">
            <h3>Menu</h3>
            <ul className="menu editable">
              {stall.menu.map((m) => (
                <li key={m.item_id} className={m.available ? '' : 'off'}>
                  <span>{m.name} - Rs {m.price}</span>
                  <span className="row-actions">
                    <button className="btn small" onClick={() => toggle(m)}>{m.available ? 'Mark unavailable' : 'Mark available'}</button>
                    <button className="btn small" onClick={() => changePrice(m)}>Change price</button>
                    <button className="btn small danger" onClick={() => removeItem(m)}>Delete</button>
                  </span>
                </li>
              ))}
            </ul>
            <form className="form-row" onSubmit={addItem}>
              <label>New item name
                <input value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} required />
              </label>
              <label>Price (Rs)
                <input type="number" min="0" value={newItem.price} onChange={(e) => setNewItem({ ...newItem, price: e.target.value })} required />
              </label>
              <button className="btn">Add item</button>
            </form>
          </section>

          {isAdmin && <button className="btn danger" onClick={removeStall}>Delete this stall</button>}
        </>
      )}

      {isAdmin && (
        <form className="card form-row" onSubmit={addStall}>
          <h3>Add a new stall</h3>
          <label>Name<input value={newStall.name} onChange={(e) => setNewStall({ ...newStall, name: e.target.value })} required /></label>
          <label>Location<input value={newStall.location} onChange={(e) => setNewStall({ ...newStall, location: e.target.value })} required /></label>
          <label>Avg service time (min)
            <input type="number" step="0.5" min="0.5" value={newStall.avg_service_time} onChange={(e) => setNewStall({ ...newStall, avg_service_time: e.target.value })} required />
          </label>
          <button className="btn primary">Create stall</button>
        </form>
      )}
    </>
  );
}
