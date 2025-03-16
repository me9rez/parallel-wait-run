import { Program } from "./program";
import pkg from "./../package.json";

export const read = async () => {
  const program = new Program({
    processArgs: process.argv,
    version: pkg.version,
    name: "parallel",
  });
  await program.parse();
};
