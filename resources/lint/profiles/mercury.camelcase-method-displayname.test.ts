/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
"use strict";
import * as validator from "../../../src/lint/lint";
import * as utils from "../../../testResources/testUtils";

const PROFILE = "mercury";

describe("camelcase method displayname tests", () => {
  const QUERY_RULE =
    "http://a.ml/vocabularies/data#camelcase-method-displayname";
  let doc;

  beforeEach(function () {
    doc = utils.getHappySpec();
  });

  it("does not conform when method display name is missing from method", async () => {
    delete doc["/resource"]["/{resourceId}"].get.displayName;
    const result = await validator.validateFile(
      utils.renderSpecAsFile(doc),
      PROFILE
    );
    utils.breaksOnlyOneRule(result, QUERY_RULE);
  });

  it("does not conform when method display name is kebab-case and not camelCase", async () => {
    doc["/resource"]["/{resourceId}"].get.displayName = "not-camel-case";
    const result = await validator.validateFile(
      utils.renderSpecAsFile(doc),
      PROFILE
    );
    utils.breaksOnlyOneRule(result, QUERY_RULE);
  });

  it("does not conform when method display name is snake_case and not camelCase", async () => {
    doc["/resource"]["/{resourceId}"].get.displayName = "not_camel_case";
    const result = await validator.validateFile(
      utils.renderSpecAsFile(doc),
      PROFILE
    );
    utils.breaksOnlyOneRule(result, QUERY_RULE);
  });

  it("does not conform when method display name is PascalCase and not camelCase", async () => {
    doc["/resource"]["/{resourceId}"].get.displayName = "PascalCase";
    const result = await validator.validateFile(
      utils.renderSpecAsFile(doc),
      PROFILE
    );
    utils.breaksOnlyOneRule(result, QUERY_RULE);
  });
});
