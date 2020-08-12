/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { NodeChanges } from "./nodeChanges";
import { RuleCategory } from "../ruleSet";
import _ from "lodash";

/**
 * Holds changes between two API specifications
 */
export class ApiChanges {
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
    return this.nodeChanges.some(n => n.hasCategorizedChanges());
  }

  /**
   * Get nodes that have categorized changes
   */
  getNodesWithCategorizedChanges(): NodeChanges[] {
    return this.nodeChanges.filter(n => n.hasCategorizedChanges());
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

  getCategorizedChangeSummary(): Record<RuleCategory, number> {
    const summaries = this.nodeChanges.map(node => {
      return node.getCategorizedChangeSummary();
    });
    return _.mergeWith(
      {},
      ...summaries,
      (a: number | undefined, b: number): number => (a || 0) + b
    );
  }

  /**
   * Format the changes as a string for printing to console
   *
   * @param extraIndent - Number of levels the headings should be nested
   */
  toString(extraIndent = 0): string {
    // Ensure passed value is a non-negative number
    extraIndent = Math.max(0, extraIndent) || 0;
    /**
     * Indents the first non-empty line by the sum of the amounts passed to this
     * function and the outer function. Also appends a newline.
     * @param baseIndent Base amount to indent
     * @param str String to indent
     * @returns The indented string
     */
    const indent = (baseIndent: number, str: string): string =>
      str.replace(/^\n*/, "$&" + " ".repeat(baseIndent + extraIndent)) + "\n";

    const categories = new Set(Object.values(RuleCategory));
    const changedNodes = this.getNodesWithCategorizedChanges();
    let out = "";

    for (const node of changedNodes) {
      out += indent(0, `Node: ${node.id}`);

      for (const cc of node.categorizedChanges) {
        // TODO: When Ignored is no longer allowed as a CategorizedChange, || [] can be removed
        const change = (cc.change || [])
          // `change.change` is a tuple, but some rules only set a single value
          .filter(v => v !== undefined)
          .join(" → ");
        out += indent(2, `[${cc.category}] ${cc.ruleName}: ${change}`);
      }
    }

    if (changedNodes.length > 0) {
      // TODO: When Ignored is no longer allowed as a CategorizedChange, the
      // count still needs to be in the summary
      out += indent(0, `\nSummary`);
      for (const category of categories) {
        const count = this.getChangeCountByCategory(category);
        if (count > 0) {
          out += indent(2, `${count} ${category} Changes`);
        }
      }
    } else {
      out += indent(0, `No changes.`);
    }

    return out.trimRight(); // Last newline is unnecessary
  }
}
