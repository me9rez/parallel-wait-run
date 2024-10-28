import { ParallelConfig, ParallelScript } from "./config";
import { unSafeObjectShallowWrapper } from "./utils";
import { isFunction } from "radash";
import { Command } from "./command";

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
}) => {
  const { config, groupName } = params;
  const { beforeRun } = config;
  const finalScripts = await getParallelScripts({
    config: config,
    groupName,
  });

  const commands = finalScripts.map((script) => {
    return new Command({
      ...script,
      cwd: script.cwd || config.root || process.cwd(),
    });
  });

  if (beforeRun) {
    try {
      const beforeRunRes = await beforeRun();
      if (!beforeRunRes) {
        throw new Error(`exited on beforeRun return ${beforeRunRes}`);
      }
    } catch (error) {
      throw error;
    }
  }

  commands.map((e) => e.start());
};
