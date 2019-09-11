/* eslint-disable no-undef */
"use strict";
const validator = require("../validator");
const assert = require("assert");

describe("happy path raml tests", () => {
  it("valid", async () => {
    let filename = new URL(`file://${__dirname}/raml/valid.raml`);
    let result = await validator.parse(filename);
    assert.equal(
      result.conforms,
      true,
      "API does not conform:\n" + result.toString()
    );
  });
});

describe("version checking tests", () => {
  it("missing version", async () => {
    let filename = new URL(
      `file://${__dirname}/raml/version-checks/missing-version.raml`
    );
    let result = await validator.parse(filename);
    assert.equal(result.conforms, false);
    assert.equal(result.results.length, 1);
    assert.equal(
      result.results[0].validationId,
      "http://a.ml/vocabularies/data#mandatory-version"
    );
  });

  it("bad version", async () => {
    let filename = new URL(
      `file://${__dirname}/raml/version-checks/bad-version.raml`
    );
    let result = await validator.parse(filename);
    assert.equal(result.conforms, false);
    assert.equal(result.results.length, 1);
    assert.equal(
      result.results[0].validationId,
      "http://a.ml/vocabularies/data#version-format"
    );
  });
});
