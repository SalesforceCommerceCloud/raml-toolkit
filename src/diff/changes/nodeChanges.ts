/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import * as AmfGraphTypes from "../amfGraphTypes";
import { CategorizedChange } from "./categorizedChange";
import { RuleCategory } from "../ruleSet";

/**
 * Class to hold differences of a JSON node
 */
export class NodeChanges {
  public added: { [key: string]: unknown } | AmfGraphTypes.Node;
  public removed: { [key: string]: unknown } | AmfGraphTypes.Node;
  //categorized changes of the node
  public categorizedChanges: CategorizedChange[];

  /**
   * Create NodeChanges object
   * @param id - ID of the node
   * @param type - Node type based on AMF vocabulary
   */
  constructor(public id: string, public type: string[]) {
    this.added = {};
    this.removed = {};
    this.categorizedChanges = [];
  }

  /**
   * Returns true when there are categorized changes
   */
  hasCategorizedChanges(): boolean {
    return this.categorizedChanges.length > 0;
  }

  /**
   * Returns true when there are breaking changes
   */
  hasBreakingChanges(): boolean {
    return this.categorizedChanges.some(
      c => c.category === RuleCategory.BREAKING
    );
  }

  /**
   * Get the number of changes by category
   * @param category - category of the change
   */
  getChangeCountByCategory(category: RuleCategory): number {
    return this.categorizedChanges.filter(c => c.category === category).length;
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
   * Get number of ignored changes
   */
  getIgnoredChangesCount(): number {
    return this.getChangeCountByCategory(RuleCategory.IGNORED);
  }
}
