/* eslint-disable no-undef */
"use strict";
const validator = require("../../validator");
const utils = require("../utils");

const PROFILE = "mercury-profile";

describe("camelcase method displayname tests", () => {
  const QUERY_RULE =
    "http://a.ml/vocabularies/data#camelcase-method-displayname";
  let doc;

  beforeEach(function() {
    doc = utils.getHappySpec();
  });

  it("does not conform when method display name is missing from method", async () => {
    delete doc["/resource"]["/{resourceId}"].get.displayName;
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.breaksOnlyOneRule(result, QUERY_RULE);
  });

  it("does not conform when method display name is kebab-case and not camelcase", async () => {
    doc["/resource"]["/{resourceId}"].get.displayName = "not-camel-case";
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.breaksOnlyOneRule(result, QUERY_RULE);
  });

  it("does not conform when method display name is snake_case and not camelcase", async () => {
    doc["/resource"]["/{resourceId}"].get.displayName = "not_camel_case";
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.breaksOnlyOneRule(result, QUERY_RULE);
  });

  it("does not conform when method display name is PascalCase and not camelcase", async () => {
    doc["/resource"]["/{resourceId}"].get.displayName = "PascalCase";
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.breaksOnlyOneRule(result, QUERY_RULE);
  });
});
