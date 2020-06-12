
# Contributing to RAML-TOOLKIT <!-- omit in toc -->

**First, thank you!!!**  We want to thank anyone reading this for contributing or even considering contributing back to this project.  We want to make sure that teams feel empowered to add their own rules and profiles to expand upon this tool.

- [Profiles](#profiles)
  - [What is a profile?](#what-is-a-profile)
  - [Creating a New Profile](#creating-a-new-profile)
    - [Naming](#naming)
    - [Testing](#testing)
    - [Don't Reinvent the Wheel](#dont-reinvent-the-wheel)
    - [Profile Metadata](#profile-metadata)
- [Adding Core Functionality](#adding-core-functionality)
- [Review Process](#review-process)
  - [Repository Branching and Pull Requests](#repository-branching-and-pull-requests)
  - [Profile Reviews](#profile-reviews)
- [Release Process and Cadence](#release-process-and-cadence)
- [FAQ](#faq)

## Profiles

A profile is a custom set of validation rules.  Taken from the AML documentation [here](https://a.ml/docbook/documentation/validation_model.html):

> * Validations can be customised
> AMF introduces the notion of a validation profile. Profiles group validations into sets of related constraints following certain semantics or standard requirements. RAML 1.0,RAML 0.8, OAS 2.0 are valid profiles that will ensure compatibility between the parsed model and these specifications. Furthermore, clients can create a custom validation profile, selecting the validations that are important for their use case, setting the right severity level for each validation or modifying one of the standard profiles, turning on and off individual validations in that profile.

> * Validations can be extended
> AMF validation profiles can be extended with custom validations defined by clients. A declarative approach using AMF validation profile dialect can be used to define new validations or a programmatic mechanism based on JavaScript functions can be followed. Advanced users can always define standard SHACL constraints to have complete control over the validation mechanism.

### What is a profile?

First you might be asking yourself what a profile is.  Basically a profile is a custom set of webapi validation rules that can be applied to RAML or Swagger to assert that a document conforms your rule set.  These profiles can be used in conjunction if you want to ensure your API meets multiple standards simultaneous.  Though be careful that these standards don't have mutually exclusive rules.

### Creating a New Profile

When creating a new profile, here are a few items that you need to follow or at least consider:

  - Naming 
  - Testing 
  - Don't reinvent the wheel
  - Add metadata to your profile in the form of comments

#### Naming

Profiles should be named with clarity to be descriptive of the purpose of that profile. The following files should be share the name of the profile:

| File                           |  Description          |
|--------------------------------|-----------------------|
| test/{profile-name}.js         | Where the tests for your profile live |
| test/{profile-name}.raml       | Where a valid RAML API Spec for your profile lives |
| resources/lint/profiles/{profile-name}.raml   | Where your raml validation profile itself lives. |

#### Testing 

We have provided a test bed for ensuring your custom validations work as expected.  We have profiled a [utils](../test/utils.js) file that provides some utility methods to easily test your profile.  Your test file should have the same name as your profile to clearly relate tests to profiles.

##### Testing Examples<!-- omit in toc -->

Refer to the mercury [tests](../test/mercury/mercury.js) if you want to get a more complete idea of how tests are written.  Here are some helpful examples:

```javascript

# Always include a RAML that is valid for your profile.  
# This ensures that the raml you are testing is valid
it("returns the RAML is valid when passed valid RAML", async () => {
    # Load the valid raml for your profile 
    let doc = utils.getHappySpec(`${PROFILE}.raml`);
    
    # Run the parser with your profile
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);

    # Assert that it conforms
    utils.conforms(result);
});

# Specific negative tests
it("does not conform when missing the version", async () => {
    # Load the valid raml for your profile 
    let doc = utils.getHappySpec(`${PROFILE}.raml`);

    # Make some breaking change to the document
    delete doc.version;

    # Run the parser with your profile
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);

    # Assert that only the rule you expected to be broken is broken
    utils.breaksOnlyOneRule(
      result,
      "http://a.ml/vocabularies/data#version-format"
    );
});
```

#### Don't Reinvent the Wheel

This entire project is just a thin wrapper to [AMF](https://github.com/aml-org/amf) with a test bed. Profiles are relatively easy to read through and we encourage everyone to use an existing profile when possible.

Only your team/cloud/organization can truly know if you need a new profile of if and existing one will suffice. Definition discuss it among your key stakeholders if you really need a new profile or if you can use an existing one.  If you want guidance on this we are happy to discuss it with you.  

#### Profile Metadata

At the beginning of your profile you should have some metadata detailing whose profile it is and who to contact with questions about the profile.  It is critical to provide a path for communication, as adding rules to a profile will likely cause existing, valid RAML, to break.  Here is an example of that metadata

```yaml
#%Validation Profile 1.0
# org: {Your git.soma organization}
# contact: {the email your team can be contacted at}
# slack: {slack channel your team can be contacted at (optional)}
```

## Adding Core Functionality

When core functionality is changed or added (i.e. changes to any non-test javascript files) all existing tests must pass and new tests must be added to maintain the minimum 80% tests coverage we have configured.  PRs against core functionality must include review and approval by someone from the CC Steel Arc team in order to be merged

## Review Process

### Repository Branching and Pull Requests

All of salesforce has read access to this repo, but not write.  We ask that when working on a new profile or feature to fork the repo to either your private repo space or your organization's repo space.  From there you can create a Pull Request back to this repo to get it accepted and published to our internal npm server when a new version is released.

### Profile Reviews

While we appreciate being informed about added profiles we are not going to require it.  At this time only CC SteelArc may merge profiles to this repo officially, but don't let that stand in the way of creating and contributing your own!  If your team has written a profile and want it added we will merge it upon request, so long as you have at least two people from your team approve the pull request and all of the tests pass.

If you are updating an existing profile the team owner of that profile needs to approve those changes before it is merged.  Once that approval is given (via pull request approvals from that team) we will gladly merge that pull request.

## Release Process and Cadence

Now that your code is merged how will it get into to the wild? We are currently working on this process, to be updated soon.

## FAQ

**Why are the profiles in code instead of being loaded from a config outside the code?**

This was done for two main reasons.
 - Provide a singular space to be able to review and understand the different profiles in the wild.
 - Provide a testbed for rules.  We are providing some tools around testing and encourage people to use it.  AML/AMF are powerful tools to be sure, but with that power comes responsibility and want to ensure that code rules are sufficiently tested.

