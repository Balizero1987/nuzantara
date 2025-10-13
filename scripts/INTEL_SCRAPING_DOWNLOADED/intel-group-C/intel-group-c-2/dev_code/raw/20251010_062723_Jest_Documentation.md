# Blog · Jest

**Source**: Jest Documentation
**URL**: https://jestjs.io/blog
**Scraped**: 2025-10-10T06:27:13.754990
**Category**: dev_code

---

Jest 30: Faster, Leaner, Better
June 4, 2025 · 10 min read
Svyatoslav Zaytsev
Christoph Nakazawa

Today we are happy to announce the release of Jest 30. This release features a substantial number of changes, fixes, and improvements. While it is one of the largest major releases of Jest ever, we admit that three years for a major release is too long. In the future, we are aiming to make more frequent major releases to keep Jest great for the next decade.

If you want to skip all the news and just get going, run npm install jest@^30.0.0 and follow the migration guide: Upgrading from Jest 29 to 30.

What’s New?
​

Jest 30 is noticeably faster, uses less memory, and comes with tons of new features. First, let’s take a look at the breaking changes:

Breaking Changes
​
Jest 30 drops support for Node 14, 16, 19, and 21.
jest-environment-jsdom was upgraded from jsdom 21 to 26.
The minimum compatible TypeScript version is now 5.4.
Various expect aliases were removed. eslint-plugin-jest has an autofixer which you can run to automatically upgrade your codebase.
Non-enumerable object properties are now excluded from object matchers such as toEqual by default.
Jest now supports .mts and .cts files by default.
--testPathPattern was renamed to --testPathPatterns.
Jest now properly handles promises that are first rejected and then later caught to avoid false positive test failures.
We made various improvements to Jest’s printing of snapshots which might require you to update snapshots. Google deprecated goo.gl links which we were using in snapshots. We don’t like it either, but you’ll have to update all your snapshots.
Jest itself is now bundled into a single file per package. This improves performance, but might break if you built tools that reach into Jest's internals.

These are just some of the highlights. The full list of breaking changes can be found in the CHANGELOG and the Jest 30 migration guide.

Performance & Memory Improvements
​

Jest 30 delivers real-world performance gains thanks to many optimizations, especially related to module resolution, memory usage, and test isolation. By relying on the new unrs-resolver, module resolution in Jest became more feature-rich, standards-compliant, and faster. Thanks to @JounQin for the migration. Depending on your project, you may see significantly faster test runs and reduced memory consumption. For example, one large TypeScript app with a client and server observed 37% faster test runs and 77% lower memory usage in one part of their codebase:

	Jest 29	Jest 30
Server tests	~1350s / 7.8 GB max	~850s / 1.8 GB max
Client tests	~49s / 1.0 GB max	~44s / 0.8 GB max

Jest is fast, but due to Jest's test isolation, slow user code often exacerbates performance issues and leads to slow test runs. When tests leave behind open handles like unclosed timers or connections to other services, it can cause Jest to hang or slow down. Jest 30 has gotten better at detecting and reporting these issues, which helps you identify and fix slow or problematic tests more easily. For example, tests at Happo were sped up by 50% from 14 minutes down to 9 minutes by cleaning up open handles and upgrading to Jest 30.

If you are using files that consolidate the exports of multiple modules into a single file (i.e. "barrel files"), we recommend using tools such as babel-jest-boost, babel-plugin-transform-barrels or no-barrel-file to avoid loading large swaths of application code for each test file. This can lead to performance improvements of up to 100x.

Globals cleanup between test files
​

Jest achieves test isolation between files by running each test in a separate VM context, giving each file a fresh global environment. However, if your code does not clean up globals after each test file, it can lead to memory leaks across Jest and slow down your test runs. Jest 30 introduces a new feature that notifies you about globals that are not correctly cleaned up after a test run.

In the future, Jest will automatically clean up globals after each test run. If you don't get any warnings about uncleaned globals with Jest 30, you can already set the globals cleanup mode to "on" now to enable this feature fully, and benefit from major memory savings and performance improvements:

export default {
  testEnvironmentOptions: {
    globalsCleanup: 'on',
  },
};


The default in Jest is globalsCleanup: 'soft'. To disable this feature you can set it to off. If you need to protect specific global objects from being cleaned up -- for example, shared utilities or caches -- you can mark them as protected using jest-util:

import {protectProperties} from 'jest-util';

protectProperties(globalThis['my-property']);


Thanks to @eyalroth for implementing this feature!

New Features
​
Improved ECMAScript Module & TypeScript Support
​

Support for import.meta.* and file:// was added when using native ESM with Jest. In addition, you can now write your Jest config files in TypeScript, and .mts and .cts files are natively supported without requiring extra configuration. If you are using Node’s native TypeScript type stripping feature, we no longer load the TypeScript transformer to strip types, leading to faster test runs.

Spies and the using keyword
​

You can now use JavaScript’s new explicit resource management syntax (using) with Jest spies. If your environment supports it, writing using jest.spyOn(obj, 'method') will automatically restore the spy when the block ends, so you don’t have to manually clean up.

test('logs a warning', () => {
  using spy = jest.spyOn(console, 'warn');
  doSomeThingWarnWorthy();
  expect(spy).toHaveBeenCalled();
});


Documentation

expect.arrayOf
​

Jest 30 introduces a new asymmetric matcher, expect.arrayOf, which lets you validate every element of an array against a condition or type. For instance, you can expect an array of numbers ensuring all items are numbers:

expect(someArray).toEqual(expect.arrayOf(expect.any(Number)));


Documentation

New test.each placeholder: %$
​

If you use data-driven tests with test.each, you can now include a special placeholder %$ in your test titles to inject the number of the test case. For example:

test.each(cases)('Case %$ works as expected', () => {});


will replace %$ with the test’s sequence number.

Documentation

jest.advanceTimersToNextFrame()
​

@sinonjs/fake-timers was upgraded to v13, adding jest.advanceTimersToNextFrame(). This new function allows you to advance all pending requestAnimationFrame callbacks to the next frame boundary, making it easier to test animations or code that relies on requestAnimationFrame without having to guess millisecond durations.

Documentation

Configurable test retries
​

Jest 30 enhances jest.retryTimes() with new options that give you control over how retries are handled. You can specify a delay or immediately retry a failed test instead of waiting until the entire test suite finishes:

// Retry failed tests up to 3 times, waiting 1 second between attempts:
jest.retryTimes(3, {waitBeforeRetry: 1000});

// Immediately retry without waiting for other tests to finish:
jest.retryTimes(3, {retryImmediately: true});


Documentation

jest.unstable_unmockModule()
​

Jest 30 adds new experimental jest.unstable_unmockModule() API for finer control when unmocking modules (especially when using native ESM).

Documentation

jest.onGenerateMock(callback)
​

A new onGenerateMock method was added. It registers a callback function that is invoked whenever Jest generates a mock for a module. This callback allows you to modify a mock before it is returned to your test environment:

jest.onGenerateMock((modulePath, moduleMock) => {
  if (modulePath.includes('Database')) {
    moduleMock.connect = jest.fn().mockImplementation(() => {
      console.log('Connected to mock DB');
    });
  }
  return moduleMock;
});


Documentation

Other Improvements
​
Custom object serialization
​

Jest’s matcher utilities now support defining a static SERIALIZABLE_PROPERTIES on custom objects. This allows you to control which properties of a custom object are included in snapshots and error messages, making the output more focused and relevant.

Documentation

Asynchronous setup support
​

Test files listed in setupFilesAfterEnv can now export an async function or use top-level await similar to setupFiles.

And so much more…
​

Check out the full CHANGELOG for all changes, improvements and new features.

Known Issues
​

jsdom has made changes to become more spec compliant. This might break some use cases, most notably mocking window.location in tests. Jest now ships with @jest/environment-jsdom-abstract to make it easier for you to compose your own custom test environment based on jsdom. If you are just looking to patch jsdom, you can apply this jsdom patch to your project. In the future, we may look into providing an alternative to jsdom that is better suited for testing.

What's Next
​

Jest has been the most popular JavaScript testing framework for a decade. It is used by millions of developers, supporting a wide range of projects from small libraries to the largest codebases in the world. Jest has constantly been improved over time, and as with all long-lasting software projects used in the real world, we accumulated technical debt. We support some features that only few people or companies use, and we have kept breaking changes to a minimum to avoid disrupting users. Some features should be made possible by Jest, but not as part of the core framework. Other features promote testing the wrong things, and should maybe not be part of Jest at all. In terms of Jest's team, a few of us moved on over time which led to slower progress and fewer releases. Here is how we are going to address these issues going forward:

Performance / Technical Debt: Slim Jest down into a leaner, more performant core. Remove features that are not used by the majority of users, and focus on what makes Jest great.
Consistent Release Cycles: We will aim to be more consistent with our release cycles and deprecation policies.
Be Open: Build everything in the open, and be transparent about our plans. Provide more opportunities to get involved and increase the number of contributors.
Be Bold: As the Jest team, we should be more bold. There are a bunch of things that holds Jest back from what it could be. It's time to make moves.

The great news is that Jest has always been well set up to deliver on these principles, ever since we built the framework as a modular system with clear separation of concerns. Now it's time to execute. More on all that soon!

Thanks
​

This release wouldn’t have been possible without the hard work of our community. Thank you.

@SimenB, @mrazauskas, @Connormiha, @liuxingbaoyu, @k-rajat19, @G-Rath, @charpeni, @dubzzz, @stekycz, @yinm, @lencioni, @phawxby, @lukeapage, @robhogan, @fisker, @k-rajat19, @connectdotz, @alesmenzel, @rickhanlonii, @mbelsky, @brunocabral88, @brandon-leapyear, @nicolo-ribaudo, @dj-stormtrooper, @eryue0220

A special thanks to everyone who made their first contribution to Jest in this release. Thank you for making Jest better for everyone!

@eyalroth, @KhaledElmorsy, @mohammednumaan, @bensternthal, @BondarenkoAlex, @phryneas, @jayvdb, @brandonchinn178, @latin-1, @rmartine-ias, @fa93hws, @Dunqing, @gustav0d, @noritaka1166, @andreibereczki, @Dreamsorcerer, @satanTime, @icholy, @ecraig12345, @cgm-16, @sebastiancarlos, @dancer1325, @loganrosen, @zakingslayerv22, @dev-intj, @tez3998, @anbnyc, @pengqiseven, @thypon, @co63oc, @danielrentz, @jonasongg, @andrew-the-drawer, @phryneas, @hyperupcall, @tonyd33, @madcapnmckay, @dongwa, @gagan-bhullar-tech, @ikonst, @ZuBB, @jzaefferer, @brandonnorsworthy, @henny1105, @DmitryMakhnev, @askoufis, @RahulARanger, @Jon-Biz, @fynsta, @KonnorRogers, @BondarenkoAlex, @mouadhbb, @kemuridama, @Avi-E-Koenig, @davidroeca, @akwodkiewicz, @mukul-turing, @dnicolson, @colinacassidy, @ofekm97, @haze, @Vadimchesh, @peterdenham, @ShuZhong, @manoraj, @nicolo-ribaudo, @georgekaran, @MathieuFedrigo, @hkdobrev, @Germandrummer92, @CheadleCheadle, @notaphplover, @danbeam, @arescrimson, @yepitschunked, @JimminiKin, @DerTimonius, @vkml, @ginabethrussell, @jeremiah-snee-openx, @WillianAgostini, @casey-lentz, @faizanu94, @someone635, @rafaelrabelos, @RayBrokeSomething, @DaniAcu, @mattkubej, @tr1ckydev, @shresthasurav, @the-ress, @Mutesa-Cedric, @nolddor, @alexreardon, @Peeja, @verycosy, @mknight-atl, @maro1993, @Eric-Tyrrell22
