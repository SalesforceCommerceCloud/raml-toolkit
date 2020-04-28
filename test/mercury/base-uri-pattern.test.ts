/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-disable no-undef */
"use strict";
import {
  getHappySpec,
  renderSpecAsFile,
  breaksOnlyOneRule,
  conforms
} from "../utils.test";
import { validateFile } from "../../src/validator";

const PROFILE = "mercury";
const RULE = "http://a.ml/vocabularies/data#base-uri-matches-pattern";

describe("base uri pattern validation", () => {
  let doc;

  beforeEach(() => {
    doc = getHappySpec();
  });

  it("should conform if the baseUri matches the pattern", async () => {
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);

    conforms(result);
  });

  it("should not conform if the baseUri is missing", async () => {
    delete doc.baseUri;

    const result = await validateFile(renderSpecAsFile(doc), PROFILE);

    breaksOnlyOneRule(result, RULE);
  });

  it("should not conform if the protocol is http", async () => {
    doc["baseUri"] =
      "http://{shortCode}.api.commercecloud.salesforce.com/test-family/test-api/{version}";

    const result = await validateFile(renderSpecAsFile(doc), PROFILE);

    breaksOnlyOneRule(result, RULE);
  });

  it("should not conform if the protocol is missing", async () => {
    doc["baseUri"] =
      "{shortCode}.api.commercecloud.salesforce.com/test-family/test-api/{version}";

    const result = await validateFile(renderSpecAsFile(doc), PROFILE);

    breaksOnlyOneRule(result, RULE);
  });

  it("should not conform if the shortCode is not followed by 'api.commercecloud.salesforce.com'", async () => {
    doc["baseUri"] =
      "https://{shortCode}.api.salesforce.commercecloud.com/test-family/test-api/{version}";

    const result = await validateFile(renderSpecAsFile(doc), PROFILE);

    breaksOnlyOneRule(result, RULE);
  });

  it("should not conform if the api family is camelCase", async () => {
    doc["baseUri"] =
      "https://{shortCode}.api.commercecloud.salesforce.com/testFamily/test-api/{version}";

    const result = await validateFile(renderSpecAsFile(doc), PROFILE);

    breaksOnlyOneRule(result, RULE);
  });

  it("should not conform if the api family is PascalCase", async () => {
    doc["baseUri"] =
      "https://{shortCode}.api.commercecloud.salesforce.com/TestFamily/test-api/{version}";

    const result = await validateFile(renderSpecAsFile(doc), PROFILE);

    breaksOnlyOneRule(result, RULE);
  });

  it("should not conform if the api family is snake_case", async () => {
    doc["baseUri"] =
      "https://{shortCode}.api.commercecloud.salesforce.com/test_family/test-api/{version}";

    const result = await validateFile(renderSpecAsFile(doc), PROFILE);

    breaksOnlyOneRule(result, RULE);
  });
  
  it("should not conform if the api name is camelCase", async () => {
    doc["baseUri"] =
      "https://{shortCode}.api.commercecloud.salesforce.com/test-family/testApi/{version}";

    const result = await validateFile(renderSpecAsFile(doc), PROFILE);

    breaksOnlyOneRule(result, RULE);
  });

  it("should not conform if the api name is PascalCase", async () => {
    doc["baseUri"] =
      "https://{shortCode}.api.commercecloud.salesforce.com/test-family/TestApi/{version}";

    const result = await validateFile(renderSpecAsFile(doc), PROFILE);

    breaksOnlyOneRule(result, RULE);
  });

  it("should not conform if the api name is snake_case", async () => {
    doc["baseUri"] =
      "https://{shortCode}.api.commercecloud.salesforce.com/test-family/test_api/{version}";

    const result = await validateFile(renderSpecAsFile(doc), PROFILE);

    breaksOnlyOneRule(result, RULE);
  });

  it("should not conform if shortCode is missing ", async () => {
    doc["baseUri"] =
      "https://api.commercecloud.salesforce.com/test-family/testApi/{version}";

    const result = await validateFile(renderSpecAsFile(doc), PROFILE);

    breaksOnlyOneRule(result, RULE);
  });

  it("should not conform if the api family or the api name is missing", async () => {
    doc["baseUri"] =
      "https://{shortCode}.api.commercecloud.salesforce.com/test-api/{version}";

    const result = await validateFile(renderSpecAsFile(doc), PROFILE);

    breaksOnlyOneRule(result, RULE);
  });

  it("should not conform if the version is missing", async () => {
    doc["baseUri"] =
      "https://{shortCode}.api.commercecloud.salesforce.com/test-family/test-api";

    const result = await validateFile(renderSpecAsFile(doc), PROFILE);

    breaksOnlyOneRule(result, RULE);
  });

  it("should not conform if the baseUri doesn't end with {version}", async () => {
    doc["baseUri"] =
      "https://{shortCode}.api.commercecloud.salesforce.com/test-family/test-api/{version}/";

    const result = await validateFile(renderSpecAsFile(doc), PROFILE);

    breaksOnlyOneRule(result, RULE);
  });
});
