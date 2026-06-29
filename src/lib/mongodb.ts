import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI!;
const dbName = process.env.MONGODB_DB!;

if (!uri) {
  throw new Error("MONGODB_URI no está definida.");
}

if (!dbName) {
  throw new Error("MONGODB_DB no está definida.");
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  var mongo: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === "development") {
  if (!global.mongo) {
    client = new MongoClient(uri);
    global.mongo = client.connect();
  }
  clientPromise = global.mongo;
} else {
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

export async function getDatabase() {
  const client = await clientPromise;
  return client.db(dbName);
}