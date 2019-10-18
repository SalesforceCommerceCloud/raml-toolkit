/* eslint-disable no-undef */
"use strict";
const validator = require("../../validator");
const utils = require("../utils");

const PROFILE = "sdk-ready";

describe("happy path raml tests", () => {
  it("valid", async () => {
    let doc = utils.getHappySpec();
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.conforms(result);
  });
});

describe("version checking tests", () => {
  it("does not conform when missing the version", async () => {
    let doc = utils.getHappySpec();
    delete doc.version;
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#version-format"
    );
  });

  it("does not conform when the version has a decimal in it", async () => {
    let doc = utils.getHappySpec();
    doc.version = "v1.1";
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#version-format"
    );
  });

  it("does not conform when the version is capitalized", async () => {
    let doc = utils.getHappySpec();
    doc.version = "V1";
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#version-format"
    );
  });

  it("does not conform when the version isn't prefixed by a 'v'", async () => {
    let doc = utils.getHappySpec();
    doc.version = "1";
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#version-format"
    );
  });
});

describe("mediaType checking tests", () => {
  it("does not conform when mediaType is missing", async () => {
    let doc = utils.getHappySpec();
    delete doc.mediaType;
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#require-json"
    );
  });

  it("does not conform when the mediaType is xml", async () => {
    let doc = utils.getHappySpec();
    doc.mediaType = "application/xml";
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#require-json"
    );
  });
});

describe("protocol checking tests", () => {
  it("does not conform when protocol is missing", async () => {
    let doc = utils.getHappySpec();
    delete doc.protocols;
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.breaksOnlyOneRule(result, "https-required");
  });

  it("does not conform when the protocol is http", async () => {
    let doc = utils.getHappySpec();
    doc.protocols = "http";
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.breaksOnlyOneRule(result, "https-required");
  });
});

describe("title checking tests", () => {
  it("does not conform when title is missing", async () => {
    let doc = utils.getHappySpec();
    delete doc.title;
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/amf/parser#WebAPI-name-minCount"
    );
  });
});

describe("description checking tests", () => {
  it("does not conform when description is missing", async () => {
    let doc = utils.getHappySpec();
    delete doc.description;
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#require-api-description"
    );
  });
});

describe("method checking tests", () => {
  it("does not conform when description is missing from method", async () => {
    let doc = utils.getHappySpec();
    delete doc["/resource"]["/{resourceId}"].get.description;
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#require-method-description"
    );
  });

  it("does not conform when method display name is missing from method", async () => {
    let doc = utils.getHappySpec();
    delete doc["/resource"]["/{resourceId}"].get.displayName;
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#camelcase-method-displayname"
    );
  });

  it("does not conform when method display name is kebab-case and not camelcase", async () => {
    let doc = utils.getHappySpec();
    doc["/resource"]["/{resourceId}"].get.displayName = "not-camel-case";
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#camelcase-method-displayname"
    );
  });

  it("does not conform when method display name is snake_case and not camelcase", async () => {
    let doc = utils.getHappySpec();
    doc["/resource"]["/{resourceId}"].get.displayName = "not_camel_case";
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#camelcase-method-displayname"
    );
  });

  it("does not conform when method display name is PascalCase and not camelcase", async () => {
    let doc = utils.getHappySpec();
    doc["/resource"]["/{resourceId}"].get.displayName = "PascalCase";
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#camelcase-method-displayname"
    );
  });
});

describe("resource checking tests", () => {
  it("does not conform when resource is in capitals", async () => {
    let doc = utils.getHappySpec();
    utils.renameKey(doc, "/resource", "/RESOURCE");
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#resource-name-validation"
    );
  });

  it("does not conform when resource starts with underscore", async () => {
    let doc = utils.getHappySpec();
    utils.renameKey(doc, "/resource", "/_RESOURCE");
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#resource-name-validation"
    );
  });

  it("does not conform when resource ends with dash", async () => {
    let doc = utils.getHappySpec();
    utils.renameKey(doc, "/resource", "/resource-");
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#resource-name-validation"
    );
  });

  it("conforms when resource contains numbers", async () => {
    let doc = utils.getHappySpec();
    utils.renameKey(doc, "/resource", "/resource2");
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.conforms(result);
  });

  it("conforms when resource contains numbers", async () => {
    let doc = utils.getHappySpec();
    utils.renameKey(doc, "/resource", "/res0urce");
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.conforms(result);
  });

  it("conforms when resource contains underscore", async () => {
    let doc = utils.getHappySpec();
    utils.renameKey(doc, "/resource", "/this_resource");
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.conforms(result);
  });

  it("conforms when resource contains hyphens", async () => {
    let doc = utils.getHappySpec();
    utils.renameKey(doc, "/resource", "/this-resource");
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.conforms(result);
  });

  it("conforms when template is in caps", async () => {
    let doc = utils.getHappySpec();
    utils.renameKey(doc["/resource"], "/{resourceId}", "/{ID}");
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.conforms(result);
  });

  it("conforms when template has underscores", async () => {
    let doc = utils.getHappySpec();
    utils.renameKey(doc["/resource"], "/{resourceId}", "/{resource_id}");
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.conforms(result);
  });
});

describe("response description checking tests", () => {
  it("does not conform when description is missing from response", async () => {
    let doc = utils.getHappySpec();
    delete doc["/resource"]["/{resourceId}"].get.responses["200"].description;
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#require-response-description"
    );
  });

  it("does not conform without a 2xx or 3xx response", async () => {
    let doc = utils.getHappySpec();
    delete doc["/resource"]["/{resourceId}"].get.responses["200"];
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#at-least-one-2xx-or-3xx-response"
    );
  });

  it("does conform with a 3xx response and no 2xx", async () => {
    let doc = utils.getHappySpec();
    utils.renameKey(
      doc["/resource"]["/{resourceId}"].get.responses,
      "200",
      "301"
    );
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.conforms(result);
  });
});

describe("description checking tests", () => {
  it("does not conform when API description contains text 'todo' preceded by whitespace", async () => {
    let doc = utils.getHappySpec();
    doc.description = "     TODO";
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#no-todo-text-in-description-fields"
    );
  });

  it("does conform when API description contains text 'todo' at the end of the word", async () => {
    let doc = utils.getHappySpec();
    doc.description = "COTODO";
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.conforms(result);
  });

  it("does conform when API description contains text 'todo' at start of the word", async () => {
    let doc = utils.getHappySpec();
    doc.description = "TODOsomestuff";
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.conforms(result);
  });

  it("does conform when API description contains text 'todo' as part of the word", async () => {
    let doc = utils.getHappySpec();
    doc.description = "sometodostuff";
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.conforms(result);
  });

  it("does not conform when API description contains empty string", async () => {
    let doc = utils.getHappySpec();
    doc.description = "";
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#no-todo-text-in-description-fields"
    );
  });

  it("does not conform when API description contains only whitespace", async () => {
    let doc = utils.getHappySpec();
    doc.description = "     ";
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#no-todo-text-in-description-fields"
    );
  });

  it("does not conform when GET method description contains text 'todo' preceded by whitespace", async () => {
    let doc = utils.getHappySpec();
    doc.description = "     TODO";
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#no-todo-text-in-description-fields"
    );
  });

  it("does not conform when GET method description is empty string", async () => {
    let doc = utils.getHappySpec();
    doc.description = "";
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#no-todo-text-in-description-fields"
    );
  });

  it("does not conform when GET method description contains only whitespace", async () => {
    let doc = utils.getHappySpec();
    doc.description = "   ";
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#no-todo-text-in-description-fields"
    );
  });

  it("does not conform when GET method description contains text 'todo'", async () => {
    let doc = utils.getHappySpec();
    doc["/resource"]["/{resourceId}"].get.description = "This method is TODo";
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#no-todo-text-in-description-fields"
    );
  });

  it("does not conform when GET method description contains text 'todo' followed by ':'", async () => {
    let doc = utils.getHappySpec();
    doc["/resource"]["/{resourceId}"].get.description = "TODO:";
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#no-todo-text-in-description-fields"
    );
  });

  it("does not conform when GET method description contains text 'todo' followed by ';'", async () => {
    let doc = utils.getHappySpec();
    doc["/resource"]["/{resourceId}"].get.description = "TODO;";
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#no-todo-text-in-description-fields"
    );
  });

  it("does not conform when GET method description contains text 'todo' followed by '-'", async () => {
    let doc = utils.getHappySpec();
    doc["/resource"]["/{resourceId}"].get.description = "TODO-";
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#no-todo-text-in-description-fields"
    );
  });

  it("does not conform when GET method description contains text 'todo' followed by '_'", async () => {
    let doc = utils.getHappySpec();
    doc["/resource"]["/{resourceId}"].get.description = "todo_";
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#no-todo-text-in-description-fields"
    );
  });

  it("does not conform when POST method description contains text 'todo'", async () => {
    let doc = utils.getHappySpec();
    doc["/resource"]["/{resourceId}"].post.description =
      "This POST method is a TODO operation";
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#no-todo-text-in-description-fields"
    );
  });

  it("does not conform when PATCH method description contains text 'todo'", async () => {
    let doc = utils.getHappySpec();
    doc["/resource"]["/{resourceId}"].patch.description =
      "This PATCH method is a TODO operation";
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#no-todo-text-in-description-fields"
    );
  });

  it("does not conform when DELETE method description contains text 'todo'", async () => {
    let doc = utils.getHappySpec();
    doc["/resource"]["/{resourceId}"].delete.description =
      "This DELETE method is a Todo operation";
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#no-todo-text-in-description-fields"
    );
  });

  it("does not conform when HEAD method description contains text 'todo'", async () => {
    let doc = utils.getHappySpec();
    doc["/resource"]["/{resourceId}"].head.description =
      "This HEAD method is a toDo operation";
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#no-todo-text-in-description-fields"
    );
  });

  it("does not conform when POST method's 201 response code's description contains text 'todo'", async () => {
    let doc = utils.getHappySpec();
    doc["/resource"]["/{resourceId}"].post.responses["201"].description =
      "201 status TODO";
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#no-todo-text-in-description-fields"
    );
  });

  it("does not conform when PUT method's 404 response code's description contains text 'todo'", async () => {
    let doc = utils.getHappySpec();
    doc["/resource"]["/{resourceId}"].post.responses["404"].description =
      "404 status TODO";
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#no-todo-text-in-description-fields"
    );
  });
});
