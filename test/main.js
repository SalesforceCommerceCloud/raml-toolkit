/* eslint-disable no-undef */
"use strict";
const fs = require("fs");
const path = require("path");
const { expect, test } = require("@oclif/test");
const utils = require("./utils");

const cmd = require("..");

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
    .do(async () => {
      await cmd.run([utils.getSingleValidFile()]);
    })
    .it("validates a single valid file and reports that it conforms", ctx => {
      expect(ctx.stdout).to.contain(successString);
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
      await cmd.run([ramlFileWithSpace]);
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
    .do(async () => {
      await cmd.run([utils.getSingleInvalidFile()]);
    })
    .exit(1)
    .it("validates a single invalid file and exits non-zero");

  test
    .stdout()
    .do(async () => {
      await cmd.run([utils.getSingleValidFile(), utils.getSingleValidFile()]);
    })
    .it("validates two valid files and reports that it conforms", ctx => {
      expect(ctx.stdout).to.contain(successString);
    });

  test
    .stdout()
    .stderr()
    .do(async () => {
      await cmd.run([utils.getSingleValidFile(), utils.getSingleInvalidFile()]);
    })
    .exit(1)
    .it("validates one valid and one invalid file and exits non-zero");

  test
    .stdout()
    .stderr()
    .do(async () => {
      await cmd.run([]);
    })
    .exit(1)
    .it("does not accept an empty file list and exits non-zero");
});
