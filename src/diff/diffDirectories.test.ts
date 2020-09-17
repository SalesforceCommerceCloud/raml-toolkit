/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { expect } from "chai";
import { default as sinon, SinonStub } from "sinon";

import {
  diffApiMetadata,
  diffApiModels,
  diffRamlDirectories,
} from "./diffDirectories";
import { ApiDifferencer } from "./apiDifferencer";
import { ApiChanges } from "./changes/apiChanges";
import { ApiCollectionChanges } from "./changes/apiCollectionChanges";
import { NodeChanges } from "./changes/nodeChanges";
import { ApiModel, ApiMetadata } from "../generate";
import * as loadApiDirectory from "../generate/loadApiDirectory";

describe("diffDirectories", () => {
  const nodeChanges = new NodeChanges("#/web-api/endpoints/test-endpoint", [
    "apiContract:Endpoint",
  ]);
  const apiChanges = new ApiChanges("left.raml", "right.raml");
  apiChanges.nodeChanges = [nodeChanges];
  let apiDifferencerStub: SinonStub;

  before(() => {
    apiDifferencerStub = sinon.stub(
      ApiDifferencer.prototype,
      "findAndCategorizeChanges"
    );
  });

  beforeEach(() => {
    apiDifferencerStub.reset();
    apiDifferencerStub.resolves(apiChanges);
  });

  after(() => {
    sinon.restore();
  });

  describe("diffApiModels", () => {
    it("should report the removed api", async () => {
      const leftModel = new ApiModel("api1", "api1.raml");
      const apiCollectionChanges = new ApiCollectionChanges(
        "api1.raml",
        "api1.raml"
      );

      await diffApiModels(leftModel, undefined, apiCollectionChanges);

      expect(apiCollectionChanges.removed).to.deep.equal(["api1.raml"]);
    });

    it("should report the added api", async () => {
      const rightModel = new ApiModel("api1", "api1.raml");
      const apiCollectionChanges = new ApiCollectionChanges(
        "api1.raml",
        "api1.raml"
      );

      await diffApiModels(undefined, rightModel, apiCollectionChanges);

      expect(apiCollectionChanges.added).to.deep.equal(["api1.raml"]);
    });

    it("should not return anything for the api if no diff is found", async () => {
      apiDifferencerStub.resolves(new ApiChanges("api1.raml", "api1.raml"));

      const leftModel = new ApiModel("api1", "api1.raml");
      const rightModel = new ApiModel("api1", "api1.raml");
      const apiCollectionChanges = new ApiCollectionChanges(
        "api1.raml",
        "api1.raml"
      );

      await diffApiModels(leftModel, rightModel, apiCollectionChanges);

      expect(apiDifferencerStub.calledOnce).to.be.true;
      expect(apiCollectionChanges.hasChanges()).to.be.false;
      expect(apiCollectionChanges.hasErrors()).to.be.false;
    });

    it("should not fail if ApiDifferencer throws an error", async () => {
      const error = new Error("Not found");
      apiDifferencerStub.rejects(error);

      const leftModel = new ApiModel("api1", "api1.raml");
      const rightModel = new ApiModel("api1", "api1.raml");
      const apiCollectionChanges = new ApiCollectionChanges(
        "api1.raml",
        "api1.raml"
      );

      await diffApiModels(leftModel, rightModel, apiCollectionChanges);

      expect(apiDifferencerStub.calledOnce).to.be.true;
      expect(apiCollectionChanges.errored).to.have.all.keys("api1.raml");
      expect(apiCollectionChanges.errored["api1.raml"]).to.equal(error.message);
    });

    it("should do nothing if both the apis are undefined", async () => {
      const apiCollectionChanges = new ApiCollectionChanges(
        "api1.raml",
        "api1.raml"
      );

      await diffApiModels(null, null, apiCollectionChanges);

      expect(apiDifferencerStub.called).to.be.false;
      expect(apiCollectionChanges.hasChanges()).to.be.false;
      expect(apiCollectionChanges.hasErrors()).to.be.false;
      expect(apiCollectionChanges.added).to.be.empty;
      expect(apiCollectionChanges.removed).to.be.empty;
    });
  });

  describe("diffApiMetadata", () => {
    it("should return api diff if ApiModel objects are passed", async () => {
      const leftModel = new ApiModel("api1", "api1.raml");
      const rightModel = new ApiModel("api1", "api1.raml");
      const apiCollectionChanges = new ApiCollectionChanges(
        "api1.raml",
        "api1.raml"
      );

      await diffApiMetadata(leftModel, rightModel, apiCollectionChanges);

      expect(Object.keys(apiCollectionChanges.changed)).to.have.length(1);
      expect(apiCollectionChanges.changed["api1.raml"]).to.equal(apiChanges);
      expect(apiDifferencerStub.calledOnce).to.be.true;
    });

    it("should return diff on all the apis that are part of the ApiMetadata", async () => {
      const leftTree = new ApiMetadata("left");
      const rightTree = new ApiMetadata("right");
      const leftApiFamily1 = new ApiMetadata("family1");
      const leftApiFamily2 = new ApiMetadata("family2");
      const rightApiFamily1 = new ApiMetadata("family1");
      const rightApiFamily2 = new ApiMetadata("family2");

      leftApiFamily1.children = [
        new ApiModel("api1", "api1.raml"),
        new ApiModel("api2", "api2.raml"),
      ];
      leftApiFamily2.children = [
        new ApiModel("api3", "api3.raml"),
        new ApiModel("api4", "api4.raml"),
      ];
      rightApiFamily1.children = [
        new ApiModel("api1", "api1.raml"),
        new ApiModel("api2", "api2.raml"),
      ];
      rightApiFamily2.children = [
        new ApiModel("api3", "api3.raml"),
        new ApiModel("api4", "api4.raml"),
      ];
      leftTree.children = [leftApiFamily1, leftApiFamily2];
      rightTree.children = [rightApiFamily1, rightApiFamily2];

      const apiCollectionChanges = new ApiCollectionChanges(
        "leftTree",
        "rightTree"
      );
      await diffApiMetadata(leftTree, rightTree, apiCollectionChanges);

      expect(Object.keys(apiCollectionChanges.changed)).to.have.length(4);
      expect(apiCollectionChanges.changed).to.have.all.keys(
        "api1.raml",
        "api2.raml",
        "api3.raml",
        "api4.raml"
      );
      expect(apiCollectionChanges.changed["api1.raml"]).to.equal(apiChanges);
      expect(apiCollectionChanges.changed["api2.raml"]).to.equal(apiChanges);
      expect(apiCollectionChanges.changed["api3.raml"]).to.equal(apiChanges);
      expect(apiCollectionChanges.changed["api4.raml"]).to.equal(apiChanges);
      expect(apiDifferencerStub.callCount).to.equal(4);
    });

    it("should report all the apis in the removed api family", async () => {
      const leftTree = new ApiMetadata("left");
      const rightTree = new ApiMetadata("right");
      const leftApiFamily1 = new ApiMetadata("family1");
      const leftApiFamily2 = new ApiMetadata("family2");
      const rightApiFamily1 = new ApiMetadata("family1");

      leftApiFamily1.children = [
        new ApiModel("api1", "api1.raml"),
        new ApiModel("api2", "api2.raml"),
      ];
      leftApiFamily2.children = [
        new ApiModel("api3", "api3.raml"),
        new ApiModel("api4", "api4.raml"),
      ];
      rightApiFamily1.children = [
        new ApiModel("api1", "api1.raml"),
        new ApiModel("api2", "api2.raml"),
      ];
      leftTree.children = [leftApiFamily1, leftApiFamily2];
      rightTree.children = [rightApiFamily1];

      const apiCollectionChanges = new ApiCollectionChanges(
        "leftTree",
        "rightTree"
      );
      await diffApiMetadata(leftTree, rightTree, apiCollectionChanges);

      expect(Object.keys(apiCollectionChanges.changed)).to.have.length(2);
      expect(apiCollectionChanges.changed).to.have.all.keys(
        "api1.raml",
        "api2.raml"
      );
      expect(apiCollectionChanges.removed).to.deep.equal([
        "api3.raml",
        "api4.raml",
      ]);
      expect(apiCollectionChanges.changed["api1.raml"]).to.equal(apiChanges);
      expect(apiCollectionChanges.changed["api2.raml"]).to.equal(apiChanges);
      expect(apiDifferencerStub.callCount).to.equal(2);
    });

    it("should report all the apis in the added api family", async () => {
      const leftTree = new ApiMetadata("left");
      const rightTree = new ApiMetadata("right");
      const leftApiFamily1 = new ApiMetadata("family1");
      const rightApiFamily1 = new ApiMetadata("family1");
      const rightApiFamily2 = new ApiMetadata("family2");

      leftApiFamily1.children = [
        new ApiModel("api1", "api1.raml"),
        new ApiModel("api2", "api2.raml"),
      ];
      rightApiFamily1.children = [
        new ApiModel("api1", "api1.raml"),
        new ApiModel("api2", "api2.raml"),
      ];
      rightApiFamily2.children = [
        new ApiModel("api3", "api3.raml"),
        new ApiModel("api4", "api4.raml"),
      ];
      leftTree.children = [leftApiFamily1];
      rightTree.children = [rightApiFamily1, rightApiFamily2];

      const apiCollectionChanges = new ApiCollectionChanges(
        "leftTree",
        "rightTree"
      );
      await diffApiMetadata(leftTree, rightTree, apiCollectionChanges);

      expect(Object.keys(apiCollectionChanges.changed)).to.have.length(2);
      expect(apiCollectionChanges.changed).to.have.all.keys(
        "api1.raml",
        "api2.raml"
      );
      expect(apiCollectionChanges.added).to.deep.equal([
        "api3.raml",
        "api4.raml",
      ]);
      expect(apiCollectionChanges.changed["api1.raml"]).to.equal(apiChanges);
      expect(apiCollectionChanges.changed["api2.raml"]).to.equal(apiChanges);
      expect(apiDifferencerStub.callCount).to.equal(2);
    });
  });

  describe("diffRamlDirectories", () => {
    let loadApiDirectoryStub: SinonStub;
    const apiMetadata = new ApiMetadata("api");
    apiMetadata.children = [new ApiModel("api1", "api1.raml")];

    before(() => {
      loadApiDirectoryStub = sinon.stub(loadApiDirectory, "loadApiDirectory");
    });

    beforeEach(() => {
      loadApiDirectoryStub.reset();
      loadApiDirectoryStub.returns(apiMetadata);
    });

    it("should return diff on two directories", async () => {
      const apiCollectionChanges = await diffRamlDirectories("dir1", "dir2");

      expect(Object.keys(apiCollectionChanges.changed)).to.have.length(1);
      expect(apiCollectionChanges.changed["api1.raml"]).to.equal(apiChanges);
      expect(loadApiDirectoryStub.calledTwice).to.be.true;
    });
  });
});
