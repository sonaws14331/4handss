import express from "express";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { randomBytes } from "node:crypto";
import { getAddress, ZeroAddress } from "ethers";
import {
  digest,
  readSettings,
  passwordMatches,
  passwordHash,
} from "./store.js";

export async function createApp(db, { production = false, origin = "" } = {}) {
  if (production && (!origin || new URL(origin).protocol !== "https:"))
    throw new Error(
      "APP_ORIGIN must be the public HTTPS origin in production.",
    );
  const app = express();
  app.disable("x-powered-by");
  if (production) app.set("trust proxy", 1);
  app.use(
    helmet({
      contentSecurityPolicy: production
        ? {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'"],
              styleSrc: [
                "'self'",
                "'unsafe-inline'",
                "https://fonts.googleapis.com",
              ],
              fontSrc: ["'self'", "https://fonts.gstatic.com"],
              imgSrc: ["'self'", "data:"],
              connectSrc: ["'self'"],
              objectSrc: ["'none'"],
              baseUri: ["'self'"],
              frameAncestors: ["'none'"],
            },
          }
        : false,
      strictTransportSecurity: production ? undefined : false,
    }),
  );
  app.use("/api", (_req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
  });
  app.use(
    "/api",
    rateLimit({
      windowMs: 60000,
      limit: 180,
      standardHeaders: "draft-8",
      legacyHeaders: false,
    }),
  );
  app.use(express.json({ limit: "8kb" }));
  const fakeHash = await passwordHash(randomBytes(32).toString("hex"));
  const cookieName = production ? "__Host-bimzi_session" : "bimzi_session";
  const cookieOptions = {
    httpOnly: true,
    secure: production,
    sameSite: "strict",
    path: "/",
  };
  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
  app.get("/api/config", (_req, res) =>
    res.json({ settings: readSettings(db) }),
  );
  app.use("/api/admin", (req, res, next) => {
    if (!["GET", "HEAD"].includes(req.method)) {
      const allowed = origin || `${req.protocol}://${req.get("host")}`;
      if (req.get("origin") !== allowed)
        return res
          .status(403)
          .json({ error: "Request origin is not allowed." });
    }
    const cookie = req.headers.cookie
      ?.split(";")
      .map((v) => v.trim())
      .find((v) => v.startsWith(`${cookieName}=`))
      ?.slice(cookieName.length + 1);
    db.prepare("DELETE FROM sessions WHERE expires <= ?").run(Date.now());
    if (cookie && /^[a-f0-9]{64}$/.test(cookie))
      req.admin = db
        .prepare(
          "SELECT username,token_hash FROM sessions WHERE token_hash=? AND expires>?",
        )
        .get(digest(cookie), Date.now());
    next();
  });
  app.get("/api/admin/session", (req, res) =>
    res.json({ authenticated: Boolean(req.admin) }),
  );
  app.post(
    "/api/admin/login",
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 15,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      message: { error: "Too many attempts. Try again in 15 minutes." },
    }),
    async (req, res, next) => {
      try {
        const { username, password } = req.body || {};
        if (
          typeof username !== "string" ||
          typeof password !== "string" ||
          username.length > 64 ||
          password.length > 256
        )
          return res
            .status(400)
            .json({ error: "Enter a valid username and password." });
        const now = Date.now();
        db.prepare("DELETE FROM login_attempts WHERE resets<=?").run(now);
        // Per-account limits survive restarts without blocking unrelated administrators.
        const loginKey = `admin-login:${digest(username)}`;
        const attempts = db
          .prepare("SELECT count FROM login_attempts WHERE key=?")
          .get(loginKey);
        if (attempts?.count >= 30)
          return res
            .status(429)
            .json({ error: "Too many attempts. Try again in 15 minutes." });
        db.prepare(
          "INSERT INTO login_attempts (key,count,resets) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1",
        ).run(loginKey, now + 15 * 60 * 1000);
        const admin = db
          .prepare("SELECT * FROM admins WHERE username=?")
          .get(username);
        const matched = await passwordMatches(
          password,
          admin?.password_hash || fakeHash,
        );
        if (!matched || !admin)
          return res
            .status(401)
            .json({ error: "Invalid username or password." });
        db.prepare("DELETE FROM login_attempts WHERE key=?").run(loginKey);
        if (req.admin)
          db.prepare("DELETE FROM sessions WHERE token_hash=?").run(
            req.admin.token_hash,
          );
        const token = randomBytes(32).toString("hex");
        db.prepare("INSERT INTO sessions VALUES (?,?,?)").run(
          digest(token),
          username,
          now + 8 * 60 * 60 * 1000,
        );
        res
          .cookie(cookieName, token, {
            ...cookieOptions,
            maxAge: 8 * 60 * 60 * 1000,
          })
          .json({ authenticated: true });
      } catch (err) {
        next(err);
      }
    },
  );
  app.use("/api/admin", (req, res, next) =>
    req.admin
      ? next()
      : res.status(401).json({ error: "Sign in to continue." }),
  );
  app.post("/api/admin/logout", (req, res) => {
    db.prepare("DELETE FROM sessions WHERE token_hash=?").run(
      req.admin.token_hash,
    );
    res.clearCookie(cookieName, cookieOptions).json({ ok: true });
  });
  app.put("/api/admin/settings", (req, res) => {
    const {
      announcement,
      communityUrl,
      contractAddress,
      contractIdentity,
      tokenOwner,
      network,
    } = req.body || {};
    if (
      typeof announcement !== "string" ||
      !announcement.trim() ||
      announcement.length > 160 ||
      !["testnet", "mainnet"].includes(network)
    )
      return res.status(400).json({
        error:
          "Use an announcement of 1–160 characters and a supported network.",
      });
    if (typeof communityUrl !== "string" || communityUrl.length > 500)
      return res
        .status(400)
        .json({ error: "Enter a valid HTTPS community link." });
    if (communityUrl) {
      try {
        const url = new URL(communityUrl);
        if (url.protocol !== "https:" || url.username || url.password)
          throw new Error();
      } catch {
        return res.status(400).json({
          error:
            "The community link must use HTTPS without embedded credentials.",
        });
      }
    }
    const addresses = { contractAddress, tokenOwner };
    try {
      for (const [key, value] of Object.entries(addresses)) {
        if (typeof value !== "string") throw new Error();
        if (value) {
          addresses[key] = getAddress(value);
          if (addresses[key] === ZeroAddress) throw new Error();
        }
      }
    } catch {
      return res.status(400).json({
        error: "Enter valid non-zero BSC addresses, or leave them empty.",
      });
    }
    if (
      contractIdentity !== undefined &&
      !["", "BIMZI"].includes(contractIdentity)
    )
      return res
        .status(400)
        .json({ error: "Select an unconfirmed or BIMZI contract identity." });
    const settings = {
      contractIdentity:
        addresses.contractAddress && contractIdentity === "BIMZI"
          ? "BIMZI"
          : "",
      announcement: announcement.trim(),
      communityUrl,
      ...addresses,
      network,
    };
    db.prepare("UPDATE settings SET value=? WHERE id=1").run(
      JSON.stringify(settings),
    );
    res.json({ settings });
  });
  app.use("/api", (_req, res) =>
    res.status(404).json({ error: "API route not found." }),
  );
  app.use((err, _req, res, next) => {
    if (res.headersSent) return next(err);
    res
      .status(
        err.type === "entity.too.large"
          ? 413
          : err instanceof SyntaxError
            ? 400
            : 500,
      )
      .json({
        error:
          err instanceof SyntaxError
            ? "Invalid JSON request."
            : "Request could not be completed.",
      });
  });
  return app;
}
