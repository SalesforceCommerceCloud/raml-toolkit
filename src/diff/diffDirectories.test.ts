/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import _ from "lodash";
import { expect } from "chai";
import fs from "fs-extra";
import path from "path";
import sinon from "sinon";
import tmp from "tmp";

import { diffRamlDirectories } from "./diffDirectories";
import { ApiDifferencer } from "./apiDifferencer";
import { ApiChanges } from "./changes/apiChanges";
import { NodeChanges } from "./changes/nodeChanges";

describe("diffRamlDirectories", () => {
  let leftDir: string;
  let rightDir: string;
  let leftApiConfigFile: string;
  let rightApiConfigFile: string;

  const apiConfig = {
    family1: [
      { assetId: "api1", fatRaml: { mainFile: "api1.raml" } },
      { assetId: "api2", fatRaml: { mainFile: "api2.raml" } },
    ],
    family2: [
      { assetId: "api3", fatRaml: { mainFile: "api3.raml" } },
      { assetId: "api4", fatRaml: { mainFile: "api4.raml" } },
    ],
  };
  const nodeChanges = new NodeChanges("#/web-api/endpoints/test-endpoint", [
    "apiContract:Endpoint",
  ]);
  const apiChanges = new ApiChanges("api1/api1.raml", "api2/api2.raml");
  apiChanges.nodeChanges = [nodeChanges];

  let apiDifferencerStub;
  before(() => {
    apiDifferencerStub = sinon.stub(
      ApiDifferencer.prototype,
      "findAndCategorizeChanges"
    );
  });
  after(() => {
    apiDifferencerStub.restore();
  });

  beforeEach(() => {
    leftDir = tmp.dirSync().name;
    rightDir = tmp.dirSync().name;
    leftApiConfigFile = path.join(leftDir, "api-config.json");
    rightApiConfigFile = path.join(rightDir, "api-config.json");
    fs.writeJsonSync(leftApiConfigFile, apiConfig);
    fs.copyFileSync(leftApiConfigFile, rightApiConfigFile);
    apiDifferencerStub.reset();
    apiDifferencerStub.resolves(apiChanges);
  });

  it("should return diff on all the apis in api-config.json", async () => {
    const apiCollectionChanges = await diffRamlDirectories(
      leftApiConfigFile,
      rightApiConfigFile
    );

    expect(Object.keys(apiCollectionChanges.changed)).to.have.length(4);
    expect(apiDifferencerStub.callCount).to.equal(4);
    expect(apiCollectionChanges.changed).to.have.all.keys(
      "api1/api1.raml",
      "api2/api2.raml",
      "api3/api3.raml",
      "api4/api4.raml"
    );
    expect(apiCollectionChanges.changed["api1/api1.raml"]).to.equal(apiChanges);
    expect(apiCollectionChanges.changed["api2/api2.raml"]).to.equal(apiChanges);
    expect(apiCollectionChanges.changed["api3/api3.raml"]).to.equal(apiChanges);
    expect(apiCollectionChanges.changed["api4/api4.raml"]).to.equal(apiChanges);
  });

  it("should not fail if ApiDifferencer throws an error", async () => {
    const error = new Error("Not found");
    apiDifferencerStub.rejects(error);
    fs.writeJsonSync(leftApiConfigFile, { family1: [apiConfig["family1"][0]] });
    fs.copyFileSync(leftApiConfigFile, rightApiConfigFile);

    const apiCollectionChanges = await diffRamlDirectories(
      leftApiConfigFile,
      rightApiConfigFile
    );

    expect(apiDifferencerStub.calledOnce).to.be.true;
    expect(apiCollectionChanges.errored).to.have.all.keys("api1/api1.raml");
    expect(apiCollectionChanges.errored["api1/api1.raml"]).to.equal(
      error.message
    );
  });

  it("should not return anything for the api if no diff is found", async () => {
    apiDifferencerStub.resolves(
      new ApiChanges("api1/api1.raml", "api1/api1.raml")
    );
    fs.writeJSONSync(leftApiConfigFile, { family1: [apiConfig["family1"][0]] });
    fs.copyFileSync(leftApiConfigFile, rightApiConfigFile);

    const apiCollectionChanges = await diffRamlDirectories(
      leftApiConfigFile,
      rightApiConfigFile
    );

    expect(apiDifferencerStub.calledOnce).to.be.true;
    expect(apiCollectionChanges.hasChanges()).to.be.false;
    expect(apiCollectionChanges.hasErrors()).to.be.false;
  });

  it("should report the removed apis", async () => {
    const apiConfigCopy = _.cloneDeep(apiConfig);
    apiConfigCopy.family2 = [apiConfig["family2"][0]];
    fs.writeFileSync(rightApiConfigFile, JSON.stringify(apiConfigCopy));

    const apiCollectionChanges = await diffRamlDirectories(
      leftApiConfigFile,
      rightApiConfigFile
    );

    expect(apiDifferencerStub.calledThrice).to.be.true;
    expect(apiCollectionChanges.removed).to.have.members(["api4/api4.raml"]);
  });

  it("should report all the apis in the removed apiFamily", async () => {
    fs.writeJsonSync(rightApiConfigFile, { family1: apiConfig["family1"] });

    const apiCollectionChanges = await diffRamlDirectories(
      leftApiConfigFile,
      rightApiConfigFile
    );

    expect(apiDifferencerStub.calledTwice).to.be.true;
    expect(apiCollectionChanges.removed).to.have.members([
      "api3/api3.raml",
      "api4/api4.raml",
    ]);
  });

  it("should report added apis", async () => {
    const apiConfigCopy = _.cloneDeep(apiConfig);
    apiConfigCopy.family2 = [apiConfig["family2"][0]];
    fs.writeJsonSync(leftApiConfigFile, apiConfigCopy);

    const apiCollectionChanges = await diffRamlDirectories(
      leftApiConfigFile,
      rightApiConfigFile
    );

    expect(apiDifferencerStub.calledThrice).to.be.true;
    expect(apiCollectionChanges.added).to.have.members(["api4/api4.raml"]);
  });

  it("should report apis in the newly added api family", async () => {
    fs.writeJsonSync(leftApiConfigFile, { family1: apiConfig["family1"] });

    const apiCollectionChanges = await diffRamlDirectories(
      leftApiConfigFile,
      rightApiConfigFile
    );

    expect(apiDifferencerStub.calledTwice).to.be.true;
    expect(apiCollectionChanges.added).to.have.members([
      "api3/api3.raml",
      "api4/api4.raml",
    ]);
  });

  it("works with relative paths", async () => {
    const apiCollectionChanges = await diffRamlDirectories(
      path.relative(process.cwd(), leftApiConfigFile),
      path.relative(process.cwd(), rightApiConfigFile)
    );

    expect(Object.keys(apiCollectionChanges.changed)).to.have.length(4);
    expect(apiDifferencerStub.callCount).to.equal(4);
  });
});
