# Raml Toolkit  <!-- omit in toc -->

A collection of raml tools for commerce cloud and beyond

  [![CircleCI][circleci-image]][circleci-url] [![Slack][slack-image]][slack-url]

- [Installation](#installation)
- [Usage](#usage)
  - [Jenkins](#jenkins)
  - [From your local machine](#from-your-local-machine)
- [SDK Ready for Mercury](#sdk-ready-for-mercury)
- [Contributing](#contributing)
- [Known issues and limitations](#known-issues-and-limitations)
- [Development Resources](#development-resources)

## Installation

```bash
npm install -g @commerce-apps/raml-toolkit
```

## Usage

The npm installs the binaries as both `raml-toolkit` and `ramlint` and they can be used interchangeably.  You can always run with `--help` to get available options, currently the options are as follows.

### Commands

**Note:** Some commands require environment variables to be set. This can be done using a [.env file](https://www.npmjs.com/package/dotenv#rules) in your working directory (the directory from which you run `raml-toolkit`).

<!-- commands -->
- [`raml-toolkit diff APISPECBASEPATH APISPECNEWPATH`](#raml-toolkit-diff-apispecbasepath-apispecnewpath)
- [`raml-toolkit download`](#raml-toolkit-download)
- [`raml-toolkit lint [FILENAME]`](#raml-toolkit-lint-filename)

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

#### `raml-toolkit lint [FILENAME]`

A linting tool for raml for commerce cloud and beyond

```txt
USAGE
  $ raml-toolkit lint [FILENAME]

OPTIONS
  -h, --help               show CLI help
  -p, --profile=(mercury)  (required) profile to apply
  -v, --version            show CLI version
  -w, --warnings           Show all the warnings

DESCRIPTION
  FILENAME is one or more RAML files to lint.
```
<!-- commandsstop -->

### Jenkins

In your Jenkinsfile, init npm and then it's a simple one line command

  ```groovy
    stage('Init') {
        // Needed only for SFCI instances to add npm to the instance
        npmInit()
    }

    stage('Whatever') {
        sh "npx raml-toolkit lint --profile mercury file1.raml file2.raml etc.raml"
    }
  ```

NOTE: Violations will return a non-zero exit code and fail the build, which warnings will still return a 0 exit code so the build will not fail with warnings

### From your local machine

To check your RAML currently the CLI just takes a list of files

```bash
$ ramlint lint --profile mercury file.raml
# or
$ ramlint lint --profile mercury file1.raml file2.raml etc.raml
```

The response will look something like

```txt
Model: file://data-products-api-v1.raml
Profile: mercury
Conforms? false
Number of results: 2

Level: Violation

- Source: http://a.ml/vocabularies/data#require-api-description
  Message: The API Description must be set
  Level: Violation
  Target: file://data-products-api-v1.raml#/web-api
  Property: http://schema.org/description
  Position: Some(LexicalInformation([(2,0)-(1885,0)]))
  Location: file://data-products-api-v1.raml

- Source: http://a.ml/vocabularies/data#version-format
  Message: The version must be formatted as v[Major], for example v2
  Level: Violation
  Target: file://data-products-api-v1.raml#/web-api
  Property: http://schema.org/version
  Position: Some(LexicalInformation([(3,9)-(3,11)]))
  Location: file://data-products-api-v1.raml

 ›   Error: ./data-products-api-v1.raml is invalid
```

Let us look more closely at each of these errors.

The first error is saying that the API description is not set, but we need to have it set according to our standards.  There is a "Position:" field in the response, but it is saying 2-1885. This happens to be the entire RAML document. Ranges like this will be common for "Missing" components since the parser doesn't know where you want to put it, but knows you need to put it somewhere.

The second error, however, is because it exists, but doesn't match our standard.  There you can see that the position leads you to the exact line number and column of the non-conforming component.

When there are no more violations, the output will say it conforms, but also provide you with some warnings you might want to fix as well.

### Exchange Connector

This package also contains the code formerly published under `@commerce-apps/exchange-connector`. There are no breaking changes between the last version of `@commerce-apps/exchange-connector` and v0.3.0 of this package. For changes since then, see the [changelog](CHANGELOG.md).

## SDK Ready for Mercury

The default profile validates the following rules from the [Mercury API Definition of Done](https://salesforce.quip.com/lHK7ADgscANI)

- `title` MUST be set and not be empty
- `protocols` MUST be HTTPS
- `version` MUST be set and follow the pattern /v[0-9]+/
- API must have a `mediaType` default of application/json
- `description` MUST be set and not be empty
- `description` MUST not include the word TODO
- All resource paths MUST be lowercase (except template parameters)
- Resource paths MUST not start with symbols
- All template/URI params MUST be lowerCamelCase
- Methods MUST have a `displayName` set
- Method `displayName` MUST be in camelCase
- Methods MUST have a `description` field set
- Method `description` MUST NOT contain the word TODO
- `queryParameters` MUST be camelCase
- Response codes MUST have a `description`
- Response codes `description` MUST NOT contain the word TODO
- There must be exactly one `baseUri`
- `baseUri` must match the pattern - `https://{shortCode}.api.commercecloud.salesforce.com/<api-family>/<api-name>/{version}`
- `displayName` must be unique across an API

## Contributing

You can read all about our contribution model [here!](./.github/CONTRIBUTING.md)

## Known issues and limitations

- Currently works only with local files

## Development Resources

Here is an AMF validation example from Mulesoft.  This includes some custom rules you can use for reference when building rules.

- <https://github.com/mulesoft-labs/amf-validation-example>
- <https://github.com/aml-org/amf/blob/develop/vocabularies/dialects/canonical_webapi.yaml>
- <https://github.com/aml-org/amf/tree/develop/documentation/validations>

<!-- Markdown link & img dfn's -->
[circleci-image]: https://circleci.com/gh/SalesforceCommerceCloud/raml-toolkit.svg?style=svg&circle-token=f0e669168c5d1538fc0b76ad71e13b2e2251ebd4
[circleci-url]: https://circleci.com/gh/SalesforceCommerceCloud/raml-toolkit
[slack-image]: https://img.shields.io/badge/slack-sfcc--raml--linter-e01563.svg?logo=slack
[slack-url]: https://commercecloud.slack.com/messages/CNDPCJQG3
