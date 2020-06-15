/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-disable no-undef */
"use strict";
import { validateFile } from "../../../src/lint/lint";
import {
  getHappySpec,
  renameKey,
  conforms,
  breaksOnlyOneRule,
  renderSpecAsFile
} from "../../../test/testUtils";

const PROFILE = "mercury";

describe("camelcase query parameters test", () => {
  const CC_RULE = "http://a.ml/vocabularies/data#camelcase-query-parameters";
  let doc;
  let parameters;

  beforeEach(function() {
    doc = getHappySpec();
    parameters = doc["/resource"]["/{resourceId}"].get.queryParameters;
  });

  it("conforms when parameter is one lowercase letter", async () => {
    renameKey(parameters, "expand", "c");
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    conforms(result);
  });

  it("conforms when parameter is camelcase", async () => {
    renameKey(parameters, "expand", "camelCase");
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    conforms(result);
  });

  it("conforms when parameter is multiple word camelcase", async () => {
    renameKey(parameters, "expand", "camelCaseMultipleWords");
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    conforms(result);
  });

  it("fails when parameter is kebabcase instead of camelcase", async () => {
    renameKey(parameters, "expand", "kebab-case");
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    breaksOnlyOneRule(result, CC_RULE);
  });

  it("fails when parameter is Pascalcase instead of camelcase", async () => {
    renameKey(parameters, "expand", "PascalCase");
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    breaksOnlyOneRule(result, CC_RULE);
  });

  it("fails when parameter is snakecase instead of camelcase", async () => {
    renameKey(parameters, "expand", "snake_case");
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    breaksOnlyOneRule(result, CC_RULE);
  });

  it("fails when parameter has uppercase acronym", async () => {
    renameKey(parameters, "expand", "notCMLCase");
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    breaksOnlyOneRule(result, CC_RULE);
  });

  it("fails when parameter has a space", async () => {
    renameKey(parameters, "expand", "not camel case");
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    breaksOnlyOneRule(result, CC_RULE);
  });
});
