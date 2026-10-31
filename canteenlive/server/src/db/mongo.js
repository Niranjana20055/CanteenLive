import { MongoClient } from 'mongodb';
import { config } from '../config.js';

let client;
let db;

export async function connectMongo() {
  client = new MongoClient(config.mongoUri);
  await client.connect();
  db = client.db(config.mongoDb);
  console.log('MongoDB connected ->', config.mongoDb);
  return db;
}

export function getDb() {
  if (!db) throw new Error('MongoDB is not connected yet. Call connectMongo() first.');
  return db;
}

export async function closeMongo() {
  if (client) await client.close();
}
