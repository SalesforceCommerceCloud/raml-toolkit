/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as AmfGraphTypes from "./amfGraphTypes";

/**
 * External property, added by jsondiffpath to indicate that the node property is an array
 */
export const JSON_DIFF_PATCH_ARRAY_KEY = "_t";
export const JSON_DIFF_PATCH_ARRAY_VALUE = "a";

/**
 * Type describing the delta of a node property
 *
 * Delta is reported in array format
 * example: [oldValue, newValue, magicalNumber], magicalNumber is used identify removal (0), text diffs(2), movements(3)
 */
export type PropertyDelta =
  | [unknown] //added
  | [unknown, unknown] //modified
  | [unknown, 0, 0] //removed
  | [string, 0, 2]; //text change when diffing algorithm is applied

/**
 * Type describing the delta of a node property which is an array
 */
export type ArrayDelta = {
  /**
   * key is the index in original array
   * ["", number, 3] - [represents the moved item value, suppressed by default,destination index,magical number that indicates "array move" ]
   */
  [key: string]: PropertyDelta | ["", number, 3];
} & {
  //"special property to indicate its an array
  [JSON_DIFF_PATCH_ARRAY_KEY]: typeof JSON_DIFF_PATCH_ARRAY_VALUE;
};

/**
 *  Type describing the delta of a reference node ID
 */
export type ReferenceNodeDelta = {
  /**
   * Delta is calculated on flattened JSON-LD structure, property referencing other node will just have its id
   * example delta: {@id:[oldId, newId]}
   */
  [AmfGraphTypes.JSON_LD_KEY_ID]: [string, string];
};

/**
 * Type describing the delta of a node
 */
export type NodeDelta = {
  [AmfGraphTypes.JSON_LD_KEY_ID]: string;
  [AmfGraphTypes.JSON_LD_KEY_TYPE]: string[];
} & {
  [key: string]: PropertyDelta | ArrayDelta | ReferenceNodeDelta;
};

/**
 * Type describing the graph delta reported by jsondiffpatch
 */
export type GraphDelta = {
  /**
   * key: index in the original amf graph (left graph for removed nodes and right graph for added nodes)
   * value:  NodeDelta - indicate the properties with in a node are changes
   *        AmfGraphTypes.Node[]  - indicate a node is added/removed/moved
   */
  [key: string]: NodeDelta | AmfGraphTypes.Node[];
} & {
  [JSON_DIFF_PATCH_ARRAY_KEY]: typeof JSON_DIFF_PATCH_ARRAY_VALUE;
};
