import { DatabaseSync } from "node:sqlite";
import { mkdirSync, chmodSync } from "node:fs";
import path from "node:path";
import { randomBytes, scrypt, timingSafeEqual, createHash } from "node:crypto";
import { promisify } from "node:util";
const derive = promisify(scrypt);
export const defaults = {
  announcement: "The next chapter starts with us.",
  contractAddress: "",
  communityUrl: "",
  tokenOwner: "",
  network: "testnet",
};
export function openStore(directory = process.env.DATA_DIR || "./data") {
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  const filename = path.join(directory, "amber.sqlite");
  const db = new DatabaseSync(filename);
  chmodSync(filename, 0o600);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS admins (username TEXT PRIMARY KEY, password_hash TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, username TEXT NOT NULL, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY CHECK(id=1), value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS login_attempts (key TEXT PRIMARY KEY, count INTEGER NOT NULL, resets INTEGER NOT NULL);`);
  db.prepare("INSERT OR IGNORE INTO settings (id,value) VALUES (1,?)").run(
    JSON.stringify(defaults),
  );
  return db;
}
export async function passwordHash(password) {
  const salt = randomBytes(16).toString("hex");
  const key = await derive(password, salt, 64);
  return `${salt}:${key.toString("hex")}`;
}
export async function passwordMatches(password, stored) {
  const [salt, hash] = stored.split(":");
  const key = await derive(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return expected.length === key.length && timingSafeEqual(key, expected);
}
export const digest = (value) =>
  createHash("sha256").update(value).digest("hex");
export function readSettings(db) {
  return {
    ...defaults,
    ...JSON.parse(
      db.prepare("SELECT value FROM settings WHERE id=1").get().value,
    ),
  };
}
