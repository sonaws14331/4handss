import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { openStore, passwordHash } from "./store.js";
import { createApp } from "./app.js";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const production = process.env.NODE_ENV === "production";
const db = openStore();
if (
  !db.prepare("SELECT 1 FROM admins LIMIT 1").get() &&
  process.env.ADMIN_USERNAME &&
  process.env.ADMIN_PASSWORD
) {
  const username = process.env.ADMIN_USERNAME,
    password = process.env.ADMIN_PASSWORD;
  if (
    !/^[A-Za-z0-9_.-]{3,64}$/.test(username) ||
    password.length < 14 ||
    password.length > 256
  )
    throw new Error(
      "Invalid bootstrap admin credentials. Use a 3–64 character username and a 14–256 character password.",
    );
  db.prepare("INSERT INTO admins VALUES (?,?)").run(
    username,
    await passwordHash(password),
  );
  console.log("Initial admin account provisioned from private environment.");
}
const app = await createApp(db, {
  production,
  origin: process.env.APP_ORIGIN || "",
});
let vite;
if (production) {
  app.use(express.static(path.join(root, "dist")));
  app.get("/{*path}", (_req, res) =>
    res.sendFile(path.join(root, "dist/index.html")),
  );
} else {
  const { createServer } = await import("vite");
  vite = await createServer({
    root,
    server: {
      middlewareMode: true,
      allowedHosts: process.env.DEV_ALLOWED_HOSTS?.split(",") || [],
    },
    appType: "spa",
  });
  app.use(vite.middlewares);
}
const port = Number(process.env.PORT) || 3000;
const server = app.listen(port, "0.0.0.0", () =>
  console.log(
    `AMBER ready on port ${port} (${production ? "production" : "development"})`,
  ),
);
async function shutdown() {
  server.close(async () => {
    await vite?.close();
    db.close();
    process.exit(0);
  });
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
