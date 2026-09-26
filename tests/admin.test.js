import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createApp } from "../server/app.js";
import { openStore, passwordHash, digest } from "../server/store.js";

test("admin sessions protect persistent settings and reject unsafe writes", async () => {
  const directory = mkdtempSync(path.join(tmpdir(), "amber-admin-"));
  const db = openStore(directory);
  await db
    .prepare("INSERT INTO admins VALUES (?,?)")
    .run("test-admin", await passwordHash("test-only-password-123"));
  const app = await createApp(db, { origin: "http://amber.test" });
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.on("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  let cookie = "";
  const request = (route, method = "GET", body, origin = "http://amber.test") =>
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
      announcement: "AMBER community update",
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
  const directory = mkdtempSync(path.join(tmpdir(), "amber-prod-"));
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
      origin: "https://amber.example",
    });
    server = app.listen(0, "127.0.0.1");
    await new Promise((resolve) => server.on("listening", resolve));
    const response = await fetch(
      `http://127.0.0.1:${server.address().port}/api/admin/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "https://amber.example",
        },
        body: JSON.stringify({
          username: "admin",
          password: "test-production-password",
        }),
      },
    );
    assert.equal(response.status, 200);
    assert.match(response.headers.get("set-cookie"), /__Host-amber_session=/);
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
