import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createApp } from "../server/app.js";
import {
  openStore,
  passwordHash,
  digest,
  readSettings,
} from "../server/store.js";

test("admin sessions protect persistent settings and reject unsafe writes", async () => {
  const directory = mkdtempSync(path.join(tmpdir(), "bimzi-admin-"));
  const db = openStore(directory);
  await db
    .prepare("INSERT INTO admins VALUES (?,?)")
    .run("test-admin", await passwordHash("test-only-password-123"));
  const app = await createApp(db, { origin: "http://bimzi.test" });
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.on("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  let cookie = "";
  const request = (route, method = "GET", body, origin = "http://bimzi.test") =>
    fetch(`${base}/${route}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Origin: origin,
        Cookie: cookie,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  try {
    let response = await request("admin/settings", "PUT", {});
    assert.equal(response.status, 401);
    response = await request("admin/login", "POST", {
      username: "test-admin",
      password: "bad-password",
    });
    assert.equal(response.status, 401);
    response = await request(
      "admin/login",
      "POST",
      { username: "test-admin", password: "test-only-password-123" },
      "https://attacker.test",
    );
    assert.equal(response.status, 403);
    response = await request("admin/login", "POST", {
      username: "test-admin",
      password: "test-only-password-123",
    });
    assert.equal(response.status, 200);
    const setCookie = response.headers.get("set-cookie");
    assert.match(setCookie, /HttpOnly/);
    assert.match(setCookie, /SameSite=Strict/);
    cookie = setCookie.split(";")[0];
    assert.equal(
      (await (await request("admin/session")).json()).authenticated,
      true,
    );
    const settings = {
      announcement: "BIMZI community update",
      contractAddress: "",
      tokenOwner: "",
      communityUrl: "https://example.com/community",
      network: "testnet",
    };
    response = await request("admin/settings", "PUT", {
      ...settings,
      communityUrl: "javascript:alert(1)",
    });
    assert.equal(response.status, 400);
    response = await request("admin/settings", "PUT", {
      ...settings,
      contractAddress: "0x0000000000000000000000000000000000000000",
    });
    assert.equal(response.status, 400);
    response = await request(
      "admin/settings",
      "PUT",
      settings,
      "https://attacker.test",
    );
    assert.equal(response.status, 403);
    response = await request("admin/settings", "PUT", settings);
    assert.equal(response.status, 200);
    assert.equal(
      (await (await request("config")).json()).settings.announcement,
      settings.announcement,
    );
    const publishedAddress = "0x1111111111111111111111111111111111111111";
    response = await request("admin/settings", "PUT", {
      ...settings,
      contractAddress: publishedAddress,
    });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).settings.contractIdentity, "");
    response = await request("admin/settings", "PUT", {
      ...settings,
      contractAddress: publishedAddress,
      contractIdentity: "BIMZI",
    });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).settings.contractIdentity, "BIMZI");
    response = await request("admin/settings", "PUT", {
      ...settings,
      contractAddress: publishedAddress,
      contractIdentity: "wrong-token",
    });
    assert.equal(response.status, 400);
    response = await request("admin/settings", "PUT", {
      ...settings,
      contractIdentity: "BIMZI",
    });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).settings.contractIdentity, "");
    const secondDb = openStore(directory);
    assert.equal(
      JSON.parse(secondDb.prepare("SELECT value FROM settings").get().value)
        .announcement,
      settings.announcement,
    );
    secondDb.close();
    const session = db.prepare("SELECT * FROM sessions").get();
    assert.notEqual(session.token_hash, cookie.split("=")[1]);
    response = await request("admin/logout", "POST", {});
    assert.equal(response.status, 200);
    assert.equal(
      (await (await request("admin/session")).json()).authenticated,
      false,
    );
    assert.equal(
      (await request("admin/settings", "PUT", settings)).status,
      401,
    );
    db.prepare("INSERT INTO login_attempts VALUES (?,?,?)").run(
      `admin-login:${digest("test-admin")}`,
      30,
      Date.now() + 10000,
    );
    assert.equal(
      (
        await request("admin/login", "POST", {
          username: "test-admin",
          password: "test-only-password-123",
        })
      ).status,
      429,
    );
    db.prepare("INSERT INTO admins VALUES (?,?)").run(
      "other-admin",
      await passwordHash("other-test-password-123"),
    );
    assert.equal(
      (
        await request("admin/login", "POST", {
          username: "other-admin",
          password: "other-test-password-123",
        })
      ).status,
      200,
    );
    assert.equal(
      db
        .prepare("SELECT count FROM login_attempts WHERE key=?")
        .get(`admin-login:${digest("test-admin")}`).count,
      30,
    );
  } finally {
    await new Promise((resolve) => server.close(resolve));
    db.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test("production requires HTTPS and uses Secure host-only cookies", async () => {
  const directory = mkdtempSync(path.join(tmpdir(), "bimzi-prod-"));
  const db = openStore(directory);
  let server;
  try {
    await assert.rejects(() => createApp(db, { production: true }), /HTTPS/);
    db.prepare("INSERT INTO admins VALUES (?,?)").run(
      "admin",
      await passwordHash("test-production-password"),
    );
    const app = await createApp(db, {
      production: true,
      origin: "https://bimzi.example",
    });
    server = app.listen(0, "127.0.0.1");
    await new Promise((resolve) => server.on("listening", resolve));
    const response = await fetch(
      `http://127.0.0.1:${server.address().port}/api/admin/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "https://bimzi.example",
        },
        body: JSON.stringify({
          username: "admin",
          password: "test-production-password",
        }),
      },
    );
    assert.equal(response.status, 200);
    assert.match(response.headers.get("set-cookie"), /__Host-bimzi_session=/);
    assert.match(response.headers.get("set-cookie"), /Secure/);
    assert.match(
      response.headers.get("content-security-policy"),
      /frame-ancestors 'none'/,
    );
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    db.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test("rebrand retains legacy admin credentials and settings including WAL data", async () => {
  const directory = mkdtempSync(path.join(tmpdir(), "bimzi-upgrade-"));
  const legacy = new DatabaseSync(path.join(directory, "amber.sqlite"));
  let upgraded;
  try {
    legacy.exec(`PRAGMA journal_mode=WAL;
      CREATE TABLE admins (username TEXT PRIMARY KEY, password_hash TEXT NOT NULL);
      CREATE TABLE settings (id INTEGER PRIMARY KEY CHECK(id=1), value TEXT NOT NULL);`);
    const hash = await passwordHash("retained-test-password-123");
    legacy
      .prepare("INSERT INTO admins VALUES (?,?)")
      .run("existing-admin", hash);
    legacy.prepare("INSERT INTO settings VALUES (1,?)").run(
      JSON.stringify({
        announcement: "Our custom message",
        network: "testnet",
      }),
    );
    upgraded = openStore(directory);
    assert.equal(readSettings(upgraded).contractIdentity, "");
    assert.equal(
      upgraded
        .prepare("SELECT password_hash FROM admins WHERE username=?")
        .get("existing-admin").password_hash,
      hash,
    );
    assert.equal(
      JSON.parse(upgraded.prepare("SELECT value FROM settings").get().value)
        .announcement,
      "Our custom message",
    );
    assert.equal(existsSync(path.join(directory, "platform.sqlite")), false);
    upgraded
      .prepare("UPDATE settings SET value=? WHERE id=1")
      .run(JSON.stringify({ announcement: "New message" }));
    assert.equal(
      JSON.parse(legacy.prepare("SELECT value FROM settings").get().value)
        .announcement,
      "New message",
    );
  } finally {
    upgraded?.close();
    legacy.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test("current database takes precedence when a legacy database is also present", () => {
  const directory = mkdtempSync(path.join(tmpdir(), "bimzi-store-priority-"));
  const current = openStore(directory);
  const legacy = new DatabaseSync(path.join(directory, "amber.sqlite"));
  let reopened;
  try {
    current
      .prepare("UPDATE settings SET value=? WHERE id=1")
      .run(JSON.stringify({ announcement: "Current settings" }));
    reopened = openStore(directory);
    assert.equal(readSettings(reopened).announcement, "Current settings");
    assert.equal(
      legacy
        .prepare("SELECT name FROM sqlite_master WHERE name='settings'")
        .get(),
      undefined,
    );
  } finally {
    reopened?.close();
    current.close();
    legacy.close();
    rmSync(directory, { recursive: true, force: true });
  }
});
