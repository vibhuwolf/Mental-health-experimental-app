import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "@/db/schema";
import { env } from "@/lib/env";

let queryClient: postgres.Sql | null = null;
let drizzleClient: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (!env.DATABASE_URL) {
    return null;
  }

  if (!queryClient) {
    queryClient = postgres(env.DATABASE_URL, {
      prepare: false,
    });
  }

  if (!drizzleClient) {
    drizzleClient = drizzle(queryClient, { schema });
  }

  return drizzleClient;
}
