import { hideBin } from "yargs/helpers";
import { ParallelConfig, ParallelConfigFunc } from "@/config";
import { bundleRequire } from "bundle-require";
import { AbsolutePath } from "./utils";
import path from "node:path";
import fsExtra from "fs-extra/esm";
import yargs from "yargs";
import { assign, isFunction } from "radash";
import { parallel } from "./parallel";

export class Program {
  constructor(params: {
    processArgs: string[];
    disableAutoHideBin?: boolean;
    version: string;
    name: string;
  }) {
    this.disableAutoHideBin = params.disableAutoHideBin;
    this.processArgs = params.processArgs;
    this.version = params.version;
    this.name = params.name;
  }

  name: string;

  disableAutoHideBin?: boolean;

  processArgs: string[];

  version: string;

  get args(): string[] {
    let args: string[] = [];
    if (this.disableAutoHideBin) {
      args = this.processArgs;
    } else {
      args = hideBin(this.processArgs);
    }
    return [...args];
  }

  async loadParallelConfigFromFile(params: {
    filePath: AbsolutePath;
  }): Promise<ParallelConfig | ParallelConfigFunc | undefined> {
    const { filePath } = params;
    const { mod } = await bundleRequire({
      filepath: filePath.content,
      format: "esm",
    });

    let result = mod.default || mod;
    return result;
  }
  async lookupParallelConfigFilePath(params: {
    root: AbsolutePath;
    configFilePath?: string;
  }): Promise<AbsolutePath | undefined> {
    const { root, configFilePath } = params;
    if (configFilePath) {
      const absoluteFilePath = new AbsolutePath(
        path.resolve(root.content, configFilePath)
      );
      const isExit = await fsExtra.pathExists(absoluteFilePath.content);
      if (!isExit) {
        throw new Error("config file not found");
      }
      return absoluteFilePath;
    } else {
      const configFileDefaultList = [
        "parallel.config.ts",
        "parallel.config.js",
        "parallel.config.cjs",
        "parallel.config.mjs",
      ];
      for (const filePath of configFileDefaultList) {
        const absoluteFilePath = new AbsolutePath(
          path.resolve(root.content, filePath)
        );
        const isExit = await fsExtra.pathExists(absoluteFilePath.content);
        if (!isExit) {
          break;
        }
        return absoluteFilePath;
      }
    }
  }

  async parse() {
    const yargsInstance = yargs()
      .scriptName(this.name)
      .command(
        "*",
        "在支持运行多个 npm script 时，同时可将某些 npm script 延迟执行",
        {
          root: {
            description: "root path | 根路径",
            alias: "r",
            type: "string",
          },
          mode: {
            description: "mode | 模式",
            alias: "m",
            type: "string",
          },
          config: {
            description: "config file path | 配置文件路径",
            alias: "c",
            type: "string",
          },
          group: {
            description: "group name ｜ 组名称",
            alias: "g",
            type: "string",
          },
        },
        async (args) => {
          const rootFormCli = (args.root as string) || undefined;
          const root = rootFormCli || process.cwd();
          const mode = (args.mode as string) || undefined;
          const configFilePathFromCli = (args.config as string) || undefined;
          const groupName = (args.group as string) || undefined;
          const absoluteRoot = new AbsolutePath(path.resolve(root));
          const parallelConfigFileAbsolutePath =
            await this.lookupParallelConfigFilePath({
              root: absoluteRoot,
              configFilePath: configFilePathFromCli,
            });
          const parallelConfigMaybeFuncFromCli = parallelConfigFileAbsolutePath
            ? await this.loadParallelConfigFromFile({
                filePath: parallelConfigFileAbsolutePath,
              })
            : undefined;
          const parallelConfigFromCli = isFunction(
            parallelConfigMaybeFuncFromCli
          )
            ? await parallelConfigMaybeFuncFromCli({ mode, root })
            : parallelConfigMaybeFuncFromCli;
          const parallelConfig = assign<ParallelConfig>(
            {
              groups: {},
              scripts: [],
            },
            parallelConfigFromCli || {
              groups: {},
              scripts: [],
            }
          );
          parallelConfig.root = args.root ? root : parallelConfig.root;
          await parallel({
            config: parallelConfig,
            groupName: groupName,
          });
        }
      );

    yargsInstance.help(true).alias("help", "h");
    yargsInstance.version(this.version).alias("version", "v");

    await yargsInstance.parse(this.args);
  }
}
