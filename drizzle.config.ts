import { defineConfig } from "drizzle-kit";

const databaseUrl = process.env.DATABASE_URL;

export default defineConfig({
  out: "./src/db/migrations",
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: databaseUrl
    ? {
        url: databaseUrl,
      }
    : undefined,
  verbose: true,
  strict: true,
});
