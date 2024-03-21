# Slurp

Slurps webpages, cleans off all the crud, and saves them to Obsidian as nice, tidy Markdown files. Think Pocket, but better.

![demo](demo/demo.gif)

_*NOTE*_: While Slurp is functional and seems to work fine, it was slapped together for fun over a couple of hours. It hasn't 
been extensively tested or secured yet! Don't use this on sites you don't trust and vaults you don't have backups of. 

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

## Known Issues

* Incoming pages are not yet sanitized prior to conversion!
* Uses the Electron API for page rendering, making it desktop-only at the moment. 
* The conversion sometimes leaves a bit of jank behind, mainly in the form of wonky markup and line breaks

## Changelog

* 0.1.0 - Initial commit

## TODO

* [ ] Mobile compatibility
* [ ] Check the content hash and use a specific commit when fetching Readbility, add both to settings
* [ ] Add settings to change the default save location, selectively disable properties, and more
* [ ] Ensure video and other embeds are captured reliably
* [ ] Import Pocket saves, manually and automagically
* [ ] Import bookmarks from other sources, incl browsers
* [ ] LLM summaries and tags
* [ ] Make sure Slurp plays nicely with other plugins, eg Dataview
* [ ] Capture Reddit and Hacker News discussion threads along with the linked page
* [ ] Save PDF and/or HTML versions of the page with the Markdown versions

## Credits

* Mozilla's Readability powers the underlying conversion.