/* eslint-disable no-undef */
"use strict";
const validator = require("../../validator");
const utils = require("../utils");

const PROFILE = "mercury-profile";

describe("camelcase query parameters test", () => {
  const CC_RULE = "http://a.ml/vocabularies/data#camelcase-query-parameters";
  let doc;
  let parameters;

  beforeEach(function() {
    doc = utils.getHappySpec();
    parameters = doc["/resource"]["/{resourceId}"].get.queryParameters;
  });

  it("conforms when parameter is one lowercase letter", async () => {
    utils.renameKey(parameters, "expand", "c");
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.conforms(result);
  });

  it("conforms when parameter is camelcase", async () => {
    utils.renameKey(parameters, "expand", "camelCase");
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.conforms(result);
  });

  it("conforms when parameter is multiple word camelcase", async () => {
    utils.renameKey(parameters, "expand", "camelCaseMultipleWords");
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.conforms(result);
  });

  it("fails when parameter is kebabcase instead of camelcase", async () => {
    utils.renameKey(parameters, "expand", "kebab-case");
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.breaksOnlyOneRule(result, CC_RULE);
  });

  it("fails when parameter is Pascalcase instead of camelcase", async () => {
    utils.renameKey(parameters, "expand", "PascalCase");
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.breaksOnlyOneRule(result, CC_RULE);
  });

  it("fails when parameter is snakecase instead of camelcase", async () => {
    utils.renameKey(parameters, "expand", "snake_case");
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.breaksOnlyOneRule(result, CC_RULE);
  });

  it("fails when parameter has uppercase acronym", async () => {
    utils.renameKey(parameters, "expand", "notCMLCase");
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.breaksOnlyOneRule(result, CC_RULE);
  });

  it("fails when parameter has a space", async () => {
    utils.renameKey(parameters, "expand", "not camel case");
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.breaksOnlyOneRule(result, CC_RULE);
  });
});
