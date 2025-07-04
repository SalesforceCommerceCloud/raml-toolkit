# CHANGELOG

## 0.7.0

* Add `ExchangeConfig` type [#230](https://github.com/SalesforceCommerceCloud/raml-toolkit/pull/230)
* Update `search` function to pull latest versions of APIs from multiple versions groups [#231](https://github.com/SalesforceCommerceCloud/raml-toolkit/pull/231)
* Add `flags` argument to `generateFromOas` function [#232](https://github.com/SalesforceCommerceCloud/raml-toolkit/pull/232)
* Update `diff` command to work with multiple versions of the same API [#233](https://github.com/SalesforceCommerceCloud/raml-toolkit/pull/233)

## 0.6.0

* Added support for OAS files:
  * Generate command: `raml-toolkit generate`
  * Diff command: `raml-toolkit diff <BASE> <NEW> -s oas`
  * Download command: `raml-toolkit-download`

## 0.5.12

* Fix bug by deprecating `deployment` argument from exchange downloader `search` command the argument is now optional and ignored.
* Fix bug by deprecating `deployment` argument from `getVersionByDeployment` the argument is now optional and ignored.
* Fix bug by deprecating download command flags `-D, --deployment, --deployment-regex-flags` the options are now ignored.
* Added custom field for class name if defined in RAML.

## 0.5.11

* Added new template helpers `getMediaTypeFromRequest` and `isRequestWithPayload`.
* Improved logging while rendering templates.
* TypeScript test files in `/resources` will no longer be published.

## 0.5.10

* Added new `parent` property to `ApiMetadata`. When a new instance is created with
children, the new instance is set as the parent of each child instance.

## 0.5.9

* Disabled the linting rule which checked for presence of duplicate display names in RAMLs because it caused serious performance degradation

## 0.5.8

* Fixed the issue due to which raml-toolkit lint command was consuming too much memory and taking too much time to complete.
* Minor bug fixes

## 0.5.7

* Added `isTraitDefinition` Handlebars helper to test whether an object is an
AMF model of a RAML trait.
* Refactored validation profiles to import rules from libraries. The rules are
unchanged, but they are now available for use in custom validation profiles.

## 0.5.6

* Updated profile validation rules to use SPARQL
* Minor bug fixes

## 0.5.5

* Added additional documentation for utilizing the Delta Checker
* Security updates

## 0.5.4

* Added Non-Breaking rule to detect addition of endpoint operations in Delta Checker
* Add retry option to fetch

## 0.5.3

* Fixed resource-name-validation rule in SLAS profile

## 0.5.2

* Upgraded AMF to v4.3.0
* Minor bug fixes

## 0.5.1

* *NEW FEATURE* Added new console formatter for diff command, see the  [README](README.md#raml-toolkit-diff-base-new).
* *BUG FIX* RAML files with correct deployment tags are now downloaded

## 0.5.0

* *NEW FEATURE* Added CLI commands to download raml files directly from exchange
* *NEW FEATURE* Added ability to render templates from an API model
* Exports have been reorganized to match associated CLI commands
* Added additional ignore rules and other enhancements to the difftool to ensure a better signal to noise ratio.

## 0.4.5

* Added new profile for slas
* updated to typescript 3.9

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
