/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import path from "path";
import { NodeChanges, NodeChangesTemplateData } from "./nodeChanges";
import {
  RuleCategory,
  createCategorySummary,
  CategorySummary,
} from "../ruleCategory";
import { Formatter } from "../formatter";

/**
 * ApiChanges data in a format more easily consumed by Handlebars templates
 */
export type ApiChangesTemplateData = {
  nodeChanges: NodeChangesTemplateData[];
  apiSummary: CategorySummary;
};

/**
 * Holds changes between two API specifications
 */
export class ApiChanges {
  protected static formatter = new Formatter<ApiChangesTemplateData>();
  //Changes between base and new API specifications
  public nodeChanges: NodeChanges[];

  /**
   * Create ApiChanges object
   * @param baseApiSpec - Base API specification to compare
   * @param newApiSpec - New API specification to compare
   */
  constructor(public baseApiSpec: string, public newApiSpec: string) {
    this.nodeChanges = [];
  }

  /**
   * Return true if there are changes
   */
  hasChanges(): boolean {
    return this.nodeChanges.length > 0;
  }

  /**
   * Return true if there are categorized changes
   */
  hasCategorizedChanges(): boolean {
    return this.nodeChanges.some((n) => n.hasCategorizedChanges());
  }

  /**
   * Get nodes that have categorized changes
   */
  getNodesWithCategorizedChanges(): NodeChanges[] {
    return this.nodeChanges.filter((n) => n.hasCategorizedChanges());
  }

  /**
   * Return true if there are breaking changes
   */
  hasBreakingChanges(): boolean {
    return this.nodeChanges.some((n) => n.hasBreakingChanges());
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

  /**
   * Gets the number of changes in each category
   */
  getCategorySummary(): CategorySummary {
    return this.nodeChanges.reduce((summary, node) => {
      const nodeSummary = node.getCategorySummary();
      Object.entries(nodeSummary).forEach(([category, count]) => {
        summary[category] += count;
      });
      return summary;
    }, createCategorySummary());
  }

  /**
   * Returns data in a format more easily consumed by Handlebars templates
   */
  getTemplateData(): ApiChangesTemplateData {
    const nodeChanges = this.getNodesWithCategorizedChanges();
    return {
      nodeChanges: nodeChanges.map((nc) => nc.getTemplateData()),
      apiSummary: this.getCategorySummary(),
    };
  }

  /**
   * Format the changes for printing to console
   */
  toConsoleString(): string {
    return ApiChanges.formatter.render(
      path.join(Formatter.TEMPLATES_DIR, "ApiChanges.console.hbs"),
      this.getTemplateData()
    );
  }
}
