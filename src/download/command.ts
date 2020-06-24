/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { Command, flags } from "@oclif/command";
import { download } from "./exchangeDownloader";

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
      description: "The category to use to group APIs together",
      env: "API_FAMILY",
      default: "CC API Family"
    }),
    "config-file": flags.string({
      char: "c",
      description: "",
      env: "API_CONFIG_FILE",
      default: "api-config.json"
    })
  };
  async run(): Promise<void> {
    const { flags } = this.parse(DownloadCommand);
    await download(flags as Omit<typeof flags, "help">);
  }
}
