/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
"use strict";

import { FatRamlResourceLoader } from "../../../src";

import { expect, default as chai } from "chai";
import chaiAsPromised from "chai-as-promised";
import sinon from "sinon";
import amf from "amf-client-js";

before(() => {
  chai.should();
  chai.use(chaiAsPromised);
});

describe("Fat raml resource loader fsAdapter tests", () => {
  it("Throws error on undefined resource absolute path", () => {
    const fatRamlResourceLoader = new FatRamlResourceLoader(
      "FiLe://////workingDir"
    );

    return expect(() =>
      fatRamlResourceLoader.fsAdapter.readFileSync(undefined)
    ).to.throw();
  });
});

describe("Fat raml resource loader create tests", () => {
  it("Throws error on undefined workingDir path", () => {
    return expect(() => new FatRamlResourceLoader(undefined)).to.throw(
      "workingDir does not begin with 'file://' protocol"
    );
  });

  it("Throws error on null workingDir path", () => {
    return expect(() => new FatRamlResourceLoader(null)).to.throw(
      "workingDir does not begin with 'file://' protocol"
    );
  });

  it("Throws error on workingDir path that has 'file://' protocol at wrong index", () => {
    return expect(
      () => new FatRamlResourceLoader("/somedirectory/file://workingDir")
    ).to.throw("workingDir does not begin with 'file://' protocol");
  });

  it("Throws error on workingDir path 'file://first/./second/..///still-second' that can be normalized ", () => {
    return expect(
      () => new FatRamlResourceLoader("file://first/./second/..///still-second")
    ).to.throw(
      "workingDir 'file://first/./second/..///still-second' must be an absolute path"
    );
  });

  it("Throws error on workingDir path that is not absolute", () => {
    return expect(
      () => new FatRamlResourceLoader("file://workingDir")
    ).to.throw("workingDir 'file://workingDir' must be an absolute path");
  });

  it("Creates FatRamlResourceLoader on workingDir that is absolute", () => {
    return expect(
      new FatRamlResourceLoader("file:///workingDir").workingDir
    ).to.eq("/workingDir");
  });

  it("Creates FatRamlResourceLoader on workingDir with case insensitive 'FiLE://' protocol", () => {
    return expect(
      new FatRamlResourceLoader("FiLE:///workingDir").workingDir
    ).to.eq("/workingDir");
  });

  it("Creates FatRamlResourceLoader on 'file://////workingDir' that is absolute", () => {
    return expect(
      new FatRamlResourceLoader("file://////workingDir").workingDir
    ).to.eq("/workingDir");
  });
});

describe("Fat raml resource loader accepts tests", () => {
  let fatRamlResourceLoader;

  before(() => {
    fatRamlResourceLoader = new FatRamlResourceLoader("file:///workingDir");
  });

  it("Returns true (accepted) for resource path containing 'exchange_modules/'", () => {
    const accepted = fatRamlResourceLoader.accepts("exchange_modules/");
    return expect(accepted).to.be.true;
  });

  it("Returns true (accepted) for resource path containing 'exchange_modules/test.raml'", () => {
    const accepted = fatRamlResourceLoader.accepts(
      "exchange_modules/test.raml"
    );
    return expect(accepted).to.be.true;
  });

  it("Returns true (accepted) for resource path containing 'exchange_modules/' anywhere in the resource path", () => {
    const accepted = fatRamlResourceLoader.accepts(
      "test/exchange_modules/test.raml"
    );
    return expect(accepted).to.be.true;
  });

  it("Returns false (not accepted) for undefined resource path", () => {
    const accepted = fatRamlResourceLoader.accepts(undefined);
    return expect(accepted).to.be.false;
  });

  it("Returns false (not accepted) for null resource path", () => {
    const accepted = fatRamlResourceLoader.accepts(null);
    return expect(accepted).to.be.false;
  });

  it("Returns false (not accepted) for resource path without 'exchange_modules/'", () => {
    const accepted = fatRamlResourceLoader.accepts("invalid");
    return expect(accepted).to.be.false;
  });
});

describe("Fat raml resource loader fetch tests", () => {
  let fatRamlResourceLoader;

  before(() => {
    fatRamlResourceLoader = new FatRamlResourceLoader("file:///workingDir");
    fatRamlResourceLoader.fsAdapter = sinon.stub({
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
      "file:///workingDir/exchange_modules/resource.json",
      "application/yaml"
    );
    fatRamlResourceLoader.fsAdapter.readFileSync.returns("content");
    return fatRamlResourceLoader
      .fetch("test/exchange_modules/resource.json")
      .then(function(s) {
        sinon.assert.calledWith(
          fatRamlResourceLoader.fsAdapter.readFileSync,
          "/workingDir/exchange_modules/resource.json"
        );
        return expect(s).to.eql(content);
      });
  });

  it("Resolved for resources with 2 exchange_modules/ in path that are successfully read", () => {
    const content = new amf.client.remote.Content(
      "content",
      "file:///workingDir/exchange_modules/resource.json",
      "application/yaml"
    );
    fatRamlResourceLoader.fsAdapter.readFileSync.returns("content");
    return fatRamlResourceLoader
      .fetch(
        "first_level/exchange_modules/second_level/exchange_modules/resource.json"
      )
      .then(function(s) {
        sinon.assert.calledWith(
          fatRamlResourceLoader.fsAdapter.readFileSync,
          "/workingDir/exchange_modules/resource.json"
        );
        return expect(s).to.eql(content);
      });
  });

  it("Rejected for undefined resource paths", () => {
    return fatRamlResourceLoader.fetch(undefined).catch(function(err) {
      sinon.assert.notCalled(fatRamlResourceLoader.fsAdapter.readFileSync);
      return expect(err.toString()).to.eql(
        "amf.client.resource.ResourceNotFound: Resource cannot be found: undefined"
      );
    });
  });

  it("Rejected for undefined resource paths", () => {
    return fatRamlResourceLoader.fetch(null).catch(function(err) {
      sinon.assert.notCalled(fatRamlResourceLoader.fsAdapter.readFileSync);
      return expect(err.toString()).to.eql(
        "amf.client.resource.ResourceNotFound: Resource cannot be found: null"
      );
    });
  });

  it("Rejected for resource paths with 'exchange_modules/' and failed to load", () => {
    fatRamlResourceLoader.fsAdapter.readFileSync.throws(
      new Error("Failed to load fat raml resource")
    );
    return fatRamlResourceLoader
      .fetch("exchange_modules/resource.json")
      .catch(function(err) {
        sinon.assert.calledWith(
          fatRamlResourceLoader.fsAdapter.readFileSync,
          sinon.match.string
        );
        return expect(err.toString()).to.eql(
          "amf.client.resource.ResourceNotFound: Resource failed to load: exchange_modules/resource.json. Error: Failed to load fat raml resource"
        );
      });
  });

  it("Rejected for resource paths not starting with 'exchange_modules/'", () => {
    return fatRamlResourceLoader.fetch("test").catch(function(err) {
      sinon.assert.notCalled(fatRamlResourceLoader.fsAdapter.readFileSync);
      return expect(err.toString()).to.eql(
        "amf.client.resource.ResourceNotFound: Resource cannot be found: test"
      );
    });
  });
});
