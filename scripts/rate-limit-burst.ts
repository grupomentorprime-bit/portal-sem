import "./_mongo-guard";
import { MongoClient } from "mongodb";
import {
  consumeDistributedRateLimit,
  createCollectionRateLimitStore,
} from "../src/core/security/public-rate-limit";
import {
  isMintedDatabaseName,
  isProtectedDatabaseName,
} from "../src/lib/mongo/destructive-guard";
import { TEST_DATABASE, classifyLocalMongo } from "../src/lib/mongo/local-boundary";

async function main(): Promise<void> {
  const uri = process.env.MONGODB_URI?.trim() ?? "";
  const connectionDb = process.env.MONGODB_DB?.trim() ?? "";
  const rateDb = process.env.RATE_DATABASE?.trim() ?? "";
  const key = process.env.RATE_KEY?.trim() ?? "";
  const hits = Number(process.env.RATE_HITS ?? "0");
  const limit = Number(process.env.RATE_LIMIT ?? "0");
  const nowMs = Number(process.env.RATE_NOW_MS ?? "0");

  // La conexión sigue siendo isolated-test (nelzuri_fixture). El contador
  // vive en la base emitida, que la frontera no acepta como MONGODB_DB.
  const isolated =
    connectionDb === TEST_DATABASE &&
    classifyLocalMongo(uri, process.env) === "isolated-test" &&
    isMintedDatabaseName(rateDb) &&
    !isProtectedDatabaseName(rateDb) &&
    rateDb !== connectionDb;
  if (!isolated || !key || hits < 1 || limit < 1 || !nowMs) {
    console.error("burst: argumentos de base aislada incompletos");
    process.exit(2);
  }

  const client = new MongoClient(uri);
  await client.connect();
  try {
    const store = createCollectionRateLimitStore(
      client.db(rateDb).collection("security_rate_limits") as never
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
