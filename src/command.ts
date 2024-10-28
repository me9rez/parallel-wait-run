import { ChildProcess, spawn, SpawnOptions } from "node:child_process";
import { MaybePromise } from "./utils";
import chalk from "chalk";
import supportsColor from "supports-color";

export interface CommandConfig {
  command: string;
  name: string;
  prefix?: {
    color?: string;
    text?: string;
  };
  cwd?: string;
  env?: Record<string, string>;
  wait?: () => MaybePromise<boolean>;
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
    const logPrefix = chalk.hex(prefix.color)(`[${prefix.text}] `);
    const textWithPrefix = `${logPrefix}${text}`;
    const textToWrite = textWithPrefix.replaceAll("\n", (matched, i) => {
      const isEnd = !textWithPrefix[i + 1];
      return isEnd ? matched : `${matched}${logPrefix}`;
    });
    process.stdout.write(textToWrite);
  }

  async start() {
    const { command, env, wait, name, cwd } = this.config;
    const colorSupport = supportsColor.stdout;
    if (wait) {
      this.log("wait ... \n");
      try {
        const canRun = await wait();
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
      this.log(text);
    });
    childProcess.stderr?.on("data", (data) => {
      const text = data.toString();
      this.log(text);
    });
  }
}

export const customSpawn = (
  command: string,
  options: SpawnOptions
): ChildProcess => {
  let file = "/bin/sh";
  let args = ["-c", command];
  if (process.platform === "win32") {
    file = "cmd.exe";
    args = ["/s", "/c", `"${command}"`];
    options.windowsVerbatimArguments = true;
  }
  return spawn(file, args, options);
};
