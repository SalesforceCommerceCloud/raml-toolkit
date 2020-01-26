/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const downloadService = require("./services/download-raml");
const validateService = require("./services/validate-raml");

const tmp = require("tmp");
const PORT = process.env.PORT || 3000;

const express = require("express");
const app = express();

const rootTemporaryFolder = tmp.dirSync();
app
  .route("/lint/:uuid")
  .get((req, res) => {
    const ramlUUID = req.params.uuid;
    downloadService.downloadRaml(ramlUUID, rootTemporaryFolder.name);

    res.send(`get fat raml for ${ramlUUID}!`);
  })
  .put((req, res) => {
    const ramlUUID = req.params.uuid;
    validateService.validateRaml(ramlUUID, rootTemporaryFolder.name);
    res.send(`Validated lint`);
  });

// eslint-disable-next-line no-unused-vars
const server = app.listen(PORT, () => {});
