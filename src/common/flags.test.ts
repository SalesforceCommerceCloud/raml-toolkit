/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { expect } from "chai";
import { flags as oclifFlags } from "@oclif/command";
import * as commonFlags from "./flags";

describe("Help flag", () => {
  it("is the default help flag, but with -h enabled", () => {
    const defaultHelp = oclifFlags.help();
    const commonHelp = commonFlags.help();
    expect(commonHelp).to.deep.equal({
      ...defaultHelp,
      char: "h"
    });
  });
});
describe("Verbosity flag", () => {
  //
});
describe("All flags builder", () => {
  it("creates an object with all common flags set", () => {
    const built = commonFlags.buildAll();
    // This literally is a copy of the function implementation, probs not a good test
    expect(built).to.deep.equal({
      help: commonFlags.help(),
      verbosity: commonFlags.verbosity()
    });
  });
});
