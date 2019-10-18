/* eslint-disable no-undef */
"use strict";
const validator = require("../validator");
const utils = require("./utils");

const PROFILE = "sdk-ready";

describe("no literal question marks in property name tests", () => {
  let doc;
  let properties;
  let datatypeProperties;

  beforeEach(function() {
    doc = utils.getHappySpec();
    properties =
      doc["/resource"]["/{resourceId}"].get.responses["200"].body[
        "application/json"
      ].properties;
    datatypeProperties = doc.types.ClassA.properties;
  });

  it("conforms when property has a question mark and required field is not present", async () => {
    utils.renameKey(properties, "allowed_currencies", "allowed_currencies?");
    delete properties["allowed_currencies?"].required;
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.conforms(result);
  });

  it("fails when property has a question mark and required field is false", async () => {
    utils.renameKey(properties, "allowed_currencies", "allowed_currencies?");
    properties["allowed_currencies?"].required = false;
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#no-literal-question-marks-in-property-names"
    );
  });

  it("fails when property has a question mark and required field is true", async () => {
    utils.renameKey(properties, "allowed_currencies", "allowed_currencies?");
    properties["allowed_currencies?"].required = true;
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#no-literal-question-marks-in-property-names"
    );
  });

  it("conforms when property has no question mark and required field is not present", async () => {
    delete properties.allowed_currencies.required;
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.conforms(result);
  });

  it("conforms when property has no question mark and required field is false", async () => {
    properties.allowed_currencies.required = false;
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.conforms(result);
  });

  it("conforms when property has no question mark and required field is true", async () => {
    properties.allowed_currencies.required = true;
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.conforms(result);
  });

  it("conforms when datatype property has a question mark and required field is not present", async () => {
    utils.renameKey(datatypeProperties, "property1", "property1?");
    delete datatypeProperties["property1?"].required;
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.conforms(result);
  });

  it("fails when datatype property has a question mark and required field is false", async () => {
    utils.renameKey(datatypeProperties, "property1", "property1?");
    datatypeProperties["property1?"].required = false;
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#no-literal-question-marks-in-property-names"
    );
  });

  it("fails when datatype property has a question mark and required field is true", async () => {
    utils.renameKey(datatypeProperties, "property1", "property1?");
    datatypeProperties["property1?"].required = true;
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#no-literal-question-marks-in-property-names"
    );
  });
});
