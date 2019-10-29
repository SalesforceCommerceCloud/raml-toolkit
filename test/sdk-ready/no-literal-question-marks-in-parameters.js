/* eslint-disable no-undef */
"use strict";
const validator = require("../../validator");
const utils = require("../utils");

const PROFILE = "sdk-ready";

describe("no literal question marks in query parameters tests", () => {
  const CC_RULE = "http://a.ml/vocabularies/data#camelcase-query-parameters";
  const ENDPOINT_RULE =
    "http://a.ml/vocabularies/data#resource-name-validation";
  const QUERY_RULE =
    "http://a.ml/vocabularies/data#no-literal-question-marks-in-parameters";
  let doc;
  let parameters;

  beforeEach(function() {
    doc = utils.getHappySpec();
    parameters = doc["/resource"]["/{resourceId}"].get.queryParameters;
  });

  it("conforms when parameter has a question mark and required field is not present", async () => {
    utils.renameKey(parameters, "expand", "expand?");
    delete parameters["expand?"].required;
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.conforms(result);
  });

  it("fails when parameter has a question mark and required field is false", async () => {
    utils.renameKey(parameters, "expand", "expand?");
    parameters["expand?"].required = false;
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.breaksTheseRules(result, [CC_RULE, QUERY_RULE]);
  });

  it("fails when parameter has a question mark and required field is true", async () => {
    utils.renameKey(parameters, "expand", "expand?");
    parameters["expand?"].required = true;
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.breaksTheseRules(result, [CC_RULE, QUERY_RULE]);
  });

  it("fails when parameter has 2 question mark and required field is not present", async () => {
    utils.renameKey(parameters, "expand", "expand??");
    delete parameters["expand??"].required;
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.breaksTheseRules(result, [CC_RULE, QUERY_RULE]);
  });

  it("fails when parameter has 2 question mark and required field is false", async () => {
    utils.renameKey(parameters, "expand", "expand??");
    parameters["expand??"].required = false;
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.breaksTheseRules(result, [CC_RULE, QUERY_RULE]);
  });

  it("fails when parameter has 2 question mark and required field is true", async () => {
    utils.renameKey(parameters, "expand", "expand??");
    parameters["expand??"].required = true;
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.breaksTheseRules(result, [CC_RULE, QUERY_RULE]);
  });

  it("fails when path parameter has a question mark", async () => {
    utils.renameKey(doc["/resource"], "/{resourceId}", "/{resourceId?}");
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.breaksTheseRules(result, [ENDPOINT_RULE, QUERY_RULE]);
  });
});
