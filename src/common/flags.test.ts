/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { expect } from "chai";
import { flags as oclifFlags } from "@oclif/command";
import { LogLevelNumbers } from "loglevel";

import * as commonFlags from "./flags";
import { ramlToolLogger as logger } from "./logger";

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

describe("Log level flag", () => {
  let level: LogLevelNumbers;
  let flag: oclifFlags.IOptionFlag<number>;
  before(() => {
    // Save original log level
    level = logger.getLevel();
    // Set in before() instead of top so the tests fail but mocha doesn't exit
    flag = commonFlags.logLevel();
  });
  beforeEach(() => {
    logger.setLevel(0);
  });
  after(() => {
    // Restore original log level
    logger.setLevel(level);
  });
  it("sets and returns the log level", () => {
    const level = flag.parse("1", {});
    expect(logger.getLevel()).to.equal(1);
    expect(level).to.equal(1);
  });
  it("accepts any input accepted by loglevel", () => {
    const debug = flag.parse("DEBUG", {});
    expect(logger.getLevel()).to.equal(1);
    expect(debug).to.equal(1);
    const info = flag.parse("info", {});
    expect(logger.getLevel()).to.equal(2);
    expect(info).to.equal(2);
  });
  it("throws on invalid input", () => {
    expect(() => flag.parse("invalid", {})).to.throw();
  });
});

describe("Version flag", () => {
  it("is the default version flag, but cleaner", () => {
    const flag = commonFlags.version();
    const expected = {
      ...oclifFlags.version(),
      description: "Show CLI version",
      hidden: true
    };
    stripParse(flag);
    stripParse(expected);
    expect(flag).to.deep.equal(expected);
  });
});

describe("allCommonFlags", () => {
  it("creates an object with all common flags set", () => {
    const built = commonFlags.allCommonFlags();
    expect(built).to.have.keys(["help", "log-level", "version"]);
  });
});
