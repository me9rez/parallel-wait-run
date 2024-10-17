import { DeepPartial } from "ts-essentials";
import { AbsolutePath, MaybePromise } from "./utils";
import { WaitConfig } from "./wait";
import path from "node:path";
import fsExtra from "fs-extra/esm";

export type ParallelConfigScripts =
  | ParallelScript[]
  | (() => MaybePromise<ParallelScript[]>);
export interface ParallelConfig {
  wait?: WaitConfig;
  root?: string;
  tempDir?: string;
  beforeRun?: () => MaybePromise<boolean>;
  beforeCheck?: () => MaybePromise<boolean>;
  scripts: ParallelConfigScripts;
  groups?: {
    [name: string]: ParallelConfigScripts;
  };
}

export interface ParallelScript {
  name: string;
  wait?: DeepPartial<WaitConfig> & {
    func: () => MaybePromise<boolean>;
  };
  command: string;
}

export type ParallelConfigFunc = (params: {
  mode?: string;
}) => MaybePromise<ParallelConfig>;

export const defineConfig = (
  config: ParallelConfig | ParallelConfigFunc
): ParallelConfig | ParallelConfigFunc => config;

export class ConfigHelper {
  #config: ParallelConfig;

  constructor(config: ParallelConfig) {
    this.#config = config;
  }
  get root() {
    const root = this.#config.root || process.cwd();
    return new AbsolutePath(path.resolve(root));
  }
  get pkgDir() {
    const root = this.root;
    let baseDir = root;
    while (baseDir) {
      const pkgPath = baseDir.resolve("package.json");
      if (fsExtra.pathExistsSync(pkgPath.content)) {
        try {
          const pkgJson = fsExtra.readJSONSync(pkgPath.content);
          if (pkgJson) {
            return baseDir;
          }
        } catch {}
      }

      const nextBaseDir = new AbsolutePath(path.dirname(baseDir.content));
      if (nextBaseDir.content === baseDir.content) {
        break;
      }
      baseDir = nextBaseDir;
    }
    return undefined;
  }

  get tempDir() {
    const pkgDir = this.pkgDir || this.root;
    const tempDir = this.#config.tempDir || "./node_modules/.parallel-wait-run";
    return pkgDir.resolve(tempDir);
  }
}
