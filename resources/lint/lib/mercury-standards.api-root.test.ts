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
  breaksOnlyOneRule,
  renderSpecAsFile,
  createCustomProfile,
  generateValidationRules,
} from "../../../testResources/testUtils";

describe("mediaType checking tests", () => {
  let testProfile: string;

  before(() => {
    testProfile = createCustomProfile(
      generateValidationRules("mercury-standards", ["require-json"])
    );
  });

  it("does not conform when mediaType is missing", async () => {
    const doc = getHappySpec();
    delete doc.mediaType;
    const result = await validateFile(renderSpecAsFile(doc), testProfile);
    breaksOnlyOneRule(result, "http://a.ml/vocabularies/data#require-json");
  });

  it("does not conform when the mediaType is xml", async () => {
    const doc = getHappySpec();
    doc.mediaType = "application/xml";
    const result = await validateFile(renderSpecAsFile(doc), testProfile);
    breaksOnlyOneRule(result, "http://a.ml/vocabularies/data#require-json");
  });
});

describe("protocol checking tests", () => {
  let testProfile: string;

  before(() => {
    testProfile = createCustomProfile(
      generateValidationRules("mercury-standards", ["https-required"])
    );
  });

  it("does not conform when protocol is missing", async () => {
    const doc = getHappySpec();
    delete doc.protocols;
    const result = await validateFile(renderSpecAsFile(doc), testProfile);
    breaksOnlyOneRule(result, "https-required");
  });

  it("does not conform when the protocol is http", async () => {
    const doc = getHappySpec();
    doc.protocols = "http";
    const result = await validateFile(renderSpecAsFile(doc), testProfile);
    breaksOnlyOneRule(result, "https-required");
  });
});

describe("title checking tests", () => {
  let testProfile: string;

  before(() => {
    testProfile = createCustomProfile({});
  });

  it("does not conform when title is missing", async () => {
    const doc = getHappySpec();
    delete doc.title;
    const result = await validateFile(renderSpecAsFile(doc), testProfile);
    breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/amf/parser#WebAPI-name-minCount"
    );
  });
});

describe("description checking tests", () => {
  let testProfile: string;

  before(() => {
    testProfile = createCustomProfile(
      generateValidationRules("mercury-standards", ["require-api-description"])
    );
  });

  it("does not conform when description is missing", async () => {
    const doc = getHappySpec();
    delete doc.description;
    const result = await validateFile(renderSpecAsFile(doc), testProfile);
    breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#require-api-description"
    );
  });
});
