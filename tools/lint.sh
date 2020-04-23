#!/bin/bash
packFilenamePattern="commerce-apps-raml-toolkit*.tgz"
cd /linter && npm pack
npmPackFiles=($packFilenamePattern) && linterPackFile=${npmPackFiles[0]}
node /linter/tools/lint.js /linter/${linterPackFile}


