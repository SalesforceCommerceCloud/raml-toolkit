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
  getVersionByDeployment,
  getSpecificApi,
  getAsset
} from "./exchangeDownloader";
import { RestApi } from "./exchangeTypes";
import { searchAssetApiResultObject } from "../../test/download/resources/restApiResponseObjects";

import tmp from "tmp";
import { Response } from "node-fetch";

import { expect, default as chai } from "chai";
import chaiAsPromised from "chai-as-promised";
import nock from "nock";
import _ from "lodash";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const assetSearchResults = require("../../test/download/resources/assetSearch.json");

// eslint-disable-next-line @typescript-eslint/no-var-requires
const getAssetWithVersion = require("../../test/download/resources/getAssetWithVersion");

// eslint-disable-next-line @typescript-eslint/no-var-requires
const getAssetWithoutVersion = require("../../test/download/resources/getAsset");

before(() => {
  chai.use(chaiAsPromised);
});

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
    mainFile: "api.raml"
  },
  version: "1.0.0"
};

describe("downloadRestApi", () => {
  afterEach(nock.cleanAll);

  it("can download a single file", async () => {
    const tmpDir = tmp.dirSync();

    nock("https://somewhere")
      .get("/fatraml.zip")
      .reply(200);

    const api = _.cloneDeep(REST_API);

    return downloadRestApi(api, tmpDir.name).then((res: Response) => {
      expect(res.status).to.equal(200);
    });
  });

  it("can download a single file even when no download dir is specified", async () => {
    nock("https://somewhere")
      .get("/fatraml.zip")
      .reply(200);

    const api = _.cloneDeep(REST_API);

    return downloadRestApi(api).then((res: Response) => {
      expect(res.status).to.equal(200);
    });
  });

  it("should not return anything if Fat RAML information is missing", async () => {
    const api = _.cloneDeep(REST_API);
    api.id = null;

    return expect(downloadRestApi(api)).to.eventually.be.undefined;
  });
});

describe("downloadRestApis", () => {
  afterEach(nock.cleanAll);

  it("can download multiple files", async () => {
    const tmpDir = tmp.dirSync();

    const apis = [_.cloneDeep(REST_API), _.cloneDeep(REST_API)];

    apis[1].fatRaml.externalLink = "https://somewhere/fatraml2.zip";

    const scope = nock("https://somewhere");

    scope.get("/fatraml.zip").reply(200);
    scope.get("/fatraml2.zip").reply(200);

    return downloadRestApis(apis, tmpDir.name).then(res => {
      expect(res).to.equal(tmpDir.name);
    });
  });

  it("can download multiple files even when no destination folder is provided", async () => {
    const apis = [_.cloneDeep(REST_API), _.cloneDeep(REST_API)];

    apis[1].fatRaml.externalLink = "https://somewhere/fatraml2.zip";

    const scope = nock("https://somewhere");

    scope.get("/fatraml.zip").reply(200);
    scope.get("/fatraml2.zip").reply(200);

    return downloadRestApis(apis).then(res => {
      expect(res).to.equal("download");
    });
  });

  it("should not do anything when an empty list is passed", async () => {
    return downloadRestApis([]).then(res => {
      expect(res).to.equal("download");
    });
  });
});

describe("searchExchange", () => {
  afterEach(nock.cleanAll);

  it("can download multiple files", async () => {
    const scope = nock("https://anypoint.mulesoft.com/exchange/api/v2");

    scope.get("/assets?search=searchString").reply(200, assetSearchResults);

    return searchExchange("AUTH_TOKEN", "searchString").then(res => {
      expect(res).to.deep.equal(searchAssetApiResultObject);
    });
  });
});

describe("getSpecificApi", () => {
  afterEach(nock.cleanAll);

  it("should return the response in RestApi type", async () => {
    const scope = nock("https://anypoint.mulesoft.com/exchange/api/v2/assets");

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
    ).to.eventually.deep.equal({
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
        "CC API Family": ["Customer"]
      },
      fatRaml: {
        classifier: "fat-raml",
        packaging: "zip",
        externalLink:
          "https://exchange2-asset-manager-kprod.s3.amazonaws.com/893f605e-10e2-423a-bdb4-f952f56eb6d8/bfff7ae2c59dd68e81adee900b56f8fd0d8ab00bc42206d0af3e96fa1025e9c3.zip?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJTBQMSKYL2HXJA4A%2F20200206%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20200206T191341Z&X-Amz-Expires=86400&X-Amz-Signature=32c30dbb73e3031ef95da76382e52acb14ad734535e108864a506a34f8e21f3f&X-Amz-SignedHeaders=host&response-content-disposition=attachment%3B%20filename%3Dshopper-customers-0.0.1-raml.zip",
        createdDate: "2020-01-22T03:25:00.200Z",
        md5: "3ce41ea699c8be4446909f172cfac317",
        sha1: "10331d32527f78bf76e0b48ab2d05945d8d141c1",
        mainFile: "shopper-customers.raml"
      }
    });
  });

  it("should return null if version is not provided", async () => {
    const scope = nock("https://anypoint.mulesoft.com/exchange/api/v2/assets");

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
    const scope = nock("https://anypoint.mulesoft.com/exchange/api/v2/assets");

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

describe("getVersionByDeployment", () => {
  afterEach(nock.cleanAll);

  it("should return a version if a deployment exists", async () => {
    const scope = nock("https://anypoint.mulesoft.com/exchange/api/v2/assets");

    scope.get("/8888888/test-api").reply(200, getAssetWithoutVersion);

    return expect(
      getVersionByDeployment("AUTH_TOKEN", REST_API, /production/i)
    ).to.eventually.equal("0.0.1");
  });

  it("should return the base version if the deployment does not exist", async () => {
    const scope = nock("https://anypoint.mulesoft.com/exchange/api/v2/assets");

    scope.get("/8888888/test-api").reply(200, getAssetWithoutVersion);

    return expect(
      getVersionByDeployment("AUTH_TOKEN", REST_API, /NOT AVAILABLE/i)
    ).to.eventually.equal(getAssetWithoutVersion.version);
  });

  it("should return undefined if the asset does not exist", async () => {
    const scope = nock("https://anypoint.mulesoft.com/exchange/api/v2/assets");

    scope.get("/8888888/test-api").reply(404, "Not Found");

    return expect(
      getVersionByDeployment("AUTH_TOKEN", REST_API, /NOT AVAILABLE/i)
    ).to.eventually.be.undefined;
  });

  it("should return undefined if the asset does not have a version", async () => {
    const scope = nock("https://anypoint.mulesoft.com/exchange/api/v2/assets");

    const assetWithoutVersion = _.cloneDeep(getAssetWithoutVersion);
    delete assetWithoutVersion.version;

    scope.get("/8888888/test-api").reply(200, assetWithoutVersion);

    return expect(
      getVersionByDeployment("AUTH_TOKEN", REST_API, /NOT AVAILABLE/i)
    ).to.eventually.be.undefined;
  });
});
