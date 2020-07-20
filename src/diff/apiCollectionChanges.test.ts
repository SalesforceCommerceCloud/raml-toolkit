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

describe("Check for changes in api collection", () => {
  it("returns true when there are changes", async () => {
    const apiCollectionChanges = new ApiCollectionChanges();
    apiCollectionChanges.changes = new Map();
    const nodeChanges = new NodeChanges("test-id", ["test:type"]);
    const apiChanges = new ApiChanges("base.raml", "new.raml", [nodeChanges]);
    apiCollectionChanges.changes.set("base.raml", apiChanges);
    expect(apiCollectionChanges.hasChanges()).to.equal(true);
  });

  it("returns true when there are removed apis", async () => {
    const apiCollectionChanges = new ApiCollectionChanges();
    apiCollectionChanges.removedApis = ["test.raml"];
    expect(apiCollectionChanges.hasChanges()).to.equal(true);
  });

  it("returns true when there are added apis", async () => {
    const apiCollectionChanges = new ApiCollectionChanges();
    apiCollectionChanges.addedApis = ["test.raml"];
    expect(apiCollectionChanges.hasChanges()).to.equal(true);
  });

  it("returns false when the changes are not defined", async () => {
    const apiCollectionChanges = new ApiCollectionChanges();
    expect(apiCollectionChanges.hasChanges()).to.equal(false);
  });

  it("returns false when the changes are null", async () => {
    const apiCollectionChanges = new ApiCollectionChanges();
    apiCollectionChanges.changes = null;
    apiCollectionChanges.removedApis = null;
    apiCollectionChanges.addedApis = null;

    expect(apiCollectionChanges.hasChanges()).to.equal(false);
  });

  it("returns false when the changes are empty", async () => {
    const apiCollectionChanges = new ApiCollectionChanges();
    apiCollectionChanges.changes = new Map();
    apiCollectionChanges.removedApis = [];
    apiCollectionChanges.addedApis = [];

    expect(apiCollectionChanges.hasChanges()).to.equal(false);
  });
});

describe("Check for failures on api collection diff", () => {
  it("returns true when there are failures", async () => {
    const apiCollectionChanges = new ApiCollectionChanges();
    apiCollectionChanges.failed = new Map();
    apiCollectionChanges.failed.set("test.raml", "test-error");
    expect(apiCollectionChanges.hasFailures()).to.equal(true);
  });

  it("returns false when the failures are not defined", async () => {
    const apiCollectionChanges = new ApiCollectionChanges();
    apiCollectionChanges.failed = undefined;
    expect(apiCollectionChanges.hasFailures()).to.equal(false);
  });

  it("returns false when the failures are null", async () => {
    const apiCollectionChanges = new ApiCollectionChanges();
    apiCollectionChanges.failed = null;
    expect(apiCollectionChanges.hasFailures()).to.equal(false);
  });

  it("returns false when the failures are empty", async () => {
    const apiCollectionChanges = new ApiCollectionChanges();
    apiCollectionChanges.failed = new Map();
    expect(apiCollectionChanges.hasFailures()).to.equal(false);
  });
});
