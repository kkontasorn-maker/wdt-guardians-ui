import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./lib/spine/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.DATABASE_URL?.replace(/^file:/, "") || "./data/guardians.sqlite",
  },
});
