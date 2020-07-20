/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { RuleCategory } from "./ruleSet";

/**
 * Holds node change that is categorized by rules
 */
export class CategorizedChange {
  //Name of the rule that is applied/passed
  public ruleName: string;

  //Event type defined in the rule
  public ruleEvent: string;

  //Category defined in the rule. Example: Breaking, Non-Breaking, Ignore
  public category: RuleCategory;

  //Flag indicating if a change is ignored by the rule
  public ignored?: boolean;

  //actual value that is changed - [oldValue, newValue]; optional if the rule is ignored
  public change?: [unknown, unknown];
}
