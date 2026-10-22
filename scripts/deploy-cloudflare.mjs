import { readFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const databaseId = process.env.SANTYSLOTS_D1_ID;
if (!databaseId || !/^[0-9a-f-]{36}$/i.test(databaseId)) {
  throw new Error("Set SANTYSLOTS_D1_ID to the Cloudflare D1 database UUID before deploying.");
}

const configPath = fileURLToPath(new URL("../dist/server/wrangler.json", import.meta.url));
const config = JSON.parse(await readFile(configPath, "utf8"));
config.name = "santyslots";
const database = config.d1_databases?.find((binding) => binding.binding === "DB");
if (!database) throw new Error("The built Worker has no DB binding.");
database.database_name = "santyslots-db";
database.database_id = databaseId;
await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`);

const wrangler = fileURLToPath(new URL("../node_modules/wrangler/bin/wrangler.js", import.meta.url));
const result = spawnSync(process.execPath, [wrangler, "deploy", "--config", configPath], { stdio: "inherit" });
if (result.error) throw result.error;
process.exit(result.status ?? 1);
