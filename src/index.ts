/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

export { FatRamlResourceLoader } from "./download";

export { getBearer } from "./download/bearerToken";
export {
  searchExchange,
  downloadRestApi,
  downloadRestApis,
  getVersionByDeployment,
  getSpecificApi,
  getAsset
} from "./download/exchangeDownloader";
export {
  groupByCategory,
  removeVersionSpecificInformation,
  removeRamlLinks
} from "./download/exchangeTools";
export { extractFiles } from "./download/exchangeDirectoryParser";

export { RestApi } from "./download/exchangeTypes";
export { ramlToolLogger } from "./common/logger";

import * as amf from "amf-client-js";
export { amf };
export { model } from "amf-client-js";

export { findApiChanges, diffRaml, NodeDiff, RamlDiff } from "./diff";
export { handlebarsHelpers } from "./generate";

export * from "./generate";

export {
  getAllDataTypes,
  getApiName,
  getNormalizedName,
  parseRamlFile,
  resolveApiModel
} from "./common/parser";

