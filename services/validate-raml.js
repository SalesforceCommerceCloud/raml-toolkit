/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const downloadService = require("./download-raml");

const path = require("path");

function validateRaml(uuid, rootFolderPath) {
  const resolvedUuidPath = path.resolve(path.join(rootFolderPath, uuid));
  downloadService.downloadRaml(uuid, rootFolderPath);

  console.log("Validating ", uuid, " RAML from folder ", resolvedUuidPath);
}

module.exports = {
  validateRaml: validateRaml
};
