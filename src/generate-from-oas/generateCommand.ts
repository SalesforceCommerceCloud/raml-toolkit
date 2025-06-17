/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { Command, flags } from "@oclif/command";
import { allCommonFlags } from "../common/flags";
import {
  generateFromOas,
  DEFAULT_CONFIG_PACKAGE_PATH,
} from "./generateFromOas";

export class GenerateCommand extends Command {
  static description = "Generate from OAS";

  static flags = {
    ...allCommonFlags(),
    inputSpec: flags.string({
      char: "i",
      description: "Input OAS specification file",
      required: true,
    }),
    outputDir: flags.string({
      char: "o",
      description: "Output directory for generated code",
      required: true,
    }),
    templateDir: flags.string({
      char: "t",
      description: "Template directory",
      required: true,
    }),
    configFile: flags.string({
      char: "c",
      description: `[default:${DEFAULT_CONFIG_PACKAGE_PATH}] Configuration file with additional generator properties`,
    }),
    generator: flags.string({
      char: "g",
      description: "[default:typescript-fetch] Generator to use",
    }),
    skipValidateSpec: flags.boolean({
      description: "Skip validation of the OAS specification",
    }),
  };

  async run(): Promise<void> {
    console.log("Running generator");
    const { flags } = this.parse(GenerateCommand);
    console.log(flags);
    generateFromOas({
      inputSpec: flags.inputSpec,
      outputDir: flags.outputDir,
      templateDir: flags.templateDir,
      configFile: flags.configFile,
      generator: flags.generator,
      skipValidateSpec: flags.skipValidateSpec,
    });
  }
}
