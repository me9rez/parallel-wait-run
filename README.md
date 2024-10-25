# parallel-wait-run

支持同时运行多个`npm scripts`，并且可以通过自定义的异步函数控制每一个`npm scripts`的启动时机。

# 文档

## 快速开始

1. 在项目根目录添加配置文件 `parallel.config.ts`（也支持其他`JS`和`TS`扩展名）

```ts
// parallel.config.ts
import { defineConfig } from "parallel-wait-run";

export default defineConfig({
  scripts: [
    {
      name: "dev",
      command: `dev command`,
    },
    {
      name: `unit-test`,
      command: `unit-test command`,
    },
  ],
});

```

2. 运行

``` bash
npm run parallel
```

使用`pnpm`

``` bash
pnpm parallel
```

使用`yarn`

``` bash
yarn parallel
```

## 命令行选项

### -r, --root  

命令运行的根路径，默认`process.cwd()`, 必须为绝对路径

示例: 

```bash
npm run parallel -r /a/b/c
```

### -c, --config 

指定配置文件，默认会在根路径下自动匹配`parallel.config.[ts,js,cjs,mjs]`, 如果设置为相对路径，则会以 `root`最为基础路径计算路径

示例: 

```bash
npm run parallel -c ./parallel.custom-config.ts
```

### -h, --help

显示帮助信息

### -v, --version

显示版本号 

### -m, --mode

指定模式

### -g, --group

指定某一组脚本

## 配置选项

### wait.timeout 

- 类型: `number`
- 是否必填: 否
- 默认值: 10000
- 超时时间，单位豪秒

### wait.interval

- 类型: `number`
- 是否必填: 否
- 默认值: 500 
- 检测间隔，单位豪秒

### root

- 类型: `string`
- 是否必填: 否
- 默认值: `process.cwd()` 
- 根路径

### tempDir

- 类型: `string`
- 是否必填: 否
- 默认值: `./node_modules/.parallel-wait-run` 
- 临时文件路径

### beforeRun

- 类型: `() => MaybePromise<boolean>`
- 是否必填: 否
- 临时文件路径

### beforeCheck

- 类型: `() => MaybePromise<boolean>`
- 是否必填: 否
- 临时文件路径

### scripts

- 类型: `array`或`() => MaybePromise<array>`
- 是否必填: 否
- 默认的脚本列表，支持使用函数返回一个列表

`script`的参数如下:

#### script.name 

- 类型: `string`
- 是否必填: 是
- 脚本名称
  
#### script.wait 

- 类型: `object`
- 是否必填: 否
- 直接指定当前脚本的`wait`配置，相关参数参照上面的`wait`选项

#### script.command 

- 类型: `string`
- 是否必填: 是
- 脚本的具体命令，例如`npm run dev`

### groups

- 类型: `object`
- 是否必填: 否
- 定义多组脚本，类型为

```ts
type Group = {
  [name: string]: ParallelConfigScripts;
}
```

`ParallelConfigScripts`的相关参数参照上面的`scripts`选项
