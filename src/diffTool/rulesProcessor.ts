/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { Engine, RuleProperties } from "json-rules-engine";
import { NodeDiff } from "./jsonDiff";
import fs from "fs-extra";
import { ramlToolLogger } from "../common/logger";
import customOperators from "./customOperators";
import _ from "lodash";
/* eslint-disable @typescript-eslint/no-use-before-define */

//ID for the diff node/fact that is passed to the rule engine
export const DIFF_FACT_ID = "diff";

/**
 * Class to categorize the change as defined by the rule
 */
export class CategorizedChange {
  // event type defined in the rule
  type: string;
  //category defined in the rule. Example: Breaking, Ignore
  category: string;
  //[oldValue, newValue]
  change: string[];
}

/**
 * Class to hold all the categorized changes of a diff node
 */
export class NodeChanges {
  public changes: CategorizedChange[];
  public rawDiff: NodeDiff;
  public ignoredChanges?: number;
  public children: { [nodeId: string]: NodeChanges };
  constructor() {
    this.changes = [];
  }
}

/**
 * Class to to hold all the categorized changes to an API/RAML
 */
export class ApiChanges {
  public nodeChanges: { [nodeId: string]: NodeChanges };
  public ignoredChanges: number;
}
/**
 * Apply rules on the AMF node differences, updates passed rules details in the node
 * @param diffs - Array of differences
 * @param rulesPath - File path of the rules
 */
export async function applyRules(
  diffs: NodeDiff[],
  rulesPath: string
): Promise<ApiChanges> {
  const apiChanges: ApiChanges = {
    nodeChanges: {},
    ignoredChanges: 0
  };

  if (!diffs || diffs.length == 0) {
    ramlToolLogger.info("No differences to apply the rules");
    return apiChanges;
  }
  const rules = loadRulesFile(rulesPath);
  if (!rules || rules.length == 0) {
    ramlToolLogger.info("No rules to apply on the differences");
    return apiChanges;
  }
  //initialize engine with rules
  const engine = new Engine(rules);
  //Add custom operators to use in rules
  customOperators.map(o => engine.addOperator(o));

  //run rules on diffs
  const promises = diffs.map(diff => {
    //run rules on diff and save the result to api changes
    return runEngine(engine, diff, apiChanges);
  });
  await Promise.all(promises);
  return apiChanges;
}

/**
 * Get rules from rules json file
 * @param rulesPath - Path to rules json file
 *
 * @returns Array of rules
 */
function loadRulesFile(rulesPath: string): RuleProperties[] {
  let rules: RuleProperties[];
  try {
    rules = fs.readJSONSync(rulesPath);
  } catch (error) {
    error.message = `Error parsing the rules file: ${error.message}`;
    throw error;
  }
  if (!Array.isArray(rules)) {
    throw new Error("Rules must be defined as a json array");
  }
  return rules;
}

/**
 * Apply rules on a difference
 * @param engine - Rules Engine
 * @param diff - Difference of a node
 * @param apiChanges - Object to save the categorized changes
 */
async function runEngine(
  engine: Engine,
  diff: NodeDiff,
  apiChanges: ApiChanges
): Promise<void> {
  ramlToolLogger.debug(`Running rules on diff: ${diff.id}`);

  const unclassified = _.cloneDeep(diff);
  /**
   * json-rules-engine adds some metadata to the provided fact.
   * Wrapping diff object in a json prevents engine from modifying it. Engine now adds metadata to the wrapped object
   * https://github.com/CacheControl/json-rules-engine/issues/187
   */
  const result = await engine.run({ [DIFF_FACT_ID]: diff });

  //process result
  console.log();
  const categorizedChanges: CategorizedChange[] = [];

  let ignoredChanges = 0;
  result.events.forEach(event => {
    //Ignore the events that are marked as "Ignore" in the rule
    const changedProperty = event.params.changedProperty;
    if (event.params.category !== "Ignore") {
      const cChange: CategorizedChange = {
        type: event.type,
        category: event.params.category,
        change: [diff.removed[changedProperty], diff.added[changedProperty]]
      };
      categorizedChanges.push(cChange);
    } else {
      ignoredChanges += 1;
    }
    delete unclassified.added[changedProperty];
    delete unclassified.removed[changedProperty];
  });

  apiChanges.ignoredChanges += ignoredChanges;

  if (ignoredChanges > 0 && categorizedChanges.length === 0) return;

  if (apiChanges.nodeChanges[diff.id]) {
    apiChanges.nodeChanges[diff.id].changes.concat(categorizedChanges);
  } else {
    const nodeChanges: NodeChanges = {
      children: {},
      changes: categorizedChanges,
      rawDiff: result.events.length == 0 ? unclassified : null
    };
    apiChanges.nodeChanges = appendChanges(
      apiChanges.nodeChanges,
      diff.id,
      nodeChanges
    );
  }
}

function appendChanges(
  rootNode: { [nodeId: string]: NodeChanges },
  nodeId: string,
  nodeChanges: NodeChanges
): { [nodeId: string]: NodeChanges } {
  const ids = Object.keys(rootNode);
  if (ids.length === 0) {
    rootNode[nodeId] = nodeChanges;
    return rootNode;
  }
  let i: number;
  for (i = 0; i < ids.length; i++) {
    if (nodeId.includes(ids[i])) {
      return appendChanges(
        rootNode[ids[i]].children,
        nodeId.replace(ids[i], ""),
        nodeChanges
      );
    }
  }

  if (i === ids.length) {
    rootNode[nodeId] = nodeChanges;
  }
  return rootNode;
}
