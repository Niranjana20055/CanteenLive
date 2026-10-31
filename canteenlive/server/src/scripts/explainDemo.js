import { connectMongo, closeMongo } from '../db/mongo.js';
import { dailyFootfallPipeline } from '../repos/analyticsRepo.js';

const db = await connectMongo();
const events = db.collection('queue_events');

// find a value under `key` anywhere inside a nested explain() result
function deepFind(o, key) {
  if (o && typeof o === 'object') {
    if (key in o) return o[key];
    for (const v of Object.values(o)) {
      const f = deepFind(v, key);
      if (f !== undefined) return f;
    }
  }
  return undefined;
}
// list the stage names of a plan, e.g. ['LIMIT','FETCH','IXSCAN']
function stages(p) {
  if (!p || typeof p !== 'object') return [];
  const own = p.stage ? [p.stage] : [];
  const kids = [p.inputStage, p.queryPlan, ...(p.inputStages ?? [])].filter(Boolean).flatMap(stages);
  return [...own, ...kids];
}
function summary(explain) {
  return {
    stages: stages(deepFind(explain, 'winningPlan')).join(' > '),
    index_used: deepFind(explain, 'indexName') ?? '(none)',
    docs_examined: deepFind(explain, 'totalDocsExamined'),
    docs_returned: deepFind(explain, 'nReturned'),
    time_ms: deepFind(explain, 'executionTimeMillis'),
  };
}

const total = await events.countDocuments();
console.log(`queue_events holds ${total} documents\n`);

// ---- Test 1: "latest check-ins of stall_001 in the last 7 days"
const since = new Date(Date.now() - 7 * 24 * 3600 * 1000);
const q = { stall_id: 'stall_001', timestamp: { $gte: since } };
const make = () => events.find(q).sort({ timestamp: -1 }).limit(50);

const before1 = await make().hint({ $natural: 1 }).explain('executionStats'); // $natural:1 = force a full collection scan
const after1 = await make().explain('executionStats');                          // no hint = MongoDB picks the best index
console.log('TEST 1  find({stall_id, timestamp >= 7 days ago}).sort({timestamp:-1}).limit(50)');
console.table({ 'WITHOUT index (forced scan)': summary(before1), 'WITH index': summary(after1) });

// ---- Test 2: the daily-footfall aggregation
const pipeline = dailyFootfallPipeline(7);
const before2 = await events.aggregate(pipeline, { hint: { $natural: 1 } }).explain('executionStats');
const after2 = await events.aggregate(pipeline).explain('executionStats');
console.log('\nTEST 2  aggregate: daily footfall for the last 7 days');
console.table({ 'WITHOUT index (forced scan)': summary(before2), 'WITH index': summary(after2) });

await closeMongo();
