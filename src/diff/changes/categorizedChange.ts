/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { RuleCategory } from "../ruleCategory";

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
}
