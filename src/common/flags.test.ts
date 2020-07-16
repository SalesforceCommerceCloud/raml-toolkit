/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { expect } from "chai";
import { flags as oclifFlags } from "@oclif/command";
import * as commonFlags from "./flags";

/**
 * Deletes the `parse` function from a flag so that deep equality checks pass.
 * @param flag - The flag to modify
 */
function stripParse<T extends { parse: Function }>(flag: T): void {
  delete flag.parse;
}

describe("Help flag", () => {
  it("is the default help flag, but cleaner", () => {
    const flag = commonFlags.help();
    const expected = {
      ...oclifFlags.help(),
      char: "h",
      description: "Show CLI help",
      hidden: true
    };
    stripParse(flag);
    stripParse(expected);
    expect(flag).to.deep.equal(expected);
  });
});
describe("Verbosity flag", () => {
  //
});
describe("Version flag", () => {
  it("is the default version flag, but cleaner", () => {
    const flag = commonFlags.version();
    const expected = {
      ...oclifFlags.version(),
      char: "v",
      description: "Show CLI version",
      hidden: true
    };
    stripParse(flag);
    stripParse(expected);
    expect(flag).to.deep.equal(expected);
  });
});
describe("buildAll", () => {
  it("creates an object with all common flags set", () => {
    const built = commonFlags.buildAll();
    expect(built).to.have.keys(["help", "verbosity", "version"]);
  });
});
