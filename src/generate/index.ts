/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
export { Api } from "./api";
export { ApiGroup } from "./apiGroup";
export { ApiCollection } from "./apiCollection";
export { Template } from "./template";

import {
  getBaseUri,
  getParameterDataType,
  getPropertyDataType,
  getRequestPayloadType,
  getReturnPayloadType,
  getProperties,
  isAdditionalPropertiesAllowed,
  isOptionalProperty,
  isRequiredProperty,
  isTypeDefinition
} from "./handlebarsAmfHelpers";
import { getValue } from "./utils";
const handlebarsAmfHelpers = {
  getBaseUri,
  getParameterDataType,
  getPropertyDataType,
  getRequestPayloadType,
  getReturnPayloadType,
  getProperties,
  getValue,
  isAdditionalPropertiesAllowed,
  isOptionalProperty,
  isRequiredProperty,
  isTypeDefinition
};
import { HandlebarsWithAmfHelpers } from "./handlebarsConfig";
export { handlebarsAmfHelpers, HandlebarsWithAmfHelpers };
