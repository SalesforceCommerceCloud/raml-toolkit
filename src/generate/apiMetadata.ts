/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { Name } from "../common/structures/name";
import fs from "fs-extra";
import path from "path";
import { ramlToolLogger } from "../common/logger";
import { TemplateDelegate } from "handlebars";
import { HandlebarsWithAmfHelpers as Handlebars } from "./";

/**
 * @description - A collection of APIs that contains metadata.
 * @export
 * @class ApiMetadata
 */
export class ApiMetadata {
  name: Name;
  metadata: { [key: string]: unknown } = {};
  parent: ApiMetadata = null;

  templates: {
    handlebarTemplate: TemplateDelegate;
    outputFile: string;
  }[] = [];
  /**
   * Creates an instance of ApiMetadata.
   * @param {string} name - Name of the api metadata
   * @param {string} [filepath=undefined] - Path to load a .metadata.json file from
   * @param {ApiMetadata[]} [children=[]] - Any children you want to add to this tree
   * @memberof ApiMetadata
   */
  constructor(
    name: string,
    protected filepath = undefined,
    public children: ApiMetadata[] = []
  ) {
    this.name = new Name(name);
    if (filepath && fs.existsSync(path.join(filepath, `.metadata.json`))) {
      try {
        this.metadata = fs.readJSONSync(path.join(filepath, `.metadata.json`));
      } catch (e) {
        ramlToolLogger.warn(
          `Metadata found, but failed to load for ${filepath}`
        );
      }
    }
    children.forEach((child) => {
      child.parent = this;
    });
  }

  /**
   * @description - Compiles a handlebar template and an output file associated with that template
   * @param {string} templatePath - Path to handlebars template
   * @param {string} outputFile - Path to output file
   * @memberof ApiMetadata
   */
  public addTemplate(templatePath: string, outputFile: string): void {
    this.templates.push({
      handlebarTemplate: Handlebars.compile(
        fs.readFileSync(path.join(templatePath), "utf8")
      ),
      outputFile,
    });
  }

  /**
   * @description - Render and templates added to the class.
   * @returns {Promise<void>} - Solely a promise to keep consistency with overridden method
   * @memberof ApiMetadata
   */
  public async renderThis(): Promise<void> {
    ramlToolLogger.info(`Rendering templates for ${this.name.original}`);
    this.templates.forEach((template) => {
      fs.ensureDirSync(path.dirname(template.outputFile));
      fs.writeFileSync(template.outputFile, template.handlebarTemplate(this));
    });
  }

  /**
   * @description - Render this, then render children.
   * @returns {Promise<void>} - A child could have a promise to we return a promise here.
   * @memberof ApiMetadata
   */
  public async render(): Promise<void> {
    try {
      await this.renderThis();
    } catch (err) {
      ramlToolLogger.error(err);
    }
    return this.children.forEach(async (child) => {
      await child.render();
    });
  }

  /**
   * @description - Walks children and runs their init methods.
   * @returns {Promise<void>} - A child could have a promise to we return a promise here.
   * @memberof ApiMetadata
   */
  public async init(): Promise<void> {
    const promises = this.children.map((child) => child.init());
    await Promise.all(promises);
  }
}
