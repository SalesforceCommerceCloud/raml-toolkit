/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-disable @typescript-eslint/no-use-before-define */
import amf from "amf-client-js";
import _ from "lodash";
import { findJsonDiffs, NodeDiff } from "./jsonDiff";
import { ramlToolLogger } from "../common/logger";
import * as path from "path";
import { applyRules } from "./rulesProcessor";
import { parseRamlFile } from "../common/parser";

export const diffRulesPath = path.join(__dirname, "../../resources/diff/rules");

/**
 * Generate differences between two RAML files
 * @param leftRaml Base RAML file to compare
 * @param rightRaml Other RAML file to compare with the left RAML to find differences
 * @param rulesPath Optional rules file to apply on the differences
 *
 * @returns Array of NodeDiff objects
 */
export async function diffRaml(
  leftRaml: string,
  rightRaml: string,
  rulesPath?: string
): Promise<NodeDiff[]> {
  const [leftGraph, rightGraph] = await Promise.all([
    generateGraph(leftRaml),
    generateGraph(rightRaml)
  ]);
  ramlToolLogger.info(
    `Finding differences between flattened JSON-LD of ${leftRaml} and ${rightRaml}`
  );
  const diffs = findJsonDiffs(leftGraph, rightGraph);
  if (rulesPath == null) {
    ramlToolLogger.info("Applying default rules on the differences");
    rulesPath = path.join(diffRulesPath, "defaultRules.json");
  }
  return applyRules(diffs, rulesPath);
}

/**
 * Generate flattened JSON-LD AMF graph from the RAML files
 * @param ramlFilePath RAML file path
 *
 * @returns flattened JSON-LD AMF graph
 */
async function generateGraph(ramlFilePath: string): Promise<object> {
  const parsedRaml = await parseRamlFile(ramlFilePath);

  const model = new amf.Raml10Resolver().resolve(parsedRaml);

  const renderOptions = new amf.render.RenderOptions().withoutSourceMaps
    .withCompactUris.withFlattenedJsonLd;
  let graphStr = await amf.AMF.amfGraphGenerator().generateString(
    model,
    renderOptions
  );
  /**
   * Types referenced from another RAML contain the filepath in their ID. Replace with empty string so that paths are not compared
   * TODO: Find if we can avoid this, if not handle escape special characters in the directory path
   */
  graphStr = _.replace(
    graphStr,
    new RegExp(path.dirname(ramlFilePath), "g"),
    ""
  );

  return JSON.parse(graphStr);
}

export type RamlDiff = {
  file: string;
  message?: string;
  diff?: NodeDiff[];
};
