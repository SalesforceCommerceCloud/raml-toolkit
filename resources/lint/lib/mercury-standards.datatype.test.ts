/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { validateFile } from "../../../src/lint/lint";
import {
  breaksOnlyOneRule,
  breaksTheseRules,
  conforms,
  createCustomProfile,
  generateValidationRules,
  getHappySpec,
  renderSpecAsFile,
} from "../../../testResources/testUtils";

describe("data type definition name checking tests", () => {
  let testProfile: string;

  before(() => {
    testProfile = createCustomProfile(
      generateValidationRules("mercury-standards", ["upper-camelcase-datatype"])
    );
  });

  const UPPER_CAMEL_CASE_RULE =
    "http://a.ml/vocabularies/data#upper-camelcase-datatype";
  it("does not conform when a data type definition is not in upper camel case", async () => {
    const doc = getHappySpec();
    doc.types["camelCaseDataType"] = {};
    const result = await validateFile(renderSpecAsFile(doc), testProfile);
    breaksOnlyOneRule(result, UPPER_CAMEL_CASE_RULE);
  });

  it("does not conform when two data type definitions are not in upper camel case", async () => {
    const doc = getHappySpec();
    doc.types["kebab-case"] = {};
    doc.types["snake_case"] = {};
    const result = await validateFile(renderSpecAsFile(doc), testProfile);
    breaksTheseRules(result, [UPPER_CAMEL_CASE_RULE, UPPER_CAMEL_CASE_RULE]);
  });

  it("does not conform when a data type definition have a space", async () => {
    const doc = getHappySpec();
    doc.types["UpperCamel Case"] = {};
    const result = await validateFile(renderSpecAsFile(doc), testProfile);
    breaksOnlyOneRule(result, UPPER_CAMEL_CASE_RULE);
  });

  it("does not conform when a data type definition have more than one space", async () => {
    const doc = getHappySpec();
    doc.types["Upper  Camel Case"] = {};
    const result = await validateFile(renderSpecAsFile(doc), testProfile);
    breaksOnlyOneRule(result, UPPER_CAMEL_CASE_RULE);
  });

  it("conforms when another data type definitions is in upper camel case", async () => {
    const doc = getHappySpec();
    doc.types["UpperCamelCaseDataType"] = {};
    const result = await validateFile(renderSpecAsFile(doc), testProfile);
    conforms(result);
  });
});
