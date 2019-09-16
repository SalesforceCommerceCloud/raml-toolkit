/* eslint-disable no-undef */
"use strict";
const validator = require("../validator");
const assert = require("assert");
const Handlebars = require("handlebars");
const tmp = require("tmp");
const fs = require("fs");
const _ = require("lodash");

const defaultTemplateVars = {
  title: "Test Raml File",
  version: "v1",
  mediaType: "application/json",
  protocols: "https",
  description: "This is a description of the API spec"
};

function renderTemplate(templateVars) {
  let compiledTemplate = Handlebars.compile(
    fs.readFileSync(`${__dirname}/template.raml`, "utf8")
  );
  let tmpFile = tmp.fileSync({ postfix: ".raml" });
  fs.writeFileSync(tmpFile.name, compiledTemplate(templateVars));
  return new URL(`file://${tmpFile.name}`);
}

describe("happy path raml tests", () => {
  it("valid", async () => {
    let filename = renderTemplate(defaultTemplateVars);
    let result = await validator.parse(filename);
    assert.equal(result.conforms, true, result.toString());
  });
});

describe("version checking tests", () => {
  it("does not conform when missing the version", async () => {
    let noVersionTemplateVars = _.cloneDeep(defaultTemplateVars);
    delete noVersionTemplateVars.version;
    let result = await validator.parse(renderTemplate(noVersionTemplateVars));
    assert.equal(result.conforms, false, result.toString());
    assert.equal(result.results.length, 1, result.toString());
    assert.equal(
      result.results[0].validationId,
      "http://a.ml/vocabularies/data#version-format"
    );
  });

  it("does not conform when the version has a decimal in it", async () => {
    let filename = renderTemplate(
      _.merge(_.cloneDeep(defaultTemplateVars), { version: "v1.1" })
    );
    let result = await validator.parse(filename);
    assert.equal(result.conforms, false, result.toString());
    assert.equal(result.results.length, 1, result.toString());
    assert.equal(
      result.results[0].validationId,
      "http://a.ml/vocabularies/data#version-format"
    );
  });

  it("does not conform when the version is capitalized", async () => {
    let filename = renderTemplate(
      _.merge(_.cloneDeep(defaultTemplateVars), { version: "V1.1" })
    );
    let result = await validator.parse(filename);
    assert.equal(result.conforms, false, result.toString());
    assert.equal(result.results.length, 1, result.toString());
    assert.equal(
      result.results[0].validationId,
      "http://a.ml/vocabularies/data#version-format"
    );
  });

  it("does not conform when the version isn't prefixed by a 'v'", async () => {
    let filename = renderTemplate(
      _.merge(_.cloneDeep(defaultTemplateVars), { version: "1" })
    );
    let result = await validator.parse(filename);
    assert.equal(result.conforms, false, result.toString());
    assert.equal(result.results.length, 1, result.toString());
    assert.equal(
      result.results[0].validationId,
      "http://a.ml/vocabularies/data#version-format"
    );
  });
});

describe("mediaType checking tests", () => {
  it("does not conform when mediaType is missing", async () => {
    let testTemplateVars = _.cloneDeep(defaultTemplateVars);
    delete testTemplateVars.mediaType;
    let result = await validator.parse(renderTemplate(testTemplateVars));
    assert.equal(result.conforms, false, result.toString());
    assert.equal(result.results.length, 1, result.toString());
    assert.equal(
      result.results[0].validationId,
      "http://a.ml/vocabularies/data#require-json"
    );
  });

  it("does not conform when the mediaType is xml", async () => {
    let filename = renderTemplate(
      _.merge(_.cloneDeep(defaultTemplateVars), {
        mediaType: "application/xml"
      })
    );
    let result = await validator.parse(filename);
    assert.equal(result.conforms, false, result.toString());
    assert.equal(result.results.length, 1, result.toString());
    assert.equal(
      result.results[0].validationId,
      "http://a.ml/vocabularies/data#require-json",
      result.toString()
    );
  });
});

describe("protocol checking tests", () => {
  it("does not conform when protocol is missing", async () => {
    let testTemplateVars = _.cloneDeep(defaultTemplateVars);
    delete testTemplateVars.protocols;
    let result = await validator.parse(renderTemplate(testTemplateVars));
    assert.equal(result.conforms, false, result.toString());
    assert.equal(result.results.length, 1, result.toString());
    assert.equal(
      result.results[0].validationId,
      "https-required",
      result.toString()
    );
  });

  it("does not conform when the protocol is http", async () => {
    let filename = renderTemplate(
      _.merge(_.cloneDeep(defaultTemplateVars), {
        protocols: "http"
      })
    );
    let result = await validator.parse(filename);
    assert.equal(result.conforms, false, result.toString());
    assert.equal(result.results.length, 1, result.toString());
    assert.equal(
      result.results[0].validationId,
      "https-required",
      result.toString()
    );
  });
});

describe("title checking tests", () => {
  it("does not conform when title is missing", async () => {
    let testTemplateVars = _.cloneDeep(defaultTemplateVars);
    delete testTemplateVars.title;
    let result = await validator.parse(renderTemplate(testTemplateVars));
    assert.equal(result.conforms, false, result.toString());
    assert.equal(result.results.length, 1, result.toString());
    assert.equal(
      result.results[0].validationId,
      "http://a.ml/vocabularies/amf/parser#WebAPI-name-minCount",
      result.toString()
    );
  });
});

describe("description checking tests", () => {
  it("does not conform when description is missing", async () => {
    let testTemplateVars = _.cloneDeep(defaultTemplateVars);
    delete testTemplateVars.description;
    let result = await validator.parse(renderTemplate(testTemplateVars));
    assert.equal(result.conforms, false, result.toString());
    assert.equal(result.results.length, 1, result.toString());
    assert.equal(
      result.results[0].validationId,
      "http://a.ml/vocabularies/data#require-api-description",
      result.toString()
    );
  });
});
