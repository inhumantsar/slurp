---
link: https://www.theverge.com/2024/4/14/24129981/game-boy-emulator-igba-iphone-ios-app-store-gba4ios-testut-knock-off
title: The first Apple-approved emulator for the iPhone has arrived... and been pulled
byline: Wes Davis
site asdf: The Verge
updated: 2024-04-15T01:27
slurped: 2024-04-19T06:19:29.974Z
excerpt: Because it seems to have copied someone else’s work.
type: article
twitter: https://twitter.com/@verge
onion:
tags:
  - slurp/verge
  - slurp/front-page
  - slurp/news
  - slurp/tech
  - slurp/games
  - slurp/entertainment
  - slurp/apple-ios
  - slurp/apple
  - slurp/iphone
  - slurp/apps
tnimnk:
---

I played Game Boy Advance games on my iPhone this weekend thanks to a new emulator called iGBA, which appears to be the first Game Boy Advance emulator on the App Store since Apple started [allowing emulators](https://www.theverge.com/2024/4/5/24122341/apple-app-store-game-emulators-super-apps) worldwide. The only trouble is, it doesn’t look like iGBA is developer Mattia La Spina’s own work. Something seemingly confirmed by Apple after it pulled the app for violating its copyright and spam rules, [according to _MacRumors_](https://www.macrumors.com/2024/04/15/apple-removes-igba-from-app-store/).

In an email to _The Verge_, developer Riley Testut said the app is an unauthorized clone of GBA4iOS, the open-source emulator he created [for iOS over a decade ago](https://www.theverge.com/2014/7/31/5956059/you-can-play-every-game-boy-advance-game-on-your-iphone-right-now) (and [recently resurrected for the Vision Pro](https://www.theverge.com/2024/2/19/24077846/if-youve-got-a-vision-pro-you-can-now-play-a-giant-game-boy)). He said his app uses the [GNU GPLv2 license](https://www.gnu.org/licenses/old-licenses/gpl-2.0.en.html). A [Mastodon user found](https://mastodon.social/@maczydeco/112268422489536936) that iGBA does not reference the license, which may violate its terms.

According to _MacRumor’s_ [Joe Rossingnol who spoke with Apple](https://www.threads.net/@rsgnl/post/C5w830dOHfb/?xmt=AQGzNM9XAl2d5pinhA-sWGc0B1CgDg98HuRNQPFiuNsu7w), the company pulled iGBA for violating the company’s App Review Guidelines related to spam and copyright. Here’s the clause ([section 5.2](https://developer.apple.com/app-store/review/guidelines/#intellectual-property)) related to intellectual property:

> Make sure your app only includes content that you created or that you have a license to use. Your app may be removed if you’ve stepped over the line and used content without permission. Of course, this also means someone else’s app may be removed if they’ve “borrowed” from your work.

Prior to the app being pulled, Testut said it was Apple he was frustrated with, not La Spina.

Testut also provided this statement to _The Verge:_

> I’ve been working with Apple to release AltStore as an alternative app marketplace for over a month now, and I’m disappointed to see that they’ve approved a knock-off of AltStore’s flagship app Delta in that time. However, we’re still planning to launch Delta ASAP, and we’ll have more to share on that very soon.

Here are some screenshots of GBA4iOS and iGBA for comparison, starting with iGBA.

![Three screenshots: an in-game session, the game picker screen, and the settings screen.](https://duet-cdn.vox-cdn.com/thumbor/0x0:5000x3031/2400x1455/filters:focal(2500x1516:2501x1517):format(webp)/cdn.vox-cdn.com/uploads/chorus_asset/file/25393425/iGBA.png)

_Screenshots from iGBA._

Screenshots: Wes Davis / The Verge

![A collection of screenshots from Riley Testut’s website, showing very similar screens to the image above it, with nearly identical graphical interface features.](https://duet-cdn.vox-cdn.com/thumbor/0x0:5000x3031/2400x1455/filters:focal(2500x1516:2501x1517):format(webp)/cdn.vox-cdn.com/uploads/chorus_asset/file/25393421/GBA4iOS_screenshots.png)

When reached for comment, La Spina did not explicitly confirm using Testut’s code, but told _The Verge_ they “did not think the app would have so much repercussion, I am really sorry,” and added that they have reached out to Testut via email.

The other issue with iGBA is that, according to [its App Store listing](https://go.skimresources.com/?id=1025X1701640&xs=1&url=https%3A%2F%2Fapps.apple.com%2Fil%2Fapp%2Figba-gba-gbc-retro-emulator%2Fid6482993626), it collects data that can be used to identify you, such as location data and identifiers. I’d suggest reading developer Mattia La Spina’s [Github-hosted privacy policy](https://gist.github.com/mattiaa95/fa36f274224f9baec2134322e620985e) before diving in. The app didn’t request location data permission when I loaded it, however, and I didn’t see the in-app browser tracker consent form [some Reddit users reported seeing](https://www.reddit.com/r/ios/comments/1c322t9/comment/kzemnno/?utm_source=share&utm_medium=web3x&utm_name=web3xcss&utm_term=1&utm_content=share_button).

I’m aware of one other emulator, [spotted by _The Verge’_s Parker Orlotani](https://www.threads.net/@parkerortolani/post/C5uKBGcJpxz). It’s a Commodore 64 emulator [called Emu64 XL](https://go.skimresources.com/?id=1025X1701640&xs=1&url=https%3A%2F%2Fapps.apple.com%2Fus%2Fapp%2Femu64-xl%2Fid6483251916). Here, I did see a consent request form populated with toggles for what seemed like miles of trackers. I did not attempt to find or play any Commodore 64 games with Emu64 XL and deleted the app.

Apple has tightly controlled the App Store since its inception. That control is breaking down now, with the EU’s Digital Markets Act making the company [permit other app stores](https://www.theverge.com/24100979/altstore-europe-app-marketplace-price-games) and sideloading on the iPhone. The company also faces a [US Department of Justice lawsuit](https://www.theverge.com/24107581/doj-v-apple-antitrust-monoply-news-updates) that could force it to make similar concessions — which may be why the company started allowing emulators in the first place. Whatever the case, emulators being allowed feels like a win; it’s just a shame the first apps to take advantage of that aren’t quite up to snuff.

_**Update April 14th, 11:17AM ET:** Updated with comment from developers Riley Testut and Mattia La Spina._

_**Update April 15th, 2:26AM ET:** Updated to note that Apple has pulled the app._