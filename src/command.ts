import { ChildProcess, SpawnOptions } from "node:child_process";
import { MaybePromise } from "./utils";
import chalk from "chalk";
import supportsColor from "supports-color";
import spawnCommand from "spawn-command";

export const spawnCommandWrapper = {
  func: (...rest: any) => spawnCommand(...rest),
};

export interface CommandConfig {
  command: string;
  name: string;
  prefix?: {
    color?: string;
    text?: string;
  };
  cwd?: string;
  env?: Record<string, string>;
  wait?: (params: { log: (message: string) => void }) => MaybePromise<boolean>;
}

const randomColor = () => {
  return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
};

export class Command {
  config: CommandConfig;
  logConfig: {
    prefix: {
      color: string;
      text: string;
    };
  };
  childProcess?: ChildProcess;
  constructor(config: CommandConfig) {
    this.config = config;
    const { name, prefix } = this.config;
    const logPrefixText = prefix?.text ? prefix.text : name;
    const logPrefixColor = prefix?.color ? prefix.color : randomColor();
    this.logConfig = {
      prefix: {
        text: logPrefixText,
        color: logPrefixColor,
      },
    };
  }

  log(text: string) {
    const prefix = this.logConfig.prefix;
    let textToWrite = "";
    const logPrefix = chalk.hex(prefix.color)(`[${prefix.text}] `);
    textToWrite = `${logPrefix}${text}`;
    textToWrite = textToWrite.endsWith("\n") ? textToWrite : `${textToWrite}\n`;
    textToWrite = textToWrite.replaceAll("\n", (matched, i) => {
      const isEnd = !textToWrite[i + 1];
      return isEnd ? matched : `${matched}${logPrefix}`;
    });
    process.stdout.write(textToWrite);
  }

  async start() {
    const { command, env, wait, name, cwd } = this.config;
    const log: (message: string) => void = (...rest) => {
      this.log(...rest);
    };
    const colorSupport = supportsColor.stdout;
    if (wait) {
      log("wait ... ");
      try {
        const canRun = await wait({
          log,
        });
        if (!canRun) {
          throw new Error(`${name} wait return ${canRun}`);
        }
      } catch (error) {
        throw error;
      }
    }

    const childProcess = customSpawn(command, {
      cwd: cwd || process.cwd(),
      stdio: ["pipe", "pipe", "pipe"],
      env: {
        ...(colorSupport ? { FORCE_COLOR: colorSupport.level.toString() } : {}),
        ...process.env,
        ...env,
      },
    });
    this.childProcess = childProcess;
    childProcess.stdout?.on("data", (data) => {
      const text = data.toString();
      log(text);
    });
    childProcess.stderr?.on("data", (data) => {
      const text = data.toString();
      log(text);
    });
  }
}

export const customSpawn = (
  command: string,
  options: SpawnOptions
): ChildProcess => {
  return spawnCommandWrapper.func(command, options);
};
