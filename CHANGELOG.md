# CHANGELOG

## 0.4.4

* Added flag to `diff` command that adds the ability to find the difference between directories.

### New Usage

For complete documentation of the `diff` command, see the [README](README.md#raml-toolkit-diff-base-new).

```txt
NEW USAGE
  $ raml-toolkit diff --dir BASE NEW

ARGUMENTS
  BASE  The base API configuration file
  NEW   The new API configuration file

OPTIONS
  -o, --out-file=out-file  File to store the computed difference

DESCRIPTION
  This command has three modes: ruleset, diff-only, and directory.
     Directory mode compares all the files in two directories and determines if there are any differences.

  In directory mode, the arguments must be API configuration (JSON) files.

  Exit statuses:
     0 - No differences found
     1 - Differences found
     2 - Evaluation could not be completed
```

## 0.4.3

* Added `diff` and `download` commands.

### New Command Usage

#### `raml-toolkit diff APISPECBASEPATH APISPECNEWPATH`

Takes two API spec files as input and outputs the differences.

```txt
USAGE
  $ raml-toolkit diff APISPECBASEPATH APISPECNEWPATH

ARGUMENTS
  APISPECBASEPATH  The base API spec file for the comparison
  APISPECNEWPATH   The new version of the API spec for comparison against the base version

OPTIONS
  -h, --help             show CLI help
  -r, --ruleset=ruleset  Path to ruleset to apply to diff
  -v, --version          show CLI version

  --diff-only            Only show differences without evaluating a ruleset. The exit status in this mode is 0 for no
                         changes, 1 for any difference and 2 when unsuccessful.

DESCRIPTION
  By default, a ruleset is applied to determine if changes are breaking. Exit status is:
     0 - all changes are non-breaking
     1 - any changes are breaking
     2 - evaluation could not be completed

  The ruleset flag is used to evaluate a custom ruleset in place of the default rules. The diff-only flag disables
  evaluation against any ruleset.
```

#### `raml-toolkit download`

Download API specification files from Anypoint Exchange

```txt
USAGE
  $ raml-toolkit download

OPTIONS
  -D, --deployment=deployment                      [default: .] Deployment status to filter results from Anypoint
                                                   Exchange

  -c, --config-file=config-file                    [default: api-config.json] Name of the target file to save the API
                                                   config

  -d, --dest=dest                                  [default: apis] Directory to download APIs into

  -g, --group-by=group-by                          (required) Category to use to group APIs together

  -h, --help                                       show CLI help

  -s, --search=search                              Search query to filter results from Anypoint Exchange

  --deployment-regex-flags=deployment-regex-flags  RegExp flags to specify for advanced deployment matching
```

## 0.4.1

* Changed TypeScript annotations for `parseRamlFile` and `resolveApiModel` to more accurate `amf.model.document.Document`.
* Added [`amf-client-js`](https://npmjs.com/package/amf-client-js) as an export (as `amf`)

## 0.4.0

* Mercury rules updated
  * Template parameters must be camelCase
  * BaseURI pattern check slightly refactored
  * Display Name must unique across an api definition
* RAML -> AMF code has been migrated from the commerce-sdk to the raml-toolkit
* Error messaging has been greatly improved
  * You will get a specific error now when a profile fails to parse

## 0.3.2

* Now uses AMF 4.0!
* Fixed an issue where some transitive dependencies weren't resolved properly
* `baseUri` must now match the pattern - `https://{shortCode}.api.commercecloud.salesforce.com/<api-family>/<api-name>/{version}`

## 0.3.1

* Dependency issue fixed

## 0.3.0

* All the raml-toolkit code is now written in Typescript.
* Fixes the issue where transitive dependencies of the target RAML could not be parsed.
* Adds logging capability and allows the logging level to be configured.

### Usage

```javascript
import { ramlToolLogger } from "@commerce-apps/raml-toolkit";

ramlToolLogger.setLevel(ramlToolLogger.levels.INFO);
```
