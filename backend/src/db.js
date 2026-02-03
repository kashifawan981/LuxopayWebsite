import sqlite3 from 'sqlite3';
import { promisify } from 'node:util';

const db = new sqlite3.Database('luxopay.sqlite');

const run = promisify(db.run.bind(db));
const get = promisify(db.get.bind(db));
const all = promisify(db.all.bind(db));

export async function initializeDatabase() {
  await run(
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    )`
  );

  await run(
    `CREATE TABLE IF NOT EXISTS payment_events (
      id TEXT PRIMARY KEY,
      provider TEXT NOT NULL,
      provider_reference TEXT,
      amount INTEGER NOT NULL,
      currency TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      user_id TEXT,
      metadata TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`
  );
}

export async function createUser({ id, name, email, passwordHash, createdAt }) {
  await run(
    `INSERT INTO users (id, name, email, password_hash, created_at)
     VALUES (?, ?, ?, ?, ?)`
    ,
    [id, name, email, passwordHash, createdAt]
  );
}

export async function findUserByEmail(email) {
  return get('SELECT * FROM users WHERE email = ?', [email]);
}

export async function findUserById(id) {
  return get('SELECT id, name, email, created_at FROM users WHERE id = ?', [id]);
}

export async function recordPaymentEvent({
  id,
  provider,
  providerReference,
  amount,
  currency,
  status,
  createdAt,
  userId,
  metadata,
}) {
  await run(
    `INSERT INTO payment_events
      (id, provider, provider_reference, amount, currency, status, created_at, user_id, metadata)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ,
    [
      id,
      provider,
      providerReference,
      amount,
      currency,
      status,
      createdAt,
      userId,
      metadata,
    ]
  );
}

export async function listPaymentsForUser(userId) {
  return all(
    `SELECT id, provider, provider_reference, amount, currency, status, created_at
     FROM payment_events
     WHERE user_id = ?
     ORDER BY created_at DESC`,
    [userId]
  );
}

export default db;
