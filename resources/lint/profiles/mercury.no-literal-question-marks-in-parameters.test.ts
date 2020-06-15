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
  breaksTheseRules,
  renderSpecAsFile
} from "../../../test/testUtils";

const PROFILE = "mercury";

describe("no literal question marks in query parameters tests", () => {
  const CC_RULE = "http://a.ml/vocabularies/data#camelcase-query-parameters";
  const QUERY_RULE =
    "http://a.ml/vocabularies/data#no-literal-question-marks-in-parameters";
  const TEMPLATE_RULE =
    "http://a.ml/vocabularies/data#camelcase-template-parameters";
  let doc;
  let parameters;

  beforeEach(function() {
    doc = getHappySpec();
    parameters = doc["/resource"]["/{resourceId}"].get.queryParameters;
  });

  it("conforms when parameter has a question mark and required field is not present", async () => {
    renameKey(parameters, "expand", "expand?");
    delete parameters["expand?"].required;
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    conforms(result);
  });

  it("fails when parameter has a question mark and required field is false", async () => {
    renameKey(parameters, "expand", "expand?");
    parameters["expand?"].required = false;
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    breaksTheseRules(result, [CC_RULE, QUERY_RULE]);
  });

  it("fails when parameter has a question mark and required field is true", async () => {
    renameKey(parameters, "expand", "expand?");
    parameters["expand?"].required = true;
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    breaksTheseRules(result, [CC_RULE, QUERY_RULE]);
  });

  it("fails when parameter has 2 question mark and required field is not present", async () => {
    renameKey(parameters, "expand", "expand??");
    delete parameters["expand??"].required;
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    breaksTheseRules(result, [CC_RULE, QUERY_RULE]);
  });

  it("fails when parameter has 2 question mark and required field is false", async () => {
    renameKey(parameters, "expand", "expand??");
    parameters["expand??"].required = false;
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    breaksTheseRules(result, [CC_RULE, QUERY_RULE]);
  });

  it("fails when parameter has 2 question mark and required field is true", async () => {
    renameKey(parameters, "expand", "expand??");
    parameters["expand??"].required = true;
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    breaksTheseRules(result, [CC_RULE, QUERY_RULE]);
  });

  it("fails when path parameter has a question mark", async () => {
    renameKey(doc["/resource"], "/{resourceId}", "/{resourceId?}");
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    breaksTheseRules(result, [TEMPLATE_RULE, QUERY_RULE]);
  });
});
