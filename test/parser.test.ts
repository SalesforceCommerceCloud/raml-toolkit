/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
"use strict";
import {
  parseRamlFile,
  getAllDataTypes,
  getApiName,
  resolveApiModel
} from "../src/parser";

import {
  WebApiBaseUnitWithDeclaresModel,
  WebApiParser,
  model,
  webapi,
  WebApiBaseUnitWithEncodesModel
} from "webapi-parser";

import { expect, default as chai } from "chai";
import path from "path";
import chaiAsPromised from "chai-as-promised";
import _ from "lodash";

before(() => {
  chai.use(chaiAsPromised);
});

describe("Test RAML file", () => {
  it("Test invalid RAML file", () => {
    const ramlFile = path.join(__dirname, "/raml/invalid/search-invalid.raml");
    return expect(parseRamlFile(ramlFile)).to.be.empty;
  });

  it("Test valid RAML file", () => {
    const ramlFile = path.join(__dirname, "site.raml");
    return parseRamlFile(ramlFile)
      .then(s => {
        expect(s).to.not.equal(null);
      })
      .catch(e => {
        expect.fail(e.message, "Valid RAML file parsing should not fail");
      });
  });
});

describe("Get Data types", () => {
  it("Test valid RAML file", () => {
    const ramlFile = path.join(__dirname, "site.raml");
    return parseRamlFile(ramlFile).then(s => {
      const res = getAllDataTypes(s as WebApiBaseUnitWithDeclaresModel);
      expect(_.map(res, res => res.name.value())).to.be.deep.equal([
        "product_search_result",
        "ClassA",
        "customer_product_list_item",
        "query",
        "ClassB",
        "search_request",
        "password_change_request",
        "sort",
        "result_page"
      ]);
    });
  });

  it("Test valid RAML file with references", () => {
    const ramlFile = path.join(__dirname, "site.raml");
    parseRamlFile(ramlFile)
      .then(refModel => {
        return parseRamlFile(ramlFile).then(mainModel => {
          mainModel.withReferences([refModel]);
          return mainModel;
        });
      })
      .then(s => {
        const res = getAllDataTypes(s as WebApiBaseUnitWithDeclaresModel);
        expect(_.map(res, res => res.name.value())).to.be.deep.equal([
          "product_search_result",
          "ClassA",
          "customer_product_list_item",
          "query",
          "ClassB",
          "search_request",
          "password_change_request",
          "sort",
          "result_page"
        ]);
      });
  });
});

describe("Test that API Name is returned in lower camelCase", () => {
  const domain = model.domain;
  before(() => {
    WebApiParser.init();
  });

  const expectedApiName = "shopperCustomers";
  it("Test with space in the name", () => {
    const api = new domain.WebApi();
    api.withName("Shopper Customers");
    const model = new webapi.WebApiExternalFragment().withEncodes(api);
    return expect(getApiName(model)).to.equal(expectedApiName);
  });
  it("Test with - in the name", () => {
    const api = new domain.WebApi();
    api.withName("Shopper-Customers");
    const model = new webapi.WebApiExternalFragment().withEncodes(api);
    return expect(getApiName(model)).to.equal(expectedApiName);
  });
  it("Test with _ in the name", () => {
    const api = new domain.WebApi();
    api.withName("Shopper-Customers");
    const model = new webapi.WebApiExternalFragment().withEncodes(api);
    return expect(getApiName(model)).to.equal(expectedApiName);
  });
  it("Test with . in the name", () => {
    const api = new domain.WebApi();
    api.withName("shopper.customers");
    const model = new webapi.WebApiExternalFragment().withEncodes(api);
    return expect(getApiName(model)).to.equal(expectedApiName);
  });
  it("Test with all lowercase name", () => {
    const api = new domain.WebApi();
    api.withName("shopper customers");
    const model = new webapi.WebApiExternalFragment().withEncodes(api);
    return expect(getApiName(model)).to.equal(expectedApiName);
  });
  it("Test with camelCase name", () => {
    const api = new domain.WebApi();
    api.withName("shopperCustomers");
    const model = new webapi.WebApiExternalFragment().withEncodes(api);
    return expect(getApiName(model)).to.equal(expectedApiName);
  });
  it("Test with null API name", () => {
    const api = new domain.WebApi();
    api.withName(null);
    const model = new webapi.WebApiExternalFragment().withEncodes(api);
    return expect(() => getApiName(model)).to.throw(
      "Invalid name provided to normalize"
    );
  });
  it("Test with undefined API name", () => {
    const api = new domain.WebApi();
    api.withName(undefined);
    const model = new webapi.WebApiExternalFragment().withEncodes(api);
    return expect(() => getApiName(model)).to.throw(
      "Invalid name provided to normalize"
    );
  });
  it("Test with empty API name", () => {
    const api = new domain.WebApi();
    api.withName("");
    const model = new webapi.WebApiExternalFragment().withEncodes(api);
    return expect(() => getApiName(model)).to.throw(
      "Invalid name provided to normalize"
    );
  });
});

describe("Test resolving API model", () => {
  it("Test with null model", () => {
    return expect(() => resolveApiModel(null, "editing")).to.throw(
      "Invalid API model provided to resolve"
    );
  });
  it("Test with undefined model", () => {
    return expect(() => resolveApiModel(undefined, "editing")).to.throw(
      "Invalid API model provided to resolve"
    );
  });
  it("Test with null resolution pipeline", () => {
    const apiModel = new webapi.WebApiExternalFragment();
    return expect(() => resolveApiModel(apiModel, null)).to.throw(
      "Invalid resolution pipeline provided to resolve"
    );
  });
  it("Test with undefined resolution pipeline", () => {
    const apiModel = new webapi.WebApiExternalFragment();
    return expect(() => resolveApiModel(apiModel, undefined)).to.throw(
      "Invalid resolution pipeline provided to resolve"
    );
  });
  it("Test with valid model and resolution pipeline", () => {
    const ramlFile = path.join(__dirname, "site.raml");
    return parseRamlFile(ramlFile)
      .then(s => {
        return resolveApiModel(s as WebApiBaseUnitWithEncodesModel, "editing");
      })
      .then(resolvedModel => {
        expect(resolvedModel).to.exist;
      });
  });
});
