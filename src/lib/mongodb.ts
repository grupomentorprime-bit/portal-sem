import { MongoClient } from "mongodb";

declare global {
  var mongo: Promise<MongoClient> | undefined;
}

let clientPromise: Promise<MongoClient> | undefined;

function requireMongoEnv(): { uri: string; dbName: string } {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB;

  if (!uri) {
    throw new Error("MONGODB_URI no está definida.");
  }

  if (!dbName) {
    throw new Error("MONGODB_DB no está definida.");
  }

  return { uri, dbName };
}

function getClientPromise(): Promise<MongoClient> {
  const { uri } = requireMongoEnv();

  if (process.env.NODE_ENV === "development") {
    if (!global.mongo) {
      global.mongo = new MongoClient(uri).connect();
    }
    return global.mongo;
  }

  if (!clientPromise) {
    clientPromise = new MongoClient(uri).connect();
  }

  return clientPromise;
}

export async function getDatabase() {
  const { dbName } = requireMongoEnv();
  const client = await getClientPromise();
  return client.db(dbName);
}
