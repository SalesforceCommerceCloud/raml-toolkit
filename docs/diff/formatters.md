# Formatting the Diff Output

The default output format for the diff tool is JSON. For a human-readable format, you can use `toFormattedString`.

```typescript
import { ApiChanges } from "@commerce-apps/raml-toolkit/lib/diff/changes/apiChanges";
import { ApiDifferencer } from "@commerce-apps/raml-toolkit/lib/diff/apiDifferencer";

const apiDifferencer = new ApiDifferencer("diff/left.raml", "diff/right.raml");

apiDifferencer.findAndCategorizeChanges().then((changes: ApiChanges) => {
    // Default output format is JSON
    console.log(changes);
    // Use human-readable console format
    console.log(changes.toFormattedString("console"));
});
```

The output is formatting using Handlebars templates. To customize the output, copy the template you'd like to customize from `resources/diff/templates`, modify it and apply it as shown here.

```typescript
import { ApiChanges } from "@commerce-apps/raml-toolkit/lib/diff/changes/apiChanges";
import { ApiDifferencer } from "@commerce-apps/raml-toolkit/lib/diff/apiDifferencer";
import { Formatter } from "@commerce-apps/raml-toolkit/lib/diff/formatter";

const apiDifferencer = new ApiDifferencer("diff/left.raml", "diff/right.raml");

apiDifferencer.findAndCategorizeChanges().then((changes: ApiChanges) => {
    const formatter = new Formatter();
    const customReport = formatter.render(
      "ApiChanges.custom.hbs",
      changes.getTemplateData()
    );
    console.log(customReport);
});
```
