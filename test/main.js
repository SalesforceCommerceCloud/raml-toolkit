/* eslint-disable no-undef */
"use strict";
const fs = require("fs");
const path = require("path");
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
      expect(ctx.stdout).to.contain("sfcc-raml-linter");
    });

  test
    .stdout()
    .stderr()
    .do(() => cmd.run([utils.getSingleValidFile()]))
    .exit(1)
    .it("does not accept a file with no profile and exits non-zero", ctx => {
      expect(ctx.stderr).to.contain("A valid profile must be specified");
    });

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
    .do(async () => {
      const tempRamlFile = utils.getSingleValidFile();
      const ramlFileWithSpace = path.join(
        path.dirname(tempRamlFile),
        "test with spaces.raml"
      );
      await fs.rename(tempRamlFile, ramlFileWithSpace, err => {
        if (err) throw err;
      });
      await cmd.run(["--profile", MERCURY_PROFILE, ramlFileWithSpace]);
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
    .exit(1)
    .it("does not accept an empty file list and exits non-zero");
});
