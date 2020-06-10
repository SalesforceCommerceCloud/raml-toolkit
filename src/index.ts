/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import lint from "./lint";
export default lint;

export { FatRamlResourceLoader } from "./exchange-connector";

export { getBearer } from "./exchange-connector/bearerToken";
export {
  searchExchange,
  downloadRestApi,
  downloadRestApis,
  getVersionByDeployment,
  getSpecificApi,
  getAsset
} from "./exchange-connector/exchangeDownloader";
export {
  groupByCategory,
  removeVersionSpecificInformation,
  removeRamlLinks
} from "./exchange-connector/exchangeTools";
export { extractFiles } from "./exchange-connector/exchangeDirectoryParser";

export { RestApi } from "./exchange-connector/exchangeTypes";
export { ramlToolLogger } from "./common/logger";

import * as amf from "amf-client-js";
export { amf };
export { model } from "amf-client-js";

export {
  getAllDataTypes,
  getApiName,
  getNormalizedName,
  parseRamlFile,
  resolveApiModel
} from "./common/parser";

export { diffRaml, NodeDiff, RamlDiff } from "./diffTool";
