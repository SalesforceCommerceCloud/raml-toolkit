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
  breaksTheseRules,
  conforms
} from "../testUtils";
import { validateFile } from "../../src/validator";

describe("base uri", () => {
  const PROFILE = "mercury";

  describe("pattern validation", () => {
    const BASE_URI_RULE =
      "http://a.ml/vocabularies/data#base-uri-matches-pattern";
    const TEMPLATE_RULE =
      "http://a.ml/vocabularies/data#camelcase-template-parameters";
    const TITLE_RULE = "http://a.ml/vocabularies/data#title-matches-api-name";
    let doc;

    beforeEach(() => {
      doc = getHappySpec();
    });

    it("should pass if the baseUri matches the pattern", async () => {
      const result = await validateFile(renderSpecAsFile(doc), PROFILE);

      conforms(result);
    });

    it("should fail if the protocol is http", async () => {
      doc["baseUri"] =
        "http://{shortCode}.api.commercecloud.salesforce.com/test-family/test-api/{version}";

      const result = await validateFile(renderSpecAsFile(doc), PROFILE);

      breaksOnlyOneRule(result, BASE_URI_RULE);
    });

    it("should fail if protocol is missing", async () => {
      doc["baseUri"] =
        "{shortCode}.api.commercecloud.salesforce.com/test-family/test-api/{version}";

      const result = await validateFile(renderSpecAsFile(doc), PROFILE);

      breaksOnlyOneRule(result, BASE_URI_RULE);
    });

    it("should fail if shortCode variable is not followed by 'api.commercecloud.salesforce.com'", async () => {
      doc["baseUri"] =
        "https://{shortCode}.api.salesforce.commercecloud.com/test-family/test-api/{version}";

      const result = await validateFile(renderSpecAsFile(doc), PROFILE);

      breaksOnlyOneRule(result, BASE_URI_RULE);
    });

    it("should pass if the api family has more than 2 words ", async () => {
      doc["baseUri"] =
        "https://{shortCode}.api.commercecloud.salesforce.com/test-api-family-name/test-api/{version}";

      const result = await validateFile(renderSpecAsFile(doc), PROFILE);

      conforms(result);
    });

    it("should pass if the api name has more than 2 words ", async () => {
      doc["baseUri"] =
        "https://{shortCode}.api.commercecloud.salesforce.com/test-family/test-dummy-api-name/{version}";
      doc["title"] = "Test Dummy Api Name";

      const result = await validateFile(renderSpecAsFile(doc), PROFILE);

      conforms(result);
    });

    it("should fail if the api family is preceded by 2 forward-slashes", async () => {
      doc["baseUri"] =
        "https://{shortCode}.api.commercecloud.salesforce.com//test-family/test-api/{version}";

      const result = await validateFile(renderSpecAsFile(doc), PROFILE);

      breaksOnlyOneRule(result, BASE_URI_RULE);
    });

    it("should fail if the api name is preceded by 2 forward-slashes", async () => {
      doc["baseUri"] =
        "https://{shortCode}.api.commercecloud.salesforce.com/test-family//test-api/{version}";

      const result = await validateFile(renderSpecAsFile(doc), PROFILE);

      breaksOnlyOneRule(result, BASE_URI_RULE);
    });

    it("should fail if the version variable is preceded by 2 forward-slashes", async () => {
      doc["baseUri"] =
        "https://{shortCode}.api.commercecloud.salesforce.com/test-family/test-api//{version}";

      const result = await validateFile(renderSpecAsFile(doc), PROFILE);

      breaksOnlyOneRule(result, BASE_URI_RULE);
    });

    it("should fail if the api family is camelCase", async () => {
      doc["baseUri"] =
        "https://{shortCode}.api.commercecloud.salesforce.com/testFamily/test-api/{version}";

      const result = await validateFile(renderSpecAsFile(doc), PROFILE);

      breaksOnlyOneRule(result, BASE_URI_RULE);
    });

    it("should fail if the api family is PascalCase", async () => {
      doc["baseUri"] =
        "https://{shortCode}.api.commercecloud.salesforce.com/TestFamily/test-api/{version}";

      const result = await validateFile(renderSpecAsFile(doc), PROFILE);

      breaksOnlyOneRule(result, BASE_URI_RULE);
    });

    it("should fail if the api family is snake_case", async () => {
      doc["baseUri"] =
        "https://{shortCode}.api.commercecloud.salesforce.com/test_family/test-api/{version}";

      const result = await validateFile(renderSpecAsFile(doc), PROFILE);

      breaksOnlyOneRule(result, BASE_URI_RULE);
    });

    it("should fail if the api name is camelCase", async () => {
      doc["baseUri"] =
        "https://{shortCode}.api.commercecloud.salesforce.com/test-family/testApi/{version}";

      const result = await validateFile(renderSpecAsFile(doc), PROFILE);

      breaksOnlyOneRule(result, BASE_URI_RULE);
    });

    it("should fail if the api name is PascalCase", async () => {
      doc["baseUri"] =
        "https://{shortCode}.api.commercecloud.salesforce.com/test-family/TestApi/{version}";

      const result = await validateFile(renderSpecAsFile(doc), PROFILE);

      breaksOnlyOneRule(result, BASE_URI_RULE);
    });

    it("should fail if the api name is snake_case", async () => {
      doc["baseUri"] =
        "https://{shortCode}.api.commercecloud.salesforce.com/test-family/test_api/{version}";

      const result = await validateFile(renderSpecAsFile(doc), PROFILE);

      breaksOnlyOneRule(result, BASE_URI_RULE);
    });

    it("should fail if the shortCode variable is missing", async () => {
      doc["baseUri"] =
        "https://api.commercecloud.salesforce.com/test-family/testApi/{version}";

      const result = await validateFile(renderSpecAsFile(doc), PROFILE);

      breaksOnlyOneRule(result, BASE_URI_RULE);
    });

    it("should fail if the api family or the api name is missing", async () => {
      doc["baseUri"] =
        "https://{shortCode}.api.commercecloud.salesforce.com/test-api/{version}";

      const result = await validateFile(renderSpecAsFile(doc), PROFILE);

      breaksOnlyOneRule(result, BASE_URI_RULE);
    });

    it("should fail if the version variable is missing", async () => {
      doc["baseUri"] =
        "https://{shortCode}.api.commercecloud.salesforce.com/test-family/test-api";

      const result = await validateFile(renderSpecAsFile(doc), PROFILE);

      breaksOnlyOneRule(result, BASE_URI_RULE);
    });

    it("should pass if the baseUri ends with a forward-slash", async () => {
      doc["baseUri"] =
        "https://{shortCode}.api.commercecloud.salesforce.com/test-family/test-api/{version}/";

      const result = await validateFile(renderSpecAsFile(doc), PROFILE);

      conforms(result);
    });

    it("should fail if the shortCode variable is uppercase", async () => {
      doc["baseUri"] =
        "https://{SHORTCODE}.api.commercecloud.salesforce.com/test-family/test-api/{version}";

      const result = await validateFile(renderSpecAsFile(doc), PROFILE);

      breaksTheseRules(result, [BASE_URI_RULE, TEMPLATE_RULE]);
    });

    it("should fail if the version variable is uppercase", async () => {
      doc["baseUri"] =
        "https://{shortCode}.api.commercecloud.salesforce.com/test-family/test-api/{VERSION}";

      const result = await validateFile(renderSpecAsFile(doc), PROFILE);

      breaksTheseRules(result, [BASE_URI_RULE, TEMPLATE_RULE]);
    });

    it("should fail if there is a comma in the baseUri", async () => {
      doc["baseUri"] =
        "https://{shortCode}.api.commercecloud,salesforce.com/test-family/test-api/{VERSION}";

      const result = await validateFile(renderSpecAsFile(doc), PROFILE);

      breaksTheseRules(result, [BASE_URI_RULE, TEMPLATE_RULE]);
    });
  });

  describe("existence validation", () => {
    const ONE_BASE_URI_RULE = "http://a.ml/vocabularies/data#only-one-base-uri";
    let doc;

    beforeEach(() => {
      doc = getHappySpec();
    });

    it("should fail if baseUri is missing", async () => {
      delete doc.baseUri;

      const result = await validateFile(renderSpecAsFile(doc), PROFILE);

      breaksOnlyOneRule(result, ONE_BASE_URI_RULE);
    });
  });
});
