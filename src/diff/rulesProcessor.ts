/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {
  Engine,
  Event,
  Almanac,
  RuleResult,
  EngineResult,
} from "json-rules-engine";
import { CategorizedChange } from "./changes/categorizedChange";
import { NodeChanges } from "./changes/nodeChanges";
import { ramlToolLogger } from "../common/logger";
import customOperators from "./customOperators";
import { RuleSet } from "./ruleSet";

//ID for the diff node/fact that is passed to the rule engine
export const DIFF_FACT_ID = "diff";

/**
 * Apply rules on the AMF node changes and categorize the changes
 * @param nodeChanges - Array of NodeChanges
 * @param rulesPath - File path of the rules
 */
export async function applyRules(
  nodeChanges: NodeChanges[],
  rulesPath: string
): Promise<NodeChanges[]> {
  if (!nodeChanges || nodeChanges.length == 0) {
    ramlToolLogger.info("No changes to apply the rules");
    return nodeChanges;
  }
  const ruleSet = await RuleSet.init(rulesPath);
  if (!ruleSet.hasRules()) {
    ramlToolLogger.info("No rules to apply on the changes");
    return nodeChanges;
  }
  //initialize engine with rules
  const engine = new Engine(ruleSet.rules);
  //callback function to execute when a rule is passed/evaluates to true
  engine.on("success", successHandler);
  //Add custom operators to use in rules
  customOperators.map((o) => engine.addOperator(o));

  /**
   * run rules on nodeChanges
   *
   * Result from the engine run is processed by the callback, the success handler. So the "EngineResult" returned by the runEngine function is ignored here.
   * Also callback has access to RuleResult which has all the details of the rule that is applied whereas EngineResult do not
   */
  const promises = nodeChanges.map((diff) => {
    return runEngine(engine, diff);
  });
  await Promise.all(promises);
  return nodeChanges;
}

/**
 * Callback function that executes when a rule is passed/evaluates to true on a diff
 * @param event - Event defined in the rule
 * @param almanac - Almanac that has the fact/diff on which the rule is applied
 * @param ruleResult - Result of rule execution
 */
async function successHandler(
  event: Event,
  almanac: Almanac,
  ruleResult: RuleResult
): Promise<void> {
  const nodeChanges: NodeChanges = await almanac.factValue(DIFF_FACT_ID);
  ramlToolLogger.debug(
    `Rule '${ruleResult.name}' is passed on node '${nodeChanges.id}'`
  );
  //Add categorized change
  let changedValues: [unknown, unknown];
  if (event.params.changedProperty) {
    changedValues = [
      nodeChanges.removed[event.params.changedProperty],
      nodeChanges.added[event.params.changedProperty],
    ];
  }
  nodeChanges.categorizedChanges.push(
    new CategorizedChange(
      ruleResult.name,
      event.type,
      event.params.category,
      changedValues
    )
  );
}

/**
 * Apply rules on the changes of a node
 * @param engine - Rules Engine
 * @param nodeChanges - Changes of a node
 */
async function runEngine(
  engine: Engine,
  nodeChanges: NodeChanges
): Promise<EngineResult> {
  ramlToolLogger.debug(`Running rules on node: ${nodeChanges.id}`);
  /**
   * json-rules-engine adds some metadata to the provided fact.
   * Wrapping nodeChanges object in a json prevents engine from modifying it. Engine now adds metadata to the wrapped object
   * https://github.com/CacheControl/json-rules-engine/issues/187
   */
  return engine.run({ [DIFF_FACT_ID]: nodeChanges });
}
