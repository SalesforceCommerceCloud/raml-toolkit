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
