import type{ DeepPartial } from "ts-essentials";
import path from "node:path";

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type MaybePromise<T> = T | Promise<T>;

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
