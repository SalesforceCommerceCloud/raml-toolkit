/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import fs from "fs-extra";
import path from "path";
import { Command } from "@oclif/command";
import { ramlToolLogger } from "../common/logger";
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

let config;
/**
 * Gets information about all the apis from exchange that match config.search,
 * for the version deployed in the config.exchangeDeploymentRegex environment.
 * If it fails to get information about the deployed version of an api, it
 * removes all the version specific information from `config.apiConfigFile`.
 *
 * @returns Information about the APIs found.
 */
async function search(): Promise<RestApi[]> {
  const token = await getBearer(
    process.env.ANYPOINT_USERNAME,
    process.env.ANYPOINT_PASSWORD
  );
  const apis = await searchExchange(token, config.exchangeSearch);
  const promises = [];
  apis.forEach(api => {
    promises.push(
      getVersionByDeployment(token, api, config.exchangeDeploymentRegex).then(
        (version: string) => {
          const neededApi = getSpecificApi(
            token,
            api.groupId,
            api.assetId,
            version
          );

          if (neededApi) {
            return neededApi;
          } else {
            return removeVersionSpecificInformation(api);
          }
        }
      )
    );
  });
  return Promise.all(promises).then((deployedApis: RestApi[]) => {
    return deployedApis;
  });
}

export default class DownloadCommand extends Command {
  static description = ``;
  static flags = {};
  static args = [];
  async run(): Promise<void> {
    const apis = await search();
    return downloadRestApis(apis, config.inputDir)
      .then(folder => {
        ramlToolLogger.info(`Setting config.inputDir to '${folder}'`);
        config.inputDir = folder;
        return extractFiles(folder);
      })
      .then(async () => {
        const apiFamilyGroups = groupByCategory(
          removeRamlLinks(apis),
          config.apiFamily
        );
        fs.ensureDirSync(config.inputDir);
        return fs.writeFile(
          path.join(config.inputDir, config.apiConfigFile),
          JSON.stringify(apiFamilyGroups)
        );
      });
  }
}
