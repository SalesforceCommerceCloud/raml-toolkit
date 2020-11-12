# Invoking the diff library directly

## Find Changes

Find changes between two RAML specifications

```typescript
import { ApiDifferencer } from "@commerce-apps/raml-toolkit/lib/diff/apiDifferencer";
import { ApiChanges } from "@commerce-apps/raml-toolkit/lib/diff/changes/apiChanges";

const apiDifferencer = new ApiDifferencer(
        path.join(__dirname, "../diffRamls/base/shopper-products/shopper-products.raml"),
        path.join(__dirname, "../diffRamls/new/shopper-products/shopper-products.raml")
    );
//find changes between the given API specifications
const apiChanges = await apiDifferencer.findChanges();
```

## Categorize Changes with Default Rules

Find changes and apply the default rules defined in the raml-toolkit. Refer [Rules to categorize differences](rules.md#Rules-to-categorize-differences) section for all the default rules

```typescript
import { ApiDifferencer } from "@commerce-apps/raml-toolkit/lib/diff/apiDifferencer";
import { ApiChanges } from "@commerce-apps/raml-toolkit/lib/diff/changes/apiChanges";

const apiDifferencer = new ApiDifferencer(
        path.join(__dirname, "../diffRamls/base/shopper-products/shopper-products.raml"),
        path.join(__dirname, "../diffRamls/new/shopper-products/shopper-products.raml")
    );
//find changes between the given API specifications and apply the default rules
const apiChanges = await apiDifferencer.findAndCategorizeChanges();
```

## Categorize Changes with Custom Rules

You can define your own rule set to apply on the changes. Look at [Defining your own rules](rules.md#Defining-your-own-rules) for details on defining custom rules

```typescript
import { ApiDifferencer } from "@commerce-apps/raml-toolkit/lib/diff/apiDifferencer";
import { ApiChanges } from "@commerce-apps/raml-toolkit/lib/diff/changes/apiChanges";

const apiDifferencer = new ApiDifferencer(
        path.join(__dirname, "../diffRamls/base/shopper-products/shopper-products.raml"),
        path.join(__dirname, "../diffRamls/new/shopper-products/shopper-products.raml")
    );
const rulesPath =  path.join(__dirname, "../diffRules/customRules.json");
//find changes between the given API specifications and apply
const apiChanges = await apiDifferencer.findAndCategorizeChanges(rulesPath);
```

## Find Changes Between Two API Directories

To find changes between API specs in two directories and apply the default ruleset, use `diffRamlDirectories`. This compares the files in the directories by using the entrypoints in the `exchange.json` files it finds.

```typescript
import { diffRamlDirectories } from "@commerce-apps/raml-toolkit/lib/diff";

const apiCollectionChanges = await diffRamlDirectories("new", "improved");
```
