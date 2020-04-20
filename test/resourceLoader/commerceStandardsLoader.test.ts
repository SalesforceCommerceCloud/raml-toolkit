/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
"use strict";

import { CommerceStandardsLoader } from "../../src";

import { expect, default as chai } from "chai";
import chaiAsPromised from "chai-as-promised";
import sinon from "sinon";
import amf from "amf-client-js";

before(() => {
  chai.should();
  chai.use(chaiAsPromised);
});

describe("Commerce standards resource loader fsAdapter tests", () => {
  it("Throws error on undefined resource absolute path", () => {
    const ccStandardsLoader = new CommerceStandardsLoader("file:///rootFolder");

    return expect(() =>
      ccStandardsLoader.fsAdapter.readFileSync(undefined)
    ).to.throw();
  });
});

describe("Commerce standards resource loader create tests", () => {
  it("Throws error on undefined root path", () => {
    return expect(() => new CommerceStandardsLoader(undefined)).to.throw(
      "Cannot read property 'split' of undefined"
    );
  });

  it("Throws error on null root path", () => {
    return expect(() => new CommerceStandardsLoader(null)).to.throw(
      "Cannot read property 'split' of null"
    );
  });

  it("Throws error on root path without 'file://' prefix", () => {
    return expect(() => new CommerceStandardsLoader("root")).to.throw(
      "rootFolder does not contain 'file://' prefix"
    );
  });
});

describe("Commerce standards resource loader accepts tests", () => {
  let standardsLoader;

  before(() => {
    standardsLoader = new CommerceStandardsLoader("file:///rootFolder");
  });

  it("Returns true (accepted) for resource path containing 'exchange_modules/'", () => {
    const accepted = standardsLoader.accepts("exchange_modules/");
    return expect(accepted).to.be.true;
  });

  it("Returns false (not accepted) for undefined resource path", () => {
    const accepted = standardsLoader.accepts(undefined);
    return expect(accepted).to.be.false;
  });

  it("Returns false (not accepted) for null resource path", () => {
    const accepted = standardsLoader.accepts(null);
    return expect(accepted).to.be.false;
  });

  it("Returns false (not accepted) for resource path without 'exchange_modules/'", () => {
    const accepted = standardsLoader.accepts("invalid");
    return expect(accepted).to.be.false;
  });
});

describe("Commerce standards resource loader fetch tests", () => {
  let standardsLoader;

  before(() => {
    standardsLoader = new CommerceStandardsLoader("file:///rootFolder/");
    standardsLoader.fsAdapter = sinon.stub({
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      readFileSync: (resourcePath: string) => {}
    });
  });

  beforeEach(() => {
    sinon.reset();
  });

  it("Resolved for resources that are successfully read", () => {
    const content = new amf.client.remote.Content(
      "content",
      "file:///rootFolder/exchange_modules/resource.json",
      "application/yaml"
    );
    standardsLoader.fsAdapter.readFileSync.returns("content");
    return standardsLoader
      .fetch("error/exchange_modules/resource.json")
      .then(function(s) {
        sinon.assert.calledWith(
          standardsLoader.fsAdapter.readFileSync,
          "/rootFolder/exchange_modules/resource.json"
        );
        return expect(s).to.eql(content);
      });
  });

  it("Rejected for resource paths with 'exchange_modules/' and failed to load", () => {
    standardsLoader.fsAdapter.readFileSync.throws(
      new Error("Failed to load standard resource")
    );
    return standardsLoader
      .fetch("error/exchange_modules/resource.json")
      .catch(function(err) {
        sinon.assert.calledWith(
          standardsLoader.fsAdapter.readFileSync,
          sinon.match.string
        );
        return expect(err.toString()).to.eql(
          "amf.client.resource.ResourceNotFound: Resource failed to load: error/exchange_modules/resource.json. Error: Failed to load standard resource"
        );
      });
  });

  it("Rejected for resource paths without 'exchange_modules/'", () => {
    return standardsLoader.fetch("test").catch(function(err) {
      sinon.assert.notCalled(standardsLoader.fsAdapter.readFileSync);
      return expect(err.toString()).to.eql(
        "amf.client.resource.ResourceNotFound: Resource cannot be found: test"
      );
    });
  });
});
