
# Contributing to SFCC-RAML-LINTER  <!-- omit in toc -->

**First, thank you!!!**  We want to thank anyone reading this for contributing or even considering contributing back to this project.  We want to make sure that teams feel empowered to add their own rules and profiles to expand upon this tool.

- [Adding Profiles](#adding-profiles)
  - [Creating a New Profile](#creating-a-new-profile)
    - [Profile Naming](#profile-naming)
    - [Testing](#testing)
    - [Don't Reinvent the Wheel](#dont-reinvent-the-wheel)
    - [Profile Metadata](#profile-metadata)
- [Adding Core Functionality](#adding-core-functionality)
- [Review Process](#review-process)
  - [Repository Branching and Pull Requests](#repository-branching-and-pull-requests)
  - [Profile Reviews](#profile-reviews)
- [Release Process and Cadence](#release-process-and-cadence)
- [Questions](#questions)


## Adding Profiles

Most of the time, you are probably looking to update or change a profile instead of code itself.  These profiles are the actual rule sets applied to the RAML specs when running this tool.  Profiles are between you and your team.  

### Creating a New Profile

If you want to create a new profile there are a few items that you need to follow or at least consider when contributing a new profile:

  - Profile naming 
  - Testing 
  - Don't reinvent the wheel
  - Add metadata to your profile in the form of comments

#### Profile Naming

Profiles should be named with clarity to be descriptive of the purpose of that profile. The following files should be names for your profile:

- test/{profile-name}.js        -> Where the tests for your profile live
- test/{profile-name}.raml      -> Where a valid RAML definition for your profile lives
- profiles/{profile-name}.raml  -> Where your raml validation profile itself lives.

#### Testing 

We have provided a test bed for ensuring your custom validations work as expected.  We have profiled a [utils](../test/utils.js) file that provides some utility methods to easily test your profile.  Your test file should have the same name as your profile to clearly relate tests to profiles.

##### Testing Examples<!-- omit in toc -->

Please of course refer to the sdk-ready [tests](../test/sdk-ready.js) if you want to get a more complete idea of how tests are written.  But here are some examples broken down for a better understanding

```javascript

# Always include a set of happy path of the overall raml.  
# This ensures that the raml you are testing is valid
it("valid", async () => {
     # Load in the happy spec
    let doc = utils.getHappySpec(`${PROFILE}.raml`);
    
    # Run the parser with your profile
    let result = await validator.parse(utils.renderSpecAsUrl(doc), PROFILE);

    # Assert that it conforms
    utils.conforms(result);
});

# Specific negative tests
it("does not conform when missing the version", async () => {
    # Always load in the happy spec for your tests  
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

Look at the profiles that exist, discuss if you really need a new profile or if you can use an existing one.  This entire project is just a thin wrapper to AMF with a test bed.  Utilize that and let's keep API fragmentation down.  Profiles are relatively easy to read through and we encourage everyone to use an existing profile when possible.

#### Profile Metadata

At the beginning of your profile you should have some metadata detailing whose profile it is and who to contact with questions about the profile.  Adding rules to a profile can cause existing valid RAML to break so communication is critical.  Here is an example of that metadata

```yaml
#%Validation Profile 1.0
# org: {Your git.soma organization}
# contact: {the email your team can be contacted at}
# slack: {slack channel your team can be contacted at (optional)}
```

## Adding Core Functionality

When Core F is changes or added (changes to any non-test javascript files) All existing tests must pass and new tests must be added to maintain the minimum 80% tests coverage we have configured.  PRs against Core F must include someone from the CC Steel Arc team.

## Review Process

### Repository Branching and Pull Requests

All of salesforce has read access to this repo, but not write.  We ask that when working on a new profile or feature to fork the repo to either your private repo space or your organization's repo space.  From there you can create a Pull Request back to this repo to get it accepted and published to our internal npm server when a new version is released.

### Profile Reviews

While we appreciate being informed about added profiles we are not going to require it.  Currently CC SteelArc is the only team with the ability to merge profiles, but we won't stand in your way.  If you team has written a profile and want it added we will merge it on request as long as you have at least two people from your team that approve it and all of its tests pass.

If you are updating an existing profile the team owner of that profile needs to approve these changes before it is merged.  Once that approval is given (via pull request approvals from that team) we will gladly merge that pull request

## Release Process and Cadence

Now that your code is merged how will it get into to the wild? We are currently working on this process, to be updated soon.

## Questions

**Why are the profiles in code instead of being loaded from a config outside the code?**

This was done for two main reasons.
 - Provide a singular space to be able to review and understand the different profiles in the wild.
 - Provide a testbed for rules.  We are providing some tools around testing and encourage people to use it.  AML/AMF are powerful tools to be sure, but with that power comes responsibility and want to ensure that code rules are sufficiently tested.

