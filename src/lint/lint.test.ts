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
import { model, AMF, Core } from "amf-client-js";
import {
  printResults,
  validateFile,
  validateCustom,
  validateModel,
  PROFILE_PATH,
} from "./lint";

import path from "path";
import {
  getHappySpec,
  renderSpecAsFile,
  getSingleInvalidFile,
  createCustomProfile,
  conforms,
} from "../../testResources/testUtils";
import Sinon from "sinon";

const PROFILE = "mercury";

before(() => {
  chai.use(chaiAsPromised);
});

describe("#printResults", () => {
  let consoleStub: Sinon.SinonSpy;

  beforeEach(() => {
    sinon.restore();
    consoleStub = sinon.stub(console, "log");
  });

  afterEach(() => {
    consoleStub.restore();
  });

  it("doesn't console log when no results passed", async () => {
    await printResults(null);
    return expect(consoleStub.callCount).to.equal(0);
  });

  it("outputs results in first branch when results conform and warnings are false (default)", async () => {
    const doc = getHappySpec();
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);

    await printResults(result);
    return expect(consoleStub.getCall(0).args[0]).to.not.have.string(
      "Level: Warning"
    );
  });

  it("outputs results in second branch when results do not conform and warnings are false (default)", async () => {
    const doc = getSingleInvalidFile();
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);

    await printResults(result);
    return expect(consoleStub.getCall(0).args[0]).to.not.have.string(
      "Number of hidden warnings: ${result.results.length}"
    );
  });

  it("does not output hidden warning count when warnings are true!", async () => {
    const doc = getHappySpec();
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);

    await printResults(result, true);
    return expect(consoleStub.getCall(0).args[0]).to.not.have.string(
      "Number of hidden warnings:"
    );
  });
});

describe("#validateCustom", () => {
  let testModel: model.document.Document;

  beforeEach(async () => {
    await AMF.init();
    testModel = new model.document.Document();
  });

  it("throws on missing validation profile", () => {
    const customProfile = "file://MISSINGFILE";
    return expect(
      validateCustom(testModel, customProfile)
    ).to.be.eventually.rejectedWith(
      `File Not Found: ENOENT: no such file or directory, open 'MISSINGFILE'`
    );
  });

  it("throws on unsupported schema", () => {
    const customProfile = "uri://MISSINGFILE";
    return expect(
      validateCustom(testModel, customProfile)
    ).to.be.eventually.rejectedWith(`Unsupported`);
  });

  it("re-throws AMF errors as actual errors", async () => {
    const stub = sinon.stub(Core, "loadValidationProfile");
    const fakeAmfError = {
      toString(): string {
        return "amf.fake.error: AMF doesn't like real Errors.";
      },
    };
    stub.rejects(fakeAmfError);

    // Can't do .rejectedWith because we want to check that the error message
    // matches exactly (not just a substring) and because we need to check the
    // `amfError` property
    const promise = validateCustom(testModel, "");
    await expect(promise).to.be.rejected;
    const err = await promise.catch((e) => e);
    expect(err.message).to.equal("AMF doesn't like real Errors.");
    expect(err.amfError).to.equal(fakeAmfError);

    stub.restore();
  });

  it("re-throws regular errors unmodified", async () => {
    const stub = sinon.stub(Core, "loadValidationProfile");
    const fakeError = new ReferenceError("Beam me up, Scotty!");
    stub.rejects(fakeError);

    await expect(validateCustom(testModel, "")).to.be.rejectedWith(fakeError);

    stub.restore();
  });
});

describe("#validateModel", () => {
  let testModel: model.document.Document;

  beforeEach(async () => {
    await AMF.init();
    testModel = new model.document.Document();
  });

  it("throws on missing validation profile", () => {
    const customProfile = "MISSINGFILE";
    return expect(
      validateModel(testModel, customProfile)
    ).to.be.eventually.rejectedWith(
      `File Not Found: ENOENT: no such file or directory, open '${path.join(
        PROFILE_PATH,
        `MISSINGFILE.raml`
      )}'`
    );
  });

  it("can validate with a custom profile", async () => {
    const doc = getHappySpec();
    const customProfile = createCustomProfile({});
    const result = await validateFile(renderSpecAsFile(doc), customProfile);
    conforms(result);
  });
});
