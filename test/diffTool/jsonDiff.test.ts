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
  addNodeDiff,
  addNodePropertyDiffs,
  DiffType,
  NodeDiff,
  addNodeArrayPropertyDiffs,
  getDiffType
} from "../../src/diffTool/jsonDiff";

import _ from "lodash";

const expect = chai.expect;

function buildValidJson(): object {
  return {
    [JSON_LD_KEY_GRAPH]: [
      { "@id": "#/web-api", "core:name": "Test Raml" },
      {
        "@id": "#/web-api/end-points/resource",
        "apiContract:path": "/resource"
      }
    ],
    [JSON_LD_KEY_CONTEXT]: { "@base": "test.raml" }
  };
}

describe("Validations of the differencing object", () => {
  it("throws error when left JSON object is undefined ", async () => {
    expect(() => findJsonDiffs(undefined, buildValidJson())).to.throw(
      "Error validating left object: Invalid object"
    );
  });

  it("throws error when left JSON object is empty ", async () => {
    expect(() => findJsonDiffs({}, buildValidJson())).to.throw(
      "Error validating left object: Invalid object"
    );
  });

  it("throws error when right JSON object is undefined ", async () => {
    expect(() => findJsonDiffs(buildValidJson(), undefined)).to.throw(
      "Error validating right object: Invalid object"
    );
  });

  it("throws error when right JSON object is empty ", async () => {
    expect(() => findJsonDiffs(buildValidJson(), {})).to.throw(
      "Error validating right object: Invalid object"
    );
  });

  it("throws error when the JSON object is missing @graph property ", async () => {
    const left = buildValidJson();
    left[JSON_LD_KEY_GRAPH] = null;
    return expect(() => findJsonDiffs(left, undefined)).to.throw(
      `Error validating left object: ${JSON_LD_KEY_GRAPH} property is missing`
    );
  });

  it("throws error when @graph in JSON object is not an array ", async () => {
    const left = buildValidJson();
    left[JSON_LD_KEY_GRAPH] = {};
    return expect(() => findJsonDiffs(left, undefined)).to.throw(
      `Error validating left object: ${JSON_LD_KEY_GRAPH} property must be an array of json nodes`
    );
  });

  it("throws error when @graph in JSON object is an empty array ", async () => {
    const left = buildValidJson();
    left[JSON_LD_KEY_GRAPH] = [];
    return expect(() => findJsonDiffs(left, undefined)).to.throw(
      `Error validating left object: ${JSON_LD_KEY_GRAPH} property must be an array of json nodes`
    );
  });
});

describe("Changes to json nodes", () => {
  it("returns empty differences when left json content is same as right json content", async () => {
    const diffs = findJsonDiffs(buildValidJson(), buildValidJson());
    expect(diffs.length).to.equal(0);
  });

  it("returns differences as 'Added' when the nodes are missing in left json", async () => {
    const left = buildValidJson();
    const obj = left[JSON_LD_KEY_GRAPH].pop();

    const diffs = findJsonDiffs(left, buildValidJson());

    expect(diffs.length).to.equal(1);
    expect(diffs[0].added).to.deep.equal(obj);
    expect(_.isEmpty(diffs[0].removed)).to.true;
  });

  it("returns differences as 'Removed' when the nodes are missing in right json", async () => {
    const right = buildValidJson();
    const obj = right[JSON_LD_KEY_GRAPH].pop();

    const diffs = findJsonDiffs(buildValidJson(), right);

    expect(diffs.length).to.equal(1);
    expect(diffs[0].removed).to.deep.equal(obj);
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

  it("throws error for invalid node difference", async () => {
    expect(() =>
      addNodeDiff([{ "@id": "node1" }, { "@id": "node2" }])
    ).to.throw("Invalid difference type for node");
  });
});

describe("Changes to the properties with in a json node", () => {
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

  it("throws error for invalid node property difference", async () => {
    expect(() =>
      addNodePropertyDiffs(
        "prop",
        [],
        DiffType.MOVED,
        new NodeDiff("test-node")
      )
    ).to.throw("Invalid difference type for node property");
  });

  it("throws error for invalid difference structure", async () => {
    expect(() => getDiffType([])).to.throw("Invalid difference structure");
  });
});

describe("Changes to the array properties with in a json node", () => {
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

  it("throws error for invalid node array property difference", async () => {
    expect(() =>
      addNodeArrayPropertyDiffs(
        "prop",
        [],
        DiffType.MODIFIED,
        new NodeDiff("test-node")
      )
    ).to.throw("Invalid difference type for node array property");
  });
});

describe("Changes to the reference node ID with in a json node", () => {
  it("returns modified reference property", async () => {
    const left = buildValidJson();
    const oldReferenceValue = { "@id": "#/declarations/securitySchemes/test" };
    left[JSON_LD_KEY_GRAPH][1]["security:scheme"] = oldReferenceValue;

    const right = buildValidJson();
    const newReferenceValue = {
      "@id": "#/declarations/securitySchemes/test-updated"
    };
    right[JSON_LD_KEY_GRAPH][1]["security:scheme"] = newReferenceValue;

    const diffs = findJsonDiffs(left, right);

    expect(diffs.length).to.equal(1);
    expect(diffs[0].removed["security:scheme"]).to.deep.equal(
      oldReferenceValue
    );
    expect(diffs[0].added["security:scheme"]).to.deep.equal(newReferenceValue);
  });

  it("throws error when the reference property is invalid", async () => {
    const left = {
      [JSON_LD_KEY_GRAPH]: [
        {
          "@id": "#/web-api",
          reference: { "@id": "test" }
        }
      ]
    };
    const right = {
      [JSON_LD_KEY_GRAPH]: [
        {
          "@id": "#/web-api",
          reference: { prop: "test" } //this is invalid, reference should have only @id property
        }
      ]
    };

    expect(() => findJsonDiffs(left, right)).to.throw(
      "Invalid difference type for node reference property"
    );
  });
});
