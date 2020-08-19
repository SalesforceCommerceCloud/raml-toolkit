/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import path from "path";
import fs from "fs-extra";
import {
  default as Handlebars,
  TemplateDelegate,
  RuntimeOptions,
} from "handlebars";

// Handlebars doesn't export the type, so we have to extract it
type CompileOptions = Parameters<typeof Handlebars.compile>["1"];

export class Formatter<TemplateData extends object> {
  /**
   * Directory containing all default templates
   */
  static readonly TEMPLATES_DIR = path.resolve(
    __dirname,
    "../../resources/diff/templates"
  );
  /**
   * Handlebars instance available for all Formatter instances to use
   */
  static readonly handlebars = Handlebars.create();
  /**
   * Template cache available for all Formatter instances to use
   */
  static readonly templates = new Map<string, TemplateDelegate>();

  /**
   * Create a Formatter instance
   * @param handlebars - Custom handlebars instance
   * @param templates - Custom template cache
   */
  constructor(
    public readonly handlebars = new.target.handlebars,
    public readonly templates = new.target.templates
  ) {}

  /**
   * Register a Handlebars partial from a file
   * @param filepath - Path to the file containing the partial
   * @param name - Name of the partial. Defaults to the name of the file, without
   * the extension and with all `.` replaced with `:`
   * @returns Whether the partial was successfully registered
   */
  registerPartial(filepath: string, name?: string): boolean {
    if (!name) {
      name = path
        .basename(filepath, path.extname(filepath))
        .replace(/\./g, ":");
    }
    if (name in this.handlebars.partials) {
      return false;
    }
    this.handlebars.registerPartial(name, fs.readFileSync(filepath, "utf8"));
    return true;
  }

  /**
   * Load a Handlebars template from a file. Caches results using the resolved
   * filepath as key.
   * @param filepath - Path to the template file
   * @param options - Handlebars compile options
   */
  protected loadTemplate(
    filepath: string,
    options?: CompileOptions
  ): TemplateDelegate<TemplateData> {
    const id = path.resolve(filepath); // Normalized for better caching

    const cached = this.templates.get(id);
    if (cached !== undefined) {
      return cached;
    }

    const template = this.handlebars.compile(
      fs.readFileSync(filepath, "utf8"),
      options
    );
    this.templates.set(id, template);
    return template;
  }

  /**
   * Loads a template from a file and fills it with the given data
   * @param template - Path to the template file
   * @param data - Data to fill the template
   * @param compileOptions - Handlebars compiler options
   * @param runtimeOptions - Handlebars runtime options
   */
  public render(
    template: string,
    data: TemplateData,
    compileOptions?: CompileOptions,
    runtimeOptions?: RuntimeOptions
  ): string {
    const renderTemplate = this.loadTemplate(template, compileOptions);
    return renderTemplate(data, runtimeOptions);
  }
}
