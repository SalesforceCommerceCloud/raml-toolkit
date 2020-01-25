# Raml Toolkit  <!-- omit in toc -->
A linting tool for raml for commerce cloud and beyond

  [![CircleCI][circleci-image]][circleci-url] [![Slack][slack-image]][slack-url]

- [Installation](#installation)
  - [Git Enterprise (git.soma)](#git-enterprise-gitsoma)
    - [Installation](#installation-1)
- [Usage](#usage)
  - [Jenkins](#jenkins)
  - [From your local machine](#from-your-local-machine)
- [SDK Ready for Mercury](#sdk-ready-for-mercury)
- [Contributing](#contributing)
- [Known issues and limitations](#known-issues-and-limitations)
- [Development Resources](#development-resources)


## Installation

### Git Enterprise (git.soma)

#### Installation


```bash
$ npm install @commerce-apps/raml-toolkit
```

## Usage

The npm installs the binaries as both `raml-toolkit` and `ramlint` and they can be used interchangeably.  You can always run with `--help` to get available options, currently the options are as follows.

```bash
OPTIONS
  -h, --help                                show CLI help
  -p, --profile=(mercury-profile, other-profile) profile to apply
  -v, --version                             show CLI version
  -w, --warnings                   Show all the warnings
```

### Jenkins

In your Jenkinsfile just make sure you init npm and then its a very simple one line command

  ```groovy
    stage('Init') {
        // Needed only for SFCI instances to add npm to the instance
        npmInit()
    }

    stage('Whatever') {
        sh "npx raml-toolkit --profile mercury-profile file1.raml file2.raml etc.raml"
    }
  ```

NOTE: Violations will return a non-zero exit code and fail the build, which warnings will still return a 0 exit code so the build will not fail with warnings

### From your local machine

To check your RAML currently the CLI just takes a list of files

```bash
$ ramlint --profile mercury-profile file.raml
# or
$ ramlint --profile mercury-profile file1.raml file2.raml etc.raml
```

The response will look something like

```
Model: file://data-products-api-v1.raml
Profile: mercury-profile
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

## SDK Ready for Mercury

The default profile validates the following rules from the [Mercury API Definition of Done](https://salesforce.quip.com/lHK7ADgscANI)

* `title` MUST be set and not be empty
* `protocols` MUST be HTTPS
* `version` MUST be set and follow the pattern /v[0-9]+/
* API must have a `mediaType` default of application/json
* `description` MUST be set and not be empty
* `description` MUST not include the word TODO
* All resource paths MUST be lowercase (except path parameters)
* Resource paths MUST not start with symbols
* Methods MUST have a `displayName` set
* Method `displayName` MUST be in camelCase
* Methods MUST have a `description` field set
* Method `description` MUST NOT contain the word TODO
* `queryParameters` MUST be camelCase
* Response codes MUST have a `description`
* Response codes `description` MUST NOT contain the word TODO

## Contributing

You can read all about our contribution model [here!](./.github/CONTRIBUTING.md)

## Known issues and limitations

* Currently works only with local files

## Development Resources

Here is an AMF validation example from Mulesoft.  This includes some custom rules you can use for reference when building rules.

* https://github.com/mulesoft-labs/amf-validation-example
* https://github.com/aml-org/amf/blob/develop/vocabularies/dialects/canonical_webapi.yaml
* https://github.com/aml-org/amf/tree/develop/documentation/validations


<!-- Markdown link & img dfn's -->
[circleci-image]: https://circleci.com/gh/SalesforceCommerceCloud/raml-toolkit.svg?style=svg&circle-token=f0e669168c5d1538fc0b76ad71e13b2e2251ebd4
[circleci-url]: https://circleci.com/gh/SalesforceCommerceCloud/raml-toolkit
[slack-image]: https://img.shields.io/badge/slack-sfcc--raml--linter-e01563.svg?logo=slack
[slack-url]: https://commercecloud.slack.com/messages/CNDPCJQG3
