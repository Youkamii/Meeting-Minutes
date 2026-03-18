import path from "node:path";
import dotenv from "dotenv";
import { defineConfig } from "prisma/config";

dotenv.config({ path: ".env.local" });

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  datasource: {
    url: (() => {
      const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
      if (!url) {
        throw new Error(
          "Missing DATABASE_URL: set DIRECT_URL or DATABASE_URL in .env.local",
        );
      }
      return url;
    })(),
  },
});
