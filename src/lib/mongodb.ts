import "server-only";

import { MongoClient } from "mongodb";
import { logServerError } from "@/core/security/redact";

declare global {
  var mongo: Promise<MongoClient> | undefined;
}

let clientPromise: Promise<MongoClient> | undefined;

function requireMongoEnv(): { uri: string; dbName: string } {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB;

  if (!uri || !dbName) {
    throw new Error("La base de datos no está configurada.");
  }

  return { uri, dbName };
}

function connectMongo(uri: string): Promise<MongoClient> {
  try {
    return new MongoClient(uri).connect().catch((error: unknown) => {
      logServerError("mongodb", error);
      throw new Error("No se pudo conectar a la base de datos.");
    });
  } catch (error) {
    logServerError("mongodb", error);
    throw new Error("No se pudo conectar a la base de datos.");
  }
}

function getClientPromise(): Promise<MongoClient> {
  const { uri } = requireMongoEnv();

  if (process.env.NODE_ENV === "development") {
    if (!global.mongo) {
      global.mongo = connectMongo(uri);
    }
    return global.mongo;
  }

  if (!clientPromise) {
    clientPromise = connectMongo(uri);
  }

  return clientPromise;
}

export async function getDatabase() {
  const { dbName } = requireMongoEnv();
  const client = await getClientPromise();
  return client.db(dbName);
}
