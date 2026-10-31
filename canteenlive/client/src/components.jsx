// Small pieces reused by several pages.

// green = short wait, amber = medium, red = long
export const waitLevel = (minutes) => (minutes <= 10 ? 'short' : minutes <= 20 ? 'medium' : 'long');

// A row of little "people" - one dot per person in the queue (max 20 shown)
export function QueueStrip({ length, level }) {
  const shown = Math.min(length, 20);
  return (
    <div className={`strip ${level}`} aria-label={`${length} people in queue`}>
      {Array.from({ length: shown }, (_, i) => <span key={i} className="dot" />)}
      {length > 20 && <span className="more">+{length - 20}</span>}
      {length === 0 && <span className="more">Nobody waiting</span>}
    </div>
  );
}

export function Notice({ note }) {
  if (!note) return null;
  return <div className={`notice ${note.type}`} role="status">{note.text}</div>;
}

export const fmtTime = (iso) =>
  new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
