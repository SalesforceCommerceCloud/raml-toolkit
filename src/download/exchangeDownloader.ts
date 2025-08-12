/*
 * Copyright (c) 2025, salesforce.com, inc.
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

// Only allows MAJOR.MINOR.PATCH (no suffixes). see https://semver.org/
const releaseSemverRegex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
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
  destinationFolder: string = DEFAULT_DOWNLOAD_FOLDER,
  isOas = false
): Promise<void> {
  if (!restApi.id) {
    ramlToolLogger.warn(
      `Failed to download '${restApi.name}' RAML / OAS as download information is missing.`,
      `Please download it manually from ${ANYPOINT_BASE_URI}/${restApi.groupId}/${restApi.assetId} and update the relevant details in apis/api-config.json`
    );
    return;
  }
  try {
    await fs.ensureDir(destinationFolder);
    let zipFilePath = path.join(destinationFolder, `${restApi.assetId}.zip`);

    if (isOas) {
      //For OAS, download clean latest versions from multiple version groups
      zipFilePath = path.join(
        destinationFolder,
        `${restApi.assetId}-${restApi.version}.zip`
      );
    }

    const fatRaml = restApi.fatRaml;
    const fatOas = restApi.fatOas;

    const externalLink = isOas ? fatOas.externalLink : fatRaml.externalLink;

    const response = await runFetch(externalLink);
    if (!response.ok) {
      throw new Error(
        `Unknown Error: (${response.status}) ${response.statusText}`
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    await fs.writeFile(zipFilePath, Buffer.from(arrayBuffer));
    const filePath = await extractFile(zipFilePath);
    delete restApi.fatRaml;
    delete restApi.fatOas;
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
 * @param isOas - True for Open Api Specification
 */
export async function downloadRestApis(
  restApi: RestApi[],
  destinationFolder: string = DEFAULT_DOWNLOAD_FOLDER,
  isOas = false
): Promise<string> {
  const downloads = restApi.map((api) =>
    downloadRestApi(api, destinationFolder, isOas)
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

  // Not all API files in anypoint exchange have an associated fat-raml or fat-oas classifier. so
  // we return null here for those cases
  if (!found) {
    return null;
  }
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
    fatOas: getFileByClassifier(apiResponse.files, "fat-oas"),
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
  //TODO: We may have to handle pagination in the future if the number of APIs returned is more than 50
  return runFetch(
    `${ANYPOINT_API_URI_V2}/assets?search=${searchString}&types=rest-api&limit=50&offset=0`,
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
 * @param isOas - True to get Open API Specifications, false for RAML
 * @returns Information about the APIs found.
 */
export async function search(
  query: string,
  deployment?: RegExp,
  isOas = false
): Promise<RestApi[]> {
  if (deployment) {
    ramlToolLogger.warn(DEPLOYMENT_DEPRECATION_WARNING);
  }

  const token = await getBearer(
    process.env.ANYPOINT_USERNAME,
    process.env.ANYPOINT_PASSWORD
  );
  const apis = await searchExchange(token, query);
  if (isOas) {
    return getLatestCleanApis(apis, token);
  }
  const promises = apis.map(async (api) => {
    const version = await getVersionByDeployment(token, api, deployment);
    return version
      ? getSpecificApi(token, api.groupId, api.assetId, version)
      : removeVersionSpecificInformation(api);
  });
  return Promise.all(promises);
}

/**
 * Gets information about all the APIs from exchange that match the given search
 * string.
 * If it fails to get information about the deployed version of an API, it
 * removes all the version specific information from the returned object.
 *
 * @param apis - Array of apis to get the latest versions
 * @param {string} accessToken
 *
 * @returns Information about the APIs found.
 */
export async function getLatestCleanApis(
  apis: RestApi[],
  accessToken: string
): Promise<RestApi[]> {
  // Get all API versions in parallel
  const apiVersionPromises = apis.map(async (api) => {
    const versions = await getLatestCleanApiVersions(accessToken, api);
    if (!versions || versions.length === 0) {
      return { api, versions: [] };
    }
    return { api, versions };
  });

  const allApiVersions = await Promise.all(apiVersionPromises);
  // Create promises for all API versions and process them in parallel
  const promises = [];
  for (const { api, versions } of allApiVersions) {
    for (const version of versions) {
      promises.push(
        getSpecificApi(accessToken, api.groupId, api.assetId, version)
      );
    }
  }
  return Promise.all(promises);
}

/**
 * @description Returns the latest clean (MAJOR.MINOR.PATCH) API versions from multiple version groups (V1, V2..) of an API
 *
 * @export
 * @param {string} accessToken
 * @param {RestApi} restApi
 * @returns {Promise<string>} Returned the version string from the instance fetched asset.version value
 */
export async function getLatestCleanApiVersions(
  accessToken: string,
  restApi: RestApi
): Promise<void | string[]> {
  const logPrefix = "[exchangeDownloader][getLatestCleanApiVersions]";

  let asset: void | RawRestApi;
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

  if (!asset.versionGroups) {
    ramlToolLogger.error(
      `${logPrefix} The rest API ${restApi.assetId} is missing asset.versionGroups`
    );
    return;
  }
  const versions: string[] = [];
  asset.versionGroups.forEach((versionGroup) => {
    const version = getLatestReleaseVersion(versionGroup);
    if (version) {
      versions.push(version);
    }
  });
  return versions;
}

function getLatestReleaseVersion(versionGroup: {
  versions: Array<{ version: string }>;
}): void | string {
  if (!versionGroup.versions || versionGroup.versions.length === 0) {
    return;
  }
  const releaseAssetVersions = versionGroup.versions.filter((version) => {
    return releaseSemverRegex.test(version.version);
  });

  // Sort versions and get the latest
  return releaseAssetVersions.sort((instanceA, instanceB) => {
    const [aMajor, aMinor, aPatch] = instanceA.version.split(".").map(Number);
    const [bMajor, bMinor, bPatch] = instanceB.version.split(".").map(Number);

    if (aMajor !== bMajor) return bMajor - aMajor;
    if (aMinor !== bMinor) return bMinor - aMinor;
    return bPatch - aPatch;
  })[0]?.version;
}
