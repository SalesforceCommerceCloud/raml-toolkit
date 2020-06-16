/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { ApiChanges } from "../rulesProcessor";

export function log(apiChanges: ApiChanges): boolean {
  const tabularFmt = [];
  apiChanges.nodeChanges.forEach(nodeChange => {
    nodeChange.changes.forEach(categorizedChange => {
      if (categorizedChange.type) {
        tabularFmt.push({
          id: decodeURIComponent(nodeChange.nodeId),
          rule: categorizedChange.type,
          severity: categorizedChange.category,
          changes: `${categorizedChange.change[0]} => ${categorizedChange.change[1]}`
        });
      }
    });
  });
  if (tabularFmt.length === 0) {
    console.log("No changes found");
    return true;
  }
  console.table(tabularFmt);
  return false;
}
