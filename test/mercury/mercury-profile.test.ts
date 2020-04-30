/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-disable no-undef */
"use strict";
import { validateFile } from "../../src/validator";
import {
  getHappySpec,
  conforms,
  breaksOnlyOneRule,
  renameKey,
  renderSpecAsFile
} from "../utils.test";

const PROFILE = "mercury";

describe("happy path raml tests", () => {
  it("valid", async () => {
    const doc = getHappySpec();
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    conforms(result);
  });
});

describe("version checking tests", () => {
  it("does not conform when missing the version", async () => {
    const doc = getHappySpec();
    delete doc.version;
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    breaksOnlyOneRule(result, "http://a.ml/vocabularies/data#version-format");
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

describe("resource checking tests", () => {
  it("does not conform when resource is in capitals", async () => {
    const doc = getHappySpec();
    renameKey(doc, "/resource", "/RESOURCE");
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#resource-name-validation"
    );
  });

  it("does not conform when resource starts with underscore", async () => {
    const doc = getHappySpec();
    renameKey(doc, "/resource", "/_RESOURCE");
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#resource-name-validation"
    );
  });

  it("does not conform when resource ends with dash", async () => {
    const doc = getHappySpec();
    renameKey(doc, "/resource", "/resource-");
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#resource-name-validation"
    );
  });

  it("conforms when resource contains numbers", async () => {
    const doc = getHappySpec();
    renameKey(doc, "/resource", "/resource2");
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    conforms(result);
  });

  it("conforms when resource contains numbers", async () => {
    const doc = getHappySpec();
    renameKey(doc, "/resource", "/res0urce");
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    conforms(result);
  });

  it("does not conform when resource contains underscore", async () => {
    const doc = getHappySpec();
    renameKey(doc, "/resource", "/this_resource");
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#resource-name-validation"
    );
  });

  it("conforms when resource contains hyphens", async () => {
    const doc = getHappySpec();
    renameKey(doc, "/resource", "/this-resource");
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    conforms(result);
  });

  it("fails when template is in caps", async () => {
    const doc = getHappySpec();
    renameKey(doc["/resource"], "/{resourceId}", "/{ID}");
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    conforms(result);
  });

  it("fails when template has underscores", async () => {
    const doc = getHappySpec();
    renameKey(doc["/resource"], "/{resourceId}", "/{resource_id}");
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#resource-name-validation"
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
