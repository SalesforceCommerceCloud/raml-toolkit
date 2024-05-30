/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { Command, flags } from "@oclif/command";
import * as download from "./exchangeDownloader";
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
      default: "",
    }),
    deployment: flags.string({
      char: "D",
      description: "Deployment status to filter results from Anypoint Exchange",
      env: "ANYPOINT_DEPLOYMENT",
      default: ".", // RegExp to match any non-empty string
    }),
    "deployment-regex-flags": flags.string({
      description: "RegExp flags to specify for advanced deployment matching",
      dependsOn: ["deployment"],
    }),
    dest: flags.string({
      char: "d",
      description: "Directory to download APIs into",
      env: "ANYPOINT_DOWNLOAD_DEST",
      default: "apis",
    }),
  };
  async run(): Promise<void> {
    if (!process.env.ANYPOINT_USERNAME || !process.env.ANYPOINT_PASSWORD) {
      this.error(
        "Environment variables ANYPOINT_USERNAME and ANYPOINT_PASSWORD must be set to download files.",
        {
          exit: 2,
        }
      );
    }
    const { flags } = this.parse(DownloadCommand);

    const deploymentWarning =
      "The deployment flag is deprecated and currently non-functional due to changes in the RAML spec. This option will be removed in the next major version.";

    if (flags.deployment || flags["deployment-regex-flags"]) {
      this.warn(deploymentWarning);
      delete flags.deployment;
      delete flags["deployment-regex-flags"];
    }

    const apis = await download.search(flags.search);
    await download.downloadRestApis(apis, flags.dest);
  }
}
