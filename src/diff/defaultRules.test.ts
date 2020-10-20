/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { NodeChanges } from "./changes/nodeChanges";
import { applyRules } from "./rulesProcessor";
import { expect } from "chai";
import { ApiDifferencer } from "./apiDifferencer";
import { Rule } from "json-rules-engine";
import fs from "fs-extra";

const defaultRules = fs.readJSONSync(ApiDifferencer.DEFAULT_RULES_PATH);

/**
 * Verify that rule is applied on node changes
 * @param nodeChanges - Node changes
 * @param rule - Rule that is expected to be applied
 */
function verifyRule(
  nodeChanges: NodeChanges,
  rule: Rule,
  countOfChanges = 1
): void {
  const categorizedChanges = nodeChanges.categorizedChanges;
  let changedValues: [unknown, unknown];
  if (rule.event.params.changedProperty) {
    changedValues = [
      nodeChanges.removed[rule.event.params.changedProperty],
      nodeChanges.added[rule.event.params.changedProperty],
    ];
  }
  expect(categorizedChanges).to.have.lengthOf(countOfChanges);
  expect(categorizedChanges[0].ruleName).to.equal(rule.name);
  expect(categorizedChanges[0].ruleEvent).to.equal(rule.event.type);
  expect(categorizedChanges[0].category).to.equal(rule.event.params.category);
  expect(categorizedChanges[0].change).to.deep.equal(changedValues);
}

describe("Display name change", () => {
  it("applies display name change rule", async () => {
    const nodeChanges = new NodeChanges("#/web-api/end-points/resource/get", [
      "apiContract:Operation",
    ]);
    nodeChanges.added = { "core:name": "newName" };
    nodeChanges.removed = { "core:name": "oldName" };
    const changes = await applyRules(
      [nodeChanges],
      ApiDifferencer.DEFAULT_RULES_PATH
    );
    const rule = defaultRules.find(
      (r) => r.event.type === "display-name-changed"
    );
    verifyRule(changes[0], rule);
  });
});

describe("Operation removal", () => {
  it("applies operation removed rule", async () => {
    const nodeChanges = new NodeChanges("#/web-api/end-points/resource/get", [
      "apiContract:Operation",
    ]);
    nodeChanges.added = {};
    nodeChanges.removed = { "core:name": "oldName" };
    const changes = await applyRules(
      [nodeChanges],
      ApiDifferencer.DEFAULT_RULES_PATH
    );
    const rule = defaultRules.find((r) => r.event.type === "operation-removed");
    verifyRule(changes[0], rule);
  });
});

describe("Parameter removal", () => {
  it("applies parameter removed rule", async () => {
    const nodeChanges = new NodeChanges("#/web-api/end-points/resource/get", [
      "apiContract:Parameter",
    ]);
    nodeChanges.added = {};
    nodeChanges.removed = { "core:name": "oldName" };
    const changes = await applyRules(
      [nodeChanges],
      ApiDifferencer.DEFAULT_RULES_PATH
    );
    const rule = defaultRules.find((r) => r.event.type === "parameter-removed");
    verifyRule(changes[0], rule);
  });
});

describe("Required parameter addition", () => {
  it("applies required parameter added rule", async () => {
    const nodeChanges = new NodeChanges("#/web-api/end-points/resource/get", [
      "apiContract:Parameter",
    ]);
    nodeChanges.added = {
      "core:name": "newName",
      "apiContract:required": true,
    };
    nodeChanges.removed = {};
    const changes = await applyRules(
      [nodeChanges],
      ApiDifferencer.DEFAULT_RULES_PATH
    );
    const rule = defaultRules.find(
      (r) => r.event.type === "required-parameter-added"
    );
    verifyRule(changes[0], rule);
  });
});

describe("Version change", () => {
  it("applies version change rule", async () => {
    const nodeChanges = new NodeChanges("#/web-api/end-points/resource/get", [
      "apiContract:WebAPI",
    ]);
    nodeChanges.added = { "core:version": "v2" };
    nodeChanges.removed = { "core:version": "v1" };
    const changes = await applyRules(
      [nodeChanges],
      ApiDifferencer.DEFAULT_RULES_PATH
    );
    const rule = defaultRules.find((r) => r.event.type === "version-changed");
    verifyRule(changes[0], rule);
  });
});

describe("Examples change", () => {
  it("does not apply ignore examples rule on a change that has no apiContract:Example node type", async () => {
    const nodeChanges = new NodeChanges("#/web-api/end-points/resource/get", [
      "apiContract:WebAPI",
    ]);
    nodeChanges.added = { "core:version": "v2" };
    nodeChanges.removed = { "core:version": "v1" };
    const changes = await applyRules(
      [nodeChanges],
      ApiDifferencer.DEFAULT_RULES_PATH
    );
    const rule = defaultRules.find((r) => r.event.type === "example-changed");
    expect(changes[0].categorizedChanges[0].ruleName).to.not.equal(rule.name);
  });

  it("does not apply ignore examples rule on a change that has undefined as the node type", async () => {
    const nodeChanges = new NodeChanges("#/web-api/end-points/resource/get", [
      undefined,
    ]);
    nodeChanges.added = { "core:version": "v2" };
    nodeChanges.removed = { "core:version": "v1" };
    const changes = await applyRules(
      [nodeChanges],
      ApiDifferencer.DEFAULT_RULES_PATH
    );
    expect(changes[0].categorizedChanges).to.be.empty;
  });

  it("does not apply ignore examples rule on a change that has no node type", async () => {
    const nodeChanges = new NodeChanges(
      "#/web-api/end-points/resource/get",
      []
    );
    nodeChanges.added = { "core:version": "v2" };
    nodeChanges.removed = { "core:version": "v1" };
    const changes = await applyRules(
      [nodeChanges],
      ApiDifferencer.DEFAULT_RULES_PATH
    );
    expect(changes[0].categorizedChanges).to.be.empty;
  });

  it("applies ignore examples rule on a change that includes only one apiContract:Example node type", async () => {
    const nodeChanges = new NodeChanges("#/web-api/end-points/resource/get", [
      "apiContract:Example",
    ]);
    nodeChanges.added = { "test:example": "Old example" };
    nodeChanges.removed = { "test:example": "New example" };
    const changes = await applyRules(
      [nodeChanges],
      ApiDifferencer.DEFAULT_RULES_PATH
    );
    const rule = defaultRules.find((r) => r.event.type === "example-changed");
    verifyRule(changes[0], rule);
  });

  it("applies ignore examples rule changes that includes many apiContract:Example node type", async () => {
    const nodeChanges = new NodeChanges("#/web-api/end-points/resource/get", [
      "apiContract:Example",
    ]);
    nodeChanges.added = { "test:example": "Old example" };
    nodeChanges.removed = { "test:example": "New example" };
    const changes = await applyRules(
      [nodeChanges, nodeChanges],
      ApiDifferencer.DEFAULT_RULES_PATH
    );
    const rule = defaultRules.find((r) => r.event.type === "example-changed");
    verifyRule(changes[0], rule, 2);
  });
});

describe("Description change", () => {
  it("applies rule when description is added", async () => {
    const nodeChanges = new NodeChanges("test-id", ["test:type"]);
    nodeChanges.added = { "core:description": "New description" };
    const changes = await applyRules(
      [nodeChanges],
      ApiDifferencer.DEFAULT_RULES_PATH
    );
    const rule = defaultRules.find(
      (r) => r.event.type === "description-changed"
    );
    verifyRule(changes[0], rule);
  });
  it("applies rule when description is removed", async () => {
    const nodeChanges = new NodeChanges("test-id", ["test:type"]);
    nodeChanges.removed = { "core:description": "Old description" };
    const changes = await applyRules(
      [nodeChanges],
      ApiDifferencer.DEFAULT_RULES_PATH
    );
    const rule = defaultRules.find(
      (r) => r.event.type === "description-changed"
    );
    verifyRule(changes[0], rule);
  });
  it("applies rule when description is modified", async () => {
    const nodeChanges = new NodeChanges("test-id", ["test:type"]);
    nodeChanges.added = { "core:description": "New description" };
    nodeChanges.removed = { "core:description": "Old description" };
    const changes = await applyRules(
      [nodeChanges],
      ApiDifferencer.DEFAULT_RULES_PATH
    );
    const rule = defaultRules.find(
      (r) => r.event.type === "description-changed"
    );
    verifyRule(changes[0], rule);
  });
});

describe("Operation addition", () => {
  it("applies operation removed rule", async () => {
    const nodeChanges = new NodeChanges("#/web-api/end-points/resource/get", [
      "apiContract:Operation",
    ]);
    nodeChanges.added = { "core:name": "newName" };
    nodeChanges.removed = {};
    const changes = await applyRules(
      [nodeChanges],
      ApiDifferencer.DEFAULT_RULES_PATH
    );
    const rule = defaultRules.find((r) => r.event.type === "operation-added");
    verifyRule(changes[0], rule);
  });
});
