/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

export { getBearer } from "./download/bearerToken";
export { RestApi } from "./download/exchangeTypes";
export { ramlToolLogger } from "./common/logger";

export * as amf from "amf-client-js";
export { model } from "amf-client-js";

export * from "./generate";

export * as diff from "./diff";
export {
  getAllDataTypes,
  getApiName,
  getNormalizedName,
  parseRamlFile,
  resolveApiModel
} from "./common/parser";
