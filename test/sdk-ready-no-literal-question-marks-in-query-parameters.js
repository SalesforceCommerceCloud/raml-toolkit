/* eslint-disable no-undef */
"use strict";
const validator = require("../validator");
const utils = require("./utils");

const PROFILE = "sdk-ready";

describe("no literal question marks in query parameters tests", () => {
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
    utils.breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#no-literal-question-marks-in-query-parameters"
    );
  });

  it("fails when parameter has a question mark and required field is true", async () => {
    utils.renameKey(parameters, "expand", "expand?");
    parameters["expand?"].required = true;
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);
    utils.breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#no-literal-question-marks-in-query-parameters"
    );
  });
});
