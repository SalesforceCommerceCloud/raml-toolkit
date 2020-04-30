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
  breaksTheseRules,
  renameKey,
  renderSpecAsFile
} from "../utils.test";

const PROFILE = "mercury";
const TEMPLATE_RULE = "http://a.ml/vocabularies/data#camelcase-template-parameters";

describe("template parameter checking tests", () => {
  it("fails when template starts with capital", async () => {
    const doc = getHappySpec();
    renameKey(doc["/resource"], "/{resourceId}", "/{ResourceId}");
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    breaksOnlyOneRule(result, TEMPLATE_RULE);
  });

  it("fails when template starts with number", async () => {
    const doc = getHappySpec();
    renameKey(doc["/resource"], "/{resourceId}", "/{9esourceId}");
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    breaksOnlyOneRule(result, TEMPLATE_RULE);
  });

  it("fails when template has a space", async () => {
    const doc = getHappySpec();
    renameKey(doc["/resource"], "/{resourceId}", "/{resource Id}");
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    breaksOnlyOneRule(result, TEMPLATE_RULE);
  });

  it("fails when template has a space", async () => {
    const doc = getHappySpec();
    renameKey(doc["/resource"], "/{resourceId}", "/{resource Id}");
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    breaksOnlyOneRule(result, TEMPLATE_RULE);
  });

  it("fails when template has a dash", async () => {
    const doc = getHappySpec();
    renameKey(doc["/resource"], "/{resourceId}", "/{resource-id}");
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    breaksOnlyOneRule(result, TEMPLATE_RULE);
  });

  it("does not conform when template is in caps", async () => {
    const doc = getHappySpec();
    renameKey(doc["/resource"], "/{resourceId}", "/{ID}");
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    breaksOnlyOneRule(result, TEMPLATE_RULE);
  });

  it("fails when template has underscores", async () => {
    const doc = getHappySpec();
    renameKey(doc["/resource"], "/{resourceId}", "/{resource_id}");
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    breaksOnlyOneRule(result, TEMPLATE_RULE);
  });
});
