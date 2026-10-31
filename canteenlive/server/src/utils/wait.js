// Estimated Wait = Queue Length x Average Service Time / Active Counters   (Review 1, section 4.4)
export function estimateWait(queueLength, avgServiceTime = 3, activeCounters = 1) {
  const counters = Math.max(Number(activeCounters) || 1, 1); // never divide by 0
  return Math.round((queueLength * avgServiceTime) / counters);
}
