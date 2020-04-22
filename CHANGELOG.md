# CHANGELOG

### 0.3.1
* Dependency issue fixed

## 0.3.0

* All the raml-toolkit code is now written in Typescript.
* Fixes the issue where transitive dependencies of the target RAML could not be parsed.
* Adds logging capability and allows the logging level to be configured.

#### Usage
```
import { ramlToolLogger } from "@commerce-apps/raml-toolkit";

ramlToolLogger.setLevel(ramlToolLogger.levels.INFO);
```