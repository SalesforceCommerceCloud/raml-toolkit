/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

export { Template } from "./template";

export * as handlebarsAmfHelpers from "./handlebarsAmfHelpers";
export { HandlebarsWithAmfHelpers, registerPartial } from "./handlebarsConfig";

export { ApiMetadata } from "./apiMetadata";
export {
  ApiModel,
  SDK_ANNOTATION,
  CUSTOM_CLASS_NAME_PROPERTY,
} from "./apiModel";
export { loadApiDirectory } from "./loadApiDirectory";
