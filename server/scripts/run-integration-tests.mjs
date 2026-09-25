import { existsSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import os from "node:os";
import path from "node:path";

const serverDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const testDb = path.join(os.tmpdir(), "student-event-app-integration.db");
const databaseUrl = `file:${testDb.replaceAll("\\", "/")}`;
const env = { ...process.env, DATABASE_URL: databaseUrl };
if (existsSync(testDb)) rmSync(testDb);
writeFileSync(testDb, "");
for (const args of [["node_modules/prisma/build/index.js", "migrate", "deploy"], ["node_modules/vitest/vitest.mjs", "run"]]) {
  const result = spawnSync(process.execPath, args, { cwd: serverDir, env, stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
