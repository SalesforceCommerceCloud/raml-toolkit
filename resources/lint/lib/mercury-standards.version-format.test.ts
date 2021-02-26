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
  breaksTheseRules,
  createCustomProfile,
  generateValidationRules,
  breaksOnlyOneRule,
} from "../../../testResources/testUtils";
import { validateFile } from "../../../src/lint/lint";

describe("version checking tests", () => {
    let testProfile: string;

    before(() => {
      testProfile = createCustomProfile(
        generateValidationRules("mercury-standards", ["version-format"])
      );
    });

    /**
     * Test breaks 2 rules
     * 1. version-format
     * 2. implicit-version-parameter-without-api-version ('baseUri' defines 'version' variable without the API defining one)
     * implicit-version-parameter-without-api-version is the default rule provided by the amf
     */
    it("does not conform when missing the version", async () => {
      const doc = getHappySpec();
      delete doc.version;
      const result = await validateFile(renderSpecAsFile(doc), testProfile);
      breaksTheseRules(result, [
        "http://a.ml/vocabularies/data#version-format",
        "http://a.ml/vocabularies/amf/parser#implicit-version-parameter-without-api-version",
      ]);
    });
  
    it("does not conform when the version has a decimal in it", async () => {
      const doc = getHappySpec();
      doc.version = "v1.1";
      const result = await validateFile(renderSpecAsFile(doc), testProfile);
      breaksOnlyOneRule(result, "http://a.ml/vocabularies/data#version-format");
    });
  
    it("does not conform when the version is capitalized", async () => {
      const doc = getHappySpec();
      doc.version = "V1";
      const result = await validateFile(renderSpecAsFile(doc), testProfile);
      breaksOnlyOneRule(result, "http://a.ml/vocabularies/data#version-format");
    });
  
    it("does not conform when the version isn't prefixed by a 'v'", async () => {
      const doc = getHappySpec();
      doc.version = "1";
      const result = await validateFile(renderSpecAsFile(doc), testProfile);
      breaksOnlyOneRule(result, "http://a.ml/vocabularies/data#version-format");
    });
});