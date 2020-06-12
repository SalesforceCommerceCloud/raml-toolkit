/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { ApiChanges } from "../rulesProcessor";

export function log(apiChanges: ApiChanges): void {
  const tabularFmt = {};
  apiChanges.nodeChanges.forEach(nodeChange => {
    nodeChange.changes.forEach(categorizedChange => {
      if (!tabularFmt[categorizedChange.type]) {
        tabularFmt[categorizedChange.type] = {
          severity: categorizedChange.category,
          changes: []
        };
      }
      const changes = tabularFmt[categorizedChange.type].changes;
      changes.push(
        `${categorizedChange.change[0]} => ${categorizedChange.change[1]}`
      );
    });
  });
  console.table(tabularFmt);
}
