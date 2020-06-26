/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-disable @typescript-eslint/no-use-before-define */
import _ from "lodash";
import { DiffPatcher } from "jsondiffpatch";
import { ramlToolLogger } from "../common/logger";

/**
 * Top level keys/property names in flattened JSON-LD
 */
export const JSON_LD_KEY_GRAPH = "@graph";
export const JSON_LD_KEY_CONTEXT = "@context";
export const JSON_LD_KEY_ID = "@id";
export const JSON_LD_KEY_TYPE = "@type";

/**
 * External property, added by jsondiffpath to indicate that the node property is an array
 */
const JSON_DIFF_PATCH_ARRAY_KEY = "_t";
const JSON_DIFF_PATCH_ARRAY_VALUE = "a";

/**
 * Difference types that can be identified by jsondiffpath
 */
export enum DiffType {
  ADDED,
  REMOVED,
  MODIFIED,
  TEXT_DIFF,
  MOVED
}

/**
 * Class to hold differences of a JSON node
 */

export class NodeDiff {
  public added?: { [key: string]: { "@id": unknown } | unknown[] };
  public removed?: { [key: string]: { "@id": unknown } | unknown[] };
  /**
   * Rule that is evaluated to true on the difference
   */
  public rule?: {
    //name of the rule that is evaluated to true
    name: string;
    //event type defined in the rule
    type: string;
    //additional params defined in the rule. json-rules-engine allows any value
    params: { [key: string]: unknown };
  };

  /**
   * Constructs differences object to hold for a node
   * @param id - ID of the node
   * @param type - Node type based on AMF vocabulary
   */
  constructor(public id: string, public type?: string[]) {
    this.added = {};
    this.removed = {};
  }
}

/**
 * Find differences between two flattened JSON-LD AMF graphs
 * @param left - Left JSON object to compare
 * @param right - Right JSON object to compare
 *
 * @returns Array of NodeDiff objects
 */
export function findJsonDiffs(left: object, right: object): NodeDiff[] {
  //Verify left and right objects conform to flattened AMF graph json structure
  try {
    validateJson(left);
  } catch (error) {
    error.message = `Error validating left object: ${error.message}`;
    throw error;
  }
  try {
    validateJson(right);
  } catch (error) {
    error.message = `Error validating right object: ${error.message}`;
    throw error;
  }
  const jsonDiff = new DiffPatcher({
    // Define an object hash function
    objectHash: (obj): string => obj["@id"],
    arrays: {
      // detect items moved inside the array (otherwise they will be registered as remove+add). This flag defaults to true if not specified
      detectMove: true,
      // include the value of items moved so that we can have node ids in the diffs. This flag defaults to false if not specified
      includeValueOnMove: true
    },
    textDiff: {
      // minimum string length (left and right sides) to use text diff algorithm: google-diff-match-patch. Default value if not specified is 60
      minLength: 6000
    }
  });
  //add plugin to include ID of the JSON node in the diff
  jsonDiff.processor.pipes.diff.before("collectChildren", addNodeInfo);
  ramlToolLogger.debug(
    `Added plugin to include node ID in the diff: ${jsonDiff.processor.pipes.diff.list()}`
  );

  /**
   * Refer to jsondiffpath documentation for the format of the diffs that are returned
   * https://github.com/benjamine/jsondiffpatch/blob/master/docs/deltas.md
   */
  const diffs = jsonDiff.diff(left, right);

  return parseDiffs(diffs);
}

/**
 * Verify object to diff/compare conform to flattened AMF graph json structure
 * @param obj - Json provided to diff/compare
 */
function validateJson(obj: object): void {
  if (_.isEmpty(obj)) {
    throw new Error(`Invalid object`);
  }
  //Flattened AMF graph must have valid @graph or @context properties
  const graph = obj[JSON_LD_KEY_GRAPH];
  if (graph == null) {
    throw new Error(`${JSON_LD_KEY_GRAPH} property is missing`);
  }
  if (!_.isArray(graph) || graph.length == 0) {
    throw new Error(
      `${JSON_LD_KEY_GRAPH} property must be an array of json nodes`
    );
  }
}

/**
 * Parse JSON differences and generate an array of typed diff objects
 * @param diffs - Differences JSON
 *
 * @returns Array of NodeDiff objects
 */
function parseDiffs(diffs: object): NodeDiff[] {
  const typedDiffs: NodeDiff[] = [];
  if (_.isEmpty(diffs)) {
    //no changes
    ramlToolLogger.info("No differences found by the jsondiffpatch");
    return typedDiffs;
  }

  ramlToolLogger.debug("Parsing differences generated by jsondiffpatch");
  const graphDiffs = diffs[JSON_LD_KEY_GRAPH];
  if (graphDiffs != null) {
    //process graph changes
    ramlToolLogger.debug("Parsing differences in JSON-LD graph node");
    typedDiffs.push(...parseGraph(graphDiffs));
  }
  const contextDiffs = diffs[JSON_LD_KEY_CONTEXT];
  if (contextDiffs != null) {
    //process context changes
    ramlToolLogger.debug("Parsing differences in the JSON-LD context node");
    const typedContextDiff = parseNodePropDiffs(
      JSON_LD_KEY_CONTEXT,
      contextDiffs
    );
    if (typedContextDiff != null) {
      typedDiffs.push(typedContextDiff);
    }
  }
  return typedDiffs;
}

/**
 * Parse differences for each JSON node in the graph
 * @param graphDiffs - JSON with differences
 *
 * @returns Array of NodeDiff objects
 */
function parseGraph(graphDiffs: object): NodeDiff[] {
  const typedDiffs: NodeDiff[] = [];
  //graphDiffs is an object in which keys represent the index in the original array (left for removed diffs and right for added diffs)
  Object.keys(graphDiffs).forEach(key => {
    if (key === JSON_DIFF_PATCH_ARRAY_KEY) {
      //Ignoring the property added by jsondiffpath to indicate that graph is an array
      return;
    }
    const diff = graphDiffs[key];
    let typedDiff;
    if (_.isArray(diff)) {
      //jsondiffpatch returns each diff as an array. So an array in place of node indicates that node is added/removed/moved
      typedDiff = addNodeDiff(diff);
    } else if (_.isObject(diff)) {
      //properties in a node are added/removed/modified/moved
      typedDiff = parseNodePropDiffs(diff[JSON_LD_KEY_ID], diff);
    }
    if (typedDiff != null) {
      typedDiffs.push(typedDiff);
    }
  });
  return typedDiffs;
}

/**
 * Parse differences to the node properties
 * @param nodeId - ID of the node
 * @param diff - JSON node that has differences
 *
 * @returns Instance of NodeDiff for the node if there are differences
 */
function parseNodePropDiffs(nodeId: string, diff: object): NodeDiff {
  let typedDiff = new NodeDiff(nodeId, diff[JSON_LD_KEY_TYPE]);
  Object.keys(diff)
    .filter(key => key !== JSON_LD_KEY_ID && key !== JSON_LD_KEY_TYPE) //ignore node id and type
    .forEach(key => {
      const value = diff[key];
      /**
       * check if the property of the node is an array. Key is the index of the original array
       * {"0":[oldValue, newValue],"_t":"a"}
       */
      if (value[JSON_DIFF_PATCH_ARRAY_KEY] === JSON_DIFF_PATCH_ARRAY_VALUE) {
        //Ignore property added by jsondiffpath to indicate array property
        Object.keys(value)
          .filter(arrKey => arrKey !== JSON_DIFF_PATCH_ARRAY_KEY)
          .forEach(arrKey => {
            //Since this is flattened graph array value is either a string or a object with an id referencing other object in the graph
            const arrValue = value[arrKey];
            const diffType = getDiffType(arrValue);
            ramlToolLogger.debug(
              `Adding difference of node: ${typedDiff.id}, array property: ${key}, array key: ${arrKey}, difference type: ${DiffType[diffType]}`
            );
            addNodeArrayPropertyDiffs(key, arrValue, diffType, typedDiff);
          });
      } else if (_.isArray(value)) {
        /**
         * Differences are reported in array format
         * example: [oldValue, newValue]
         */
        const diffType = getDiffType(value);
        ramlToolLogger.debug(
          `Adding difference of node: ${typedDiff.id}, property: ${key}, difference type: ${DiffType[diffType]}`
        );
        addNodePropertyDiffs(key, value, diffType, typedDiff);
      } else {
        /**
         * Since we are dealing with flattened JSON-LD structure, value is a object with just node ID referring other node
         * example diff: {@id:[oldId, newId]}
         */
        const diffType = getDiffType(value[JSON_LD_KEY_ID]);
        ramlToolLogger.debug(
          `Adding difference of node: ${typedDiff.id}, reference property: ${key}, difference type: ${DiffType[diffType]}`
        );
        addNodeReferenceDiffs(key, value[JSON_LD_KEY_ID], diffType, typedDiff);
      }
    });
  if (_.isEmpty(typedDiff.added) && _.isEmpty(typedDiff.removed)) {
    //when there are just moves and no actual changes, ignore the typed diff
    typedDiff = undefined;
  }
  return typedDiff;
}

/**
 * Get the type of the difference from the difference array generated by jsondiffpatch
 * @param diff - Difference of a node or a node property
 *
 * @return DiffType Type of the difference
 */
export function getDiffType(diff: unknown[]): DiffType {
  const diffLength = diff.length;
  if (diffLength === 1) {
    return DiffType.ADDED;
  }
  if (diffLength === 2) {
    return DiffType.MODIFIED;
  }
  if (diffLength === 3 && diff[2] === 0) {
    return DiffType.REMOVED;
  }
  if (diffLength === 3 && diff[2] === 2) {
    return DiffType.TEXT_DIFF;
  }
  if (diffLength === 3 && diff[2] === 3) {
    return DiffType.MOVED;
  }
  throw new Error(
    `Invalid difference structure found: ${JSON.stringify(diff, null, 2)}`
  );
}

/**
 * Add node differences (add or remove) to NodeDiff object
 * @param diff - Node that has been added/removed
 *
 * @returns Instance of NodeDiff for the node
 */
export function addNodeDiff(diff: object[]): NodeDiff {
  let typedDiff;
  const diffNode = diff[0];
  const id = diffNode[JSON_LD_KEY_ID];
  const type = diffNode[JSON_LD_KEY_TYPE];
  const diffType = getDiffType(diff);
  ramlToolLogger.debug(
    `Parsing differences of node: ${id}, difference type: ${DiffType[diffType]}`
  );
  switch (diffType) {
    case DiffType.ADDED:
      typedDiff = new NodeDiff(id, type);
      typedDiff.added = diffNode;
      break;
    case DiffType.REMOVED:
      typedDiff = new NodeDiff(id, type);
      typedDiff.removed = diffNode;
      break;
    case DiffType.MOVED:
      ramlToolLogger.debug(`Ignoring the move of node: ${id}`);
      break;
    default:
      /**
       *  Note: MODIFIED, TEXT_DIFF are not valid for node as diff is by node id
       */
      throw new Error(
        `Invalid difference type for node: ${DiffType[diffType]}, node: ${id}`
      );
  }
  return typedDiff;
}

/**
 * Add node property differences to NodeDiff object
 * @param key - Name of the property that has difference
 * @param diff - Differences of the property
 * @param diffType - Type of the difference
 * @param typedDiff - Instance of NodeDiff for the node
 */
export function addNodePropertyDiffs(
  key: string,
  diff: unknown[][],
  diffType: DiffType,
  typedDiff: NodeDiff
): void {
  switch (diffType) {
    case DiffType.ADDED:
      typedDiff.added[key] = diff[0];
      break;
    case DiffType.MODIFIED:
      typedDiff.removed[key] = diff[0];
      typedDiff.added[key] = diff[1];
      break;
    case DiffType.REMOVED:
      typedDiff.removed[key] = diff[0];
      break;
    case DiffType.TEXT_DIFF:
      //TODO: Handle text diffs where the text length exceeds the configured length
      //parseTextDiff(diff[0);
      break;
    default:
      throw new Error(
        `Invalid difference type for node property: ${DiffType[diffType]},  node: ${typedDiff.id}, property: ${key}`
      );
  }
}

/**
 * Add differences of node property of type array to NodeDiff object
 * @param key - Name of the property that has difference
 * @param diff - Differences of the property
 * @param diffType - Type of the difference
 * @param typedDiff - Instance of NodeDiff for the node
 */
export function addNodeArrayPropertyDiffs(
  key: string,
  diff: unknown[],
  diffType: DiffType,
  typedDiff: NodeDiff
): void {
  switch (diffType) {
    case DiffType.ADDED:
      if (typedDiff.added[key] == null) {
        typedDiff.added[key] = [];
      }
      (typedDiff.added[key] as unknown[]).push(diff[0]);
      break;
    case DiffType.REMOVED:
      if (typedDiff.removed[key] == null) {
        typedDiff.removed[key] = [];
      }
      (typedDiff.removed[key] as unknown[]).push(diff[0]);
      break;
    case DiffType.MOVED:
      ramlToolLogger.debug(
        `Ignoring the moves of node: ${typedDiff.id}, property: ${key}`
      );
      break;
    default:
      throw new Error(
        `Invalid difference type for node array property value: ${DiffType[diffType]},  node: ${typedDiff.id}, property: ${key}`
      );
  }
}
/**
 * Add differences to reference ID to NodeDiff object
 * @param key - Name of the property that has difference
 * @param diff - Differences of the property
 * @param diffType - Type of the difference
 * @param typedDiff - Instance of NodeDiff for the node
 */
function addNodeReferenceDiffs(
  key: string,
  diff: unknown[],
  diffType: DiffType,
  typedDiff: NodeDiff
): void {
  switch (diffType) {
    case DiffType.MODIFIED:
      typedDiff.removed[key] = { [JSON_LD_KEY_ID]: diff[0] };
      typedDiff.added[key] = { [JSON_LD_KEY_ID]: diff[1] };
      break;
    case DiffType.TEXT_DIFF:
      //TODO: Handle text diffs where the text length exceeds the configured length
      break;
    default:
      throw new Error(
        `Invalid difference type for node reference property: ${DiffType[diffType]},  node: ${typedDiff.id}, property: ${key}`
      );
  }
}

/**
 * jsondiffpatch plugin to add node ID and type to the difference
 */
const addNodeInfo = function(context): void {
  if (
    context.leftType === "object" &&
    typeof context.left[JSON_LD_KEY_ID] !== "undefined"
  ) {
    const changed = !!_.find(
      context.children,
      childContext => childContext.result
    );
    if (changed) {
      context.setResult({
        /**
         * Add additional details of the node that has differences
         * @id: Node ID - diff is done based on the node ID, so this is unique
         * @type: Node type - AMF vocabulary that is expected to be the same for all the RAMLs
         */
        [JSON_LD_KEY_ID]: context.right[JSON_LD_KEY_ID],
        [JSON_LD_KEY_TYPE]: context.right[JSON_LD_KEY_TYPE]
      });
    }
  }
};
addNodeInfo.filterName = "addNodeInfo";
