/* eslint-disable no-undef */
"use strict";
const validator = require("../validator");
const assert = require("assert");
const tmp = require("tmp");
const fs = require("fs");
const yaml = require("js-yaml");
const _ = require("lodash");

/**
 * Each test starts with loading a known good template and then tweaking it for
 * the test case. If you make changes to the template, make sure all of the
 * tests pass.
 */

function getHappySpec() {
  return yaml.safeLoad(fs.readFileSync(`${__dirname}/template.raml`, "utf8"));
}

function renderSpec(doc) {
  let tmpFile = tmp.fileSync({ postfix: ".raml" });
  let content = `#%RAML 1.0\n---\n${yaml.safeDump(doc)}`;
  fs.writeFileSync(tmpFile.name, content);
  return new URL(`file://${tmpFile.name}`);
}

function conforms(result) {
  assert.equal(result.conforms, true, result.toString());
}

function breaksOnlyOneRule(result, rule) {
  assert.equal(result.conforms, false, result.toString());
  assert.equal(result.results.length, 1, result.toString());
  assert.equal(result.results[0].validationId, rule);
}

function renameKey(obj, oldKey, newKey) {
  obj[newKey] = _.cloneDeep(obj[oldKey]);
  delete obj[oldKey];
  return obj;
}

describe("happy path raml tests", () => {
  it("valid", async () => {
    let doc = getHappySpec();
    let result = await validator.parse(renderSpec(doc));
    conforms(result);
  });
});

describe("version checking tests", () => {
  it("does not conform when missing the version", async () => {
    let doc = getHappySpec();
    delete doc.version;
    let result = await validator.parse(renderSpec(doc));
    breaksOnlyOneRule(result, "http://a.ml/vocabularies/data#version-format");
  });

  it("does not conform when the version has a decimal in it", async () => {
    let doc = getHappySpec();
    doc.version = "v1.1";
    let result = await validator.parse(renderSpec(doc));
    breaksOnlyOneRule(result, "http://a.ml/vocabularies/data#version-format");
  });

  it("does not conform when the version is capitalized", async () => {
    let doc = getHappySpec();
    doc.version = "V1";
    let result = await validator.parse(renderSpec(doc));
    breaksOnlyOneRule(result, "http://a.ml/vocabularies/data#version-format");
  });

  it("does not conform when the version isn't prefixed by a 'v'", async () => {
    let doc = getHappySpec();
    doc.version = "1";
    let result = await validator.parse(renderSpec(doc));
    breaksOnlyOneRule(result, "http://a.ml/vocabularies/data#version-format");
  });
});

describe("mediaType checking tests", () => {
  it("does not conform when mediaType is missing", async () => {
    let doc = getHappySpec();
    delete doc.mediaType;
    let result = await validator.parse(renderSpec(doc));
    breaksOnlyOneRule(result, "http://a.ml/vocabularies/data#require-json");
  });

  it("does not conform when the mediaType is xml", async () => {
    let doc = getHappySpec();
    doc.mediaType = "application/xml";
    let result = await validator.parse(renderSpec(doc));
    breaksOnlyOneRule(result, "http://a.ml/vocabularies/data#require-json");
  });
});

describe("protocol checking tests", () => {
  it("does not conform when protocol is missing", async () => {
    let doc = getHappySpec();
    delete doc.protocols;
    let result = await validator.parse(renderSpec(doc));
    breaksOnlyOneRule(result, "https-required");
  });

  it("does not conform when the protocol is http", async () => {
    let doc = getHappySpec();
    doc.protocols = "http";
    let result = await validator.parse(renderSpec(doc));
    breaksOnlyOneRule(result, "https-required");
  });
});

describe("title checking tests", () => {
  it("does not conform when title is missing", async () => {
    let doc = getHappySpec();
    delete doc.title;
    let result = await validator.parse(renderSpec(doc));
    breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/amf/parser#WebAPI-name-minCount"
    );
  });
});

describe("description checking tests", () => {
  it("does not conform when description is missing", async () => {
    let doc = getHappySpec();
    delete doc.description;
    let result = await validator.parse(renderSpec(doc));
    breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#require-api-description"
    );
  });

  it("does not conform when description contains text 'TODO' (case insensitive)", async () => {
    let filename = renderTemplate(
      _.merge(_.cloneDeep(defaultTemplateVars), {
        description: "1TODO "
      })
    );
    let result = await validator.parse(filename);
    assert.equal(result.conforms, false, result.toString());
    assert.equal(result.results.length, 1, result.toString());
    assert.equal(
      result.results[0].validationId,
      "http://a.ml/vocabularies/data#validate-api-description",
      result.toString()
    );
  });
});

describe("method checking tests", () => {
  it("does not conform when description is missing from method", async () => {
    let doc = getHappySpec();
    delete doc["/resource"]["/{resourceId}"].get.description;
    let result = await validator.parse(renderSpec(doc));
    breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#require-method-description"
    );
  });

  it("does not conform when method display name is missing from method", async () => {
    let doc = getHappySpec();
    delete doc["/resource"]["/{resourceId}"].get.displayName;
    let result = await validator.parse(renderSpec(doc));
    breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#camelcase-method-displayname"
    );
  });

  it("does not conform when method display name is kebab-case and not camelcase", async () => {
    let doc = getHappySpec();
    doc["/resource"]["/{resourceId}"].get.displayName = "not-camel-case";
    let result = await validator.parse(renderSpec(doc));
    breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#camelcase-method-displayname"
    );
  });

  it("does not conform when method display name is snake_case and not camelcase", async () => {
    let doc = getHappySpec();
    doc["/resource"]["/{resourceId}"].get.displayName = "not_camel_case";
    let result = await validator.parse(renderSpec(doc));
    breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#camelcase-method-displayname"
    );
  });

  it("does not conform when method display name is PascalCase and not camelcase", async () => {
    let doc = getHappySpec();
    doc["/resource"]["/{resourceId}"].get.displayName = "PascalCase";
    let result = await validator.parse(renderSpec(doc));
    breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#camelcase-method-displayname"
    );
  });
});

describe("resource checking tests", () => {
  it("does not conform when resource is in capitals", async () => {
    let doc = getHappySpec();
    renameKey(doc, "/resource", "/RESOURCE");
    let result = await validator.parse(renderSpec(doc));
    breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#resource-name-validation"
    );
  });

  it("does not conform when resource starts with underscore", async () => {
    let doc = getHappySpec();
    renameKey(doc, "/resource", "/_RESOURCE");
    let result = await validator.parse(renderSpec(doc));
    breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#resource-name-validation"
    );
  });

  it("does not conform when resource ends with dash", async () => {
    let doc = getHappySpec();
    renameKey(doc, "/resource", "/resource-");
    let result = await validator.parse(renderSpec(doc));
    breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#resource-name-validation"
    );
  });

  it("conforms when resource contains numbers", async () => {
    let doc = getHappySpec();
    renameKey(doc, "/resource", "/resource2");
    let result = await validator.parse(renderSpec(doc));
    conforms(result);
  });

  it("conforms when resource contains numbers", async () => {
    let doc = getHappySpec();
    renameKey(doc, "/resource", "/res0urce");
    let result = await validator.parse(renderSpec(doc));
    conforms(result);
  });

  it("conforms when resource contains underscore", async () => {
    let doc = getHappySpec();
    renameKey(doc, "/resource", "/this_resource");
    let result = await validator.parse(renderSpec(doc));
    conforms(result);
  });

  it("conforms when resource contains hyphens", async () => {
    let doc = getHappySpec();
    renameKey(doc, "/resource", "/this-resource");
    let result = await validator.parse(renderSpec(doc));
    conforms(result);
  });

  it("conforms when template is in caps", async () => {
    let doc = getHappySpec();
    renameKey(doc["/resource"], "/{resourceId}", "/{ID}");
    let result = await validator.parse(renderSpec(doc));
    conforms(result);
  });

  it("conforms when template has underscores", async () => {
    let doc = getHappySpec();
    renameKey(doc["/resource"], "/{resourceId}", "/{resource_id}");
    let result = await validator.parse(renderSpec(doc));
    conforms(result);
  });
});

describe("response description checking tests", () => {
  it("does not conform when description is missing from response", async () => {
    let doc = getHappySpec();
    delete doc["/resource"]["/{resourceId}"].get.responses["200"].description;
    let result = await validator.parse(renderSpec(doc));
    breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#require-response-description"
    );
  });

  it("does not conform without a 2xx or 3xx response", async () => {
    let doc = getHappySpec();
    delete doc["/resource"]["/{resourceId}"].get.responses["200"];
    let result = await validator.parse(renderSpec(doc));
    breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#at-least-one-2xx-or-3xx-response"
    );
  });

  it("does conform with a 3xx response and no 2xx", async () => {
    let doc = getHappySpec();
    renameKey(doc["/resource"]["/{resourceId}"].get.responses, "200", "301");
    let result = await validator.parse(renderSpec(doc));
    conforms(result);
  });
});
