/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { RestApi } from "./exchangeTypes";
import _ from "lodash";

/**
 * @description Group APIs by a category in exchange
 * @export
 * @param {RestApi[]} apis An array of apis we want to group
 * @param {string} groupBy Name of the category we want to group APIs by
 * @param {boolean} [allowUnclassified=true] If we want to file on grouping if an item is missing the groupBy category
 * @returns {{ [key: string]: RestApi[] }} List of Apis grouped by category
 */
export function groupByCategory(
  apis: RestApi[],
  groupBy: string,
  allowUnclassified = true
): { [key: string]: RestApi[] } {
  return _.groupBy(apis, api => {
    // Categories are actually a list.
    // We are just going to use whatever the first one is for now
    if (api.categories && groupBy in api.categories) {
      return api.categories[groupBy][0];
    } else if (allowUnclassified) {
      return "unclassified";
    } else {
      throw new Error("Unclassified APIs are NOT allowed!");
    }
  });
}

/**
 * @description Removes links from the api specs as they contain aws api keys
 *
 * @export
 * @param {RestApi[]} apis List of apis to scrub
 * @returns {RestApi[]} Same list of APIs but without their external links
 */
export function removeRamlLinks(apis: RestApi[]): RestApi[] {
  const apiCopy = _.cloneDeep(apis);
  apiCopy.forEach(apiEntry => {
    delete apiEntry.fatRaml.externalLink;
  });
  return apiCopy;
}

/**
 * Remove all the information that is specific to a version so that the SDK is
 * not generated with incorrect information accidentally in the event of a
 * failure to retrieve information about the asset. Correct information should
 * be filled manually in 'apis/api-config.json' before the SDK can be generated.
 *
 * @param api The target API
 */
export function removeVersionSpecificInformation(api: RestApi): RestApi {
  const apiCopy = _.cloneDeep(api);
  apiCopy.id = null;
  apiCopy.updatedDate = null;
  apiCopy.version = null;

  if (apiCopy.fatRaml) {
    apiCopy.fatRaml.createdDate = null;
    apiCopy.fatRaml.md5 = null;
    apiCopy.fatRaml.sha1 = null;

    delete apiCopy.fatRaml.externalLink;
  }

  return apiCopy;
}
