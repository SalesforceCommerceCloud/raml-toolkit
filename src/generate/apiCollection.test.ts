/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import path from "path";

import { expect, default as chai } from "chai";
import chaiAsPromised from "chai-as-promised";

import { ApiCollection } from "./apiCollection";

const validRamlFile = path.join(__dirname, "../../test/site.raml");
const invalidRamlFile = path.join(__dirname, "../../test/search-invalid.raml");

before(() => {
  chai.use(chaiAsPromised);
});

describe("Test ApiCollection class init", () => {
  it("creates a default instance", async () => {
    const collection = new ApiCollection();
    expect(collection).to.deep.equal([]);
  });

  it("creates an instance from a valid raml file", async () => {
    const collection = await ApiCollection.init({
      "Group One": [validRamlFile]
    });
    expect(collection.get("Group One")).to.not.be.empty;
    expect(collection.get("Group One")[0].model).to.not.be.empty;
    expect(collection.get("Group One")[0].name.original).to.equal("Shop API");
    expect(collection.get("Group One")[0].path).to.equal(validRamlFile);
  });

  it("creates an instance from two valid raml files in one group", async () => {
    const collection = await ApiCollection.init({
      "Group One": [validRamlFile, validRamlFile]
    });
    expect(collection.get("Group One"))
      .to.be.an("array")
      .with.lengthOf(2);
  });

  it("creates an instance from two valid raml files in two groups", async () => {
    const collection = await ApiCollection.init({
      "Group One": [validRamlFile],
      "Group Two": [validRamlFile]
    });
    expect(collection.get("Group One"))
      .to.be.an("array")
      .with.lengthOf(1);
    expect(collection.get("Group Two"))
      .to.be.an("array")
      .with.lengthOf(1);
  });

  it("rejects from an invalid raml file", () => {
    return expect(ApiCollection.init({ "Group One": [invalidRamlFile] })).to
      .eventually.be.rejected;
  });

  it("rejects from one good, one bad raml file", () => {
    return expect(
      ApiCollection.init({ "Group One": [validRamlFile, invalidRamlFile] })
    ).to.eventually.be.rejected;
  });

  it("rejects from an invalid file path", () => {
    return expect(ApiCollection.init({ "Group One": ["THISISNOTAREALFILE"] }))
      .to.eventually.be.rejected;
  });

  it("rejects from an invalid file path plus a good one", () => {
    return expect(
      ApiCollection.init({ "Group One": [validRamlFile, "THISISNOTAREALFILE"] })
    ).to.eventually.be.rejected;
  });
});
