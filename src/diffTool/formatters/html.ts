/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-disable @typescript-eslint/no-use-before-define */
import { ApiChanges, NodeChanges } from "../rulesProcessor";
import { string } from "@oclif/command/lib/flags";

/**
 * class to render changes in a table format in html, object represents the row in the table
 */
class ChangesByType {
  //event type defined in the rule, Example: version-changed
  type: string;
  //category defined in the rule, Example: Breaking
  category: string;
  //Array of changes (old => new) in all the nodes for the event type
  changes: string[];
}

/**
 * Return api changes  as an array of ChangesByType(rows)
 * @param apiChanges
 */
export function getApiChangesByType(apiChanges: ApiChanges): ChangesByType[] {
  const changesArr: ChangesByType[] = [];
  apiChanges.nodeChanges.forEach(nodeChanges => {
    nodeChanges.changes.forEach(categorizedChange => {
      let changesByType = changesArr.find(
        c => c.type === categorizedChange.type
      );
      if (!changesByType) {
        changesByType = new ChangesByType();
        changesByType.type = categorizedChange.type;
        changesByType.category = categorizedChange.category;
        changesByType.changes = [];
        changesArr.push(changesByType);
      }
      changesByType.changes.push(
        `${categorizedChange.change[0]} => ${categorizedChange.change[1]}`
      );
    });
  });
  return changesArr;
}

export function format(diffs: ApiChanges): string {
  // const data = getApiChangesByType(diffs);
  /* generate rows */
  // diffs.
  const rows = diffs.nodeChanges.map(createRow).join("");
  /* generate table */
  const table = createTable(rows);
  /* generate html */
  return createHtml(table);
}

/**
 * Generates an html row with the columns data
 * @param changesByType - Data object for the table rows
 * @returns html row as string
 */
const createRow = (nodeChanges: NodeChanges): string => {
  const rows = [];

  const MAX_SEGMENTS = 5;
  const splitFullId = decodeURIComponent(nodeChanges.nodeId).split("/");
  const shortenedId =
    splitFullId.length > MAX_SEGMENTS
      ? "..." +
        splitFullId
          .slice(splitFullId.length - MAX_SEGMENTS, splitFullId.length)
          .join("/")
      : splitFullId.join("/");

  nodeChanges.changes.forEach(row => {
    rows.push(`
    <tr>
      <td><span title="${splitFullId.join("/")}">${shortenedId}</span></td>
      <td>${row.type}</td>
      <td>${row.category}</td>
      <td>${row.change[0]} => ${row.change[1]}</td>
    </tr>`);
  });

  return rows.join("\n");
};

/**
 * Generates an html table with all the table rows
 * @param rows - rows in the table
 * @returns html table as string
 */
export const createTable = (rows): string => `
  <table>
    <tr>
        <th>ID</th>
        <th>Rule Matched</th>
        <th>Category</th>
        <th>Changes</th>
    </tr>
    ${rows}
  </table>
`;

/**
 * Generate an html page with a populated table
 * @param table - html table as string
 * @returns html page as string
 */
export const createHtml = (table): string => `
  <html lang="en">
    <head>
      <style>
        table {
          border-collapse: collapse;
          width: 100%;
        }
        table, th, td {
            border: 1px solid black;
        }
        th, tr {
          text-align: left;
        }
        th {
          background-color:lightsteelblue;
        }
        th:first-child { width: 20%;}
        th:first-child+th { width: 15%; }
      </style>
      <title>API Changes</title>
    </head>
    <body>
      ${table}
    </body>
  </html>
`;
