/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import _ from "lodash";
import fetch from "make-fetch-happen";
import fs from "fs-extra";
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
import { retryOptions } from "./config";

export const DEFAULT_DOWNLOAD_FOLDER = "download";
const ANYPOINT_BASE_URI = "https://anypoint.mulesoft.com/exchange";
const ANYPOINT_API_URI_V1 = `${ANYPOINT_BASE_URI}/api/v1`;
const ANYPOINT_API_URI_V2 = `${ANYPOINT_BASE_URI}/api/v2`;
const DEPLOYMENT_DEPRECATION_WARNING =
  "The 'deployment' argument is deprecated. The latest RAML specification that is published to Anypoint Exchange will be downloaded always.";

/**
 * Makes an HTTP call to the url with the options passed. If the calls due to
 * a 5xx, 408, 420 or 429, it retries the call with the retry options passed
 * in the options argument. If no retry options are passed, it uses the default
 * options set in retryOptions of config.ts.
 *
 * @param url - Where the request should be made
 * @param options - options to be passed when the call is made
 *
 * @returns a promise with the raw response returned by the server
 */
export async function runFetch(
  url: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  options: { [key: string]: any } = {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  options.retry = _.merge({}, retryOptions, options.retry);
  options = _.merge(options, {
    onRetry() {
      ramlToolLogger.info(
        "Request failed due to an unexpected error, retrying..."
      );
    },
  });

  return fetch(url, options);
}

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

    const response = await runFetch(restApi.fatRaml.externalLink);
    if (!response.ok) {
      throw new Error(
        `Unknown Error: (${response.status}) ${response.statusText}`
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    await fs.writeFile(zipFilePath, Buffer.from(arrayBuffer));
    const filePath = await extractFile(zipFilePath);
    delete restApi.fatRaml;
    await fs.writeJSON(path.join(filePath, ".metadata.json"), restApi, {
      spaces: 2,
    });
  } catch (err) {
    throw new Error(err.message);
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
 *  This function uses V1 API to utilize the environmentName attribute for verifying the deployment tags
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
  const res = await runFetch(`${ANYPOINT_API_URI_V1}/assets/${assetId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!res.ok) {
    ramlToolLogger.warn(
      `Failed to get information about ${assetId} from exchange: ${res.status} - ${res.statusText}`,
      `Please get it manually from ${ANYPOINT_API_URI_V1}/assets/${assetId} and update the relevant details in apis/api-config.json`
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
  return runFetch(
    `${ANYPOINT_API_URI_V2}/assets?search=${searchString}&types=rest-api`,
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
 * @description Returns the version of an api in exchange from the instance fetched asset.version value
 *
 * @export
 * @param {string} accessToken
 * @param {RestApi} restApi
 * @param {RegExp} [deployment]
 * @returns {Promise<string>} Returned the version string from the instance fetched asset.version value
 */
export async function getVersionByDeployment(
  accessToken: string,
  restApi: RestApi,
  deployment?: RegExp
): Promise<void | string> {
  if (deployment) {
    ramlToolLogger.warn(DEPLOYMENT_DEPRECATION_WARNING);
  }
  const logPrefix = "[exchangeDownloader][getVersion]";

  let asset;
  try {
    asset = await getAsset(
      accessToken,
      `${restApi.groupId}/${restApi.assetId}`
    );
  } catch (error) {
    ramlToolLogger.error(`${logPrefix} Error fetching asset:`, error);
    return;
  }

  if (!asset) {
    ramlToolLogger.log(
      `${logPrefix} No asset found for ${restApi.assetId}, returning`
    );
    return;
  }

  if (!asset.version) {
    ramlToolLogger.error(
      `${logPrefix} The rest API ${restApi.assetId} is missing the asset.version`
    );
    return;
  }

  // return the most recent version of an asset from the rest API
  return asset.version;
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
 * string.
 * If it fails to get information about the deployed version of an API, it
 * removes all the version specific information from the returned object.
 *
 * @param query - Exchange search query
 * @param [deployment] - RegExp matching the desired deployment targets
 *
 * @returns Information about the APIs found.
 */
export async function search(
  query: string,
  deployment?: RegExp
): Promise<RestApi[]> {
  if (deployment) {
    ramlToolLogger.warn(DEPLOYMENT_DEPRECATION_WARNING);
  }

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
