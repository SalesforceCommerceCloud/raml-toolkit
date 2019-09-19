/* eslint-disable no-undef */
"use strict";
const { expect, test } = require("@oclif/test");
const Handlebars = require("handlebars");
const tmp = require("tmp");
const fs = require("fs");

const cmd = require("..");

const defaultTemplateVars = {
  title: "Test Raml File",
  version: "v1",
  mediaType: "application/json",
  protocols: "https",
  description: "This is a description of the API spec"
};

const template = Handlebars.compile(
  fs.readFileSync(`${__dirname}/template.raml`, "utf8")
);

describe("sfcc-raml-linter", () => {
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
      await cmd.run([getSingleValidFile()]);
    })
    .it("validates a single valid file", ctx => {
      expect(ctx.stdout).to.contain("Conforms? true");
    });

  test
    .stdout()
    .stderr()
    .do(async () => {
      await cmd.run([getSingleInvalidFile()]);
    })
    .exit(1)
    .it("validates a single invalid file");

  test
    .stdout()
    .do(async () => {
      await cmd.run([getSingleValidFile(), getSingleValidFile()]);
    })
    .it("validates two valid files", ctx => {
      expect(ctx.stdout).to.contain("Conforms? true");
    });

  test
    .stdout()
    .stderr()
    .do(async () => {
      await cmd.run([getSingleValidFile(), getSingleInvalidFile()]);
    })
    .exit(1)
    .it("validates one valid and one invalid file");

  test
    .stdout()
    .stderr()
    .do(async () => {
      await cmd.run([]);
    })
    .exit(1)
    .it("does not accept an empty file list");
});

function getSingleValidFile() {
  let tmpFile = tmp.fileSync({ postfix: ".raml" }).name;
  fs.writeFileSync(tmpFile, template(defaultTemplateVars));
  return tmpFile;
}

function getSingleInvalidFile() {
  let tmpFile = tmp.fileSync({ postfix: ".raml" }).name;
  fs.writeFileSync(tmpFile, "");
  return tmpFile;
}
