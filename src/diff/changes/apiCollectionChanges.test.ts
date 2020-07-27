/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { expect } from "chai";
import { NodeChanges } from "./nodeChanges";
import { ApiChanges } from "./apiChanges";
import { ApiCollectionChanges } from "./apiCollectionChanges";

describe("Create an instance of ApiCollectionChanges", () => {
  it("creates ApiCollectionChanges object", async () => {
    const apiCollectionChanges = new ApiCollectionChanges(
      "baseApiConfig",
      "newApiConfig"
    );

    expect(apiCollectionChanges).to.be.an.instanceof(ApiCollectionChanges);
    expect(apiCollectionChanges.baseApiConfig).to.equal("baseApiConfig");
    expect(apiCollectionChanges.newApiConfig).to.equal("newApiConfig");
  });
});

describe("Check for changes in api collection", () => {
  it("returns true when there are changes", async () => {
    const apiCollectionChanges = new ApiCollectionChanges(
      "baseApiConfig",
      "newApiConfig"
    );
    apiCollectionChanges.changed = new Map();
    const apiChanges = new ApiChanges("base.raml", "new.raml");
    apiChanges.nodeChanges = [new NodeChanges("test-id", ["test:type"])];
    apiCollectionChanges.changed.set("base.raml", apiChanges);
    expect(apiCollectionChanges.hasChanges()).to.be.true;
  });

  it("returns true when there are removed apis", async () => {
    const apiCollectionChanges = new ApiCollectionChanges(
      "baseApiConfig",
      "newApiConfig"
    );
    apiCollectionChanges.removed = ["test.raml"];
    expect(apiCollectionChanges.hasChanges()).to.be.true;
  });

  it("returns true when there are added apis", async () => {
    const apiCollectionChanges = new ApiCollectionChanges(
      "baseApiConfig",
      "newApiConfig"
    );
    apiCollectionChanges.added = ["test.raml"];
    expect(apiCollectionChanges.hasChanges()).to.be.true;
  });

  it("returns false when the changes are not defined", async () => {
    const apiCollectionChanges = new ApiCollectionChanges(
      "baseApiConfig",
      "newApiConfig"
    );
    expect(apiCollectionChanges.hasChanges()).to.be.false;
  });

  it("returns false when the changes are empty", async () => {
    const apiCollectionChanges = new ApiCollectionChanges(
      "baseApiConfig",
      "newApiConfig"
    );
    apiCollectionChanges.changed = new Map();
    apiCollectionChanges.removed = [];
    apiCollectionChanges.added = [];

    expect(apiCollectionChanges.hasChanges()).to.be.false;
  });
});

describe("Check for failures on api collection diff", () => {
  it("returns true when there are failures", async () => {
    const apiCollectionChanges = new ApiCollectionChanges(
      "baseApiConfig",
      "newApiConfig"
    );
    apiCollectionChanges.errored = new Map();
    apiCollectionChanges.errored.set("test.raml", "test-error");
    expect(apiCollectionChanges.hasErrors()).to.be.true;
  });

  it("returns false when the failures are empty", async () => {
    const apiCollectionChanges = new ApiCollectionChanges(
      "baseApiConfig",
      "newApiConfig"
    );
    apiCollectionChanges.errored = new Map();
    expect(apiCollectionChanges.hasErrors()).to.be.false;
  });
});
