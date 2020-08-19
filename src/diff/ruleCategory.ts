/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Category to define a rule
 */
export enum RuleCategory {
  BREAKING = "Breaking",
  NON_BREAKING = "Non-Breaking",
  IGNORED = "Ignored",
}

/**
 * Count of number of rules in each category for some collection of rules
 */
export type CategorySummary = Record<RuleCategory, number>;

/**
 * Creates a category summary with all counts set to zero.
 */
export function createCategorySummary(): CategorySummary {
  const summary = {} as CategorySummary;
  Object.values(RuleCategory).forEach((category) => {
    summary[category] = 0;
  });
  return summary;
}
