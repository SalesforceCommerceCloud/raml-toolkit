/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as chai from "chai";
import {
  findJsonDiffs,
  JSON_LD_KEY_GRAPH,
  JSON_LD_KEY_CONTEXT,
  JSON_LD_KEY_ID
} from "../../src/differencer/jsonDiff";
import chaiAsPromised from "chai-as-promised";
import _ from "lodash";

const expect = chai.expect;

before(() => {
  chai.should();
  chai.use(chaiAsPromised);
});

function buildValidJson(): object {
  const obj = {};
  obj[JSON_LD_KEY_GRAPH] = [
    { "@id": "#/web-api", "core:name": "Test Raml" },
    { "@id": "#/web-api/end-points/resource", "apiContract:path": "/resource" }
  ];
  obj[JSON_LD_KEY_CONTEXT] = { "@base": "test.raml" };
  return obj;
}

describe("Test validations of the differencing object", () => {
  it("throws error when left JSON object is undefined ", async () => {
    expect(() => findJsonDiffs(undefined, buildValidJson())).to.throw(
      "Invalid left object"
    );
  });

  it("throws error when left JSON object is empty ", async () => {
    expect(() => findJsonDiffs({}, buildValidJson())).to.throw(
      "Invalid left object"
    );
  });

  it("throws error when right JSON object is undefined ", async () => {
    expect(() => findJsonDiffs(buildValidJson(), undefined)).to.throw(
      "Invalid right object"
    );
  });

  it("throws error when right JSON object is empty ", async () => {
    expect(() => findJsonDiffs(buildValidJson(), {})).to.throw(
      "Invalid right object"
    );
  });

  it("throws error when the JSON object is missing @graph property ", async () => {
    const left = buildValidJson();
    left[JSON_LD_KEY_GRAPH] = null;
    return expect(() => findJsonDiffs(left, undefined)).to.throw(
      `Left json must have ${JSON_LD_KEY_GRAPH} property`
    );
  });

  it("throws error when @graph in JSON object is not an array ", async () => {
    const left = buildValidJson();
    left[JSON_LD_KEY_GRAPH] = {};
    return expect(() => findJsonDiffs(left, undefined)).to.throw(
      `${JSON_LD_KEY_GRAPH} property in left json must be an array of json nodes`
    );
  });

  it("throws error when @graph in JSON object is an empty array ", async () => {
    const left = buildValidJson();
    left[JSON_LD_KEY_GRAPH] = [];
    return expect(() => findJsonDiffs(left, undefined)).to.throw(
      `${JSON_LD_KEY_GRAPH} property in left json must be an array of json nodes`
    );
  });
});

describe("Test json node differences", () => {
  it("returns empty differences when left json content is same as right json content", async () => {
    const diffs = findJsonDiffs(buildValidJson(), buildValidJson());
    expect(diffs.length).to.equal(0);
  });

  it("returns differences as 'Added' when the nodes are missing in left json", async () => {
    const left = buildValidJson();
    const obj = left[JSON_LD_KEY_GRAPH].pop();

    const diffs = findJsonDiffs(left, buildValidJson());

    expect(diffs.length).to.equal(1);
    expect(diffs[0].added[obj[JSON_LD_KEY_ID]]).to.deep.equal(obj);
    expect(_.isEmpty(diffs[0].removed)).to.true;
  });

  it("returns differences as 'Removed' when the nodes are missing in right json", async () => {
    const right = buildValidJson();
    const obj = right[JSON_LD_KEY_GRAPH].pop();

    const diffs = findJsonDiffs(buildValidJson(), right);

    expect(diffs.length).to.equal(1);
    expect(diffs[0].removed[obj[JSON_LD_KEY_ID]]).to.deep.equal(obj);
    expect(_.isEmpty(diffs[0].added)).to.true;
  });

  it("Ignores node position/index changes", async () => {
    const right = buildValidJson();
    right[JSON_LD_KEY_GRAPH].reverse();

    const diffs = findJsonDiffs(buildValidJson(), right);

    expect(diffs.length).to.equal(0);
  });

  it("returns differences in @context node", async () => {
    const right = buildValidJson();
    right[JSON_LD_KEY_CONTEXT]["@base"] = "test-updated.raml";

    const diffs = findJsonDiffs(buildValidJson(), right);

    expect(diffs.length).to.equal(1);
    expect(diffs[0].removed["@base"]).to.equal("test.raml");
    expect(diffs[0].added["@base"]).to.equal("test-updated.raml");
  });
});

describe("Test json node property differences", () => {
  it("returns added properties", async () => {
    const right = buildValidJson();
    const apiObj = right[JSON_LD_KEY_GRAPH][0];
    apiObj["core:version"] = "v1";

    const diffs = findJsonDiffs(buildValidJson(), right);

    expect(diffs.length).to.equal(1);
    expect(diffs[0].added["core:version"]).to.equal("v1");
  });

  it("returns removed properties", async () => {
    const left = buildValidJson();
    const apiObj = left[JSON_LD_KEY_GRAPH][0];
    apiObj["core:version"] = "v1";

    const diffs = findJsonDiffs(left, buildValidJson());

    expect(diffs.length).to.equal(1);
    expect(diffs[0].removed["core:version"]).to.equal("v1");
  });

  it("returns modified properties", async () => {
    const left = buildValidJson();
    left[JSON_LD_KEY_GRAPH][0]["core:version"] = "v1";
    const right = buildValidJson();
    right[JSON_LD_KEY_GRAPH][0]["core:version"] = "v2";

    const diffs = findJsonDiffs(left, right);

    expect(diffs.length).to.equal(1);
    expect(diffs[0].removed["core:version"]).to.equal("v1");
    expect(diffs[0].added["core:version"]).to.equal("v2");
  });
});

describe("Test json node array property differences", () => {
  it("returns added array properties", async () => {
    const left = buildValidJson();
    const arrayValue = { "@id": "#/web-api/end-points/resource" };
    left[JSON_LD_KEY_GRAPH][0]["apiContract:endpoint"] = [arrayValue];

    const right = buildValidJson();
    const newArrayValue = {
      "@id": "#/web-api/end-points/resource/{resourceId}"
    };
    right[JSON_LD_KEY_GRAPH][0]["apiContract:endpoint"] = [
      arrayValue,
      newArrayValue
    ];

    const diffs = findJsonDiffs(left, right);

    expect(diffs.length).to.equal(1);
    expect(diffs[0].added["apiContract:endpoint"]).to.deep.equal([
      newArrayValue
    ]);
  });

  it("returns removed array properties", async () => {
    const left = buildValidJson();
    const arrayValue = { "@id": "#/web-api/end-points/resource" };
    const removedArrayValue = {
      "@id": "#/web-api/end-points/resource/{resourceId}"
    };
    left[JSON_LD_KEY_GRAPH][0]["apiContract:endpoint"] = [
      arrayValue,
      removedArrayValue
    ];

    const right = buildValidJson();
    right[JSON_LD_KEY_GRAPH][0]["apiContract:endpoint"] = [arrayValue];

    const diffs = findJsonDiffs(left, right);

    expect(diffs.length).to.equal(1);
    expect(diffs[0].removed["apiContract:endpoint"]).to.deep.equal([
      removedArrayValue
    ]);
  });

  it("Ignores index/position changes to array property in the node modified array value", async () => {
    const left = buildValidJson();
    const arr = [
      { "@id": "#/web-api/end-points/resource" },
      {
        "@id": "#/web-api/end-points/resource/{resourceId}"
      }
    ];
    left[JSON_LD_KEY_GRAPH][0]["apiContract:endpoint"] = arr;

    const right = buildValidJson();
    right[JSON_LD_KEY_GRAPH][0]["apiContract:endpoint"] = [...arr].reverse();

    const diffs = findJsonDiffs(left, right);
    expect(diffs.length).to.equal(0);
  });
});
