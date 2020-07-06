/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import fs from "fs-extra";
import path from "path";
import { Command, flags } from "@oclif/command";
import { search, downloadRestApis } from "./exchangeDownloader";
import { extractFiles } from "./exchangeDirectoryParser";
import { groupByCategory, removeRamlLinks } from "./exchangeTools";

export default class DownloadCommand extends Command {
  static description =
    "Download API specification files from Anypoint Exchange";
  static flags = {
    help: flags.help({
      char: "h"
    }),
    search: flags.string({
      char: "s",
      description: "Search query to filter results from Exchange",
      env: "EXCHANGE_SEARCH",
      default: 'category:"CC Visibility" = "External"'
    }),
    deployment: flags.string({
      char: "D",
      description: "Deployment status to filter results from Exchange",
      env: "EXCHANGE_DEPLOYMENT",
      default: "production"
    }),
    "deployment-regex-flags": flags.string({
      description: "RegExp flags to specify for advanced deployment matching",
      default: "i",
      dependsOn: ["deployment"]
    }),
    dest: flags.string({
      char: "d",
      description: "Directory to download APIs into",
      env: "EXCHANGE_DOWNLOAD_DEST",
      default: "apis"
    }),
    family: flags.string({
      char: "f",
      description: "Category to use to group APIs together",
      env: "API_FAMILY",
      default: "CC API Family"
    }),
    "config-file": flags.string({
      char: "c",
      description: "Name of the target file to save the API config",
      env: "API_CONFIG_FILE",
      default: "api-config.json"
    })
  };
  async run(): Promise<void> {
    if (!process.env.ANYPOINT_USERNAME || !process.env.ANYPOINT_PASSWORD) {
      this.error(
        "Environment variables ANYPOINT_USERNAME and ANYPOINT_PASSWORD must be set to download files.",
        {
          exit: 2
        }
      );
    }
    const { flags } = this.parse(DownloadCommand);
    if (flags["config-file"] !== path.basename(flags["config-file"])) {
      this.error("Config file name cannot be a path.", {
        exit: 2
      });
    }
    const apis = await search(
      flags.search,
      new RegExp(flags.deployment, flags["deployment-regex-flags"])
    );
    await downloadRestApis(apis, flags.dest);
    await extractFiles(flags.dest);
    const apiFamilyGroups = groupByCategory(
      removeRamlLinks(apis),
      flags.family
    );
    await fs.writeJson(
      path.join(flags.dest, flags["config-file"]),
      apiFamilyGroups
    );
  }
}
