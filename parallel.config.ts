import { defineConfig } from "./src";

export default defineConfig({
  scripts: [
    {
      name: "dev",
      command: `pnpm  dev`,
    },
    {
      name: `unit-test`,
      command: `pnpm test-watch`,
    },
  ],
});
