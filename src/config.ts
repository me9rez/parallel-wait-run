import { type CommandConfig } from "./command";
import { type MaybePromise } from "./utils";

export interface ParallelConfig {
  root?: string;
  beforeRun?: () => MaybePromise<boolean>;
  scripts: ParallelScript[];
  groups?: {
    [name: string]: ParallelScript[];
  };
}

export interface ParallelScript extends CommandConfig {}

export type ParallelConfigFunc = (params: {
  mode?: string;
  root: string;
}) => MaybePromise<ParallelConfig>;

export const defineConfig = (
  config: ParallelConfig | ParallelConfigFunc
): ParallelConfig | ParallelConfigFunc => config;
