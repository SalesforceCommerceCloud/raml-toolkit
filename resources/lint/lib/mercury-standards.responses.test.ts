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
  renameKey,
  renderSpecAsFile,
  createCustomProfile,
  generateValidationRules,
  breaksOnlyOneRule,
} from "../../../testResources/testUtils";

describe("response description checking tests", () => {
  let testProfile: string;

  before(() => {
    testProfile = createCustomProfile(
      generateValidationRules("mercury-standards", [
        "require-response-description",
        "at-least-one-2xx-or-3xx-response",
      ])
    );
  });

  it("does not conform when description is missing from response", async () => {
    const doc = getHappySpec();
    delete doc["/resource"]["/{resourceId}"].get.responses["200"].description;
    const result = await validateFile(renderSpecAsFile(doc), testProfile);
    breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#require-response-description"
    );
  });

  it("does not conform without a 2xx or 3xx response", async () => {
    const doc = getHappySpec();
    delete doc["/resource"]["/{resourceId}"].get.responses["200"];
    const result = await validateFile(renderSpecAsFile(doc), testProfile);
    breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#at-least-one-2xx-or-3xx-response"
    );
  });

  it("does conform with a 3xx response and no 2xx", async () => {
    const doc = getHappySpec();
    renameKey(doc["/resource"]["/{resourceId}"].get.responses, "200", "301");
    const result = await validateFile(renderSpecAsFile(doc), testProfile);
    conforms(result);
  });
});
