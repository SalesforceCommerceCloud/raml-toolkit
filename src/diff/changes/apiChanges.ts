/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { NodeChanges } from "./nodeChanges";
import { RuleCategory } from "./ruleSet";

/**
 * Holds changes between two API specifications
 */
export class ApiChanges {
  /**
   * Create ApiChanges object
   * @param baseApiSpec - Base API specification to compare
   * @param newApiSpec - New API specification to compare
   * @param nodeChanges - Changes between base and new API specifications
   */
  constructor(
    public baseApiSpec: string,
    public newApiSpec: string,
    public nodeChanges: NodeChanges[]
  ) {}

  /**
   * Return true if there are changes
   */
  hasChanges(): boolean {
    return this.nodeChanges.length > 0;
  }

  /**
   * Get nodes that has categorized changes
   */
  getCategorizedChanges(): NodeChanges[] {
    return this.nodeChanges.filter(n => n.hasCategorizedChanges());
  }

  /**
   * Return true if there are breaking changes
   */
  hasBreakingChanges(): boolean {
    return this.nodeChanges.some(n => n.hasBreakingChanges());
  }

  /**
   * Get the number of changes by category
   * @param category - category of the change
   */
  getChangeCountByCategory(category: RuleCategory): number {
    let count = 0;
    for (const n of this.nodeChanges) {
      count += n.getChangeCountByCategory(category);
    }
    return count;
  }

  /**
   * Get number of breaking changes
   */
  getBreakingChangesCount(): number {
    return this.getChangeCountByCategory(RuleCategory.BREAKING);
  }

  /**
   * Get number of non-breaking changes
   */
  getNonBreakingChangesCount(): number {
    return this.getChangeCountByCategory(RuleCategory.NON_BREAKING);
  }

  /**
   * Return number of ignored changes
   */
  getIgnoredChangesCount(): number {
    return this.getChangeCountByCategory(RuleCategory.IGNORED);
  }
}
