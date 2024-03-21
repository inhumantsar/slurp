# Slurp

Slurps webpages, cleans off all the crud, and saves them to Obsidian as nice, tidy Markdown files. Think Pocket, but better.

![demo](demo/demo.gif)

## Goals

* Integrate information from unstructured web pages with the more structured notes, diagrams, and other data managed by Obsidian.
* Make information persistent, indexable, and easier to digest.
* Map out semantic connections between saved pages to encourage reuse and maybe surface unexpected links between ideas.  

## Features

* Select a URL in an existing note and replace it with the article content.
* Use the command palette to create a new note, complete with properties.
* Note properties include properly formatted dates so daily notes link up automatically

## Usage

### Saving pages as new notes

1. _Ctrl+P_ or _Cmd+P_ to open the command palette
2. Search for _Slurp_
3. Select _Create note from URL_
4. Paste the URL and hit _Enter_ or tap the _Slurp_ button
5. Slurp will save the note to a folder called _Slurped Pages_ and open it up

### Replacing a URL inside an existing note

0. Open a note in _Editing_ mode
1. Select the URL _not a Markdown link!_
2. _Ctrl+P_ or _Cmd+P_ to open the command palette
3. Search for _Slurp_
4. Select _Replace URL with article_

## A Note on the Conversion Process

The conversion library, [Mozilla's Readability](https://github.com/mozilla/readability), needs to run against the target page's DOM object. 
Electron's security model prevents Slurp from simply fetching the target page's HTML and creating a DOM object from that. Instead, Slurp 
has to create a headless browser window, inject Readability into that window, and grab the parsed results before finally closing the window. 

This results in a couple tricky limitations:

* Since the script needs to be injected into a headless Electron window...
    * Slurp must handle Readability like a text file rather than a dependency which gets imported.
* Obsidian's plugin architecture maps out dependencies for packaging, but Readability isn't a dependency per se, so...
    * Slurp must download Readability directly from Mozilla's GitHub at runtime.

From a security standpoint, this isn't any more risky than using NPM for dependencies. It's a trusted website, a trusted organisation, 
the domain is verified with SSL, GitHub's authentication requirements are solid (more so than NPM's), etc. The risk of a supply chain attack 
is no higher than it would be with NPM.

The main drawbacks this approach are:

* Slurp has to make some network calls (~80KB + DNS requests + retries) at startup.
* GitHub is not a CDN and they won't like having a bunch of people pulling this script from them.
* Slurp releases cannot be immutable or self-contained. If Mozilla pulls Readability from GitHub, Slurp breaks.

### TL;DR: Slurp is going to download a key library at runtime because reasons.

### Well, what are you going to do about it then?

In the short term, Slurp will probably move toward redistributing Readability by including a JS file which stores Readbility in an enormous multi-
line string. In the long term, who knows.

In an ideal world, all of the conversion work happens locally. Things get messy as soon as an API is involved. I'm not
looking to build another Diffbot, nor do I believe most Obsidian users would be willing to pay subscription fees for a plugin.

On the other hand I'm personally very interested in this capability and extending it out to make web bookmarking less shite and more portable.

## Known Issues & Limitations

* ⚠️ Incoming pages are __not__ sanitized prior to conversion. ⚠️
  * Using a library like DOM Purify is possible, but would require the same import process as Readability. This is an issue for 
    all the reasons stated above. Integrating more libraries that way is worth avoiding until a better solution is found.
  * This shouldn't pose any serious risks most of the time, since malicious actors won't be able to push infected code at Slurp. Regardless 
    though: _Do not use this on sites you can't trust._
* Uses the Electron API for page rendering, making it desktop-only at the moment. 
* The conversion sometimes leaves a bit of jank behind, mainly in the form of wonky markup and line breaks.
* Readability uses DOM manipulation and Regex to do its thing, so it isn't capable of the sort of NLP-driven understanding that libraries 
  like Newspaper and services like Diffbot are capable of.  

## Changelog

* 0.1.0 - Initial commit

## TODO

* [ ] Work out a way to provide the same capabilities without relying on the Electron API
* [ ] Add settings to change the default save location, selectively disable properties, and more
* [ ] Ensure video and other embeds are captured reliably
* [ ] Import Pocket saves, manually and automagically
* [ ] Import bookmarks from other sources, incl browsers
* [ ] LLM summaries and tags
* [ ] Make sure Slurp plays nicely with other plugins, eg Dataview
* [ ] Capture Reddit and Hacker News discussion threads along with the linked page
* [ ] Save PDF and/or HTML versions of the page with the Markdown versions

## Credits

* [Mozilla's Readability](https://github.com/mozilla/readability) powers the underlying conversion.