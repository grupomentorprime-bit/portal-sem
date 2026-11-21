import "./_mongo-guard";
import { MongoClient } from "mongodb";
import {
  consumeDistributedRateLimit,
  createCollectionRateLimitStore,
} from "../src/core/security/public-rate-limit";
import {
  classifyMongoConnection,
  isDestructiveEnvironmentAuthorized,
  isMintedDatabaseName,
  isProtectedDatabaseName,
} from "../src/lib/mongo/destructive-guard";

async function main(): Promise<void> {
  const uri = process.env.MONGODB_URI?.trim() ?? "";
  const dbName = process.env.MONGODB_DB?.trim() ?? "";
  const key = process.env.RATE_KEY?.trim() ?? "";
  const hits = Number(process.env.RATE_HITS ?? "0");
  const limit = Number(process.env.RATE_LIMIT ?? "0");
  const nowMs = Number(process.env.RATE_NOW_MS ?? "0");

  const isolated =
    isDestructiveEnvironmentAuthorized(process.env) &&
    classifyMongoConnection(uri, process.env) === "isolated-test" &&
    isMintedDatabaseName(dbName) &&
    !isProtectedDatabaseName(dbName);
  if (!isolated || !key || hits < 1 || limit < 1 || !nowMs) {
    console.error("burst: argumentos de base aislada incompletos");
    process.exit(2);
  }

  const client = new MongoClient(uri);
  await client.connect();
  try {
    const store = createCollectionRateLimitStore(
      client.db(dbName).collection("security_rate_limits") as never
    );
    let allowed = 0;
    let blocked = 0;
    for (let i = 0; i < hits; i += 1) {
      const result = await consumeDistributedRateLimit({
        store,
        key,
        limit,
        windowMs: 60_000,
        nowMs,
      });
      if (result.ok) allowed += 1;
      else blocked += 1;
    }
    console.log(JSON.stringify({ allowed, blocked }));
  } finally {
    await client.close();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.name : "error";
  console.error(message);
  process.exit(1);
});
