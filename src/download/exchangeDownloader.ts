/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import fs from "fs-extra";
import fetch from "node-fetch";
import path from "path";

import { getBearer } from "./bearerToken";
import { removeVersionSpecificInformation } from "./exchangeTools";
import {
  RawRestApi,
  RestApi,
  FileInfo,
  RawCategories,
  Categories,
} from "./exchangeTypes";
import { ramlToolLogger } from "../common/logger";
import { extractFile } from "./exchangeDirectoryParser";

const DEFAULT_DOWNLOAD_FOLDER = "download";
const ANYPOINT_BASE_URI = "https://anypoint.mulesoft.com/exchange";
const ANYPOINT_BASE_URI_V1 = `${ANYPOINT_BASE_URI}/api/v1`;
const ANYPOINT_BASE_URI_V2 = `${ANYPOINT_BASE_URI}/api/v2`;

export async function downloadRestApi(
  restApi: RestApi,
  destinationFolder: string = DEFAULT_DOWNLOAD_FOLDER
): Promise<void> {
  if (!restApi.id) {
    ramlToolLogger.warn(
      `Failed to download '${restApi.name}' RAML as Fat RAML download information is missing.`,
      `Please download it manually from ${ANYPOINT_BASE_URI}/${restApi.groupId}/${restApi.assetId} and update the relevant details in apis/api-config.json`
    );
    return;
  }
  try {
    await fs.ensureDir(destinationFolder);
    const zipFilePath = path.join(destinationFolder, `${restApi.assetId}.zip`);
    const response = await fetch(restApi.fatRaml.externalLink);
    const arrayBuffer = await response.arrayBuffer();
    await fs.writeFile(zipFilePath, Buffer.from(arrayBuffer));
    const filepath = await extractFile(zipFilePath);
    delete restApi.fatRaml;
    await fs.writeJSON(path.join(filepath, ".metadata.json"), restApi, {
      spaces: 2,
    });
  } catch (err) {
    ramlToolLogger.error(err);
  }
}

/**
 * Download the API specifications
 * @param restApi - Metadata of the API
 * @param destinationFolder - Destination directory for the download
 */
export async function downloadRestApis(
  restApi: RestApi[],
  destinationFolder: string = DEFAULT_DOWNLOAD_FOLDER
): Promise<string> {
  const downloads = restApi.map((api) =>
    downloadRestApi(api, destinationFolder)
  );
  await Promise.all(downloads);
  return destinationFolder;
}

function mapCategories(categories: RawCategories[]): Categories {
  const cats: Categories = {};
  categories.forEach((category) => {
    cats[category.key] = category.value;
  });
  return cats;
}

function getFileByClassifier(files: FileInfo[], classifier: string): FileInfo {
  const found = files.find((file) => file.classifier === classifier);
  // There are extra properties we don't want (downloadURL, isGenerated), so we
  // create a new object that excludes them
  return {
    classifier: found.classifier,
    packaging: found.packaging,
    externalLink: found.externalLink,
    createdDate: found.createdDate,
    md5: found.md5,
    sha1: found.sha1,
    mainFile: found.mainFile,
  };
}

function convertResponseToRestApi(apiResponse: RawRestApi): RestApi {
  return {
    id: apiResponse.id,
    name: apiResponse.name,
    description: apiResponse.description,
    updatedDate: apiResponse.updatedDate,
    groupId: apiResponse.groupId,
    assetId: apiResponse.assetId,
    version: apiResponse.version,
    categories: mapCategories(apiResponse.categories),
    fatRaml: getFileByClassifier(apiResponse.files, "fat-raml"),
  };
}

/**
 * @description Get an asset from exchange.  This can be any of the following patterns
 *  * /groupId/assetId/version
 *  * /groupId/assetId
 *  * /groupId
 *
 * @export
 * @param {string} accessToken
 * @param {string} assetId
 * @returns {Promise<void | RawRestApi>}
 */
export async function getAsset(
  accessToken: string,
  assetId: string
): Promise<void | RawRestApi> {
  const res = await fetch(`${ANYPOINT_BASE_URI_V1}/assets/${assetId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!res.ok) {
    ramlToolLogger.warn(
      `Failed to get information about ${assetId} from exchange: ${res.status} - ${res.statusText}`,
      `Please get it manually from ${ANYPOINT_BASE_URI_V1}/assets/${assetId} and update the relevant details in apis/api-config.json`
    );
    return;
  }

  return res.json();
}

/**
 * @description Searches exchange and gets a list of apis based on the search string
 * @export
 * @param {string} accessToken
 * @param {string} searchString
 * @returns {Promise<RestApi[]>}
 */
export async function searchExchange(
  accessToken: string,
  searchString: string
): Promise<RestApi[]> {
  return fetch(
    `${ANYPOINT_BASE_URI_V2}/assets?search=${searchString}&types=rest-api`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )
    .then((res) => res.json())
    .then((restApis) => {
      const apis: RestApi[] = [];
      restApis.forEach((restApi) => {
        apis.push(convertResponseToRestApi(restApi));
      });
      return apis;
    });
}

/**
 * @description Looks at all versions of an api in exchange for an instance that matched the deployment regex
 *
 * @export
 * @param {string} accessToken
 * @param {RestApi} restApi
 * @param {RegExp} deployment
 * @returns {Promise<string>} Returned the version string that matches the regex passed.  Will return first found result
 */
export async function getVersionByDeployment(
  accessToken: string,
  restApi: RestApi,
  deployment: RegExp
): Promise<void | string> {
  const asset = await getAsset(
    accessToken,
    `${restApi.groupId}/${restApi.assetId}`
  );
  if (!asset) {
    return;
  }
  let version = null;
  asset.instances.forEach((instance) => {
    if (
      instance.environmentName &&
      deployment.test(instance.environmentName) &&
      !version
    ) {
      version = instance.version;
    }
  });
  // If no instance matched the intended deployment get the version info
  // from the fetched asset.
  return version || asset.version;
}

/**
 * @description Gets details on a very specific api version combination
 * @export
 * @param {string} accessToken
 * @param {string} groupId
 * @param {string} assetId
 * @param {string} version
 * @returns {Promise<RestApi>}
 */
export async function getSpecificApi(
  accessToken: string,
  groupId: string,
  assetId: string,
  version: string
): Promise<RestApi | null> {
  if (!version) return null;
  const api = await getAsset(accessToken, `${groupId}/${assetId}/${version}`);
  return api ? convertResponseToRestApi(api) : null;
}

/**
 * Gets information about all the APIs from exchange that match the given search
 * string for the version deployed in the given environment.
 * If it fails to get information about the deployed version of an API, it
 * removes all the version specific information from the returned object.
 *
 * @param query - Exchange search query
 * @param deployment - RegExp matching the desired deployment targets
 *
 * @returns Information about the APIs found.
 */
export async function search(
  query: string,
  deployment: RegExp
): Promise<RestApi[]> {
  const token = await getBearer(
    process.env.ANYPOINT_USERNAME,
    process.env.ANYPOINT_PASSWORD
  );
  const apis = await searchExchange(token, query);
  const promises = apis.map(async (api) => {
    const version = await getVersionByDeployment(token, api, deployment);
    return version
      ? getSpecificApi(token, api.groupId, api.assetId, version)
      : removeVersionSpecificInformation(api);
  });
  return Promise.all(promises);
}
