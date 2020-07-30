/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-disable @typescript-eslint/no-use-before-define */
import _ from "lodash";
import { Delta, DiffPatcher } from "jsondiffpatch";
import { ramlToolLogger } from "../common/logger";
import { NodeChanges } from "./changes/nodeChanges";
import * as AmfGraphTypes from "./amfGraphTypes";
import * as AmfGraphDeltaTypes from "./amfGraphDeltaTypes";

/**
 * Delta types that can be identified by jsondiffpath
 */
export enum DeltaType {
  ADDED,
  REMOVED,
  MODIFIED,
  TEXT_DIFF,
  MOVED
}

/**
 * Since context is also treated as a node and type is required for node, we will use a custom type for context
 **/
export const CONTEXT_TYPE = ["context"];

/**
 * Find changes between two flattened JSON-LD AMF graphs
 * @param baseGraph - Left JSON object to compare
 * @param newGraph - Right JSON object to compare
 *
 * @returns Array of NodeChanges objects
 */
export function findGraphChanges(
  baseGraph: AmfGraphTypes.FlattenedGraph,
  newGraph: AmfGraphTypes.FlattenedGraph
): NodeChanges[] {
  //Verify baseGraph and newGraph objects conform to flattened AMF graph json structure
  try {
    validateAmfGraph(baseGraph);
  } catch (error) {
    error.message = `Error validating base AMF graph: ${error.message}`;
    throw error;
  }
  try {
    validateAmfGraph(newGraph);
  } catch (error) {
    error.message = `Error validating new AMF graph: ${error.message}`;
    throw error;
  }
  const jsonDiff = new DiffPatcher({
    // Define an object hash function
    objectHash: (obj): string => obj[AmfGraphTypes.KEY_NODE_ID],
    arrays: {
      // detect items moved inside the array (otherwise they will be registered as remove+add). This flag defaults to true if not specified
      detectMove: true,
      // include the value of items moved so that we can have node ids in the diffs. This flag defaults to false if not specified
      includeValueOnMove: true
    },
    textDiff: {
      // minimum string length (baseGraph and newGraph sides) to use text diff algorithm: google-diff-match-patch. Default value if not specified is 60
      minLength: 6000
    }
  });
  //add plugin to include ID of the node in the delta
  jsonDiff.processor.pipes.diff.before("collectChildren", addNodeInfo);
  ramlToolLogger.debug(
    `Added plugin to include node ID in the node delta: ${jsonDiff.processor.pipes.diff.list()}`
  );

  /**
   * Refer to jsondiffpath documentation for the format of the diffs that are returned
   * https://github.com/benjamine/jsondiffpatch/blob/master/docs/deltas.md
   */
  const delta = jsonDiff.diff(baseGraph, newGraph);

  return parseDelta(delta);
}

/**
 * Verify object to diff/compare conform to flattened AMF graph json structure
 * @param flattenedJson - Flattened json provided to diff/compare
 */
function validateAmfGraph(flattenedJson: AmfGraphTypes.FlattenedGraph): void {
  if (!flattenedJson) {
    throw new Error(`Invalid object`);
  }
  //Flattened AMF graph must have valid @graph or @context properties
  const graph = flattenedJson[AmfGraphTypes.KEY_GRAPH];
  if (graph == null) {
    throw new Error(`${AmfGraphTypes.KEY_GRAPH} property is missing`);
  }
  if (graph.length == 0) {
    throw new Error(
      `${AmfGraphTypes.KEY_GRAPH} property must be an array of json nodes`
    );
  }
}

/**
 * Parse JSON delta and generate an array of NodeChanges
 * @param delta - JSON delta
 *
 * @returns Array of NodeChanges objects
 */
function parseDelta(delta: Delta): NodeChanges[] {
  const nodeChanges: NodeChanges[] = [];
  if (_.isEmpty(delta)) {
    //no changes
    ramlToolLogger.info("No delta reported by jsondiffpatch");
    return nodeChanges;
  }

  ramlToolLogger.debug("Parsing delta reported by jsondiffpatch");
  const graphDelta = delta[AmfGraphTypes.KEY_GRAPH];
  if (graphDelta != null) {
    //process graph changes
    ramlToolLogger.debug("Parsing delta of graph nodes");
    nodeChanges.push(...parseGraphDelta(graphDelta));
  }
  const contextDelta = delta[AmfGraphTypes.KEY_CONTEXT];
  if (contextDelta != null) {
    //process context changes
    ramlToolLogger.debug("Parsing delta of context node");
    const contextNodeChanges = parseNodePropDelta(
      AmfGraphTypes.KEY_CONTEXT,
      CONTEXT_TYPE,
      contextDelta
    );
    if (contextNodeChanges != null) {
      nodeChanges.push(contextNodeChanges);
    }
  }
  return nodeChanges;
}

/**
 * Parse delta for each JSON node in the graph
 * @param graphDelta - Delta of the graph
 *
 * @returns Array of NodeChanges objects
 */
function parseGraphDelta(
  graphDelta: AmfGraphDeltaTypes.GraphDelta
): NodeChanges[] {
  const graphChanges: NodeChanges[] = [];
  //Ignore the property added by jsondiffpath to indicate an array
  const keys = Object.keys(graphDelta).filter(
    key => key !== AmfGraphDeltaTypes.ARRAY_KEY
  );
  keys.forEach(key => {
    const nodeDelta = graphDelta[key];
    let nodeChanges;
    if (_.isArray(nodeDelta)) {
      nodeChanges = parseNodeDelta(nodeDelta, getDeltaType(nodeDelta));
    } else if (_.isObject(nodeDelta)) {
      nodeChanges = parseNodePropDelta(
        nodeDelta[AmfGraphTypes.KEY_NODE_ID],
        nodeDelta[AmfGraphTypes.KEY_NODE_TYPE],
        nodeDelta
      );
    }
    if (nodeChanges != null) {
      graphChanges.push(nodeChanges);
    }
  });
  return graphChanges;
}

/**
 * Parse delta of the node properties
 * @param nodeId - ID of the node
 * @param nodeType - Type of the node
 * @param nodeDelta - Node delta
 *
 * @returns Instance of NodeChanges for the node if there are changes
 */
function parseNodePropDelta(
  nodeId: string,
  nodeType: string[],
  nodeDelta: AmfGraphDeltaTypes.NodePropertyDelta
): NodeChanges {
  let nodeChanges = new NodeChanges(nodeId, nodeType);
  //ignore node id and type
  const keys = Object.keys(nodeDelta).filter(
    key =>
      key !== AmfGraphTypes.KEY_NODE_ID && key !== AmfGraphTypes.KEY_NODE_TYPE
  );
  keys.forEach(key => {
    const value = nodeDelta[key];
    if (_.isArray(value)) {
      parsePropertyDelta(
        key,
        value as AmfGraphDeltaTypes.PropertyDelta<unknown>,
        getDeltaType(value),
        nodeChanges
      );
    } else if (_.isObject(value)) {
      if (
        value[AmfGraphDeltaTypes.ARRAY_KEY] === AmfGraphDeltaTypes.ARRAY_VALUE
      ) {
        parseArrayDelta(
          key,
          value as AmfGraphDeltaTypes.ArrayDelta<unknown>,
          nodeChanges
        );
      } else if (value[AmfGraphTypes.KEY_NODE_ID]) {
        parseReferenceNodeDelta(
          key,
          value as AmfGraphDeltaTypes.ReferenceNodeDelta,
          nodeChanges
        );
      }
    }
  });
  if (_.isEmpty(nodeChanges.added) && _.isEmpty(nodeChanges.removed)) {
    //when there are just moves and no actual changes, ignore the typed nodeDelta
    nodeChanges = undefined;
  }
  return nodeChanges;
}

/**
 * Get the type of the delta from the array generated by jsondiffpatch
 * @param delta - Delta of a node or a node property
 *
 * @return DeltaType Type of the delta
 */
export function getDeltaType<T>(
  delta:
    | AmfGraphDeltaTypes.Added<T>
    | AmfGraphDeltaTypes.Removed<T>
    | AmfGraphDeltaTypes.Modified<T>
    | AmfGraphDeltaTypes.Moved<T>
    | AmfGraphDeltaTypes.LongTextModified
): DeltaType {
  const deltaLength = delta.length;
  if (deltaLength === 1) {
    return DeltaType.ADDED;
  }
  if (deltaLength === 2) {
    return DeltaType.MODIFIED;
  }
  if (deltaLength === 3 && delta[2] === 0) {
    return DeltaType.REMOVED;
  }
  if (deltaLength === 3 && delta[2] === 2) {
    return DeltaType.TEXT_DIFF;
  }
  if (deltaLength === 3 && delta[2] === 3) {
    return DeltaType.MOVED;
  }
  throw new Error(
    `Invalid delta structure found: ${JSON.stringify(delta, null, 2)}`
  );
}

/**
 * Parse and add node delta (add or remove) to NodeChanges object
 * @param delta - Node delta
 * @param deltaType - Type of the delta
 * @returns Instance of NodeChanges for the node
 */
export function parseNodeDelta(
  delta: AmfGraphDeltaTypes.ArrayElementDelta<AmfGraphTypes.Node>,
  deltaType: DeltaType
): NodeChanges {
  let nodeChanges;
  const node = delta[0];
  const id = node[AmfGraphTypes.KEY_NODE_ID];
  const type = node[AmfGraphTypes.KEY_NODE_TYPE];
  ramlToolLogger.debug(
    `Parsing delta of node: ${id}, delta type: ${DeltaType[deltaType]}`
  );
  //Id and type are already set, so exclude them
  const nodeProps = _.omit(
    node,
    AmfGraphTypes.KEY_NODE_ID,
    AmfGraphTypes.KEY_NODE_TYPE
  );
  switch (deltaType) {
    case DeltaType.ADDED:
      nodeChanges = new NodeChanges(id, type);
      nodeChanges.added = nodeProps;
      break;
    case DeltaType.REMOVED:
      nodeChanges = new NodeChanges(id, type);
      nodeChanges.removed = nodeProps;
      break;
    case DeltaType.MOVED:
      ramlToolLogger.debug(`Ignoring the move of node: ${id}`);
      break;
    default:
      /**
       *  Note: MODIFIED, TEXT_DIFF are not valid for node as delta is by node id
       */
      throw new Error(
        `Invalid delta type for node: ${DeltaType[deltaType]}, node: ${id}`
      );
  }
  return nodeChanges;
}

/**
 * Add node property delta to NodeChanges object
 * @param nodeProperty - Name of the node property
 * @param delta - Delta of the property
 * @param deltaType - Type of the delta
 * @param nodeChanges - Instance of NodeChanges for the node
 */
export function parsePropertyDelta(
  nodeProperty: string,
  delta: AmfGraphDeltaTypes.PropertyDelta<unknown>,
  deltaType: DeltaType,
  nodeChanges: NodeChanges
): void {
  ramlToolLogger.debug(
    `Adding delta of node: ${nodeChanges.id}, property: ${nodeProperty}, delta type: ${DeltaType[deltaType]}`
  );
  switch (deltaType) {
    case DeltaType.ADDED:
      nodeChanges.added[nodeProperty] = delta[0];
      break;
    case DeltaType.MODIFIED:
      nodeChanges.removed[nodeProperty] = delta[0];
      nodeChanges.added[nodeProperty] = delta[1];
      break;
    case DeltaType.REMOVED:
      nodeChanges.removed[nodeProperty] = delta[0];
      break;
    case DeltaType.TEXT_DIFF:
      //TODO: Handle text diffs where the text length exceeds the configured length
      //parseTextDiff(delta[0);
      break;
    default:
      throw new Error(
        `Invalid delta type for node property: ${DeltaType[deltaType]},  node: ${nodeChanges.id}, property: ${nodeProperty}`
      );
  }
}

/**
 * Parse and add delta of array property
 * @param nodeProperty - Name of the node property
 * @param delta - Delta of the property
 * @param nodeChanges - Instance of NodeChanges for the node
 */
export function parseArrayDelta(
  nodeProperty: string,
  delta: AmfGraphDeltaTypes.ArrayDelta<unknown>,
  nodeChanges: NodeChanges
): void {
  const indexKeys = Object.keys(delta).filter(
    key => key !== AmfGraphDeltaTypes.ARRAY_KEY
  );
  indexKeys.forEach(k => {
    //Since this is flattened graph array value is either a string or a object with an id referencing other object in the graph
    const arrValue = delta[k];
    const deltaType = getDeltaType(arrValue);
    ramlToolLogger.debug(
      `Adding delta of node: ${nodeChanges.id}, array property: ${nodeProperty}, array key: ${k}, delta type: ${DeltaType[deltaType]}`
    );
    addArrayDelta(nodeProperty, arrValue, deltaType, nodeChanges);
  });
}

/**
 * Add delta of node property of type array to NodeChanges object
 * @param key - Name of the property
 * @param delta - Delta of an array value
 * @param deltaType - Type of the delta
 * @param nodeChanges - Instance of NodeChanges for the node
 */
export function addArrayDelta(
  key: string,
  delta: AmfGraphDeltaTypes.ArrayElementDelta<unknown>,
  deltaType: DeltaType,
  nodeChanges: NodeChanges
): void {
  switch (deltaType) {
    case DeltaType.ADDED:
      if (nodeChanges.added[key] == null) {
        nodeChanges.added[key] = [];
      }
      (nodeChanges.added[key] as Array<unknown>).push(delta[0]);
      break;
    case DeltaType.REMOVED:
      if (nodeChanges.removed[key] == null) {
        nodeChanges.removed[key] = [];
      }
      (nodeChanges.removed[key] as Array<unknown>).push(delta[0]);
      break;
    case DeltaType.MOVED:
      ramlToolLogger.debug(
        `Ignoring the moves of node: ${nodeChanges.id}, property: ${key}`
      );
      break;
    default:
      throw new Error(
        `Invalid delta type for node array property value: ${DeltaType[deltaType]},  node: ${nodeChanges.id}, property: ${key}`
      );
  }
}
/**
 * Parse and add delta of reference ID to NodeChanges object
 * @param nodeProperty - Name of the node property
 * @param delta - Delta of the property
 * @param nodeChanges - Instance of NodeChanges for the node
 */
function parseReferenceNodeDelta(
  nodeProperty: string,
  delta: AmfGraphDeltaTypes.ReferenceNodeDelta,
  nodeChanges: NodeChanges
): void {
  const deltaValues = delta[AmfGraphTypes.KEY_NODE_ID];
  const deltaType = getDeltaType(deltaValues);
  ramlToolLogger.debug(
    `Adding delta of node: ${nodeChanges.id}, reference property: ${nodeProperty}, delta type: ${DeltaType[deltaType]}`
  );
  switch (deltaType) {
    case DeltaType.MODIFIED:
      nodeChanges.removed[nodeProperty] = {
        [AmfGraphTypes.KEY_NODE_ID]: deltaValues[0]
      };
      nodeChanges.added[nodeProperty] = {
        [AmfGraphTypes.KEY_NODE_ID]: deltaValues[1]
      };
      break;
    case DeltaType.TEXT_DIFF:
      //TODO: Handle text diffs where the text length exceeds the configured length
      break;
    default:
      throw new Error(
        `Invalid delta type for node reference property: ${DeltaType[deltaType]},  node: ${nodeChanges.id}, property: ${nodeProperty}`
      );
  }
}

/**
 * jsondiffpatch plugin to add node ID and type to the node delta
 */
const addNodeInfo = function(context): void {
  if (
    context.leftType === "object" &&
    typeof context.left[AmfGraphTypes.KEY_NODE_ID] !== "undefined"
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
        [AmfGraphTypes.KEY_NODE_ID]: context.right[AmfGraphTypes.KEY_NODE_ID],
        [AmfGraphTypes.KEY_NODE_TYPE]:
          context.right[AmfGraphTypes.KEY_NODE_TYPE]
      });
    }
  }
};
addNodeInfo.filterName = "addNodeInfo";
