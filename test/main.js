/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-disable no-undef */
"use strict";
const path = require("path");
const rename = require("util").promisify(require("fs").rename);
const { expect, test } = require("@oclif/test");
const utils = require("./utils");

const cmd = require("..").SfccRamlintCommand;

const MERCURY_PROFILE = "mercury-profile";

const successString = "Conforms? true";

describe("sfcc-raml-linter cli", () => {
  test
    .stdout()
    .do(() => cmd.run(["--version"]))
    .exit(0)
    .it("checks that the version string starts with the app name", ctx => {
      expect(ctx.stdout).to.contain("@commerce-apps/raml-toolkit");
    });

  test
    .stdout()
    .stderr()
    .do(function() {
      return cmd.run([utils.getSingleValidFile()]);
    })
    .exit(2)
    .it("does not accept a file with no profile and exits non-zero");

  test
    .stdout()
    .do(() =>
      cmd.run(["--profile", MERCURY_PROFILE, utils.getSingleValidFile()])
    )
    .it("validates a single valid file and reports that it conforms", ctx => {
      expect(ctx.stdout).to.contain(successString);
    });

  test
    .stdout()
    .do(() =>
      cmd.run([
        "--profile",
        MERCURY_PROFILE,
        utils.getSingleValidFile(),
        "--warnings"
      ])
    )
    .it("validates a single valid file and reports that it conforms", ctx => {
      expect(ctx.stdout).to.contain(successString);
      expect(ctx.stdout).to.contain("Number of hidden warnings:");
    });

  test
    .stdout()
    .do(() => {
      const tempRamlFile = utils.getSingleValidFile();
      const ramlFileWithSpace = path.join(
        path.dirname(tempRamlFile),
        "test with spaces.raml"
      );
      return rename(tempRamlFile, ramlFileWithSpace).then(() =>
        cmd.run(["--profile", MERCURY_PROFILE, ramlFileWithSpace])
      );
    })
    .it(
      "validates a single valid file with a space in the name" +
        " and reports that it conforms",
      ctx => {
        expect(ctx.stdout).to.contain(successString);
      }
    );

  test
    .stdout()
    .stderr()
    .do(() =>
      cmd.run(["--profile", MERCURY_PROFILE, utils.getSingleInvalidFile()])
    )
    .exit(1)
    .it("validates a single invalid file and exits non-zero");

  test
    .stdout()
    .stderr()
    .do(() => cmd.run(["--profile", MERCURY_PROFILE]))
    .exit(1)
    .it("Requires at least one file to validate");

  test
    .stdout()
    .do(() =>
      cmd.run([
        "--profile",
        MERCURY_PROFILE,
        utils.getSingleValidFile(),
        utils.getSingleValidFile()
      ])
    )
    .it("validates two valid files and reports that it conforms", ctx => {
      expect(ctx.stdout).to.contain(successString);
    });

  test
    .stdout()
    .stderr()
    .do(() =>
      cmd.run([
        "--profile",
        MERCURY_PROFILE,
        utils.getSingleValidFile(),
        utils.getSingleInvalidFile()
      ])
    )
    .exit(1)
    .it("validates one valid and one invalid file and exits non-zero");

  test
    .stdout()
    .stderr()
    .do(() => cmd.run([]))
    .exit(2)
    .it("does not accept an empty file list and exits non-zero");
});
