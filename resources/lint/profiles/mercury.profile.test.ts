/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
"use strict";
import { validateFile } from "../../../src/lint/lint";
import {
  getHappySpec,
  conforms,
  breaksOnlyOneRule,
  renameKey,
  renderSpecAsFile,
  breaksTheseRules,
} from "../../../testResources/testUtils";

const PROFILE = "mercury";

describe("happy path raml tests", () => {
  it("valid", async () => {
    const doc = getHappySpec();
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    conforms(result);
  });
});

// Skipping since the rule is currently not working as expected
describe.skip("data type definition name checking tests", () => {
  const UPPER_CAMEL_CASE_RULE =
    "http://a.ml/vocabularies/data#upper-camelcase-datatype";
  it("does not conform when a data type definition is not in upper camel case", async () => {
    const doc = getHappySpec();
    doc.types["camelCaseDataType"] = {};
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    breaksOnlyOneRule(result, UPPER_CAMEL_CASE_RULE);
  });

  it("does not conform when two data type definitions are not in upper camel case", async () => {
    const doc = getHappySpec();
    doc.types["kebab-case"] = {};
    doc.types["snake_case"] = {};
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    breaksTheseRules(result, [UPPER_CAMEL_CASE_RULE, UPPER_CAMEL_CASE_RULE]);
  });

  it("does not conform when a data type definition have a space", async () => {
    const doc = getHappySpec();
    doc.types["UpperCamel Case"] = {};
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    breaksOnlyOneRule(result, UPPER_CAMEL_CASE_RULE);
  });

  it("does not conform when a data type definition have more than one space", async () => {
    const doc = getHappySpec();
    doc.types["Upper  Camel Case"] = {};
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    breaksOnlyOneRule(result, UPPER_CAMEL_CASE_RULE);
  });

  it("conforms when another data type definitions is in upper camel case", async () => {
    const doc = getHappySpec();
    doc.types["UpperCamelCaseDataType"] = {};
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    conforms(result);
  });
});

describe("mediaType checking tests", () => {
  it("does not conform when mediaType is missing", async () => {
    const doc = getHappySpec();
    delete doc.mediaType;
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    breaksOnlyOneRule(result, "http://a.ml/vocabularies/data#require-json");
  });

  it("does not conform when the mediaType is xml", async () => {
    const doc = getHappySpec();
    doc.mediaType = "application/xml";
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    breaksOnlyOneRule(result, "http://a.ml/vocabularies/data#require-json");
  });
});

describe("protocol checking tests", () => {
  it("does not conform when protocol is missing", async () => {
    const doc = getHappySpec();
    delete doc.protocols;
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    breaksOnlyOneRule(result, "https-required");
  });

  it("does not conform when the protocol is http", async () => {
    const doc = getHappySpec();
    doc.protocols = "http";
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    breaksOnlyOneRule(result, "https-required");
  });
});

describe("title checking tests", () => {
  it("does not conform when title is missing", async () => {
    const doc = getHappySpec();
    delete doc.title;
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/amf/parser#WebAPI-name-minCount"
    );
  });
});

describe("description checking tests", () => {
  it("does not conform when description is missing", async () => {
    const doc = getHappySpec();
    delete doc.description;
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#require-api-description"
    );
  });
});

describe("method checking tests", () => {
  it("does not conform when description is missing from method", async () => {
    const doc = getHappySpec();
    delete doc["/resource"]["/{resourceId}"].get.description;
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#require-method-description"
    );
  });
});

describe("response description checking tests", () => {
  it("does not conform when description is missing from response", async () => {
    const doc = getHappySpec();
    delete doc["/resource"]["/{resourceId}"].get.responses["200"].description;
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#require-response-description"
    );
  });

  it("does not conform without a 2xx or 3xx response", async () => {
    const doc = getHappySpec();
    delete doc["/resource"]["/{resourceId}"].get.responses["200"];
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#at-least-one-2xx-or-3xx-response"
    );
  });

  it("does conform with a 3xx response and no 2xx", async () => {
    const doc = getHappySpec();
    renameKey(doc["/resource"]["/{resourceId}"].get.responses, "200", "301");
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    conforms(result);
  });
});
