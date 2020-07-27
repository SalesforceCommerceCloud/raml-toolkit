/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Top level keys/property names in flattened JSON-LD
 */
export const KEY_GRAPH = "@graph";
export const KEY_CONTEXT = "@context";
export const KEY_NODE_ID = "@id";
export const KEY_NODE_TYPE = "@type";

/**
 * Types for AMF graph
 */
export type Node = {
  [KEY_NODE_ID]: string;
  [KEY_NODE_TYPE]: string[];
  [key: string]: unknown;
};
export type Context = {
  [key: string]: string;
};
export type FlattenedGraph = {
  [KEY_GRAPH]: Node[];
  [KEY_CONTEXT]: Context;
};
