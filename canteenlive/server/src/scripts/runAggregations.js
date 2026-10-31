import { connectMongo, closeMongo } from '../db/mongo.js';
import {
  estimateAccuracy, peakHours, dailyFootfall, menuStats, staffCorrections,
} from '../repos/analyticsRepo.js';

await connectMongo();

const show = async (title, fn) => {
  console.log(`\n=== ${title} ===`);
  console.table(await fn());
};

await show('1. Estimate accuracy (estimated wait vs real time in queue, minutes)', estimateAccuracy);
await show('2. Peak hour per stall (24h clock, IST)', peakHours);
await show('3. Daily footfall, last 3 days', () => dailyFootfall(3));
await show('4. Menu statistics per stall', menuStats);
await show('5. Staff corrections (how far the digital count drifted)', staffCorrections);

await closeMongo();
