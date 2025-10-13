# Krebs on Security – In-depth security news and investigation

**Source**: Krebs on Security
**URL**: https://krebsonsecurity.com
**Scraped**: 2025-10-10T06:27:07.010765
**Category**: dev_code

---

ShinyHunters Wage Broad Corporate Extortion Spree
October 7, 2025
32 Comments

A cybercriminal group that used voice phishing attacks to siphon more than a billion records from Salesforce customers earlier this year has launched a website that threatens to publish data stolen from dozens of Fortune 500 firms if they refuse to pay a ransom. The group also claimed responsibility for a recent breach involving Discord user data, and for stealing terabytes of sensitive files from thousands of customers of the enterprise software maker Red Hat.

The new extortion website tied to ShinyHunters (UNC6040), which threatens to publish stolen data unless Salesforce or individual victim companies agree to pay a ransom.

In May 2025, a prolific and amorphous English-speaking cybercrime group known as ShinyHunters launched a social engineering campaign that used voice phishing to trick targets into connecting a malicious app to their organization’s Salesforce portal.

The first real details about the incident came in early June, when the Google Threat Intelligence Group (GTIG) warned that ShinyHunters — tracked by Google as UNC6040 — was extorting victims over their stolen Salesforce data, and that the group was poised to launch a data leak site to publicly shame victim companies into paying a ransom to keep their records private. A month later, Google acknowledged that one of its own corporate Salesforce instances was impacted in the voice phishing campaign.

Last week, a new victim shaming blog dubbed “Scattered LAPSUS$ Hunters” began publishing the names of companies that had customer Salesforce data stolen as a result of the May voice phishing campaign.

“Contact us to negotiate this ransom or all your customers data will be leaked,” the website stated in a message to Salesforce. “If we come to a resolution all individual extortions against your customers will be withdrawn from. Nobody else will have to pay us, if you pay, Salesforce, Inc.”

Below that message were more than three dozen entries for companies that allegedly had Salesforce data stolen, including Toyota, FedEx, Disney/Hulu, and UPS. The entries for each company specified the volume of stolen data available, as well as the date that the information was retrieved (the stated breach dates range between May and September 2025).

Image: Mandiant.

On October 5, the Scattered LAPSUS$ Hunters victim shaming and extortion blog announced that the group was responsible for a breach in September involving a GitLab server used by Red Hat that contained more than 28,000 Git code repositories, including more than 5,000 Customer Engagement Reports (CERs).

“Alot of folders have their client’s secrets such as artifactory access tokens, git tokens, azure, docker (redhat docker, azure containers, dockerhub), their client’s infrastructure details in the CERs like the audits that were done for them, and a whole LOT more, etc.,” the hackers claimed.

Their claims came several days after a previously unknown hacker group calling itself the Crimson Collective took credit for the Red Hat intrusion on Telegram.

Red Hat disclosed on October 2 that attackers had compromised a company GitLab server, and said it was in the process of notifying affected customers.

“The compromised GitLab instance housed consulting engagement data, which may include, for example, Red Hat’s project specifications, example code snippets, internal communications about consulting services, and limited forms of business contact information,” Red Hat wrote.

Separately, Discord has started emailing users affected by another breach claimed by ShinyHunters. Discord said an incident on September 20 at a “third-party customer service provider” impacted a “limited number of users” who communicated with Discord customer support or Trust & Safety teams. The information included Discord usernames, emails, IP address, the last four digits of any stored payment cards, and government ID images submitted during age verification appeals.

The Scattered Lapsus$ Hunters claim they will publish data stolen from Salesforce and its customers if ransom demands aren’t paid by October 10. The group also claims it will soon begin extorting hundreds more organizations that lost data in August after a cybercrime group stole vast amounts of authentication tokens from Salesloft, whose AI chatbot is used by many corporate websites to convert customer interaction into Salesforce leads.

In a communication sent to customers today, Salesforce emphasized that the theft of any third-party Salesloft data allegedly stolen by ShinyHunters did not originate from a vulnerability within the core Salesforce platform. The company also stressed that it has no plans to meet any extortion demands.

“Salesforce will not engage, negotiate with, or pay any extortion demand,” the message to customers read. “Our focus is, and remains, on defending our environment, conducting thorough forensic analysis, supporting our customers, and working with law enforcement and regulatory authorities.”

The GTIG tracked the group behind the Salesloft data thefts as UNC6395, and says the group has been observed harvesting the data for authentication tokens tied to a range of cloud services like Snowflake and Amazon’s AWS.

Google catalogs Scattered Lapsus$ Hunters by so many UNC names (throw in UNC6240 for good measure) because it is thought to be an amalgamation of three hacking groups — Scattered Spider, Lapsus$ and ShinyHunters. The members of these groups hail from many of the same chat channels on the Com, a mostly English-language cybercriminal community that operates across an ocean of Telegram and Discord servers.

The Scattered Lapsus$ Hunters darknet blog is currently offline. The outage appears to have coincided with the disappearance of the group’s new clearnet blog — breachforums[.]hn — which vanished after shifting its Domain Name Service (DNS) servers from DDoS-Guard to Cloudflare.

But before it died, the websites disclosed that hackers were exploiting a critical zero-day vulnerability in Oracle’s E-Business Suite software. Oracle has since confirmed that a security flaw tracked as CVE-2025-61882 allows attackers to perform unauthenticated remote code execution, and is urging customers to apply an emergency update to address the weakness.

Mandiant’s Charles Carmakal shared on LinkedIn that CVE-2025-61882 was initially exploited in August 2025 by the Clop ransomware gang to steal data from Oracle E-Business Suite servers. Bleeping Computer writes that news of the Oracle zero-day first surfaced on the Scattered Lapsus$ Hunters blog, which published a pair of scripts that were used to exploit vulnerable Oracle E-Business Suite instances. Continue reading →
