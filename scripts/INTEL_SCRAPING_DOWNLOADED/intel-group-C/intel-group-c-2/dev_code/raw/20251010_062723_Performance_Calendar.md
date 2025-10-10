# Web Performance Calendar » 2024

**Source**: Performance Calendar
**URL**: https://calendar.perfplanet.com
**Scraped**: 2025-10-10T06:27:00.741500
**Category**: dev_code

---

31st
Dec 2024
Breaking Up with Long Tasks or: how I learned to group loops and wield the yield
by Rick Viscomi

Everything, On the Main Thread, All at Once Arrays are in every web developer’s toolbox, and there are a dozen ways to iterate over them. Choose wrong, though, and all of that processing time will happen synchronously in one long, blocking task. The thing is, the most natural ways are the wrong ways. A simple […]

31st
Dec 2024
Fabulous Font-Face Fallbacks
by Stoyan Stefanov

Let’s talk about font fallbacks and how we can craft these to to perfection in order to reduce layout shifts and our users’ headaches. Who among us has not experienced the horrors of clicking the wrong thing because stuff moves? Arghhhh! I’ll start with a brief intro and then focus on lessons learned (the hard […]

31st
Dec 2024
Designing websites for bad performance
by Keerthana Krishnan

There was once a farmer who wanted his chickens to lay more eggs. His friend, a physicist, said – “I can give you a solution for your problem if you have a spherical chicken kept in vacuum” Looking at performance problems in the real world often reminds me of this scenario. Here’s a map from […]

30th
Dec 2024
Using DevTools to Validate Web Performance Improvements
by Joan León

I’m passionate about Web Performance—from identifying performance issues, monitoring (synthetic and RUM), metrics, implementing product culture, training development teams and other stakeholders, speaking at meetups and conferences, tools, and snippets. When it comes to tools, my favorite is Chrome DevTools. They are integrated into the browser (desktop, that is), making it quick and easy to […]

29th
Dec 2024
Getting Real (small) With Compression Dictionaries
by Patrick Meenan

Compression dictionary transport is a relatively new feature in HTTP that allows for using custom compression dictionaries to improve the compression of HTTP responses. The results can be pretty dramatic, with responses anywhere from 60-90+% smaller than using the best non-dictionary compression currently available. The feature has been under experimentation in Chrome over the last […]

28th
Dec 2024
Wait? What? Web Performance Optimization is being studied in universities?
by Tsvetan Stoychev

TL;DR: In this article I am sharing the good news that Web Performance Optimization is being studied in universities and I am laying out the plan of teaching Real User Monitoring which I will do for the first time in front of students. My hope is to share ideas in case other fellows would be […]

27th
Dec 2024
My Favorite Web Performance Graphs of the Year
by Fabian Krumbholz

As a web performance consultant, I frequently rely on visual data to prioritize optimizations and troubleshoot regressions. Over the past year, two types of graphs have stood out for their effectiveness in simplifying complex data and speeding up decision-making. The Prioritization Graph: Where to Start? When optimizing web performance, the first step is identifying the […]

26th
Dec 2024
Don’t Let Your Redesign Ruin Performance: A Case Study
by Martin Michálek

It’s a shame that so many redesigns end up slowing down the site or dropping conversions. How to prevent this? In this text, based on one of our successful projects, you will get a framework for web redesign management. We are a small team of web performance consultants with years of experience and a good […]

25th
Dec 2024
Correlation or Causation: How web performance proves its value
by Emilie Wilhelm

As web performance experts, we’re all familiar with the oft-cited examples: Amazon, Walmart, and their gains or losses directly tied to page loading speeds. But while these examples are inspiring, they prompt an essential question: what about your company? Your users, buying cycles, and challenges are unique. The real question is not whether web performance […]

24th
Dec 2024
The curious (performance) case of CSS @import
by Erwin Hofman

Nearly one in five websites is secretly sabotaging its own performance through a single CSS feature that’s been known to be problematic for over a decade. Based on our analysis of over 16 million mobile websites, there’s a good chance you might recognize this in your own codebase 😉 The culprit? CSS @import. While its […]

23rd
Dec 2024
What is an AnimationFrame and what can it tell you?
by Vinicius Dallacqua

Modern web applications need to be responsive and smooth, providing users with immediate feedback for their interactions. To understand how our applications perform, we need to understand how browsers process and render content. This is why we now have animation frame, the base model that powers INP and LoAF APIs! We will be talking about […]

22nd
Dec 2024
Build Your Own Site Speed Testing Tool with Puppeteer
by Henry Price

Site performance plays a crucial role in delivering a seamless user experience. Slow load times, unexpected layout shifts, and unresponsive interactions can negatively impact both SEO and user satisfaction. However, identifying these issues under real-world conditions requires the right tools. This is where Puppeteer comes in. Puppeteer is a Node.js library that allows developers and […]

21st
Dec 2024
Unattributed Navigation Overhead (UNO)
by Tim Vereecke

I promise you, UNO (Unattributed Navigation Overhead) is the best Christmas present you will get this year! UNO, not the card game, is the missing piece for many of your unsolved performance puzzles! UNO, not the organisation, even restores peace by keeping teams from pointing fingers and calling each other names when inexplicable things happen. […]

20th
Dec 2024
Data-Driven SEO and Web Performance
by Todd Gardner

The readers of this calendar know that web performance is important. A faster site means happier users, better conversion rates, and, according to Google, higher SEO rankings. But how much does performance actually affect your SEO? It’s frustratingly unclear. While Google says Core Web Vitals are a ranking factor, they don’t say how much weight […]

19th
Dec 2024
Detecting web performance regressions using statistical tools
by Peter Hedenskog

Running web performance synthetic testing tools can really be a pain. It’s constant work to make sure to get stable metrics out of your setup so you can find those regressions. You use a bare metal server, you pin the CPU speed, you use a replay proxy to get rid of the noise from the […]

18th
Dec 2024
Speculative loading and the Speculation Rules API
by Quynh-Chi Nguyen

Speculative loading, or navigation speculation, is the concept of predicting (speculating about) which page a user might visit next and doing some or all of the work to load that page before they visit it. This way, if the user does end up navigating to the page, it appears to load much faster. Browsers have […]

17th
Dec 2024
5 tips to effectively optimize INP in React
by Michal Matuška

In this post, let’s consider several optimization techniques for improving Core Web Vitals metrics for sites that are built with React. We are a team of speed consultants from the Czech Republic and in this article we would like to share some experiences from the many front-end performance optimizations we did for our clients. We […]

16th
Dec 2024
When users interact
by Philip Tellis

When looking at the Core Web Vitals, we often try optimizing each independently of the others, but that’s not how users experience the web. A user’s web experience is made up of many metrics, and it’s important to look at these metrics together for each experience. Real User Measurement (RUM) allows us to do that […]

15th
Dec 2024
Creating Shared Ownership for Web Performance from a Cryptic CSS Value
by Tobias Grundmann

Creating ownership for web performance metrics is challenging, especially if you want to ensure your entire organization is pushing along. Alex Russell has an excellent maturity model that captures this enduring journey (see infrequently.org blog). After navigating much of this journey over the past few years at Galaxus (www.galaxus.ch), I’d like to share one simple […]

14th
Dec 2024
Towards Measuring INP on All Browsers and Devices
by Ivailo Hristov

Web performance metrics are essential for understanding and improving the user experience. While First Input Delay (FID) initially provided a positive outlook on interactivity, the shift to Interaction to Next Paint (INP) revealed significant areas needing improvement in responsiveness. However, the PerformanceEventTiming API, which is foundational for calculating metrics like INP, is not natively supported […]

13th
Dec 2024
Top 8 things I want in the Devtools Network Panel
by Robin Marx

Look, I’m just going to come out and say it: I’m a jealous man. I’m not proud of it, but I’m a jealous man. These past months and years, I’ve seen great update after amazing update (not you) being released for the Chrome Devtools Performance panel while my personal favourite panel, the network one, has […]

12th
Dec 2024
Informal Thoughts about the Winding Road of Performance Engineering
by Alex Podelko

There are very interesting trends in performance engineering nowadays, so I’d like to share a few personal observations and thoughts (not representing in any way my current and former employers – and not pretending that it has any real research behind it). I spoke about Current Trends in Performance Engineering before, but here I want […]

11th
Dec 2024
Not every user owns an iPhone
by Alex Hamer

As software engineers and technologists its common to have access to some powerful devices and super fast bandwidths. It’s highly likely that you will be developing/testing on a high end Mac (or similar) or pulling out an expensive mobile device such as an iPhone from your pocket. But we need to be careful that this […]

10th
Dec 2024
Simple Web Performance Mentoring
by Morgan Murrah

This article is noticeably light on numbers for a web performance article but hopefully relevant nonetheless. What mattered to me to write about was software acceptance and getting buy-in for web performance solutions. Essentially: did people accept the tool you proposed to work with? Did they feel a sense of ownership of the results of […]

9th
Dec 2024
Putting Performance in Relatable Terms
by Ethan Gardner

A 300ms improvement may sound like a big win to someone immersed in web performance optimization, but for most people, mentioning milliseconds doesn’t usually resonate or seem meaningful. Whenever I’ve mentioned how we could save a few hundred milliseconds to an executive, my proposal was often met with quizzical looks and a nod to proceed, […]

8th
Dec 2024
Understanding the main thread in the browser
by Amrik Malhans

The browser makes use of a single main thread for executing most important tasks, it’s responsible for running JavaScript, handling user interactions, and updating the DOM. The main thread also performs the layout and painting. These are browser’s high-level tasks that are bound to the main thread, so what is this “main thread” we’re talking […]

7th
Dec 2024
Your website is a restaurant
by Boris Schapira

In most organizations, even before creating a website, teams select the technologies to use, often without having defined the functional scope and desired user experience. I won’t infer here on their motivations, but the fact is that they present this to stakeholders who often do not know what it is about, and validate from a […]

6th
Dec 2024
The Evolution of Instant Web: What It Means for Performance Tooling
by Ana Boneva

For years, traditional optimization techniques like caching and resource compression have been the go-to solutions for speeding up websites. They’ve been effective at reducing load times and easing server strain. Performance tools have made these advanced techniques more accessible to site owners, whether they have technical expertise or not. However, as user expectations for near-instant […]

5th
Dec 2024
SUX sells, but how to sell SUX?
by Karlijn Löwik

2024 was the year my public speaking career really took off – I did a quick count and realized I’ve done 10 speaking events about web performance across 5 countries and 2 continents. You could even argue Great Britain is another continent after Brexit (3 continents then! 😉) Giving my talk “The state of Web […]

4th
Dec 2024
How does the React Compiler perform on real code
by Nadia Makarevich

In the last few years, one of the biggest sources of excitement and anticipation in the React community has been a tool known as React Compiler (previously React Forget). And for a good reason. The central premise of the Compiler is that it will improve the overall performance of our React apps. And as a […]

3rd
Dec 2024
What a Web Performance Engineer Needs to Know About Cloud Cost Savings
by Andrew Lee

Every line of code has a cost – but some lines cost more than others. This rather Orwellian-sounding statement might seem stark, but for web performance engineers, it’s a useful perspective when considering cloud costs. Why Should You Care About Costs? Cost reduction directly impacts the bottom line. Money saved can be reinvested into meaningful […]

2nd
Dec 2024
How does Web Performance sound?
by Brian Louis Ramirez

If you’re reading this, you probably have spent time looking over performance traces, flame charts, network logs and waterfall charts. The key word here is looking. Paint timings like FCP and LCP, Interaction to Next Paint, Long Animation Frames – many of the metrics and APIs we use measure the visual experience of using the […]

1st
Dec 2024
Goodhart’s law in action: 3 WebPerf examples
by Noam Rosenthal

Real world examples of how over-optimizing for metrics can be at odds with performance. “When a measure becomes a target, it ceases to be a good measure” An adage attributed to Charles Goodhart, a British economist. Overview In web performance, Goodhart’s law surfaces when optimizing for metrics and optimizing for UX might lead to opposite […]
