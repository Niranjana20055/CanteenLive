import crypto from 'node:crypto';
import { getDb } from '../db/mongo.js';
import { HttpError } from '../utils/errors.js';

export const stalls = () => getDb().collection('stalls');

const makeHours = (wd, we) => {
  const days = {};
  for (const d of ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']) days[d] = { open: wd[0], close: wd[1] };
  for (const d of ['saturday', 'sunday']) days[d] = { open: we[0], close: we[1] };
  return days;
};

/* ---------------- READ ---------------- */
export const getStall = (id) => stalls().findOne({ _id: id });
export const listStalls = () => stalls().find({}).sort({ _id: 1 }).toArray();

// Full-text search over stall name + menu item names (uses the text index)
export const searchStalls = (q) =>
  stalls()
    .find({ $text: { $search: q } }, { projection: { score: { $meta: 'textScore' } } })
    .sort({ score: { $meta: 'textScore' } })
    .toArray();

/* ---------------- CREATE ---------------- */
export async function createStall(input) {
  const doc = {
    _id: `stall_${crypto.randomBytes(3).toString('hex')}`,
    name: input.name,
    location: input.location,
    menu: input.menu ?? [],
    hours: input.hours ?? makeHours(['08:00', '20:00'], ['09:00', '18:00']),
    avg_service_time: input.avg_service_time,
    active_counters: input.active_counters ?? 1,
    created_at: new Date(),
  };
  await stalls().insertOne(doc);
  return doc;
}

export async function addMenuItem(stallId, { name, price }) {
  const item = { item_id: `item_${crypto.randomBytes(3).toString('hex')}`, name, price, available: true };
  const r = await stalls().updateOne({ _id: stallId }, { $push: { menu: item } }); // $push = append to array
  if (r.matchedCount === 0) throw new HttpError(404, 'Stall not found');
  return item;
}

/* ---------------- UPDATE ---------------- */
export async function updateStall(id, fields) {
  const allowed = ['name', 'location', 'avg_service_time', 'active_counters', 'hours'];
  const $set = {};
  for (const key of allowed) if (fields[key] !== undefined) $set[key] = fields[key];
  if (Object.keys($set).length === 0) throw new HttpError(400, 'Nothing to update');
  const r = await stalls().updateOne({ _id: id }, { $set });
  if (r.matchedCount === 0) throw new HttpError(404, 'Stall not found');
}

// "menu.$.price" = the "$" means "the array element that matched 'menu.item_id'"
export async function updateMenuItem(stallId, itemId, fields) {
  const $set = {};
  if (fields.available !== undefined) $set['menu.$.available'] = fields.available;
  if (fields.price !== undefined) $set['menu.$.price'] = fields.price;
  if (fields.name !== undefined) $set['menu.$.name'] = fields.name;
  if (Object.keys($set).length === 0) throw new HttpError(400, 'Nothing to update');
  const r = await stalls().updateOne({ _id: stallId, 'menu.item_id': itemId }, { $set });
  if (r.matchedCount === 0) throw new HttpError(404, 'Stall or menu item not found');
}

/* ---------------- DELETE ---------------- */
export const deleteStall = async (id) => (await stalls().deleteOne({ _id: id })).deletedCount;

export async function deleteMenuItem(stallId, itemId) {
  const r = await stalls().updateOne({ _id: stallId }, { $pull: { menu: { item_id: itemId } } }); // $pull = remove from array
  if (r.matchedCount === 0) throw new HttpError(404, 'Stall not found');
  if (r.modifiedCount === 0) throw new HttpError(404, 'Menu item not found');
}
