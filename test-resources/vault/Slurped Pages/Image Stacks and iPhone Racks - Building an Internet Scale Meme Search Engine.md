---
link: https://findthatmeme.com/blog/2023/01/08/image-stacks-and-iphone-racks-building-an-internet-scale-meme-search-engine-Qzrz7V6T.html?utm_source=pocket_saves
author: Matthew Bryant (Creator)
date: 2023-01-08
time: 2023-01-08T06:00:00
timestamp: 1673136000
site: FindThatMeme.com Blog
slurped: true
---
Anyone who’s spent any amount of time on the Internet has a good idea of how prevalent meme usage has become in online discourse. Finding new memes on the latest happening and sharing them with various friend groups to share in the humor is a long-enjoyed pastime of mine. Working in tech and in the InfoSec field has netted me an unsurprisingly “terminally-online” groups of friends who all do the same.

However, there’s an ironic duality to most memes: the more niche they are, the more funny they tend to be. Some of the best memes are just stupid in-jokes between my friend groups, or from the incredibly niche InfoSec industry.

This presented an extremely common problem: I could never find the niche memes I wanted to send folks when I needed them most. Mid-conversation, spir-of-the-moment memes were always impossible to find. Scrolling through hundreds of saved images in my phone is not efficient searching as it turns out, so I decided to try to better solve the problem.

## An OCR Realization

Previous attempts at writing a meme search engine ultimately led to one core blocking issue: lack of scalable OCR. All of the existing solutions were either extremely poor at recognizing the warped and highly-varied text of most memes, or were prohibitively expensive.

For example, [Tesseract OCR](https://github.com/tesseract-ocr/tesseract) is a free open-source library to extract text from images. When testing with this library it was OK at recognizing memes with very standard fonts and color schemes:

![alt text](https://docpusher.s3.amazonaws.com/images/bea57aea1c463e7eb6a561d770b9d4ce/image6.png)

_Example easy-to-OCR meme, Tesseract result: `i'm supposed to feel refreshed after waking up from a nap but instead i end up feeling like this`_

However, remixing, watermarking, and resharing of memes makes their format anything but standard. Take the following meme, for example:

![alt text](https://docpusher.s3.amazonaws.com/images/bea57aea1c463e7eb6a561d770b9d4ce/image2.png)

Tesseract states that the OCR-ed text for this meme is: `30 BLUE man41;? S4-5?'ﬂew/ — V \[IL ' . ",2; g" .'Sj /B"f;T"EArmDand \[red\] mvslmunlm: sawmills`. This is quite far from the actual text as any human could tell. It seemed that my options were either expensive cloud OCR services, or poor-performing solutions like this.

However, one night I had a big realization when I was attempting to send someone an example old-school CAPTCHA image on my iPhone:

![alt text](https://docpusher.s3.amazonaws.com/images/bea57aea1c463e7eb6a561d770b9d4ce/image9.png)

_Accidentally selecting the obfuscated text in a previous-generation reCAPTCHA image._

To my surprise, iOS was more than happy to highlight the intentionally-scrambled and warped text of the CAPTCHA image. Even more surprising, it decoded the text perfectly:

![alt text](https://docpusher.s3.amazonaws.com/images/bea57aea1c463e7eb6a561d770b9d4ce/image1.png)

_Pasting the copied reCAPTCHA text._

If it did this well with intentionally obfuscated text images, how would it fare with the various formats that most memes come in? After testing the OCR on a bunch of saved memes in my phone it seemed the answer was “extremely well”.

Better yet, after some quick Googling I found that this functionality is exposed in the iOS [Vision framework](https://developer.apple.com/documentation/vision). Meaning this OCR could be fully automated in the form of a custom iOS app. Finally it seemed there was a scalable OCR solution to the problem I had been facing!

## Cheap Scalable OCR for Millions of Memes

Though I’ve written a lot of code, I had never written anything serious in Swift or Objective C. I wasn’t able to find any Vision Framework plugins for [Apache Cordova](https://cordova.apache.org/), so I couldn’t just write the app in JavaScript either. It looked like it was time to bite the bullet and write an OCR iOS server in Swift.

By combining the power of intense Googling, reverse engineering various Swift repos on Github, and the occasional Xcode question to my iOS friend, I was able to cobble together a working solution:

![alt text](https://docpusher.s3.amazonaws.com/images/bea57aea1c463e7eb6a561d770b9d4ce/image5.png)

_A very basic iOS Vision OCR server running on an iPhone._

My preliminary speed tests were fairly slow on my Macbook. However, once I deployed the app to an actual iPhone the speed of OCR was extremely promising (possibly due to the [Vision framework using the GPU](https://developer.apple.com/documentation/vision/vnrequest/2923480-usescpuonly#:~:text=This%20value%20defaults%20to%20false%20to%20signify%20that%20the%20Vision%20request%20is%20free%20to%20leverage%20the%20GPU%20to%20accelerate%20its%20processing.)). I was then able to perform extremely accurate OCR on thousands of images in no time at all, even on the budget iPhone models like the 2nd gen SE.

Overall the API server built on top of [GCDWebServer](https://github.com/swisspol/GCDWebServer) worked fairly well but did suffer from a slight memory leak. After 20K-40K images being OCR-ed the app would usually crash, which was a pretty big annoyance. Again, my familiarity with Swift was about on par with a [golden retriever’s understanding of finance](https://youtu.be/SmHl7hKlVj4?t=34), so debugging the problem proved quite tricky. After investigating more “hacky” options, I realized that I could utilize [“Guided Access” on iOS](https://support.apple.com/en-us/HT202612) to automatically restart the app when it crashed. This essentially operated as a daemon to ensure the OCR server would continue to serve requests and also guard against other unknown crashes from corrupt images halting the pipeline.

## Full Text Search With ElasticSearch

With a way to now properly extract the text from all meme images the problem was now how to search through a huge corpus of text quickly. Initial testing with the [Postgres Full Text Search](https://www.postgresql.org/docs/current/textsearch.html) indexing functionality proved unusably slow at the scale of anything over a million images, even when allocated the appropriate hardware resources.

I decided to give [ElasticSearch](https://github.com/elastic/elasticsearch) a try as it is basically custom-built exactly for this problem. After doc reading, early testing, and reading blog posts from real-world usage of it, I came to some conclusions about implementation of it for my use case:

- [ElasticSearch is a glutton for RAM and system resources](https://github.com/elastic/elasticsearch), especially if run with multiple nodes. Having multiple nodes allows for [resilience against failures](https://www.elastic.co/guide/en/elasticsearch/reference/current/high-availability-cluster-small-clusters.html#high-availability-cluster-design-one-node) when they occur, as is commonplace in any distributed system.
    
- I could run ElasticSearch in a [one-node cluster](https://www.elastic.co/guide/en/elasticsearch/reference/current/high-availability-cluster-small-clusters.html#high-availability-cluster-design-one-node), since the combined text of even millions of memes was still not comparatively large for ElasticSearch’s usual scale. This would be cost-effective but of course came at the expense of reliability.
    
- Since I was utilizing Postgres for the rest of the structured data for the memes (e.g. context, source, etc), having the meme text stored in ElasticSearch concerned me in that it would muddy the “[single source of truth](https://en.wikipedia.org/wiki/Single_source_of_truth)” paradigm. In past experience, having to ensure that two sources of truth align can be the source of extreme complexity and headache.
    
- Upon doing some searching I found that I could utilize [PGSync](https://pgsync.com/) to automatically sync select Postgres columns to ElasticSearch. This seemed an excellent tradeoff to keep a single source of truth (Postgres) and run ElasticSearch cost effectively in single-node configuration. If there was any data loss I could blow ElasticSearch away and PGSync would allow me to easily rebuild the text search index.
    
- ElasticSearch had a huge amount of configurability for text search and a full REST API allowing for me to easily integrate it into my service.
    

My final design looked something like the following:

![alt text](https://docpusher.s3.amazonaws.com/images/bea57aea1c463e7eb6a561d770b9d4ce/image8.png)

_Extremely haphazard diagram of the final implementation infra._

Testing with generated datasets showed that it scaled really well, allowing for searching of millions of memes in less than a second even on relatively modest hardware. At the time of this writing I’m able to index and search the text of around ~17 million memes on a shared Linode instance with only 6 cores and 16GB of RAM. This keeps the costs relatively low, which is important for side-projects if you intend on keeping them running for any amount of time.

## Video Memes, ffmpeg, and OCR

As it turns out, memes are not exclusively images. Many memes are now video complete with audio tracks as well. This is no doubt due to improvements in mobile networks allowing quick delivery of bigger files. In some cases, like GIF, videos are even better because they have much better compression and thus can be much smaller in size.

In order to index memes of this type, the videos had to be chopped up into sets of screenshots which would then be OCRed just like regular memes. To address this I wrote a small microservice which does the following:

- Takes an input video file.
    
- Using ffmpeg (via a library), pulls out [ten evenly spaced screenshots from the video](https://ffmpeg.org/ffmpeg.html#Video-and-Audio-file-format-conversion:~:text=You%20can%20extract%20images%20from%20a%20video%2C%20or%20create%20a%20video%20from%20many%20images%3A).
    
- Sends the screenshot files off to the iPhone OCR service.
    
- Returns the result set after OCRing each screenshot from the video file.
    

## Upgrading the iPhone OCR Service Into An OCR Cluster

Non-suprisingly, this increased the load on the OCR service significantly. For every video meme it was essentially 10x the work to do OCR. Despite the speed of the OCR app server this became a major bottleneck, I ultimately opted to upgrade the iOS OCR service into a cluster:

![alt text](https://docpusher.s3.amazonaws.com/images/bea57aea1c463e7eb6a561d770b9d4ce/image7.jpg)

_Don’t worry, there’s a fan keeping them cool._

This setup looks quite expensive due to the many iPhones in use. However, there are some things that played in my favor to make this much cheaper than you’d expect:

- Since these are dedicated for doing OCR via the [iOS Vision API](https://developer.apple.com/documentation/vision), I could use older (and cheaper) iPhone models such as the [iPhone SE (2nd generation)](https://support.apple.com/kb/SP820?locale=en_US).
    
- I have the advantage of not caring about things such as screen cracks, scratches, and other cosmetic issues which lowers the cost even further.
    
- Better yet, I don’t even want to use them as phones, so even iPhones that are [IMEI banned](https://en.wikipedia.org/wiki/International_Mobile_Equipment_Identity#Blocklists_of_stolen_devices) or are locked to unpopular networks are perfectly fine for my use.
    

Taking all these factors into consideration, I was able to find iPhones at a considerably cheaper price. For example, here’s a listing that matches my criteria and is quite affordable:

![alt text](https://docpusher.s3.amazonaws.com/images/bea57aea1c463e7eb6a561d770b9d4ce/image4.png)

This phone likely went for only 40$ because it was locked to an unpopular US carrier (Cricket) and thus most people wouldn’t want to be stuck with it.

How do these costs compare to cloud OCR services anyway? [GCP’s Cloud Vision API charges you $1.50 for every thousand images you OCR](https://cloud.google.com/vision/pricing). That means that by using this homebrewed solution, we’d eclipse the cost of the iPhone after ~27K images. Of course, maybe GCP’s OCR service is much better quality-wise, but in my testing the results seemed very comparable for this use case. Trying to use the Cloud API at the scale of tens of millions of OCR requests and the cost would have been prohibitive for this project.

Keeping a close eye on eBay auctions I bought any iPhones which went for dirt cheap rates like this. Using an old Raspberry Pi I had around the house, I configured it to act as an Nginx load balancer to spread requests across the iPhones evenly. Adding in some networking, and a cheap fan to keep everything cool, and I had a working OCR cluster which could easily handle much larger demand.

## The Final (Convoluted) Architecture

![alt text](https://docpusher.s3.amazonaws.com/images/bea57aea1c463e7eb6a561d770b9d4ce/image3.png)

The final architecture looks something similar to the above diagram. While there’s definitely some extra complexity due to my optimizations for cost, the cheaper infrastructure will allow me to run this side project for much longer.

Overall it was a fun project with a bonus of having a large amount of personal utility. I learned a lot about a variety of topics including ElasticSearch configuration, iOS app development, and a bit about machine learning. In future posts I hope to elaborate on some of the other features I’ve built for it, including things like:

- “Search by Image”/”Image Similarity” searching at the scale of millions of memes.
    
- Automatic detection and labeling of NSFW memes.
    
- Building out the scraping infrastructure to actually index all of the memes.
    

If you’d like to give it a try, check out the site at [https://findthatmeme.com](https://findthatmeme.com/) and let me know what you think!

-[@IAmMandatory](https://twitter.com/iammandatory)