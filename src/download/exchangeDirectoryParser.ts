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
 * @returns {Promise<string>} The extracted file's path
 */
export function extractFile(file: string, removeFiles = true): Promise<string> {
  return new Promise((resolve, reject) => {
    const filepath = path.join(path.dirname(file), path.basename(file, ".zip"));
    fs.createReadStream(file).pipe(
      unzipper
        .Extract({
          path: filepath,
        })
        .on("error", () =>
          reject(`Failed to extract ${file}, probably not a zip file`)
        )
        .on("close", () => {
          if (removeFiles) {
            fs.removeSync(file);
          }
          resolve(filepath);
        })
    );
  });
}

/**
 * @description Extracts zip files present in the given directory.
 *   zip files are usually downloaded from Anypoint exchange
 * @export
 * @param {string} directory Directory we want to download to
 * @param {boolean} [removeFiles=true] Whether to remove the zip files after extraction
 * @returns {Promise<string[]>} A list of extracted file paths
 */
export function extractFiles(
  directory: string,
  removeFiles = true
): Promise<string[]> {
  const files = getFiles(directory);
  const promises: Promise<string>[] = [];
  files
    .filter((file) => file.isFile() && path.extname(file.name) === ".zip")
    .forEach((file) => {
      promises.push(
        extractFile(path.join(path.resolve(directory), file.name), removeFiles)
      );
    });

  return Promise.all(promises);
}
