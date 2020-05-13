/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-disable no-undef */
"use strict";
import { expect, default as chai } from "chai";
import sinon from "sinon";
import chaiAsPromised from "chai-as-promised";
import { printResults, validateFile } from "../src/validator";
import {
  getHappySpec,
  renderSpecAsFile,
  getSingleInvalidFile
} from "./testUtils";

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
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    return expect(consoleSpy.callCount).to.equal(0);
  });

  it("outputs results in first branch when results conform and warnings are false (default)", async () => {
    const doc = getHappySpec();
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);

    await printResults(result);

    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    return expect(consoleSpy.getCall(0).args[0]).to.have.string(
      "Conforms? true"
    );
  });

  it("outputs results in second branch when results do not conform and warnings are false (default)", async () => {
    const doc = getSingleInvalidFile();
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);

    await printResults(result);

    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    return expect(consoleSpy.getCall(0).args[0]).to.have.string(
      "Conforms? false"
    );
  });

  it("outputs results in second branch when results do conform and warnings are true", async () => {
    const doc = getHappySpec();
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);

    await printResults(result, true);

    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    return expect(consoleSpy.getCall(0).args[0]).to.have.string(
      "Level: Warning"
    );
  });
});
