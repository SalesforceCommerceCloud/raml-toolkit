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
  renderSpecAsFile
} from "../utils.test";

const PROFILE = "mercury";

describe("baseUriParameters checking tests", () => {
  it("conforms when shortCode is only baseUriParameter", async () => {
    const doc = getHappySpec();
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    conforms(result);
  });

  it("does not conform when shortCode is missing from baseUriParameters", async () => {
    const doc = getHappySpec();
    // We have to change the baseUri because it's implicit if it appears in the template
    doc["baseUri"] = "https://example.com";
    delete doc["baseUriParameters"]["shortCode"];
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#baseuriparameters-must-only-have-shortcode"
    );
  });

  it("does not conform with additional baseUriParameters", async () => {
    const doc = getHappySpec();
    doc["baseUri"] =
      "https://{shortCode}.api.commercecloud.salesforce.com/checkout/shopper-orders/{version}/{anotherParameter}";
    doc["baseUriParameters"]["anotherParameter"] = {
      description: "my additional parameter",
      example: "hello"
    };
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#baseuriparameters-must-only-have-shortcode"
    );
  });

  it("does not conform with additional baseUriParameters in different position", async () => {
    const doc = getHappySpec();
    doc["baseUri"] =
      "https://{shortCode}.api.commercecloud.salesforce.com/checkout/{apiFamily}/{version}";
    doc["baseUriParameters"]["apiFamily"] = {
      description: "my additional parameter",
      example: "hello"
    };
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#baseuriparameters-must-only-have-shortcode"
    );
  });
});
