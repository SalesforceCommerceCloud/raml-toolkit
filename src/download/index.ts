/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import fs from "fs-extra";
import path from "path";
import { Command, flags } from "@oclif/command";
import * as download from "./exchangeDownloader";
import { extractFiles } from "./exchangeDirectoryParser";
import { groupByCategory, removeRamlLinks } from "./exchangeTools";
import { allCommonFlags } from "../common/flags";

export class DownloadCommand extends Command {
  static description =
    "Download API specification files from Anypoint Exchange";
  static flags = {
    ...allCommonFlags(),
    search: flags.string({
      char: "s",
      description: "Search query to filter results from Anypoint Exchange",
      env: "ANYPOINT_SEARCH",
      default: ""
    }),
    deployment: flags.string({
      char: "D",
      description: "Deployment status to filter results from Anypoint Exchange",
      env: "ANYPOINT_DEPLOYMENT",
      default: "." // RegExp to match any non-empty string
    }),
    "deployment-regex-flags": flags.string({
      description: "RegExp flags to specify for advanced deployment matching",
      dependsOn: ["deployment"]
    }),
    dest: flags.string({
      char: "d",
      description: "Directory to download APIs into",
      env: "ANYPOINT_DOWNLOAD_DEST",
      default: "apis"
    }),
    "group-by": flags.string({
      char: "g",
      description: "Category to use to group APIs together",
      env: "ANYPOINT_GROUP_BY",
      required: true
    }),
    "config-file": flags.string({
      char: "c",
      description: "Name of the target file to save the API config",
      env: "ANYPOINT_CONFIG_FILE",
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
    const configFile = flags["config-file"];
    if (configFile !== path.basename(configFile)) {
      this.error("Config file name must not be a path.", { exit: 2 });
    }
    const apis = await download.search(
      flags.search,
      new RegExp(flags.deployment, flags["deployment-regex-flags"])
    );
    await download.downloadRestApis(apis, flags.dest);
    await extractFiles(flags.dest);
    const apiGroups = groupByCategory(removeRamlLinks(apis), flags["group-by"]);
    await fs.writeJson(path.join(flags.dest, configFile), apiGroups);
  }
}
