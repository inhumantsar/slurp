# Slurp

Slurps webpages, cleans off all the crud, and saves them to Obsidian as nice, tidy Markdown files. Think Pocket, but better.

![demo](demo/demo.gif)

## Goals

* Integrate information from unstructured web pages with the more structured notes, diagrams, and other data managed by Obsidian.
* Make information persistent, indexable, and easier to digest.
* Map out semantic connections between saved pages to encourage reuse and maybe surface unexpected links between ideas.  

## Features

* Use the command palette to create a new note, complete with properties.
* Note properties include properly formatted dates so daily notes link up automatically

## Usage

### Create Note from URL

1. _Ctrl+P_ or _Cmd+P_ to open the command palette
2. Search for _Slurp_
3. Select _Create note from URL_
4. Paste the URL and hit _Enter_ or tap the _Slurp_ button
5. Slurp will save the note to a folder called _Slurped Pages_ and open it up

## Known Issues & Limitations

* Social media links generally don't work well, for example:
  * Twitter links will simply fail because Twitter aggressively filters non-browsers.
  * Comments will be captured from HackerNews links (mostly), but all threading will be lost.
  * Reddit links will be processed without error, but only the link, author, and Reddit sidebar content will be captured.
* Slurp does *nothing* to bypass paywalls.
* The conversion will leave a bit of jank behind sometimes, mainly in the form of wonky markup and line breaks.

## Changelog

* 0.1.0 - Initial commit

## TODO

* [ ] Add settings to change the default save location, selectively disable properties, and more
* [ ] Ensure video and other embeds are captured reliably
* [ ] Import Pocket saves, manually and automagically
* [ ] Import bookmarks from other sources, incl browsers
* [ ] LLM summaries and tags
* [ ] Make sure Slurp plays nicely with other plugins, eg Dataview
* [ ] Capture Reddit and Hacker News discussion threads along with the linked page
* [ ] Save PDF and/or HTML versions of the page with the Markdown versions


## Development Environment

Don't use your personal or any kind of sensitive Obsidian vault for development! Set up a fresh one!

### direnv (optional)

There is a `direnv` config which can be used to quickly configure a completely isolated local environment. Setting it up requires a few extra steps though.

1. Install the Nix package manager: `sh <(curl -L https://nixos.org/nix/install) --no-daemon`
2. Ensure `flakes` and `nix-command` are enabled, eg: `mkdir -p ~/.local/nix && echo "experimental-features = nix-command flakes" >> nix.conf`
2. Install `direnv`, adjusting or removing `bin_path` as needed: `curl -sfL https://direnv.net/install.sh | bin_path=~/.local/bin bash`
3. `direnv` will instruct you to add a line to your `.bashrc`, once that's done, run `direnv allow`.

### Hot Reload

This hooks into Obsidian to reload plugins anytime a change is detected. This is *definitely* not recommended for use with production Obsidian vaults.

https://github.com/pjeby/hot-reload

### Linking the Slurp dev directory

```
cd /path/to/dev-vault/.obsidian/plugins
ln -s /path/to/slurp ./
```

### Enable plugins

Open up Obsidian, go into Settings > Community Plugins and hit Enable. You should see Slurp and Hot Reload under Installed Plugins. Turn them on and you should be good to go!


## Credits

* [Mozilla's Readability](https://github.com/mozilla/readability) powers the underlying conversion.