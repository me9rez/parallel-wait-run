import { test, describe, vi, expect } from "vitest";
import { customSpawn, spawnCommandWrapper } from "../src/command";

describe("customSpawn", () => {
  test("customSpawn", async () => {
    const spy = vi.spyOn(spawnCommandWrapper, "func");
    customSpawn("s", {});
    expect(spy).toHaveBeenCalledTimes(1);
    console.log(spy.mock.calls);
  });
});
