/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { findAmfGraphChanges } from "./jsonDiff";
import { parseRamlFile } from "../common/parser";
import { ramlToolLogger } from "../common/logger";
import { ApiChanges } from "./changes/apiChanges";
import { applyRules } from "./rulesProcessor";
import amf from "amf-client-js";
import path from "path";
import { FlattenedGraph } from "./amfGraphTypes";

export class ApiDifferencer {
  // Path relative to project root
  static readonly DEFAULT_RULES_BASE_PATH =
    "resources/diff/rules/defaultRules.json";
  // Full path
  static readonly DEFAULT_RULES_PATH = path.join(
    __dirname,
    "../../",
    ApiDifferencer.DEFAULT_RULES_BASE_PATH
  );
  // Path prefixed with package name, short form usable by require()
  static readonly DEFAULT_RULES_PACKAGE_PATH = path.join(
    "@commerce-apps/raml-toolkit",
    path.dirname(ApiDifferencer.DEFAULT_RULES_BASE_PATH),
    path.basename(ApiDifferencer.DEFAULT_RULES_BASE_PATH, ".json")
  );

  constructor(public baseApiSpec: string, public newApiSpec: string) {}

  /**
   * Find changes between the API specifications
   *
   * @returns changes to the API specifications
   */
  async findChanges(): Promise<ApiChanges> {
    const [leftGraph, rightGraph] = await Promise.all([
      this.generateGraph(this.baseApiSpec),
      this.generateGraph(this.newApiSpec)
    ]);
    ramlToolLogger.info(
      `Finding differences between flattened JSON-LD of ${this.baseApiSpec} and ${this.newApiSpec}`
    );
    const apiChanges = new ApiChanges(this.baseApiSpec, this.newApiSpec);
    apiChanges.nodeChanges = findAmfGraphChanges(leftGraph, rightGraph);
    return apiChanges;
  }

  /**
   * Find changes between the API specifications and categorize with rules
   * @param rulesPath - Optional rules path, default rules are applied if not provided
   *
   * @returns categorized changes to the API specifications
   */
  async findAndCategorizeChanges(
    rulesPath = ApiDifferencer.DEFAULT_RULES_PATH
  ): Promise<ApiChanges> {
    const apiChanges = await this.findChanges();
    ramlToolLogger.info("Applying rules on the differences");
    apiChanges.nodeChanges = await applyRules(
      apiChanges.nodeChanges,
      rulesPath
    );
    return apiChanges;
  }

  /**
   * Generate flattened JSON-LD AMF graph from the RAML files
   * @param ramlFilePath - RAML file path
   *
   * @returns flattened JSON-LD AMF graph
   */
  private async generateGraph(ramlFilePath: string): Promise<FlattenedGraph> {
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
     */
    graphStr = graphStr.split(path.dirname(ramlFilePath)).join("");

    return JSON.parse(graphStr);
  }
}
