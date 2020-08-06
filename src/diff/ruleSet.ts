/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { Rule } from "json-rules-engine";
import fs from "fs-extra";

/**
 * Category to define in rule
 */
export enum RuleCategory {
  BREAKING = "Breaking",
  NON_BREAKING = "Non-Breaking",
  IGNORED = "Ignored",
}

/**
 * Holds rules
 */
export class RuleSet {
  constructor(public rules: Rule[]) {
    /**
     * Validate properties that are required for amf node diffs
     */
    this.validateRuleProperties();
  }

  /**
   * Initialize rule set from a rules json file
   * @param rulesPath - Path to rules file
   */
  static async init(rulesPath: string): Promise<RuleSet> {
    let ruleJsonArray: unknown;
    try {
      ruleJsonArray = await fs.readJSON(rulesPath);
    } catch (error) {
      error.message = `Error parsing the rules file: ${error.message}`;
      throw error;
    }

    if (!Array.isArray(ruleJsonArray)) {
      throw new Error("Rules must be defined as a json array");
    }

    try {
      const rules = ruleJsonArray.map((r) => new Rule(r));
      return new RuleSet(rules);
    } catch (error) {
      error.message = `Error parsing the rule: ${error.message}`;
      throw error;
    }
  }

  /**
   * Validate properties of the rule required for the Diff
   */
  validateRuleProperties(): void {
    this.rules.forEach((r) => {
      if (!r.name) {
        throw new Error("Name is required for every rule");
      }
      if (!r.event.params) {
        throw new Error(`Params are required in rule: ${r.name}`);
      }
      if (!r.event.params.category) {
        throw new Error(`Category is required in rule: ${r.name}`);
      }
      if (!Object.values(RuleCategory).includes(r.event.params.category)) {
        throw new Error(`Invalid category in rule: ${r.name}`);
      }
      //changedProperty is optional only for Ignored changes
      if (
        (!r.event.params.changedProperty ||
          r.event.params.changedProperty.trim() === "") &&
        r.event.params.category !== RuleCategory.IGNORED
      ) {
        throw new Error(`Changed property is required in rule: ${r.name}`);
      }
    });
  }

  /**
   * Returns true when there are rules
   */
  hasRules(): boolean {
    return this.rules != null && this.rules.length > 0;
  }
}
