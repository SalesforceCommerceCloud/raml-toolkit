/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
"use strict";
import {
  getHappySpec,
  renderSpecAsFile,
  conforms,
  createCustomProfile,
  generateValidationRules,
  breaksOnlyOneRule,
} from "../../../testResources/testUtils";
import { validateFile } from "../../../src/lint/lint";

describe("unique display name validation", () => {
  let doc;
  let testProfile: string;

  before(() => {
    testProfile = createCustomProfile(
      generateValidationRules("mercury-standards", ["no-todo-text-in-description-fields"])
    );
  });

  it("does not conform when API description contains text 'todo' preceded by whitespace", async () => {
    const doc = getHappySpec();
    doc.description = "     TODO";
    const result = await validateFile(renderSpecAsFile(doc), testProfile);
    breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#no-todo-text-in-description-fields"
    );
  });

  it("does conform when API description contains text 'todo' at the end of the word", async () => {
    const doc = getHappySpec();
    doc.description = "COTODO";
    const result = await validateFile(renderSpecAsFile(doc), testProfile);
    conforms(result);
  });

  it("does conform when API description contains text 'todo' at start of the word", async () => {
    const doc = getHappySpec();
    doc.description = "TODOsomestuff";
    const result = await validateFile(renderSpecAsFile(doc), testProfile);
    conforms(result);
  });

  it("does conform when API description contains text 'todo' as part of the word", async () => {
    const doc = getHappySpec();
    doc.description = "sometodostuff";
    const result = await validateFile(renderSpecAsFile(doc), testProfile);
    conforms(result);
  });

  it("does not conform when API description contains empty string", async () => {
    const doc = getHappySpec();
    doc.description = "";
    const result = await validateFile(renderSpecAsFile(doc), testProfile);
    breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#no-todo-text-in-description-fields"
    );
  });

  it("does not conform when API description contains only whitespace", async () => {
    const doc = getHappySpec();
    doc.description = "     ";
    const result = await validateFile(renderSpecAsFile(doc), testProfile);
    breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#no-todo-text-in-description-fields"
    );
  });

  it("does not conform when GET method description contains text 'todo' preceded by whitespace", async () => {
    const doc = getHappySpec();
    doc.description = "     TODO";
    const result = await validateFile(renderSpecAsFile(doc), testProfile);
    breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#no-todo-text-in-description-fields"
    );
  });

  it("does not conform when GET method description is empty string", async () => {
    const doc = getHappySpec();
    doc.description = "";
    const result = await validateFile(renderSpecAsFile(doc), testProfile);
    breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#no-todo-text-in-description-fields"
    );
  });

  it("does not conform when GET method description contains only whitespace", async () => {
    const doc = getHappySpec();
    doc.description = "   ";
    const result = await validateFile(renderSpecAsFile(doc), testProfile);
    breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#no-todo-text-in-description-fields"
    );
  });

  it("does not conform when GET method description contains text 'todo'", async () => {
    const doc = getHappySpec();
    doc["/resource"]["/{resourceId}"].get.description = "This method is TODo";
    const result = await validateFile(renderSpecAsFile(doc), testProfile);
    breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#no-todo-text-in-description-fields"
    );
  });

  it("does not conform when GET method description contains text 'todo' followed by ':'", async () => {
    const doc = getHappySpec();
    doc["/resource"]["/{resourceId}"].get.description = "TODO:";
    const result = await validateFile(renderSpecAsFile(doc), testProfile);
    breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#no-todo-text-in-description-fields"
    );
  });

  it("does not conform when GET method description contains text 'todo' followed by ';'", async () => {
    const doc = getHappySpec();
    doc["/resource"]["/{resourceId}"].get.description = "TODO;";
    const result = await validateFile(renderSpecAsFile(doc), testProfile);
    breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#no-todo-text-in-description-fields"
    );
  });

  it("does not conform when GET method description contains text 'todo' followed by '-'", async () => {
    const doc = getHappySpec();
    doc["/resource"]["/{resourceId}"].get.description = "TODO-";
    const result = await validateFile(renderSpecAsFile(doc), testProfile);
    breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#no-todo-text-in-description-fields"
    );
  });

  it("does not conform when GET method description contains text 'todo' followed by '_'", async () => {
    const doc = getHappySpec();
    doc["/resource"]["/{resourceId}"].get.description = "todo_";
    const result = await validateFile(renderSpecAsFile(doc), testProfile);
    breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#no-todo-text-in-description-fields"
    );
  });

  it("does not conform when POST method description contains text 'todo'", async () => {
    const doc = getHappySpec();
    doc["/resource"]["/{resourceId}"].post.description =
      "This POST method is a TODO operation";
    const result = await validateFile(renderSpecAsFile(doc), testProfile);
    breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#no-todo-text-in-description-fields"
    );
  });

  it("does not conform when PATCH method description contains text 'todo'", async () => {
    const doc = getHappySpec();
    doc["/resource"]["/{resourceId}"].patch.description =
      "This PATCH method is a TODO operation";
    const result = await validateFile(renderSpecAsFile(doc), testProfile);
    breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#no-todo-text-in-description-fields"
    );
  });

  it("does not conform when DELETE method description contains text 'todo'", async () => {
    const doc = getHappySpec();
    doc["/resource"]["/{resourceId}"].delete.description =
      "This DELETE method is a Todo operation";
    const result = await validateFile(renderSpecAsFile(doc), testProfile);
    breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#no-todo-text-in-description-fields"
    );
  });

  it("does not conform when HEAD method description contains text 'todo'", async () => {
    const doc = getHappySpec();
    doc["/resource"]["/{resourceId}"].head.description =
      "This HEAD method is a toDo operation";
    const result = await validateFile(renderSpecAsFile(doc), testProfile);
    breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#no-todo-text-in-description-fields"
    );
  });

  it("does not conform when POST method's 201 response code's description contains text 'todo'", async () => {
    const doc = getHappySpec();
    doc["/resource"]["/{resourceId}"].post.responses["201"].description =
      "201 status TODO";
    const result = await validateFile(renderSpecAsFile(doc), testProfile);
    breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#no-todo-text-in-description-fields"
    );
  });

  it("does not conform when PUT method's 404 response code's description contains text 'todo'", async () => {
    const doc = getHappySpec();
    doc["/resource"]["/{resourceId}"].post.responses["404"].description =
      "404 status TODO";
    const result = await validateFile(renderSpecAsFile(doc), testProfile);
    breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#no-todo-text-in-description-fields"
    );
  });
});
