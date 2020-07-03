# CHANGELOG

## 0.4.1

* Changed TypeScript annotations for `parseRamlFile` and `resolveApiModel` to more accurate `amf.model.document.Document`.
* Added [`amf-client-js`](https://npmjs.com/package/amf-client-js) as an export (as `amf`)
* OK!

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
