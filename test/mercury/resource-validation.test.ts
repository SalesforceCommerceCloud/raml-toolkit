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
const NAME_VALIDATION =
  "http://a.ml/vocabularies/data#resource-name-validation";

describe("resource checking tests", () => {
  it("does not conform when resource is in capitals", async () => {
    const doc = getHappySpec();
    renameKey(doc, "/resource", "/RESOURCE");
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    // This validates the resolved path of each resource so this causes a
    // failure for this resource AND any child resources. We need to expect
    // multiple failures
    breaksTheseRules(result, [NAME_VALIDATION, NAME_VALIDATION]);
  });

  it("does not conform when resource starts with underscore", async () => {
    const doc = getHappySpec();
    renameKey(doc, "/resource", "/_RESOURCE");
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    breaksTheseRules(result, [NAME_VALIDATION, NAME_VALIDATION]);
  });

  it("does not conform when resource ends with dash", async () => {
    const doc = getHappySpec();
    renameKey(doc, "/resource", "/resource-");
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    breaksTheseRules(result, [NAME_VALIDATION, NAME_VALIDATION]);
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
    breaksTheseRules(result, [NAME_VALIDATION, NAME_VALIDATION]);
  });

  it("conforms when resource contains multiple literal parts", async () => {
    const doc = getHappySpec();
    renameKey(doc, "/resource", "/path/is/ok");
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    conforms(result);
  });

  it("conforms when resource contains multiple literal parts and template", async () => {
    const doc = getHappySpec();
    renameKey(doc, "/resource", "/path/is/{ok}");
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    conforms(result);
  });

  it("does not conform when resource starts with symbol", async () => {
    const doc = getHappySpec();
    renameKey(doc, "/resource", "/-path");
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    breaksTheseRules(result, [NAME_VALIDATION, NAME_VALIDATION]);
  });

  it("does not conform when resource contains multiple literal parts and starts with symbol", async () => {
    const doc = getHappySpec();
    renameKey(doc, "/resource", "/-path/is/ok");
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    breaksTheseRules(result, [NAME_VALIDATION, NAME_VALIDATION]);
  });

  it("conforms when resource contains hyphens", async () => {
    const doc = getHappySpec();
    renameKey(doc, "/resource", "/this-resource");
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    conforms(result);
  });

});
