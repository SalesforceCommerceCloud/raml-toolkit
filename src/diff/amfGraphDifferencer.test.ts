/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {
  addArrayDelta,
  CONTEXT_TYPE,
  DeltaType,
  findGraphChanges,
  parseNodeDelta,
  parsePropertyDelta
} from "./amfGraphDifferencer";
import * as AmfGraphTypes from "./amfGraphTypes";
import _ from "lodash";
import { expect } from "chai";
import { NodeChanges } from "./changes/nodeChanges";

function buildValidGraph(): AmfGraphTypes.FlattenedGraph {
  return {
    [AmfGraphTypes.KEY_GRAPH]: [
      {
        [AmfGraphTypes.KEY_NODE_ID]: "#/web-api",
        [AmfGraphTypes.KEY_NODE_TYPE]: ["apiContract:WebAPI"],
        "core:name": "Test Raml"
      },
      {
        [AmfGraphTypes.KEY_NODE_ID]: "#/web-api/end-points/resource",
        [AmfGraphTypes.KEY_NODE_TYPE]: ["apiContract:endpoint"],
        "apiContract:path": "/resource"
      }
    ],
    [AmfGraphTypes.KEY_CONTEXT]: { "@base": "test.raml" }
  };
}

describe("Validate flattened AMF graph", () => {
  it("throws error when base AMF graph is undefined ", async () => {
    expect(() => findGraphChanges(undefined, buildValidGraph())).to.throw(
      "Error validating base AMF graph: Invalid object"
    );
  });

  it("throws error when new AMF graph is undefined ", async () => {
    expect(() => findGraphChanges(buildValidGraph(), undefined)).to.throw(
      "Error validating new AMF graph: Invalid object"
    );
  });

  it("throws error when @graph property is null", async () => {
    const baseGraph = buildValidGraph();
    baseGraph[AmfGraphTypes.KEY_GRAPH] = null;
    return expect(() => findGraphChanges(baseGraph, undefined)).to.throw(
      `Error validating base AMF graph: ${AmfGraphTypes.KEY_GRAPH} property is missing`
    );
  });

  it("throws error when @graph property is an empty array ", async () => {
    const baseGraph = buildValidGraph();
    baseGraph[AmfGraphTypes.KEY_GRAPH] = [];
    return expect(() => findGraphChanges(baseGraph, undefined)).to.throw(
      `Error validating base AMF graph: ${AmfGraphTypes.KEY_GRAPH} property must be an array of json nodes`
    );
  });
});

describe("Changes to graph nodes", () => {
  it("returns empty changes when base graph content is same as new graph content", async () => {
    const nodeChanges = findGraphChanges(buildValidGraph(), buildValidGraph());
    expect(nodeChanges).to.have.length(0);
  });

  it("returns changes as 'Added' when the nodes are missing in base graph", async () => {
    const baseGraph = buildValidGraph();
    const obj = baseGraph[AmfGraphTypes.KEY_GRAPH].pop();

    const nodeChanges = findGraphChanges(baseGraph, buildValidGraph());

    expect(nodeChanges).to.have.length(1);
    expect(nodeChanges[0].id).to.equal(obj[AmfGraphTypes.KEY_NODE_ID]);
    expect(nodeChanges[0].type).to.deep.equal(obj[AmfGraphTypes.KEY_NODE_TYPE]);
    expect(nodeChanges[0].added).to.deep.equal(
      _.omit(obj, AmfGraphTypes.KEY_NODE_ID, AmfGraphTypes.KEY_NODE_TYPE)
    );
    expect(_.isEmpty(nodeChanges[0].removed)).to.true;
  });

  it("returns changes as 'Removed' when the nodes are missing in new graph", async () => {
    const newGraph = buildValidGraph();
    const obj = newGraph[AmfGraphTypes.KEY_GRAPH].pop();

    const nodeChanges = findGraphChanges(buildValidGraph(), newGraph);

    expect(nodeChanges).to.have.length(1);
    expect(nodeChanges[0].id).to.equal(obj[AmfGraphTypes.KEY_NODE_ID]);
    expect(nodeChanges[0].type).to.deep.equal(obj[AmfGraphTypes.KEY_NODE_TYPE]);
    expect(nodeChanges[0].removed).to.deep.equal(
      _.omit(obj, AmfGraphTypes.KEY_NODE_ID, AmfGraphTypes.KEY_NODE_TYPE)
    );
    expect(_.isEmpty(nodeChanges[0].added)).to.true;
  });

  it("Ignores node position/index changes", async () => {
    const newGraph = buildValidGraph();
    newGraph[AmfGraphTypes.KEY_GRAPH].reverse();

    const nodeChanges = findGraphChanges(buildValidGraph(), newGraph);
    expect(nodeChanges).to.have.length(0);
  });

  it("returns changes in @context node", async () => {
    const rightGraph = buildValidGraph();
    rightGraph[AmfGraphTypes.KEY_CONTEXT]["@base"] = "test-updated.raml";

    const nodeChanges = findGraphChanges(buildValidGraph(), rightGraph);

    expect(nodeChanges).to.have.length(1);
    expect(nodeChanges[0].id).to.equal(AmfGraphTypes.KEY_CONTEXT);
    expect(nodeChanges[0].type).to.deep.equal(CONTEXT_TYPE);
    expect(nodeChanges[0].removed["@base"]).to.equal("test.raml");
    expect(nodeChanges[0].added["@base"]).to.equal("test-updated.raml");
  });

  it("throws error for invalid node delta", async () => {
    expect(() =>
      parseNodeDelta(
        [
          {
            [AmfGraphTypes.KEY_NODE_ID]: "node1",
            [AmfGraphTypes.KEY_NODE_TYPE]: ["test:type"]
          }
        ],
        DeltaType.MODIFIED
      )
    ).to.throw("Invalid delta type for node");
  });

  it("Excludes node with undefined type", async () => {
    const baseGraph = buildValidGraph();
    const baseNode = baseGraph[AmfGraphTypes.KEY_GRAPH][1];
    baseNode[AmfGraphTypes.KEY_NODE_TYPE] = undefined;

    const newGraph = buildValidGraph();
    newGraph[AmfGraphTypes.KEY_GRAPH].pop();

    const nodeChanges = findGraphChanges(baseGraph, newGraph);
    expect(nodeChanges).to.have.length(0);
  });

  it("Excludes node with empty type array", async () => {
    const baseGraph = buildValidGraph();
    const baseNode = baseGraph[AmfGraphTypes.KEY_GRAPH][1];
    baseNode[AmfGraphTypes.KEY_NODE_TYPE] = [];

    const newGraph = buildValidGraph();
    newGraph[AmfGraphTypes.KEY_GRAPH].pop();

    const nodeChanges = findGraphChanges(baseGraph, newGraph);
    expect(nodeChanges).to.have.length(0);
  });
});

describe("Changes to the properties with in a node", () => {
  it("returns added properties", async () => {
    const newGraph = buildValidGraph();
    const apiObj = newGraph[AmfGraphTypes.KEY_GRAPH][0];
    apiObj["core:version"] = "v1";

    const nodeChanges = findGraphChanges(buildValidGraph(), newGraph);

    expect(nodeChanges).to.have.length(1);
    expect(nodeChanges[0].added["core:version"]).to.equal("v1");
  });

  it("returns removed properties", async () => {
    const baseGraph = buildValidGraph();
    const apiObj = baseGraph[AmfGraphTypes.KEY_GRAPH][0];
    apiObj["core:version"] = "v1";

    const nodeChanges = findGraphChanges(baseGraph, buildValidGraph());

    expect(nodeChanges).to.have.length(1);
    expect(nodeChanges[0].removed["core:version"]).to.equal("v1");
  });

  it("returns modified properties", async () => {
    const baseGraph = buildValidGraph();
    baseGraph[AmfGraphTypes.KEY_GRAPH][0]["core:version"] = "v1";
    const newGraph = buildValidGraph();
    newGraph[AmfGraphTypes.KEY_GRAPH][0]["core:version"] = "v2";

    const nodeChanges = findGraphChanges(baseGraph, newGraph);

    expect(nodeChanges).to.have.length(1);
    expect(nodeChanges[0].removed["core:version"]).to.equal("v1");
    expect(nodeChanges[0].added["core:version"]).to.equal("v2");
  });

  it("throws error for invalid node property delta", async () => {
    expect(() =>
      parsePropertyDelta(
        "prop",
        ["old", "new"],
        DeltaType.MOVED,
        new NodeChanges("test-node", ["test:type"])
      )
    ).to.throw("Invalid delta type for node property");
  });

  it("Excludes node with undefined type", async () => {
    const baseGraph = buildValidGraph();
    const baseNode = baseGraph[AmfGraphTypes.KEY_GRAPH][0];
    baseNode[AmfGraphTypes.KEY_NODE_TYPE] = undefined;
    baseNode["core:version"] = "v1";

    const newGraph = buildValidGraph();
    const newNode = newGraph[AmfGraphTypes.KEY_GRAPH][0];
    newNode[AmfGraphTypes.KEY_NODE_TYPE] = undefined;
    newNode["core:version"] = "v2";

    const nodeChanges = findGraphChanges(baseGraph, newGraph);
    expect(nodeChanges).to.have.length(0);
  });

  it("Excludes node with empty type array", async () => {
    const baseGraph = buildValidGraph();
    const baseNode = baseGraph[AmfGraphTypes.KEY_GRAPH][0];
    baseNode[AmfGraphTypes.KEY_NODE_TYPE] = [];
    baseNode["core:version"] = "v1";

    const newGraph = buildValidGraph();
    const newNode = newGraph[AmfGraphTypes.KEY_GRAPH][0];
    newNode[AmfGraphTypes.KEY_NODE_TYPE] = [];
    newNode["core:version"] = "v2";

    const nodeChanges = findGraphChanges(baseGraph, newGraph);
    expect(nodeChanges).to.have.length(0);
  });
});

describe("Changes to the array properties with in a node", () => {
  it("returns added array properties", async () => {
    const baseGraph = buildValidGraph();
    const arrayValue = {
      [AmfGraphTypes.KEY_NODE_ID]: "#/web-api/end-points/resource"
    };
    baseGraph[AmfGraphTypes.KEY_GRAPH][0]["apiContract:endpoint"] = [
      arrayValue
    ];

    const newGraph = buildValidGraph();
    const newArrayValue = {
      [AmfGraphTypes.KEY_NODE_ID]: "#/web-api/end-points/resource/{resourceId}"
    };
    newGraph[AmfGraphTypes.KEY_GRAPH][0]["apiContract:endpoint"] = [
      arrayValue,
      newArrayValue
    ];

    const nodeChanges = findGraphChanges(baseGraph, newGraph);

    expect(nodeChanges).to.have.length(1);
    expect(nodeChanges[0].added["apiContract:endpoint"]).to.deep.equal([
      newArrayValue
    ]);
  });

  it("returns removed array properties", async () => {
    const baseGraph = buildValidGraph();
    const arrayValue = {
      [AmfGraphTypes.KEY_NODE_ID]: "#/web-api/end-points/resource"
    };
    const removedArrayValue = {
      [AmfGraphTypes.KEY_NODE_ID]: "#/web-api/end-points/resource/{resourceId}"
    };
    baseGraph[AmfGraphTypes.KEY_GRAPH][0]["apiContract:endpoint"] = [
      arrayValue,
      removedArrayValue
    ];

    const newGraph = buildValidGraph();
    newGraph[AmfGraphTypes.KEY_GRAPH][0]["apiContract:endpoint"] = [arrayValue];

    const nodeChanges = findGraphChanges(baseGraph, newGraph);

    expect(nodeChanges).to.have.length(1);
    expect(nodeChanges[0].removed["apiContract:endpoint"]).to.deep.equal([
      removedArrayValue
    ]);
  });

  it("Ignores index/position changes to array property in the node modified array value", async () => {
    const baseGraph = buildValidGraph();
    const arr = [
      { [AmfGraphTypes.KEY_NODE_ID]: "#/web-api/end-points/resource" },
      {
        [AmfGraphTypes.KEY_NODE_ID]:
          "#/web-api/end-points/resource/{resourceId}"
      }
    ];
    baseGraph[AmfGraphTypes.KEY_GRAPH][0]["apiContract:endpoint"] = arr;

    const newGraph = buildValidGraph();
    newGraph[AmfGraphTypes.KEY_GRAPH][0]["apiContract:endpoint"] = [
      ...arr
    ].reverse();

    const nodeChanges = findGraphChanges(baseGraph, newGraph);
    expect(nodeChanges).to.have.length(0);
  });

  it("throws error for invalid node array property delta", async () => {
    expect(() =>
      addArrayDelta(
        "prop",
        ["value"],
        DeltaType.MODIFIED,
        new NodeChanges("test-node", ["test:type"])
      )
    ).to.throw("Invalid delta type for node array property");
  });
});

describe("Changes to the reference node ID with in a node", () => {
  it("returns modified reference property", async () => {
    const baseGraph = buildValidGraph();
    const oldReferenceValue = {
      [AmfGraphTypes.KEY_NODE_ID]: "#/declarations/securitySchemes/test"
    };
    baseGraph[AmfGraphTypes.KEY_GRAPH][1][
      "security:scheme"
    ] = oldReferenceValue;

    const newGraph = buildValidGraph();
    const newReferenceValue = {
      [AmfGraphTypes.KEY_NODE_ID]: "#/declarations/securitySchemes/test-updated"
    };
    newGraph[AmfGraphTypes.KEY_GRAPH][1]["security:scheme"] = newReferenceValue;

    const nodeChanges = findGraphChanges(baseGraph, newGraph);

    expect(nodeChanges).to.have.length(1);
    expect(nodeChanges[0].removed["security:scheme"]).to.deep.equal(
      oldReferenceValue
    );
    expect(nodeChanges[0].added["security:scheme"]).to.deep.equal(
      newReferenceValue
    );
  });

  it("throws error when the reference property is invalid", async () => {
    const baseGraph = {
      [AmfGraphTypes.KEY_GRAPH]: [
        {
          [AmfGraphTypes.KEY_NODE_ID]: "#/web-api",
          [AmfGraphTypes.KEY_NODE_TYPE]: ["apiContract:WebAPI"],
          reference: { [AmfGraphTypes.KEY_NODE_ID]: "ref-node" }
        }
      ],
      [AmfGraphTypes.KEY_CONTEXT]: { "@base": "test.raml" }
    };
    const newGraph = {
      [AmfGraphTypes.KEY_GRAPH]: [
        {
          [AmfGraphTypes.KEY_NODE_ID]: "#/web-api",
          [AmfGraphTypes.KEY_NODE_TYPE]: ["apiContract:WebAPI"],
          reference: { prop: "test" } //this is invalid, reference should have only @id property
        }
      ],
      [AmfGraphTypes.KEY_CONTEXT]: { "@base": "test.raml" }
    };

    expect(() => findGraphChanges(baseGraph, newGraph)).to.throw(
      "Invalid delta type for node reference property"
    );
  });
});
