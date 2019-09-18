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
    .it("version starts with app name", ctx => {
      expect(ctx.stdout).to.contain("sfcc-raml-linter");
    });

  test
    .stdout()
    .do(async () => {
      await cmd.run([getSingleValidFile()]);
    })
    .it("runs one good file", ctx => {
      expect(ctx.stdout).to.contain("RAML is valid");
    });

  test
    .stdout()
    .stderr()
    .do(async () => {
      await cmd.run([getSingleInvalidFile()]);
    })
    .exit(1)
    .it("runs one bad file");

  // TODO
  // Make folder with 1 file
  // Make folder with 2 file
  // Make folder with 1 file and 1 subfolder with file nonrecursive
  // Make folder with 1 file and 1 subfolder with file recursive
});

function getSingleValidFile(path) {
  let tmpFile;
  if (path) {
    tmpFile = tmp.tmpNameSync({ dir: path, postfix: ".raml" });
  } else {
    tmpFile = tmp.fileSync({ postfix: ".raml" }).name;
  }
  fs.writeFileSync(tmpFile, template(defaultTemplateVars));
  return tmpFile;
}

function getSingleInvalidFile(path) {
  let tmpFile;
  if (path) {
    tmpFile = tmp.tmpNameSync({ dir: path, postfix: ".raml" });
  } else {
    tmpFile = tmp.fileSync({ postfix: ".raml" }).name;
  }
  fs.writeFileSync(tmpFile, "");
  return tmpFile;
}
