import { defineConfig } from '@prisma/config';

export default defineConfig({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
      // directUrl is usually handled via 'url' env var in standard migrations or manual setup
      // but if we want to be explicit:
      // directUrl: process.env.DIRECT_URL 
      // Note: check typescript typings, typically 'url' is the main one.
    },
  },
});
