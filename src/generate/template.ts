/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import fs from "fs-extra";
import { HandlebarsWithAmfHelpers } from "./";

/**
 * Holds a template and renders the template with the given data
 */
export class Template {
  content: string;

  /**
   * Creates a Template object
   * @param path - Path to the template file
   * @param handlebars - Optional handlebars instance, default instance is used if not provided
   */
  constructor(
    public path: string,
    public handlebars = HandlebarsWithAmfHelpers
  ) {
    try {
      this.content = fs.readFileSync(path, "utf8");
    } catch (error) {
      error.message = `Error initializing template: ${error.message}`;
      throw error;
    }
    if (!this.content) {
      throw new Error(`Invalid template content: ${this.content}`);
    }
  }

  /**
   * Make substitutions and write the template to a file.
   *
   * @param context - The data model to use for substitutions
   * @param destination - The file path to write the rendered template to
   */
  async render(
    context: { [key: string]: unknown },
    destination: string
  ): Promise<void> {
    try {
      await fs.outputFile(
        destination,
        //Parts of the AMF model use prototype properties and methods, we need to make those available to Handlebars
        this.handlebars.compile(this.content)(context, {
          allowProtoPropertiesByDefault: true,
          allowProtoMethodsByDefault: true,
        })
      );
    } catch (error) {
      error.message = `Error rendering template: ${error.message}`;
      throw error;
    }
  }
}
