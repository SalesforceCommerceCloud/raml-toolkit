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
  renameKey,
  conforms,
  breaksOnlyOneRule,
  renderSpecAsFile
} from "../../../test/testUtils";

const PROFILE = "mercury";

describe("no literal question marks in property name tests", () => {
  const PROPERTY_RULE =
    "http://a.ml/vocabularies/data#no-literal-question-marks-in-property-names";
  let doc;
  let properties;
  let datatypeProperties;

  beforeEach(function() {
    doc = getHappySpec();
    properties =
      doc["/resource"]["/{resourceId}"].get.responses["200"].body[
        "application/json"
      ].properties;
    datatypeProperties = doc.types.ClassA.properties;
  });

  it("conforms when property has a question mark and required field is not present", async () => {
    renameKey(properties, "allowed_currencies", "allowed_currencies?");
    delete properties["allowed_currencies?"].required;
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    conforms(result);
  });

  it("fails when property has a question mark and required field is false", async () => {
    renameKey(properties, "allowed_currencies", "allowed_currencies?");
    properties["allowed_currencies?"].required = false;
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    breaksOnlyOneRule(result, PROPERTY_RULE);
  });

  it("fails when property has a question mark and required field is true", async () => {
    renameKey(properties, "allowed_currencies", "allowed_currencies?");
    properties["allowed_currencies?"].required = true;
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    breaksOnlyOneRule(result, PROPERTY_RULE);
  });

  it("fails when property has 2 question mark and required field is not present", async () => {
    renameKey(properties, "allowed_currencies", "allowed_currencies??");
    delete properties["allowed_currencies??"].required;
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    breaksOnlyOneRule(result, PROPERTY_RULE);
  });

  it("fails when property has 2 question mark and required field is false", async () => {
    renameKey(properties, "allowed_currencies", "allowed_currencies??");
    properties["allowed_currencies??"].required = false;
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    breaksOnlyOneRule(result, PROPERTY_RULE);
  });

  it("fails when property has 2 question mark and required field is true", async () => {
    renameKey(properties, "allowed_currencies", "allowed_currencies??");
    properties["allowed_currencies??"].required = true;
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    breaksOnlyOneRule(result, PROPERTY_RULE);
  });

  it("conforms when property has no question mark and required field is not present", async () => {
    delete properties.allowed_currencies.required;
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    conforms(result);
  });

  it("conforms when property has no question mark and required field is false", async () => {
    properties.allowed_currencies.required = false;
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    conforms(result);
  });

  it("conforms when property has no question mark and required field is true", async () => {
    properties.allowed_currencies.required = true;
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    conforms(result);
  });

  it("conforms when datatype property has a question mark and required field is not present", async () => {
    renameKey(datatypeProperties, "property1", "property1?");
    delete datatypeProperties["property1?"].required;
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    conforms(result);
  });

  it("fails when datatype property has a question mark and required field is false", async () => {
    renameKey(datatypeProperties, "property1", "property1?");
    datatypeProperties["property1?"].required = false;
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    breaksOnlyOneRule(result, PROPERTY_RULE);
  });

  it("fails when datatype property has a question mark and required field is true", async () => {
    renameKey(datatypeProperties, "property1", "property1?");
    datatypeProperties["property1?"].required = true;
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    breaksOnlyOneRule(result, PROPERTY_RULE);
  });

  it("fails when datatype property has 2 question mark and required field is not present", async () => {
    renameKey(datatypeProperties, "property1", "property1??");
    delete datatypeProperties["property1??"].required;
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    breaksOnlyOneRule(result, PROPERTY_RULE);
  });

  it("fails when datatype property has 2 question mark and required field is false", async () => {
    renameKey(datatypeProperties, "property1", "property1??");
    datatypeProperties["property1??"].required = false;
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    breaksOnlyOneRule(result, PROPERTY_RULE);
  });

  it("fails when datatype property has 2 question mark and required field is true", async () => {
    renameKey(datatypeProperties, "property1", "property1??");
    datatypeProperties["property1??"].required = true;
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    breaksOnlyOneRule(result, PROPERTY_RULE);
  });
});
