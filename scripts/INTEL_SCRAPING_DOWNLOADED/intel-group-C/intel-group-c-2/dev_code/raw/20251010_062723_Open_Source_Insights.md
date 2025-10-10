# Open Source Insights

**Source**: Open Source Insights
**URL**: https://deps.dev
**Scraped**: 2025-10-10T06:26:23.231759
**Category**: dev_code

---

About
Documentation
Blog
Understand your dependencies

Your software and your users rely not only on the code you write, but also on the code your code depends on, the code that code depends on, and so on. An accurate view of the complete dependency graph is critical to understanding the state of your project. And it’s not just code: you need to know about security vulnerabilities, licenses, recent releases, and more.

npm

PACKAGES

3.64M

Go

MODULES

1.88M

Maven

ARTIFACTS

753k

PyPI

PACKAGES

656k

NuGet

PACKAGES

476k

Cargo

CRATES

200k

RubyGems

GEMS

186k

All systems
arrow_drop_down
Search
NEW
Introducing RubyGems (Ruby) support

RubyGems version metadata and dependency requirements are now available through the deps.dev API, BigQuery dataset and website. This includes direct security advisories, licenses and more.

You can read all about it on our blog.

New features in the deps.dev API

The deps.dev API, which provides free access to the data that powers this website, now has experimental batch and purl support, as well as a new version that comes with a stability guarantee and deprecation policy.

Learn more about the new features on our blog, or get started with the API documentation, and code examples.

BigQuery Public Dataset

The data that powers this website is now also available as part of the Google Cloud Public Dataset Program, and can be explored using BigQuery.

For more information, please check out the dataset on the Google Cloud Platform Marketplace, or have a look at the schema documentation.

chevron_right
Seeing the big picture can be difficult—but it shouldn’t be

The Open Source Insights page for each package shows the full dependency graph and updates it every day. The information provided can help you make informed decisions about using, building, and maintaining your software.

With Open Source Insights, you can actually see the dependency graph for a package, then isolate the paths to a particular dependency. Or see whether a vulnerability in a dependency might affect your code. Or compare two versions of a package to see how the dependencies have changed in a new release.

How it works

The service repeatedly examines sites such as github.com, npmjs.com, and pkg.go.dev to find up-to-date information about open source software packages. Using that information it builds for each package the full dependency graph from scratch—not just from package lock files—connecting it to the packages it depends on and to those that depend on it. And then does it all again to keep the information fresh. This transitive dependency graph allows problems in any package to be made visible to the owners and users of any software they affect.

Powered By
