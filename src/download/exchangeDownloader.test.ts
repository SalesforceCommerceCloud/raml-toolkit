/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {
  downloadRestApi,
  downloadRestApis,
  searchExchange,
  getApiVersions,
  getSpecificApi,
  getAsset,
  runFetch,
  search,
  DEFAULT_DOWNLOAD_FOLDER,
} from "./exchangeDownloader";
import { RestApi } from "./exchangeTypes";
import { searchAssetApiResultObject } from "../../testResources/download/resources/restApiResponseObjects";
import * as exchangeDirectoryParser from "../download/exchangeDirectoryParser";

import tmp from "tmp";

import { expect, default as chai } from "chai";
import chaiAsPromised from "chai-as-promised";
import _ from "lodash";
import nock from "nock";
import sinon from "sinon";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const assetSearchResults = require("../../testResources/download/resources/assetSearch.json");

// eslint-disable-next-line @typescript-eslint/no-var-requires
const getAssetWithVersion = require("../../testResources/download/resources/getAssetWithVersion");

// eslint-disable-next-line @typescript-eslint/no-var-requires
const getAssetWithoutVersion = require("../../testResources/download/resources/getAsset");

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

describe("exchangeDownloader", () => {
  let parserStub: sinon.SinonStub;

  before(() => {
    chai.use(chaiAsPromised);
    parserStub = sinon.stub(exchangeDirectoryParser, "extractFile");
  });

  after(() => sinon.restore);

  afterEach(() => {
    parserStub.reset();
    nock.cleanAll();
  });

  describe("downloadRestApi", () => {
    const scope = nock("https://somewhere");

    it("can download a single file", async () => {
      const api = _.cloneDeep(REST_API);
      const tmpDir = tmp.dirSync();

      parserStub.resolves(tmpDir.name);
      scope.get("/fatraml.zip").reply(200);

      return expect(downloadRestApi(api, tmpDir.name)).to.eventually.be
        .fulfilled;
    });

    it("can download a single file even when no download dir is specified", async () => {
      const api = _.cloneDeep(REST_API);

      scope.get("/fatraml.zip").reply(200);
      parserStub.resolves(DEFAULT_DOWNLOAD_FOLDER);

      return expect(downloadRestApi(api)).to.eventually.be.fulfilled;
    });

    it("should not return anything if Fat RAML information is missing", async () => {
      const api = _.cloneDeep(REST_API);
      api.id = null;

      return expect(downloadRestApi(api)).to.eventually.be.undefined;
    });

    it("throws an error when the download api request fails with 4xx", async () => {
      const api = _.cloneDeep(REST_API);

      scope.get("/fatraml.zip").reply(403);

      return expect(downloadRestApi(api, DEFAULT_DOWNLOAD_FOLDER)).to.eventually
        .be.rejected;
    });
  });

  describe("downloadRestApis", () => {
    const scope = nock("https://somewhere");

    it("can download multiple files", async () => {
      const tmpDir = tmp.dirSync();
      const apis = [_.cloneDeep(REST_API), _.cloneDeep(REST_API)];
      apis[1].fatRaml.externalLink = "https://somewhere/fatraml2.zip";

      parserStub.resolves(tmpDir.name);
      scope.get("/fatraml.zip").reply(200).get("/fatraml2.zip").reply(200);

      return downloadRestApis(apis, tmpDir.name).then((res) => {
        expect(res).to.equal(tmpDir.name);
      });
    });

    it("can download multiple files even when no destination folder is provided", async () => {
      const apis = [_.cloneDeep(REST_API), _.cloneDeep(REST_API)];
      apis[1].fatRaml.externalLink = "https://somewhere/fatraml2.zip";

      parserStub.resolves(DEFAULT_DOWNLOAD_FOLDER);
      scope.get("/fatraml.zip").reply(200).get("/fatraml2.zip").reply(200);

      return downloadRestApis(apis).then((res) => {
        expect(res).to.equal("download");
      });
    });

    it("should not do anything when an empty list is passed", async () => {
      return downloadRestApis([]).then((res) =>
        expect(res).to.equal("download")
      );
    });
  });

  describe("searchExchange", () => {
    it("can download multiple files", async () => {
      nock("https://anypoint.mulesoft.com/exchange/api/v2")
        .get("/assets?search=searchString&types=rest-api")
        .reply(200, assetSearchResults);

      return searchExchange("AUTH_TOKEN", "searchString").then((res) => {
        expect(res).to.deep.equal(searchAssetApiResultObject);
      });
    });
  });

  describe("getSpecificApi", () => {
    const scope = nock("https://anypoint.mulesoft.com/exchange/api/v1/assets");

    it("should return the response in RestApi type", async () => {
      scope
        .get("/893f605e-10e2-423a-bdb4-f952f56eb6d8/shopper-customers/0.0.1")
        .reply(200, getAssetWithVersion);

      return expect(
        getSpecificApi(
          "AUTH_TOKEN",
          "893f605e-10e2-423a-bdb4-f952f56eb6d8",
          "shopper-customers",
          "0.0.1"
        )
      ).to.eventually.deep.equal(shopperCustomersAsset);
    });

    it("should return null if version is not provided", async () => {
      scope
        .get("/893f605e-10e2-423a-bdb4-f952f56eb6d8/shopper-customers/0.0.1")
        .reply(200, getAssetWithVersion);

      const restApi = getSpecificApi(
        "AUTH_TOKEN",
        "893f605e-10e2-423a-bdb4-f952f56eb6d8",
        "shopper-customers",
        null
      );

      return expect(restApi).to.eventually.be.null;
    });

    it("should return null it fails to fetch the asset", async () => {
      scope
        .get("/893f605e-10e2-423a-bdb4-f952f56eb6d8/shopper-customers/0.0.1")
        .reply(404, "Not Found");

      return expect(
        getSpecificApi(
          "AUTH_TOKEN",
          "893f605e-10e2-423a-bdb4-f952f56eb6d8",
          "shopper-customers",
          "0.0.1"
        )
      ).to.eventually.be.null;
    });
  });

  describe("getApiVersions", () => {
    const scope = nock("https://anypoint.mulesoft.com/exchange/api/v1/assets");

    it("should return the latest version", async () => {
      scope.get("/8888888/test-api").reply(200, getAssetWithoutVersion);

      return expect(
        getApiVersions("AUTH_TOKEN", REST_API)
      ).to.eventually.deep.equal(["0.1.1"]);
    });

    it("should return undefined if the asset does not exist", async () => {
      scope.get("/8888888/test-api").reply(404, "Not Found");

      return expect(getApiVersions("AUTH_TOKEN", REST_API)).to.eventually.be
        .undefined;
    });

    it("should return undefined if the asset does not have a version groups", async () => {
      const assetWithoutVersion = _.cloneDeep(getAssetWithoutVersion);
      delete assetWithoutVersion.versionGroups;

      scope.get("/8888888/test-api").reply(200, assetWithoutVersion);

      return expect(getApiVersions("AUTH_TOKEN", REST_API)).to.eventually.be
        .undefined;
    });

    it("should return latest versions from all the version groups", async () => {
      scope
        .get("/8888888/test-api")
        .reply(200, getAssetWithMultipleVersionGroups);

      return expect(
        getApiVersions("AUTH_TOKEN", REST_API)
      ).to.eventually.deep.equal(["2.0.10", "1.8.19"]);
    });

    it("should return undefined if the version groups does not have a version", async () => {
      const assetWithoutVersion = _.cloneDeep(
        getAssetWithMultipleVersionGroups
      );
      delete assetWithoutVersion.versionGroups[0].versions;
      delete assetWithoutVersion.versionGroups[1].versions;

      scope.get("/8888888/test-api").reply(200, assetWithoutVersion);

      return expect(
        getApiVersions("AUTH_TOKEN", REST_API)
      ).to.eventually.deep.equal([]);
    });
  });

  describe("getAsset", () => {
    const scope = nock("https://anypoint.mulesoft.com/exchange/api/v1/assets");
    it("gets the JSON asset with the specified ID", () => {
      scope
        .get("/8888888/test-get-asset")
        .reply(200, { data: "json response" });

      return expect(
        getAsset("AUTH_TOKEN", "8888888/test-get-asset")
      ).to.eventually.deep.equal({ data: "json response" });
    });

    it("returns undefined when the response indicates an error", () => {
      scope.get("/8888888/get-asset-404").reply(404, "Not Found");

      return expect(getAsset("AUTH_TOKEN", "8888888/get-asset-404")).to
        .eventually.be.undefined;
    });
  });

  describe("search", () => {
    const scope = nock(
      "https://anypoint.mulesoft.com/exchange/api/v1/assets/893f605e-10e2-423a-bdb4-f952f56eb6d8"
    );

    // Search uses process.env, so we need to set expected values
    let ANYPOINT_USERNAME: string;
    let ANYPOINT_PASSWORD: string;

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
        .get("/assets?search=searchString&types=rest-api")
        .reply(200, [assetSearchResults[0]]);
    });

    it("searches Exchange and filters by latest version", () => {
      scope
        .get("/shop-products-categories-api-v1")
        .reply(200, getAssetWithVersion)
        .get("/shop-products-categories-api-v1/0.1.1")
        .reply(200, getAssetWithVersion);

      return expect(search("searchString")).to.eventually.deep.equal([
        shopperCustomersAsset,
        shopperCustomersAsset,
      ]);
    });

    it("works when an asset does not exist", () => {
      scope.get("/shop-products-categories-api-v1").reply(404, "Not Found");

      return expect(search("searchString")).to.eventually.deep.equal([]);
    });

    it("searches Exchange and returns multiple version groupd", () => {
      scope
        .get("/shop-products-categories-api-v1")
        .reply(200, getAssetWithMultipleVersionGroups)
        .get("/shop-products-categories-api-v1/1.8.19")
        .reply(200, getAssetWithVersion)
        .get("/shop-products-categories-api-v1/2.0.10")
        .reply(200, getAssetWithVersion);

      return expect(search("searchString")).to.eventually.deep.equal([
        shopperCustomersAsset,
        shopperCustomersAsset,
      ]);
    });
  });

  describe("runFetch", () => {
    const url = "https://somewhere";

    it("retries 3 times if a request fails with 5xx", async () => {
      const scope = nock(url)
        .get("/fatraml.zip")
        .thrice()
        .reply(503)
        .get("/fatraml.zip")
        .reply(200);

      expect((await runFetch(`${url}/fatraml.zip`)).ok).to.be.true;
      expect(scope.isDone()).to.be.true;
    });

    it("does not retry if a request fails with 401", async () => {
      const scope = nock(url)
        .get("/fatraml.zip")
        .reply(401)
        .get("/fatraml.zip")
        .reply(200);

      expect((await runFetch(`${url}/fatraml.zip`)).status).to.equal(401);
      expect(scope.isDone()).to.be.false;
    });

    it("can override number of retries", async () => {
      const retryOptions = { retry: { retries: 1 } };
      const scope = nock(url)
        .get("/fatraml.zip")
        .thrice()
        .reply(503)
        .get("/fatraml.zip")
        .reply(200);

      expect(
        (await runFetch(`${url}/fatraml.zip`, retryOptions)).status
      ).to.equal(503);
      expect(scope.isDone()).to.be.false;
    });
  });
});
