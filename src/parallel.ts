import { ConfigHelper, ParallelConfig, ParallelScript } from "./config";
import {
  AbsolutePath,
  MaybePromise,
  unSafeObjectShallowWrapper,
} from "./utils";
import { isFunction } from "radash";
import { v4 as uuidv4 } from "uuid";
import fsExtra from "fs-extra/esm";
import {
  genWaitCommand,
  mergeWaitFile,
  WaitDefaultConfig,
  writeWaitFile,
} from "./wait";
import concurrently from "concurrently";

const runWaitFunc = async (func: () => MaybePromise<boolean>) => {
  console.log("runWaitFunc");
  return await func();
};

export const getParallelScripts = async (params: {
  config: ParallelConfig;
  groupName?: string;
}): Promise<ParallelScript[]> => {
  const { config, groupName } = params;
  const groups = unSafeObjectShallowWrapper(config.groups || {});
  if (groupName) {
    const scriptsInGroup = groups[groupName];
    if (!scriptsInGroup) {
      throw new Error(`error groupName: ${groupName}`);
    }
    if (isFunction(scriptsInGroup)) {
      return await scriptsInGroup();
    } else {
      return scriptsInGroup;
    }
  }
  if (config.scripts) {
    if (isFunction(config.scripts)) {
      return await config.scripts();
    } else {
      return config.scripts;
    }
  }
  return [];
};

export const parallel = async (params: {
  config: ParallelConfig;
  groupName?: string;
  genWaitCommand?: (params: {
    waitResAbsoluteFilePath: AbsolutePath;
  }) => MaybePromise<string>;
}) => {
  const { config, groupName } = params;
  const { beforeRun, beforeCheck } = config;
  const configHelper = new ConfigHelper(config);
  const tempDir = configHelper.tempDir;
  fsExtra.emptyDir(tempDir.content);
  const finalScripts = await getParallelScripts({
    config: config,
    groupName,
  });

  const finalGenWaitCommand = params.genWaitCommand || genWaitCommand;

  const waitFuncList: {
    path: AbsolutePath;
    func: () => MaybePromise<boolean>;
  }[] = [];

  const commandList: {
    command: string;
    name: string;
  }[] = await Promise.all([
    ...finalScripts.map(async (script) => {
      let command = `${script.command}`;
      if (script.wait?.func) {
        const waitFilePath = tempDir.resolve(`${script.name}_wait_${uuidv4()}`);
        await writeWaitFile({
          filePath: waitFilePath,
          content: {
            name: script.name,
            finish: false,
            interval:
              script.wait.interval ||
              config.wait?.interval ||
              WaitDefaultConfig.interval,
            timeout:
              script.wait.interval ||
              config.wait?.timeout ||
              WaitDefaultConfig.timeout,
            checkTime: [],
            result: false,
            message: "",
          },
        });
        waitFuncList.push({
          func: script.wait?.func,
          path: waitFilePath,
        });

        const waitCmd = finalGenWaitCommand({
          waitResAbsoluteFilePath: waitFilePath,
        });
        command = `${waitCmd} && ${command}`;
      }
      return {
        name: script.name,
        command,
      };
    }),
  ]);
  if (beforeRun) {
    const beforeRunRes = await beforeRun();
    if (!beforeRunRes) {
      throw new Error("exited on beforeRunRes");
    }
  }

  if (commandList.length <= 0) {
    throw new Error("empty script list, please check config file.");
  }

  concurrently(commandList, {
    prefixColors: "auto",
    prefix: "[{time}]-[{name}]",
    timestampFormat: "HH:mm:ss",
    killOthers: ["failure"],
  });

  if (beforeCheck) {
    const res = await beforeCheck();
    if (!res) {
      throw new Error("exit on beforeCheck");
    }
  }

  for (const waitFunc of waitFuncList) {
    runWaitFunc(waitFunc.func)
      .then(async (res) => {
        console.log("check finish");
        await mergeWaitFile({
          filePath: waitFunc.path,
          content: {
            finish: true,
            result: res,
            message: res ? "success" : "false",
          },
        });
      })
      .catch(async (error) => {
        await mergeWaitFile({
          filePath: waitFunc.path,
          content: {
            finish: true,
            result: false,
            message: error.message || "unknown error",
          },
        });
      });
  }
};
