import { getDb } from '../db/mongo.js';

const users = () => getDb().collection('users');

// CREATE
export async function createUser({ reg_no, name, role, password_hash, stall_id = null }) {
  const doc = { reg_no, name, role, password_hash, stall_id, created_at: new Date() };
  await users().insertOne(doc);
  return doc;
}

// READ
export const findByRegNo = (reg_no) => users().findOne({ reg_no });
export const listUsers = (filter = {}) =>
  users().find(filter, { projection: { password_hash: 0 } }).sort({ reg_no: 1 }).toArray();

// UPDATE
export const updateUserName = (reg_no, name) => users().updateOne({ reg_no }, { $set: { name } });

// DELETE
export const deleteUser = async (reg_no) => (await users().deleteOne({ reg_no })).deletedCount;
