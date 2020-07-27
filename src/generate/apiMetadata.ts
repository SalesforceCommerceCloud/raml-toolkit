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
import { HandlebarsWithAmfHelpers as Handlebars } from "../generate/index";

/**
 * A collection of APIs that contains metadata.
 */
export class ApiMetadata {
  name: Name;
  metadata: { [key: string]: unknown };

  templates: {
    handlebarTemplate: TemplateDelegate;
    outputFile: string;
  }[] = [];

  constructor(
    name: string,
    protected filepath: string,
    public children: ApiMetadata[] = []
  ) {
    this.name = new Name(name);
    if (fs.existsSync(path.join(filepath, `.metadata.json`))) {
      try {
        this.metadata = fs.readJSONSync(path.join(filepath, `.metadata.json`));
      } catch (e) {
        ramlToolLogger.warn(
          `Metadata found, but failed to load for ${filepath}`
        );
      }
    }
  }

  public addTemplate(templatePath: string, outputFile: string): void {
    this.templates.push({
      handlebarTemplate: Handlebars.compile(
        fs.readFileSync(path.join(templatePath), "utf8")
      ),
      outputFile,
    });
  }

  public async render(): Promise<void> {
    ramlToolLogger.info(`Rendering templates for ${this.name.original}`);
    this.templates.forEach((template) => {
      fs.ensureDirSync(path.dirname(template.outputFile));
      fs.writeFileSync(template.outputFile, template.handlebarTemplate(this));
    });
  }

  public async renderAll(): Promise<void> {
    try {
      await this.render();
    } catch (err) {
      ramlToolLogger.error(err);
    }
    return this.children.forEach(async (child) => {
      await child.renderAll();
    });
  }

  public async init(): Promise<void> {
    const promises = this.children.map((child) => child.init());
    await Promise.all(promises);
  }
}
