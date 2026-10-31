import { getDb } from '../db/mongo.js';

const events = () => getDb().collection('queue_events');
const TZ = 'Asia/Kolkata';

// Reusable pipeline pieces: turn a stall_id into the stall's name
const addStallName = [
  { $lookup: { from: 'stalls', localField: '_id', foreignField: '_id', as: 'stall' } },
  { $unwind: { path: '$stall', preserveNullAndEmptyArrays: true } },
];
const stallName = { $ifNull: ['$stall.name', '(deleted stall)'] };

/* 1) How good is our wait estimate?  estimated wait shown at check-in  vs  real time spent in queue */
export const estimateAccuracyPipeline = [
  { $match: { type: { $in: ['CHECK_IN', 'CHECK_OUT'] } } },
  {
    $group: {
      _id: '$stall_id',
      avg_estimated_wait: { $avg: '$estimated_wait_minutes' }, // only CHECK_IN docs have this field ($avg skips missing)
      avg_actual_time: { $avg: '$duration_min' },              // only CHECK_OUT docs have this field
      check_ins: { $sum: { $cond: [{ $eq: ['$type', 'CHECK_IN'] }, 1, 0] } },
    },
  },
  ...addStallName,
  {
    $project: {
      _id: 0, stall_id: '$_id', stall_name: stallName, check_ins: 1,
      configured_service_time: '$stall.avg_service_time',
      avg_estimated_wait: { $round: ['$avg_estimated_wait', 1] },
      avg_actual_time: { $round: ['$avg_actual_time', 1] },
    },
  },
  { $sort: { stall_id: 1 } },
];

/* 2) Peak hour of every stall (busiest hour of the day, in IST) */
export const peakHoursPipeline = [
  { $match: { type: 'CHECK_IN' } },
  { $group: { _id: { stall_id: '$stall_id', hour: { $hour: { date: '$timestamp', timezone: TZ } } }, check_ins: { $sum: 1 } } },
  { $sort: { check_ins: -1 } },
  { $group: { _id: '$_id.stall_id', peak_hour: { $first: '$_id.hour' }, check_ins_in_that_hour: { $first: '$check_ins' } } },
  ...addStallName,
  { $project: { _id: 0, stall_id: '$_id', stall_name: stallName, peak_hour: 1, check_ins_in_that_hour: 1 } },
  { $sort: { stall_id: 1 } },
];

/* 3) Footfall per stall per day for the last N days */
export const dailyFootfallPipeline = (days = 7) => [
  { $match: { type: 'CHECK_IN', timestamp: { $gte: new Date(Date.now() - days * 24 * 3600 * 1000) } } },
  {
    $group: {
      _id: { stall_id: '$stall_id', day: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp', timezone: TZ } } },
      check_ins: { $sum: 1 },
    },
  },
  { $sort: { '_id.day': -1, '_id.stall_id': 1 } },
  { $project: { _id: 0, day: '$_id.day', stall_id: '$_id.stall_id', check_ins: 1 } },
];

/* 4) Menu statistics per stall (runs on the STALLS collection, unwinds the embedded menu array) */
export const menuStatsPipeline = [
  { $unwind: '$menu' },
  {
    $group: {
      _id: '$_id', stall_name: { $first: '$name' },
      total_items: { $sum: 1 },
      available_items: { $sum: { $cond: ['$menu.available', 1, 0] } },
      avg_price: { $avg: '$menu.price' },
      max_price: { $max: '$menu.price' },
    },
  },
  { $project: { _id: 0, stall_id: '$_id', stall_name: 1, total_items: 1, available_items: 1, avg_price: { $round: ['$avg_price', 1] }, max_price: 1 } },
  { $sort: { stall_id: 1 } },
];

/* 5) How often does staff have to correct the digital count, and by how much? */
export const staffCorrectionsPipeline = [
  { $match: { type: 'STAFF_SET' } },
  { $addFields: { drift: { $abs: { $subtract: ['$new_length', '$previous_length'] } } } },
  { $group: { _id: '$stall_id', corrections: { $sum: 1 }, avg_drift: { $avg: '$drift' }, max_drift: { $max: '$drift' } } },
  ...addStallName,
  { $project: { _id: 0, stall_id: '$_id', stall_name: stallName, corrections: 1, avg_drift: { $round: ['$avg_drift', 1] }, max_drift: 1 } },
  { $sort: { corrections: -1 } },
];

const run = (collection, pipeline) => collection.aggregate(pipeline).toArray();

export const estimateAccuracy = () => run(events(), estimateAccuracyPipeline);
export const peakHours = () => run(events(), peakHoursPipeline);
export const dailyFootfall = (days) => run(events(), dailyFootfallPipeline(days));
export const menuStats = () => run(getDb().collection('stalls'), menuStatsPipeline);
export const staffCorrections = () => run(events(), staffCorrectionsPipeline);
