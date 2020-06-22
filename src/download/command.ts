/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import fs from "fs-extra";
import path from "path";
import { Command, flags } from "@oclif/command";
import { getBearer } from "./bearerToken";
import { extractFiles } from "./exchangeDirectoryParser";
import {
  searchExchange,
  getVersionByDeployment,
  getSpecificApi,
  downloadRestApis
} from "./exchangeDownloader";
import {
  removeVersionSpecificInformation,
  groupByCategory,
  removeRamlLinks
} from "./exchangeTools";
import { RestApi } from "./exchangeTypes";

/**
 * Gets information about all the APIs from exchange that match the given search
 * string for the version deployed in the given environment.
 * If it fails to get information about the deployed version of an API, it
 * removes all the version specific information from the returned object.
 *
 * @returns Information about the APIs found.
 */
async function search(search: string, deployment: RegExp): Promise<RestApi[]> {
  const token = await getBearer(
    process.env.ANYPOINT_USERNAME,
    process.env.ANYPOINT_PASSWORD
  );
  const apis = await searchExchange(token, search);
  const promises = apis.map(async api => {
    const version = await getVersionByDeployment(token, api, deployment);
    return version
      ? getSpecificApi(token, api.groupId, api.assetId, version)
      : removeVersionSpecificInformation(api);
  });
  return Promise.all(promises);
}

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
    await fs.ensureDir(flags.dest);
    await fs.writeJson(
      path.join(flags.dest, flags["config-file"]),
      apiFamilyGroups
    );
  }
}
