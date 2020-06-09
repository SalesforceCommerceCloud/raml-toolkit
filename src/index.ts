/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import path from "path";
import fs from "fs";
import { Command, flags } from "@oclif/command";
import { validateFile, printResults } from "./lint/lint";

export const profilePath = path.join(__dirname, "../resources/lint/profiles");

export default class RamlToolkitCommand extends Command {
  async run(): Promise<void> {
    const { argv, flags } = this.parse(RamlToolkitCommand);

    if (argv.length === 0) {
      this.error("Requires at least one file to validate", { exit: 1 });
    }

    let exitCode = 0;

    const promises = [];

    for (const arg of argv) {
      // eslint-disable-next-line no-await-in-loop
      promises.push(
        validateFile(arg, flags.profile).then(results => {
          if (results.conforms === false) {
            exitCode += 1;
          }
          return printResults(results, flags.warnings);
        })
      );
    }

    await Promise.all(promises).catch(e => {
      console.error(e.message);
      exitCode += 1;
    });

    if (exitCode !== 0) {
      this.error(`Validation for ${exitCode} file(s) failed.`, {
        exit: exitCode
      });
    }
  }
}

function getProfiles(): string[] {
  const files = fs.readdirSync(profilePath);
  return files.map(name => name.replace(/\.raml$/i, ""));
}

RamlToolkitCommand.description = `A linting tool for raml for commerce cloud and beyond

FILENAME is one or more RAML files to lint.
`;

RamlToolkitCommand.flags = {
  // Add --profile flag to set the custom profile
  profile: flags.enum({
    char: "p",
    options: getProfiles(),
    description: "profile to apply",
    required: true
  }),
  // Add --warnings flag to show warnings
  warnings: flags.boolean({
    char: "w",
    default: false,
    description: "Show all the warnings"
  }),
  // Add --version flag to show CLI version
  version: flags.version({ char: "v" }),
  // Add --help flag to show CLI version
  help: flags.help({ char: "h" })
};

RamlToolkitCommand.args = [{ name: "filename" }];
// This allows a variable length list of files
RamlToolkitCommand.strict = false;

// module.exports = RamlToolkitCommand;
export { FatRamlResourceLoader } from "./exchange-connector";

export { getBearer } from "./exchange-connector/bearerToken";
export {
  searchExchange,
  downloadRestApi,
  downloadRestApis,
  getVersionByDeployment,
  getSpecificApi,
  getAsset
} from "./exchange-connector/exchangeDownloader";
export {
  groupByCategory,
  removeVersionSpecificInformation,
  removeRamlLinks
} from "./exchange-connector/exchangeTools";
export { extractFiles } from "./exchange-connector/exchangeDirectoryParser";

export { RestApi } from "./exchange-connector/exchangeTypes";
export { ramlToolLogger } from "./common/logger";

export { model } from "amf-client-js";
export {
  getAllDataTypes,
  getApiName,
  getNormalizedName,
  parseRamlFile,
  resolveApiModel
} from "./common/parser";

export { diffRaml } from "./diffTool";
