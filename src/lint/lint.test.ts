/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
"use strict";
import { expect, default as chai } from "chai";
import sinon from "sinon";
import chaiAsPromised from "chai-as-promised";
import { model } from "amf-client-js";
import { printResults, validateFile, validateCustom } from "./lint";
import {
  getHappySpec,
  renderSpecAsFile,
  getSingleInvalidFile
} from "../../testResources/testUtils";

const PROFILE = "mercury";

before(() => {
  chai.use(chaiAsPromised);
});

describe("#printResults", () => {
  let consoleSpy;

  beforeEach(() => {
    consoleSpy = sinon.spy(console, "log");
  });

  afterEach(() => {
    consoleSpy.restore();
  });

  it("doesn't console log when no results passed", async () => {
    await printResults(null);
    return expect(consoleSpy.callCount).to.equal(0);
  });

  it("outputs results in first branch when results conform and warnings are false (default)", async () => {
    const doc = getHappySpec();
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);

    await printResults(result);
    return expect(consoleSpy.getCall(0).args[0]).to.not.have.string(
      "Level: Warning"
    );
  });

  it("outputs results in second branch when results do not conform and warnings are false (default)", async () => {
    const doc = getSingleInvalidFile();
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);

    await printResults(result);
    return expect(consoleSpy.getCall(0).args[0]).to.not.have.string(
      "Number of hidden warnings: ${result.results.length}"
    );
  });

  it("does not output hidden warning count when warnings are true!", async () => {
    const doc = getHappySpec();
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);

    await printResults(result, true);
    return expect(consoleSpy.getCall(0).args[0]).to.not.have.string(
      "Number of hidden warnings:"
    );
  });
});

describe("#validateCustom", () => {
  let testModel: model.document.Document;

  beforeEach(() => {
    testModel = new model.document.Document();
  });

  it("missing validation profile", () => {
    expect(
      validateCustom(testModel, "file://MISSINGFILE")
    ).to.be.eventually.rejectedWith("No registered runtime validator");
  });
});
