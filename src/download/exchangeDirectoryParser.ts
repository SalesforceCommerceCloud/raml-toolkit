/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import fs from "fs-extra";
import path from "path";
import unzipper from "unzipper";

function getFiles(directory): fs.Dirent[] {
  return fs.readdirSync(path.join(directory), {
    withFileTypes: true,
  });
}

/**
 * @description Extracts zip files present in the given directory.
 *   zip files are usually downloaded from Anypoint exchange
 * @export
 * @param {string} directory Directory we want to download to
 * @param {boolean} [removeFiles=true] Whether to remove the zip files after extraction
 * @returns {Promise<void>} Just a promise to indicate we are done.
 */
export function extractFiles(
  directory: string,
  removeFiles = true
): Promise<void[]> {
  const files = getFiles(directory);
  const promises: Promise<void>[] = [];
  files
    .filter((file) => file.isFile() && path.extname(file.name) === ".zip")
    .forEach((file) => {
      promises.push(
        new Promise((resolve, reject) => {
          fs.createReadStream(
            path.join(path.resolve(directory), file.name)
          ).pipe(
            unzipper
              .Extract({
                path: path.join(
                  path.resolve(directory),
                  path.basename(file.name, ".zip")
                ),
              })
              .on("error", reject)
              .on("close", () => {
                if (removeFiles) {
                  fs.removeSync(path.join(path.resolve(directory), file.name));
                }
                resolve();
              })
          );
        })
      );
    });

  return Promise.all(promises);
}
