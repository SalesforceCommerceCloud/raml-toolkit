/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { test, expect } from "@oclif/test";
import JSZip from "jszip";
import tmp from "tmp";
import chai from "chai";
import chaiFs from "chai-fs";
import { DownloadCommand } from ".";

chai.use(chaiFs);

// eslint-disable-next-line @typescript-eslint/no-var-requires
const assetSearchResults = require("../../testResources/download/resources/assetSearch.json");

// eslint-disable-next-line @typescript-eslint/no-var-requires
const asset = require("../../testResources/download/resources/getAsset");
// Use a shorter URL for better readability
asset.files.find(file => file.classifier === "fat-raml").externalLink =
  "https://short.url/raml.zip";

const createZip = (): NodeJS.ReadableStream =>
  new JSZip().file("file.raml", "zip content").generateNodeStream();

const API_CONFIG = {
  Customer: [
    {
      id: "893f605e-10e2-423a-bdb4-f952f56eb6d8/shopper-customers/0.0.7",
      name: "Shopper Customers",
      description:
        "Let customers log in and manage their profiles and product lists.",
      updatedDate: "2020-02-06T17:55:32.375Z",
      groupId: "893f605e-10e2-423a-bdb4-f952f56eb6d8",
      assetId: "shopper-customers",
      version: "0.0.7",
      categories: {
        "CC API Visibility": ["External"],
        "CC Version Status": ["Beta"],
        "CC API Family": ["Customer"],
        "API layer": ["Process"]
      },
      fatRaml: {
        classifier: "fat-raml",
        packaging: "zip",
        createdDate: "2020-02-05T21:26:01.199Z",
        md5: "87b3ad2b2aa17639b52f0cc83c5a8d40",
        sha1: "f2b9b2de50b7250616e2eea8843735b57235c22b",
        mainFile: "shopper-customers.raml"
      }
    }
  ]
};
const API_CONFIG_JSON = JSON.stringify(API_CONFIG);

/**
 * Sets up environment and interceptors to test the command.
 * NOTE: Technically, `typeof test` would be the most accurate return type, but
 * it is too complex for VS Code to parse and causes things to hang / break.
 */
function setup({
  search = "",
  version = "0.0.1"
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} = {}): any {
  return (
    test
      .env({ ANYPOINT_USERNAME: "user", ANYPOINT_PASSWORD: "pass" })
      // Intercept getBearer request
      .nock("https://anypoint.mulesoft.com", scope =>
        scope
          .post("/accounts/login", { username: "user", password: "pass" })
          // eslint-disable-next-line @typescript-eslint/camelcase
          .reply(200, { access_token: "AUTH_TOKEN" })
      )
      // Intercept searchExchange request
      .nock("https://anypoint.mulesoft.com/exchange/api/v2", scope =>
        scope
          .get(`/assets?search=${encodeURIComponent(search)}&types=rest-api`)
          .reply(200, [assetSearchResults[0]])
      )
      // Intercept search requests
      .nock(
        "https://anypoint.mulesoft.com/exchange/api/v2/assets/893f605e-10e2-423a-bdb4-f952f56eb6d8",
        scope =>
          scope
            .get("/shop-products-categories-api-v1")
            .reply(200, asset)
            .get(`/shop-products-categories-api-v1/${version}`)
            .reply(200, asset)
      )
      // Intercept downloadRestApis request
      .nock("https://short.url", scope =>
        scope.get("/raml.zip").reply(200, createZip())
      )
  );
}

describe("Download Command", () => {
  const tmpWorkDir = tmp.dirSync().name;
  const tmpOtherDir = tmp.dirSync().name;
  let oldWorkDir;

  before(() => {
    // Change working directory to a tmp dir just for these tests
    oldWorkDir = process.cwd();
    process.chdir(tmpWorkDir);
  });

  after(() => {
    // Restore original working directory
    process.chdir(oldWorkDir);
  });

  setup()
    .do(() => DownloadCommand.run(["--group-by", "CC API Family"]))
    .it("downloads APIs", () => {
      expect("apis").to.be.a.directory();
      expect("apis/api-config.json")
        .to.be.a.file()
        .with.content(`${API_CONFIG_JSON}\n`);
      expect("apis/shopper-customers").to.be.a.directory();
      expect("apis/shopper-customers/file.raml")
        .to.be.a.file()
        .with.content("zip content");
    });

  setup({ search: "test" })
    .do(() =>
      DownloadCommand.run(["--search=test", "--group-by", "CC API Family"])
    )
    .it("accepts a configurable search query");

  setup({ version: "0.0.7" })
    .do(() =>
      DownloadCommand.run(["--deployment=test", "--group-by", "CC API Family"])
    )
    .it("accepts a configurable deployment status");

  setup()
    .do(() =>
      DownloadCommand.run([
        "--group-by=category",
        "--group-by",
        "CC API Family"
      ])
    )
    .it("accepts a configurable category for grouping APIs");

  setup()
    .do(() =>
      DownloadCommand.run(["--dest=test", "--group-by", "CC API Family"])
    )
    .it("accepts a configurable target directory (relative)", () => {
      expect("test")
        .to.be.a.directory()
        .with.deep.contents([
          "api-config.json",
          "shopper-customers",
          "shopper-customers/file.raml"
        ]);
    });

  setup()
    .do(() =>
      DownloadCommand.run([
        `--dest=${tmpOtherDir}`,
        "--group-by",
        "CC API Family"
      ])
    )
    .it("accepts a configurable target directory (absolute)", () => {
      expect("test")
        .to.be.a.directory()
        .with.deep.contents([
          "api-config.json",
          "shopper-customers",
          "shopper-customers/file.raml"
        ]);
    });

  setup()
    .do(() =>
      DownloadCommand.run([
        "--config-file=test-file.json",
        "--group-by",
        "CC API Family"
      ])
    )
    .it("accepts a configurable config file name", () => {
      expect("apis/test-file.json")
        .to.be.a.file()
        .with.content(`${API_CONFIG_JSON}\n`);
    });

  test
    .do(() =>
      DownloadCommand.run([
        `--config-file=/path/to/api-config.json`,
        "--group-by",
        "CC API Family"
      ])
    )
    .exit(2)
    .it("forbids specifying a path for config file name");

  test
    .do(() => DownloadCommand.run([]))
    .exit(2)
    .it("requires --group-by flag to be set");

  test
    .env({
      ANYPOINT_USERNAME: undefined,
      ANYPOINT_PASSWORD: undefined
    })
    .do(() => DownloadCommand.run(["--group-by", "CC API Family"]))
    .exit(2)
    .it("requires ANYPOINT_USERNAME and ANYPOINT_PASSWORD env variables");
});
