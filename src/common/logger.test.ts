/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as chai from "chai";
import * as log from "loglevel";
import { ramlToolLogger, RAML_TOOL_LOGGER_KEY } from "./logger";

describe("Test log level", () => {
  it("Test default log level", async () => {
    return chai.expect(ramlToolLogger.getLevel()).to.equal(log.levels.INFO);
  });

  it("Test default log level with getLogger function", async () => {
    return chai
      .expect(log.getLogger(RAML_TOOL_LOGGER_KEY).getLevel())
      .to.equal(log.levels.INFO);
  });

  it("Test log level change", async () => {
    ramlToolLogger.setLevel(ramlToolLogger.levels.DEBUG);
    return chai.expect(ramlToolLogger.getLevel()).to.equal(log.levels.DEBUG);
  });
});
