/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
  CategorizedChange,
  CategorizedChangeTemplateData,
} from "./categorizedChange";
import {
  RuleCategory,
  createCategorySummary,
  CategorySummary,
} from "../ruleCategory";

/**
 * NodeChanges data in a format more easily consumed by Handlebars templates
 */
export type NodeChangesTemplateData = {
  nodeId: string;
  categorizedChanges: CategorizedChangeTemplateData[];
  nodeSummary: CategorySummary;
};

/**
 * Class to hold differences of a JSON node
 */
export class NodeChanges {
  public added: { [key: string]: unknown };
  public removed: { [key: string]: unknown };
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
      (c) => c.category === RuleCategory.BREAKING
    );
  }

  /**
   * Returns true when there are ignored changes
   */
  hasIgnoredChanges(): boolean {
    return this.categorizedChanges.some(
      (c) => c.category === RuleCategory.IGNORED
    );
  }

  /**
   * Get the number of changes by category
   * @param category - category of the change
   */
  getChangeCountByCategory(category: RuleCategory): number {
    return this.categorizedChanges.filter((c) => c.category === category)
      .length;
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

  /**
   * Gets the number of changes in each category
   */
  getCategorySummary(): CategorySummary {
    const summary = createCategorySummary();
    this.categorizedChanges.forEach((change) => {
      summary[change.category] += 1;
    });
    return summary;
  }

  /**
   * Returns data in a format more easily consumed by Handlebars templates
   */
  getTemplateData(): NodeChangesTemplateData {
    // Handlebars cannot do equality checks (without a helper), so a workaround
    // is to just filter out the values we don't want here
    const changes = this.categorizedChanges
      .filter((cc) => cc.category !== RuleCategory.IGNORED)
      .map((cc) => cc.getTemplateData());
    return {
      nodeId: this.id,
      categorizedChanges: changes,
      nodeSummary: this.getCategorySummary(),
    };
  }
}
