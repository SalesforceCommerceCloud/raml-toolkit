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
export const ARRAY_KEY = "_t";
export const ARRAY_VALUE = "a";

/**
 * Types describing the delta of a value
 *
 * Delta is reported in array format
 * example: [oldValue, newValue, magicalNumber], magicalNumber is used identify removal (0), text diffs(2), movements(3)
 */
export type Added<T> = [T];
export type Modified<T> = [T, T];
export type Removed<T> = [T, 0, 0];
export type Moved<T> = [T, number, 3]; //[represents the moved item value,destination index,magical number indicating "array move" ]
export type LongTextModified = [string, 0, 2]; //text change when diffing algorithm is applied

/**
 * Type describing property delta
 */
export type PropertyDelta<T> =
  | Added<T>
  | Modified<T>
  | Removed<T>
  | LongTextModified;

/**
 * Type describing delta of an array element
 */
export type ArrayElementDelta<T> = Added<T> | Removed<T> | Moved<T>;

/**
 * Type describing the delta of an array
 */
export type ArrayDelta<T> = {
  /**
   * key is the index in original array
   */
  [key: string]: ArrayElementDelta<T>;
} & {
  //special property to indicate its an array
  [ARRAY_KEY]: typeof ARRAY_VALUE;
};

/**
 *  Type describing the delta of a reference node ID
 */
export type ReferenceNodeDelta = {
  /**
   * Delta is calculated on flattened JSON-LD structure, property referencing other node will just have its id
   * example delta: {@id:[oldId, newId]}
   */
  [AmfGraphTypes.KEY_NODE_ID]: Modified<string>;
};

/**
 * Type describing the delta of node properties
 */
export type NodePropertyDelta = {
  [AmfGraphTypes.KEY_NODE_ID]: string;
  [AmfGraphTypes.KEY_NODE_TYPE]: string[];
} & {
  [key: string]:
    | PropertyDelta<unknown>
    | ArrayDelta<unknown>
    | ReferenceNodeDelta;
};

/**
 * Type describing the graph delta reported by jsondiffpatch
 */
export type GraphDelta = {
  /**
   * key: index in the original amf graph (left graph for removed nodes and right graph for added nodes)
   * value:  Property - indicate the properties with in a node are changes
   *        AmfGraphTypes.Node[]  - indicate a node is added/removed/moved
   */
  [key: string]: NodePropertyDelta | ArrayElementDelta<AmfGraphTypes.Node>;
} & {
  [ARRAY_KEY]: typeof ARRAY_VALUE;
};
