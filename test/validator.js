/* eslint-disable no-undef */
"use strict";
const validator = require("../validator");
const assert = require("assert");

describe("generator-commerce-cloud:app", () => {
  it("valid", async () => {
    let filename = new URL(`file://${__dirname}/raml/valid.raml`);
    let result = await validator.parse(filename);
    assert.equal(result.conforms, true, "Api expected to conform");
  });

  it("missing version", async () => {
    let filename = new URL(`file://${__dirname}/raml/missing-version.raml`);
    let result = await validator.parse(filename);
    assert.equal(result.conforms, false, "Api expected to not conform");
    assert.equal(result.results.length, 1);
    assert.equal(
      result.results[0].validationId,
      "http://a.ml/vocabularies/data#mandatory-version"
    );
  });

  it("bad version", async () => {
    let filename = new URL(`file://${__dirname}/raml/bad-version.raml`);
    let result = await validator.parse(filename);
    assert.equal(result.conforms, false, "Api expected to not conform");
    assert.equal(result.results.length, 1);
    assert.equal(
      result.results[0].validationId,
      "http://a.ml/vocabularies/data#version-format"
    );
  });
});
