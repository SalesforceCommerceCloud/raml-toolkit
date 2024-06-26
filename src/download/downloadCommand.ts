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
    "Download API specification files from Anypoint Exchange.\n\n" +
    "Note: The options 'deployment' and 'deployment-regex-flags' are deprecated starting from version 0.5.12.";

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
      description:
        "(deprecated) Deployment status to filter results from Anypoint Exchange",
      env: "ANYPOINT_DEPLOYMENT",
      default: ".", // RegExp to match any non-empty string
      hidden: true, // Hide the flag from help output to discourage its use
    }),
    "deployment-regex-flags": flags.string({
      description:
        "(deprecated) RegExp flags to specify for advanced deployment matching",
      dependsOn: ["deployment"],
      hidden: true, // Hide the flag from help output to discourage its use
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

    if (flags.deployment !== "." || flags["deployment-regex-flags"]) {
      this.warn(
        "The options 'deployment' and 'deployment-regex-flags' are deprecated. The latest RAML specification that is published to Anypoint Exchange will be downloaded always."
      );
    }

    const apis = await download.search(flags.search);
    await download.downloadRestApis(apis, flags.dest);
  }
}
