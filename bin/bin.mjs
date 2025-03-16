#!/usr/bin/env node
async function start() {
  const { read } = await import("../dist/index.mjs");
  return read();
}
start();
