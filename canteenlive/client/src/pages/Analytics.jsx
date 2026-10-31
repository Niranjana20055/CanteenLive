import { useEffect, useState } from 'react';
import api, { errMsg } from '../api.js';
import { Notice } from '../components.jsx';

// Each card = one MongoDB aggregation pipeline (server/src/repos/analyticsRepo.js)
const REPORTS = [
  { path: '/analytics/estimate-accuracy', title: 'Estimate accuracy',
    text: 'Wait shown at check-in versus the time students really spent in the queue (minutes).' },
  { path: '/analytics/peak-hours', title: 'Peak hour per stall',
    text: 'The busiest hour of the day for every stall (24-hour clock, IST).' },
  { path: '/analytics/daily-footfall?days=7', title: 'Daily footfall - last 7 days',
    text: 'Number of check-ins per stall per day.' },
  { path: '/analytics/menu-stats', title: 'Menu statistics',
    text: 'Items, availability and prices per stall (unwinds the embedded menu array).' },
  { path: '/analytics/staff-corrections', title: 'Staff corrections',
    text: 'How often staff had to fix the digital count, and by how many people on average.' },
];

const heading = (key) => key.replaceAll('_', ' ');

function Table({ rows }) {
  if (!rows.length) return <p className="muted">No data yet.</p>;
  const cols = Object.keys(rows[0]);
  return (
    <div className="table-wrap">
      <table>
        <thead><tr>{cols.map((c) => <th key={c}>{heading(c)}</th>)}</tr></thead>
        <tbody>
          {rows.map((r, i) => <tr key={i}>{cols.map((c) => <td key={c}>{String(r[c] ?? '-')}</td>)}</tr>)}
        </tbody>
      </table>
    </div>
  );
}

export default function Analytics() {
  const [data, setData] = useState({});
  const [note, setNote] = useState(null);

  useEffect(() => {
    Promise.all(REPORTS.map((r) => api.get(r.path)))
      .then((res) => setData(Object.fromEntries(REPORTS.map((r, i) => [r.path, res[i].data]))))
      .catch((e) => setNote({ type: 'error', text: errMsg(e) }));
  }, []);

  return (
    <>
      <h2>Analytics</h2>
      <p className="muted">Live results of the five MongoDB aggregation queries.</p>
      <Notice note={note} />
      {REPORTS.map((r) => (
        <section className="card" key={r.path}>
          <h3>{r.title}</h3>
          <p className="muted small">{r.text}</p>
          {data[r.path] ? <Table rows={data[r.path]} /> : !note && <p className="muted">Loading...</p>}
        </section>
      ))}
    </>
  );
}
