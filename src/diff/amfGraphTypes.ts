/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Top level keys/property names in flattened JSON-LD
 */
export const JSON_LD_KEY_GRAPH = "@graph";
export const JSON_LD_KEY_CONTEXT = "@context";
export const JSON_LD_KEY_ID = "@id";
export const JSON_LD_KEY_TYPE = "@type";

/**
 * Types for AMF graph
 */
export type Node = {
  [JSON_LD_KEY_ID]: string;
  [JSON_LD_KEY_TYPE]: string[];
  [key: string]: unknown;
};
export type Context = {
  [key: string]: string;
};
export type FlattenedGraph = {
  [JSON_LD_KEY_GRAPH]: Node[];
  [JSON_LD_KEY_CONTEXT]: Context;
};
