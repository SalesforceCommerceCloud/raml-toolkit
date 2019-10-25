/* eslint-disable no-undef */
"use strict";
const validator = require("../../validator");
const utils = require("../utils");

const PROFILE = "sdk-ready";

describe("camelcase query parameters test", () => {
  const QUERY_RULE = "http://a.ml/vocabularies/data#camelcase-query-parameters";
  let doc;
  let parameters;

  beforeEach(function() {
    doc = utils.getHappySpec();
    parameters = doc["/resource"]["/{resourceId}"].get.queryParameters;
  });

  it("conforms when parameter is camelcase", async () => {
    utils.renameKey(parameters, "expand", "camelCase");
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.conforms(result);
  });

  it("fails when parameter is kebabcase instead of camelcase", async () => {
    utils.renameKey(parameters, "expand", "kebab-case");
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.breaksOnlyOneRule(result, QUERY_RULE);
  });

  it("fails when parameter is Pascalcase instead of camelcase", async () => {
    utils.renameKey(parameters, "expand", "PascalCase");
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.breaksOnlyOneRule(result, QUERY_RULE);
  });

  it("fails when parameter is snakecase instead of camelcase", async () => {
    utils.renameKey(parameters, "expand", "snake_case");
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.breaksOnlyOneRule(result, QUERY_RULE);
  });

  it("fails when parameter has uppercase acronym", async () => {
    utils.renameKey(parameters, "expand", "notCMLCase");
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.breaksOnlyOneRule(result, QUERY_RULE);
  });

  it("fails when parameter has a space", async () => {
    utils.renameKey(parameters, "expand", "not camel case");
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.breaksOnlyOneRule(result, QUERY_RULE);
  });
});
