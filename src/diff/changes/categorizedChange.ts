/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { RuleCategory } from "../ruleCategory";

/**
 * CategorizedChange data in a format more easily consumed by Handlebars templates
 */
export type CategorizedChangeTemplateData = {
  ruleName: string;
  category: RuleCategory;
  change: {
    single?: unknown;
    multiple?: [unknown, unknown];
  };
};

/**
 * Holds node change that is categorized by rules
 */
export class CategorizedChange {
  /**
   * @param ruleName - Name of the rule that is applied/passed
   * @param ruleEvent - Event type defined in the rule
   * @param category - Category defined in the rule. Example: Breaking, Non-Breaking, Ignore
   * @param change - actual value that is changed - [oldValue, newValue]; optional if the rule is ignored
   */
  constructor(
    public ruleName: string,
    public ruleEvent: string,
    public category: RuleCategory,
    public change?: [unknown, unknown]
  ) {
    if (category !== RuleCategory.IGNORED && !change) {
      throw new Error("Changed values are required");
    }
  }

  /**
   * Returns data in a format more easily consumed by Handlebars templates
   */
  getTemplateData(): CategorizedChangeTemplateData {
    const change: CategorizedChangeTemplateData["change"] = {};
    if (this.change) {
      // Handlebars cannot use methods or boolean logic, so a workaround for
      // detecting single/multiple/no associated values is to make it explicit
      const values = this.change.filter((v) => v !== undefined);
      if (values.length === 2) {
        change.multiple = values as [unknown, unknown];
      } else if (values.length === 1) {
        change.single = values[0];
      }
    }
    return {
      change,
      category: this.category,
      ruleName: this.ruleName,
    };
  }
}
