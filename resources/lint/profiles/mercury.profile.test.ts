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

describe("version checking tests", () => {
  /**
   * Test breaks 2 rules
   * 1. version-format
   * 2. implicit-version-parameter-without-api-version ('baseUri' defines 'version' variable without the API defining one)
   * implicit-version-parameter-without-api-version is the default rule provided by the amf
   */
  it("does not conform when missing the version", async () => {
    const doc = getHappySpec();
    delete doc.version;
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    breaksTheseRules(result, [
      "http://a.ml/vocabularies/data#version-format",
      "http://a.ml/vocabularies/amf/parser#implicit-version-parameter-without-api-version",
    ]);
  });

  it("does not conform when the version has a decimal in it", async () => {
    const doc = getHappySpec();
    doc.version = "v1.1";
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    breaksOnlyOneRule(result, "http://a.ml/vocabularies/data#version-format");
  });

  it("does not conform when the version is capitalized", async () => {
    const doc = getHappySpec();
    doc.version = "V1";
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    breaksOnlyOneRule(result, "http://a.ml/vocabularies/data#version-format");
  });

  it("does not conform when the version isn't prefixed by a 'v'", async () => {
    const doc = getHappySpec();
    doc.version = "1";
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    breaksOnlyOneRule(result, "http://a.ml/vocabularies/data#version-format");
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

describe("description checking tests", () => {
  it("does not conform when API description contains text 'todo' preceded by whitespace", async () => {
    const doc = getHappySpec();
    doc.description = "     TODO";
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#no-todo-text-in-description-fields"
    );
  });

  it("does conform when API description contains text 'todo' at the end of the word", async () => {
    const doc = getHappySpec();
    doc.description = "COTODO";
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    conforms(result);
  });

  it("does conform when API description contains text 'todo' at start of the word", async () => {
    const doc = getHappySpec();
    doc.description = "TODOsomestuff";
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    conforms(result);
  });

  it("does conform when API description contains text 'todo' as part of the word", async () => {
    const doc = getHappySpec();
    doc.description = "sometodostuff";
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    conforms(result);
  });

  it("does not conform when API description contains empty string", async () => {
    const doc = getHappySpec();
    doc.description = "";
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#no-todo-text-in-description-fields"
    );
  });

  it("does not conform when API description contains only whitespace", async () => {
    const doc = getHappySpec();
    doc.description = "     ";
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#no-todo-text-in-description-fields"
    );
  });

  it("does not conform when GET method description contains text 'todo' preceded by whitespace", async () => {
    const doc = getHappySpec();
    doc.description = "     TODO";
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#no-todo-text-in-description-fields"
    );
  });

  it("does not conform when GET method description is empty string", async () => {
    const doc = getHappySpec();
    doc.description = "";
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#no-todo-text-in-description-fields"
    );
  });

  it("does not conform when GET method description contains only whitespace", async () => {
    const doc = getHappySpec();
    doc.description = "   ";
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#no-todo-text-in-description-fields"
    );
  });

  it("does not conform when GET method description contains text 'todo'", async () => {
    const doc = getHappySpec();
    doc["/resource"]["/{resourceId}"].get.description = "This method is TODo";
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#no-todo-text-in-description-fields"
    );
  });

  it("does not conform when GET method description contains text 'todo' followed by ':'", async () => {
    const doc = getHappySpec();
    doc["/resource"]["/{resourceId}"].get.description = "TODO:";
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#no-todo-text-in-description-fields"
    );
  });

  it("does not conform when GET method description contains text 'todo' followed by ';'", async () => {
    const doc = getHappySpec();
    doc["/resource"]["/{resourceId}"].get.description = "TODO;";
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#no-todo-text-in-description-fields"
    );
  });

  it("does not conform when GET method description contains text 'todo' followed by '-'", async () => {
    const doc = getHappySpec();
    doc["/resource"]["/{resourceId}"].get.description = "TODO-";
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#no-todo-text-in-description-fields"
    );
  });

  it("does not conform when GET method description contains text 'todo' followed by '_'", async () => {
    const doc = getHappySpec();
    doc["/resource"]["/{resourceId}"].get.description = "todo_";
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#no-todo-text-in-description-fields"
    );
  });

  it("does not conform when POST method description contains text 'todo'", async () => {
    const doc = getHappySpec();
    doc["/resource"]["/{resourceId}"].post.description =
      "This POST method is a TODO operation";
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#no-todo-text-in-description-fields"
    );
  });

  it("does not conform when PATCH method description contains text 'todo'", async () => {
    const doc = getHappySpec();
    doc["/resource"]["/{resourceId}"].patch.description =
      "This PATCH method is a TODO operation";
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#no-todo-text-in-description-fields"
    );
  });

  it("does not conform when DELETE method description contains text 'todo'", async () => {
    const doc = getHappySpec();
    doc["/resource"]["/{resourceId}"].delete.description =
      "This DELETE method is a Todo operation";
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#no-todo-text-in-description-fields"
    );
  });

  it("does not conform when HEAD method description contains text 'todo'", async () => {
    const doc = getHappySpec();
    doc["/resource"]["/{resourceId}"].head.description =
      "This HEAD method is a toDo operation";
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#no-todo-text-in-description-fields"
    );
  });

  it("does not conform when POST method's 201 response code's description contains text 'todo'", async () => {
    const doc = getHappySpec();
    doc["/resource"]["/{resourceId}"].post.responses["201"].description =
      "201 status TODO";
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#no-todo-text-in-description-fields"
    );
  });

  it("does not conform when PUT method's 404 response code's description contains text 'todo'", async () => {
    const doc = getHappySpec();
    doc["/resource"]["/{resourceId}"].post.responses["404"].description =
      "404 status TODO";
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#no-todo-text-in-description-fields"
    );
  });
});
