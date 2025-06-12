/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { getLatestCleanApiVersions, search } from "./exchangeDownloader";
import { RestApi } from "./exchangeTypes";

import { expect, default as chai } from "chai";
import chaiAsPromised from "chai-as-promised";
import _ from "lodash";
import nock from "nock";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const assetSearchResults = require("../../testResources/download/resources/assetSearch.json");

// eslint-disable-next-line @typescript-eslint/no-var-requires
const getAssetWithVersion = require("../../testResources/download/resources/getAssetWithVersion");

// eslint-disable-next-line @typescript-eslint/no-var-requires
const getAssetWithMultipleVersionGroups = require("../../testResources/download/resources/getAssetWithMultipleVersionGroups.json");

const REST_API: RestApi = {
  id: "8888888/test-api/1.0.0",
  name: "Test API",
  groupId: "8888888",
  assetId: "test-api",
  fatRaml: {
    classifier: "rest-api",
    sha1: "sha1",
    md5: "md5",
    externalLink: "https://somewhere/fatraml.zip",
    packaging: "zip",
    createdDate: "today",
    mainFile: "api.raml",
  },
  version: "1.0.0",
};

const shopperCustomersAsset = {
  id: "893f605e-10e2-423a-bdb4-f952f56eb6d8/shopper-customers/0.0.1",
  name: "Shopper Customers",
  description:
    "Let customers log in and manage their profiles and product lists.",
  updatedDate: "2020-02-06T17:55:32.375Z",
  groupId: "893f605e-10e2-423a-bdb4-f952f56eb6d8",
  assetId: "shopper-customers",
  version: "0.0.1",
  categories: {
    "API layer": ["Process"],
    "CC API Visibility": ["External"],
    "CC Version Status": ["Beta"],
    "CC API Family": ["Customer"],
  },
  fatRaml: {
    classifier: "fat-raml",
    packaging: "zip",
    externalLink: "https://short.url/test",
    createdDate: "2020-01-22T03:25:00.200Z",
    md5: "3ce41ea699c8be4446909f172cfac317",
    sha1: "10331d32527f78bf76e0b48ab2d05945d8d141c1",
    mainFile: "shopper-customers.raml",
  },
  fatOas: null,
};

describe("exchangeDownloaderMultipleVersions", () => {
  before(() => {
    chai.use(chaiAsPromised);
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe("getLatestCleanApiVersions", () => {
    const scope = nock("https://anypoint.mulesoft.com/exchange/api/v1/assets");

    it("should return the latest version", async () => {
      scope.get("/8888888/test-api").reply(200, getAssetWithVersion);

      return expect(
        getLatestCleanApiVersions("AUTH_TOKEN", REST_API)
      ).to.eventually.deep.equal(["0.1.1"]);
    });

    it("should return undefined if the asset does not exist", async () => {
      scope.get("/8888888/test-api").reply(404, "Not Found");

      return expect(getLatestCleanApiVersions("AUTH_TOKEN", REST_API)).to
        .eventually.be.undefined;
    });

    it("should return undefined if the asset does not have a version groups", async () => {
      const asset = _.cloneDeep(getAssetWithMultipleVersionGroups);
      delete asset.versionGroups;

      scope.get("/8888888/test-api").reply(200, asset);

      return expect(getLatestCleanApiVersions("AUTH_TOKEN", REST_API)).to
        .eventually.be.undefined;
    });

    it("should return latest versions from all the version groups", async () => {
      scope
        .get("/8888888/test-api")
        .reply(200, getAssetWithMultipleVersionGroups);

      return expect(
        getLatestCleanApiVersions("AUTH_TOKEN", REST_API)
      ).to.eventually.deep.equal(["2.0.10", "1.8.19"]);
    });

    it("should return empty array if the version groups does not have a version", async () => {
      const assetWithoutVersion = _.cloneDeep(
        getAssetWithMultipleVersionGroups
      );
      delete assetWithoutVersion.versionGroups[0].versions;
      delete assetWithoutVersion.versionGroups[1].versions;

      scope.get("/8888888/test-api").reply(200, assetWithoutVersion);

      return expect(
        getLatestCleanApiVersions("AUTH_TOKEN", REST_API)
      ).to.eventually.deep.equal([]);
    });
  });

  describe("search", () => {
    const scope = nock(
      "https://anypoint.mulesoft.com/exchange/api/v1/assets/893f605e-10e2-423a-bdb4-f952f56eb6d8"
    );

    // Search uses process.env, so we need to set expected values
    let ANYPOINT_USERNAME: string | undefined;
    let ANYPOINT_PASSWORD: string | undefined;

    before(() => {
      ANYPOINT_USERNAME = process.env.ANYPOINT_USERNAME;
      ANYPOINT_PASSWORD = process.env.ANYPOINT_PASSWORD;
      process.env.ANYPOINT_USERNAME = "user";
      process.env.ANYPOINT_PASSWORD = "pass";
    });

    // Restore the original values so other tests can use them
    after(() => {
      process.env.ANYPOINT_USERNAME = ANYPOINT_USERNAME;
      process.env.ANYPOINT_PASSWORD = ANYPOINT_PASSWORD;
    });

    beforeEach(() => {
      // Intercept getBearer request
      nock("https://anypoint.mulesoft.com")
        .post("/accounts/login", { username: "user", password: "pass" })
        .reply(200, { access_token: "AUTH_TOKEN" });

      // Intercept searchExchange request
      nock("https://anypoint.mulesoft.com/exchange/api/v2", {
        reqheaders: {
          Authorization: "Bearer AUTH_TOKEN",
        },
      })
        .get("/assets?search=searchString&types=rest-api&limit=50&offset=0")
        .reply(200, [assetSearchResults[0]]);
    });

    afterEach(() => {
      // Clean up any remaining nock interceptors for this describe block
      nock.cleanAll();
    });

    it("searches Exchange and filters by latest version", () => {
      scope
        .get("/shop-products-categories-api-v1")
        .reply(200, getAssetWithMultipleVersionGroups)
        .get("/shop-products-categories-api-v1/2.0.10")
        .reply(200, getAssetWithVersion)
        .get("/shop-products-categories-api-v1/1.8.19")
        .reply(200, getAssetWithVersion);

      return expect(
        search("searchString", undefined, true)
      ).to.eventually.deep.equal([
        shopperCustomersAsset,
        shopperCustomersAsset,
      ]);
    });

    it("works when an oas asset does not exist", () => {
      scope.get("/shop-products-categories-api-v1").reply(404, "Not Found");

      return expect(
        search("searchString", undefined, true)
      ).to.eventually.deep.equal([]);
    });

    it("searches Exchange and returns multiple version groups", () => {
      scope
        .get("/shop-products-categories-api-v1")
        .reply(200, getAssetWithMultipleVersionGroups)
        .get("/shop-products-categories-api-v1/1.8.19")
        .reply(200, getAssetWithVersion)
        .get("/shop-products-categories-api-v1/2.0.10")
        .reply(200, getAssetWithVersion);

      return expect(
        search("searchString", undefined, true)
      ).to.eventually.deep.equal([
        shopperCustomersAsset,
        shopperCustomersAsset,
      ]);
    });
  });
});
