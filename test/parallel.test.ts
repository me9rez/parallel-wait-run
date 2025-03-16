import { expect, test, describe } from "vitest";
import { getParallelScripts, parallel, parallelMassages } from "../src/parallel";
import { type ParallelConfig } from "../src/config";

describe("getParallelScripts", () => {
  test("获取默认的scripts", async () => {
    const config: ParallelConfig = {
      scripts: [
        {
          name: "test name",
          command: "test command",
        },
      ],
    };
    const scripts = await getParallelScripts({ config });
    expect(scripts).toEqual(config.scripts);
  });
  test("获取指定group的scripts", async () => {
    const config: ParallelConfig = {
      scripts: [],
      groups: {
        test: [
          {
            name: "test name",
            command: "test command",
          },
        ],
      },
    };
    const scripts = await getParallelScripts({ config, groupName: "test" });
    expect(scripts).toEqual(config.groups?.["test"]);
  });
});

describe("parallel", () => {
  test("scripts为空时会报错", async () => {
    await expect(() => {
      return parallel({
        config: {
          scripts: [],
        },
      });
    }).rejects.toThrowError(parallelMassages.emptyScripts);
  });
  test("运行", async () => {
    await parallel({
      config: {
        scripts: [
          {
            name: "s",
            command: "sssssss",
          },
        ],
      },
    });
  });
});
