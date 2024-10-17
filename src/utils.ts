import fs from "node:fs/promises";
import fsExtra from "fs-extra/esm";
import { DeepPartial } from "ts-essentials";
import path from "node:path";

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type MaybePromise<T> = T | Promise<T>;

export const modifyJson = async <T, V = T>(
  path: string,
  modify: (input: T) => MaybePromise<V | undefined>
) => {
  let oldContent: string | undefined = undefined;
  let oldJson: T | undefined = undefined;
  try {
    oldContent = (await fs.readFile(path, "utf-8")) as string;
    oldJson = JSON.parse(oldContent || "");
  } catch (error) {}
  const newJson = (await modify(oldJson as T)) || "";
  const detectIndent = await import("detect-indent");
  const detectNewline = await import("detect-newline");
  const DEFAULT_INDENT = 2;
  const CRLF = "\r\n";
  const LF = "\n";
  const indent =
    detectIndent.default(oldContent || "").indent || DEFAULT_INDENT;
  const newline = detectNewline.detectNewline(oldContent || "");
  let newContent = JSON.stringify(newJson, null, indent);
  if (newline === CRLF) {
    newContent = newContent.replace(/\n/g, CRLF) + CRLF;
  }
  newContent = newContent + LF;
  await fsExtra.outputFile(path, newContent, "utf-8");
};

export const readJson = async <T>(path: string): Promise<T> => {
  let jsonObj: T | undefined = undefined;
  const content = (await fs.readFile(path, "utf-8")) as string;
  jsonObj = JSON.parse(content || "") as T;
  return jsonObj;
};

export const unSafeObjectWrapper = <T extends object>(
  obj: T
): DeepPartial<T> => {
  return obj as DeepPartial<T>;
};

export const unSafeObjectShallowWrapper = <T extends object>(
  obj: T
): Partial<T> => {
  return obj as Partial<T>;
};

export class RelativePath {
  #content: string;
  constructor(content: string) {
    if (path.isAbsolute(content)) {
      throw new Error("RelativePath content is absolute path");
    }
    this.#content = content;
  }
  get content() {
    return this.#content;
  }
  toAbsolutePath(rel: AbsolutePath) {
    const absolutePath = path.resolve(rel.content, this.content);
    return new AbsolutePath(absolutePath);
  }
}
export class AbsolutePath {
  #content: string;
  constructor(content: string) {
    if (!path.isAbsolute(content)) {
      throw new Error("AbsolutePath content must is absolute path");
    }
    this.#content = content;
  }
  get content() {
    return this.#content;
  }
  toRelativePath(rel: AbsolutePath) {
    const content = path.relative(rel.content, this.content);
    return new RelativePath(content);
  }
  resolve(next: string) {
    const content = path.resolve(this.content, next);
    return new AbsolutePath(content);
  }
}

export const filterNullable = <T>(
  list: T[],
  isNullable?: (value: T) => boolean
): NonNullable<T>[] => {
  return list.filter((e) => {
    if (isNullable) {
      return !isNullable(e);
    }
    return !!e;
  }) as NonNullable<T>[];
};
export function arraify<T>(target: T | T[]): T[] {
  return Array.isArray(target) ? target : [target];
}
