/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const fs = require("fs");
const fsExtra = require("fs-extra");
const path = require("path");

function downloadRaml(uuid, rootFolderPath) {
  prepareRamlFolder(uuid, rootFolderPath, true);
  console.log(
    "Downloading ",
    uuid,
    " RAML from Anypoint to ",
    path.join(rootFolderPath, uuid)
  );
}

function prepareRamlFolder(uuid, rootFolderPath, clearDir) {
  let resolvedUuidPath = path.resolve(path.join(rootFolderPath, uuid));

  // Check if uuid exists inside root path
  // if not then create the folder
  // if yes then clear the folder
  const isUuidExists = fs.existsSync(resolvedUuidPath);
  console.log("uuid exists? ", isUuidExists);
  if (!isUuidExists) {
    fsExtra.ensureDirSync(resolvedUuidPath);
    console.log("created ", uuid, " directory");
  }

  if (clearDir) {
    console.log("Cleared ", uuid, " directory");
    fsExtra.emptyDirSync(resolvedUuidPath);
  }
}

module.exports = {
  downloadRaml: downloadRaml
};
