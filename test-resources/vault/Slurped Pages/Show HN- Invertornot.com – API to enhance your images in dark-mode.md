---
link: https://news.ycombinator.com/item?id=39821632&utm_source=pocket_saves
slurped: true
---
|                              |                                                                         |                                                                                                                                                                                                                                                                                                                                                                          |
| ---------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ![](app://obsidian.md/s.gif) | [](app://obsidian.md/vote?id=39822344&how=up&goto=item%3Fid%3D39821632) | Semi-related - I saw this on [https://v8.dev](https://v8.dev/) a while back, but `filter: hue-rotate(180deg) invert();` can be a neat CSS trick to 'dark mode' some kinds of graphics, while not screwing with the colours so much. The `hue-rotate` help a bit to keep 'blues blue' etc.<br><br>It's far from perfect, but it's a neat one to have in your back pocket. |

|   |   |   |
|---|---|---|
|![](app://obsidian.md/s.gif)|[](app://obsidian.md/vote?id=39822754&how=up&goto=item%3Fid%3D39821632)|Anyone who thought Retool should have a dark mode has come across this. Definitely a useful trick.|

|   |   |   |
|---|---|---|
|![](app://obsidian.md/s.gif)|[](app://obsidian.md/vote?id=39823677&how=up&goto=item%3Fid%3D39821632)|Hey This is cofounder of a retool alternative here.<br><br>We did introduce dark mode in a manner where a creator can even make it dynamic for end user to choose a different theme.<br><br>While I was loggerheads with my CTO cofounder on this - I am glad someone finds this useful in the community of users.<br><br>I am curious what kind of use case you have for retool/ alternate tools where you see dark mode as a need|

|   |   |   |
|---|---|---|
|![](app://obsidian.md/s.gif)|[](app://obsidian.md/vote?id=39835311&how=up&goto=item%3Fid%3D39821632)|I find most tools easier to use when I'm not required to jam a live flashlight into my eye sockets.|

|   |   |   |
|---|---|---|
|![](app://obsidian.md/s.gif)|[](app://obsidian.md/vote?id=39826412&how=up&goto=item%3Fid%3D39821632)|If you don't have a lot of images, you can go over them all manually and write the "please invert me" request directly into the filename.<br><br>CSS:<br><br>```<br>    img[src^="/images/invertable"] {<br>        filter: hue-rotate(180deg) invert(1);<br>    }<br>```<br><br>Now all image names starting with "invertable" will be inverted.|

|   |   |   |
|---|---|---|
|![](app://obsidian.md/s.gif)|[](app://obsidian.md/vote?id=39831453&how=up&goto=item%3Fid%3D39821632)|Yep, or you can just set a class on each image. It's easy even in Markdown: `![](image){.invertible}`.<br><br>It's just that often you do have a lot of images and, more importantly, they may not be _known in advance_. If images are dynamic, then you obviously can't go over them manually, no matter how few of them there are.<br><br>This was the principal motivation for me for InvertOrNot.com: I am willing to manually classify hundreds or thousands of images for inversion, and I did, but what I _can't_ do is do that for all of the many Wikipedia popups on gwern.net - not just because there's 22k+ of them, but because they are constantly being added, WP articles are constantly changing, and they are fully recursive so a reader could pop up any WP article. A fully-automated API is the only possible solution. (Doesn't have to be neural nets, that's just the most obvious & easiest approach; I expect classical approaches would work too and would be easier to get running in-browser too.)<br><br>And then if you have a high-quality fully-automated API, then you might as well drop the manual classifying. It's tedious and adds friction to writing.|

|   |   |   |
|---|---|---|
|![](app://obsidian.md/s.gif)|[](app://obsidian.md/vote?id=39822011&how=up&goto=item%3Fid%3D39821632)|Neat, as a reader, I've absolutely wanted this exact behavior many times. Do you have any examples of incorrectly classified images? As you say, the model seems quite simple, but I wonder if there are some pathological kinds of photographs that result in inversion.|

|   |   |   |
|---|---|---|
|![](app://obsidian.md/s.gif)|[](app://obsidian.md/vote?id=39822122&how=up&goto=item%3Fid%3D39821632)|Some graphs with lots of colors can be difficult for models to handle. In these cases, the model often chooses not to flip the graph to avoid making it hard to read, based on past problems with similar graphs. The model generally does a good job at deciding when to flip something. Although I haven't seen it flip photos, it's possible that there are examples out there.|

|   |   |   |
|---|---|---|
|![](app://obsidian.md/s.gif)|[](app://obsidian.md/vote?id=39825363&how=up&goto=item%3Fid%3D39821632)|I built dark mode for an email client’s (shortwave.com) HTML emails and this was the last major hurdle to solve. I wish that had existed then :)<br><br>Generally making emails dark mode is a non trivial problem, there is an hope source library that is a good start from Tempo: [https://github.com/yourtempo/tempo-message-dark-mode](https://github.com/yourtempo/tempo-message-dark-mode)<br><br>However there are plenty of edge cases that plugin doesn’t handle that we had to fix at Shortwave. Examples include legacy HTML4 attributes, better support for emails that are half dark mode, emails that have background images of #fff (looking at you google play reciepts), the list goes on. It’s honestly pretty solid now|

|   |   |   |
|---|---|---|
|![](app://obsidian.md/s.gif)|[](app://obsidian.md/vote?id=39823605&how=up&goto=item%3Fid%3D39821632)|Huh. This is neat.<br><br>As a side, I have a great frustration balancing dark mode with other things. I use flux on my Mac, not for color temp but strictly for the "darkroom" mode which inverts everything and makes the (inverted) brightness values into red. I only do this when coding at night, to help with my sleep... but the trouble is it's made for people who use light mode during the day. I use dark mode all day. So I have to get _out_ of dark mode and change my vscode theme to light in order for it to work. Not a huge deal, but then I open up some web page with a black background and go blind from all the red.|

|   |   |   |
|---|---|---|
|![](app://obsidian.md/s.gif)|[](app://obsidian.md/vote?id=39823573&how=up&goto=item%3Fid%3D39821632)|Does this distinguish white backgrounds from transparent backgrounds? For example, a graph consisting of anything-on-white should probably be inverted, while a graph consisting of pure red on transparent should probably not be inverted. For the latter, increasing the luminance (i.e. make it pink on transparent) might be best, followed by leaving it as-is, followed by inverting.<br><br>But I guess with ML reinforced by human feedback, trends like this manifest without having to explicitly handle them as special cases at all...|

|   |   |   |
|---|---|---|
|![](app://obsidian.md/s.gif)|[](app://obsidian.md/vote?id=39826652&how=up&goto=item%3Fid%3D39821632)|I'm confused... has the meaning of "invert" changed since I last looked? Because the bar chart given as an example on the page isn't actually inverted (the color of the bars and as far as I can see also the text stay the same, only the background changes from light to dark). So, additionally to this API, you need another model that does the actual "inversion"? Or just good old editing?<br><br>EDIT: from another comment - actually "inverting" seems to refer to doing<br><br>```<br>    hue-rotate(180deg) invert()<br>```<br><br>...which (if I read it correctly) inverts the hue of colored areas before applying the actual inversion in order to keep the colors the same (more or less - see also [https://stackoverflow.com/questions/65344006/why-does-filter...](https://stackoverflow.com/questions/65344006/why-does-filter-invert1-hue-rotate180deg-turn-red-into-a-peachy-pink-colo)) ? Not a frontend developer, so I wasn't familiar with this trick until now. TIL...|

|   |   |   |
|---|---|---|
|![](app://obsidian.md/s.gif)|[](app://obsidian.md/vote?id=39822557&how=up&goto=item%3Fid%3D39821632)|How can you use or create this model for conventional non-API projects? Like to embed it within some C code?|

|   |   |   |
|---|---|---|
|![](app://obsidian.md/s.gif)|[](app://obsidian.md/vote?id=39822120&how=up&goto=item%3Fid%3D39821632)|Very cool! Nice job! Out of curiosity, how much CPU/GPU/RAM resources do you need to allocate to run something like this? Like you mention you're using small models. For example, could this run on a t2.micro on EC2? (1 vCPU + 1GB RAM)|

|   |   |   |
|---|---|---|
|![](app://obsidian.md/s.gif)|[](app://obsidian.md/vote?id=39822168&how=up&goto=item%3Fid%3D39821632)|Thank you! Very little resources are needed to run it, gwern is using the API and at first I was using a 6$ Droplet (exact same specs as the t2.micro) and it was running well.|

|   |   |   |
|---|---|---|
|![](app://obsidian.md/s.gif)|[](app://obsidian.md/vote?id=39825137&how=up&goto=item%3Fid%3D39821632)|not exactly the same but for colored pictures GPT recently suggested inverting the image and then turning the color space by 180° so that the original colors are restored... pretty genius|

|   |   |   |
|---|---|---|
|![](app://obsidian.md/s.gif)|[](app://obsidian.md/vote?id=39822861&how=up&goto=item%3Fid%3D39821632)|What I am interested in is a plugin/extension for Firefox/Chrome that can invert a video running on a page (darkreader is not doing that).|

|   |   |   |
|---|---|---|
|![](app://obsidian.md/s.gif)|[](app://obsidian.md/vote?id=39823456&how=up&goto=item%3Fid%3D39821632)|Does that really make sense? Unlike a single static image, a video is not one thing. It might go rapidly between invertible and non-invertible. Would you expect it to switch strategies potentially every scene or second...?|

|   |   |   |
|---|---|---|
|![](app://obsidian.md/s.gif)|[](app://obsidian.md/vote?id=39864554&how=up&goto=item%3Fid%3D39821632)|Yes it indeed has very specific use case of tutorial videos with white background; those generally stay the same until the switch to dark mode for showing code. It would be impressive if the add-on is smart enough to do what you said to maintain dark background throughout (I don't have a lot of idea of how technically challenging this might be).|

|   |   |   |
|---|---|---|
|![](app://obsidian.md/s.gif)|[](app://obsidian.md/vote?id=39823782&how=up&goto=item%3Fid%3D39821632)|I would be interested to see more samples. Naively it seems like you could just say "isPhoto ? REDUCE_BRIGHTNESS : INVERT"|

|   |   |   |
|---|---|---|
|![](app://obsidian.md/s.gif)|[](app://obsidian.md/vote?id=39825313&how=up&goto=item%3Fid%3D39821632)|The two big cluster are indeed photo and charts. However chart or meme are not all invertible, charts with lots of color can for example be degraded by inversion. Also some chart are already done for dark theme, for those images the model will understand that it doesn’t need to invert them.|

|   |   |   |
|---|---|---|
|![](app://obsidian.md/s.gif)|[](app://obsidian.md/vote?id=39825929&how=up&goto=item%3Fid%3D39821632)|Is inverting the colors in a photo ever the right choice? People come out looking really strange.|

|   |   |   |
|---|---|---|
|![](app://obsidian.md/s.gif)|[](app://obsidian.md/vote?id=39826003&how=up&goto=item%3Fid%3D39821632)|That’s the point of using a NN. If it detects people, dim it (losing contrast). If it detect bright vector graphics, invert it (not losing contrast).|

|   |   |   |
|---|---|---|
|![](app://obsidian.md/s.gif)|[](app://obsidian.md/vote?id=39825321&how=up&goto=item%3Fid%3D39821632)|Close to 100%, this problem seem to be easily solved by the model. I plan to do cross validation and also to explore the use of a smaller model.|

|   |   |   |
|---|---|---|
|![](app://obsidian.md/s.gif)|[](app://obsidian.md/vote?id=39831397&how=up&goto=item%3Fid%3D39821632)|Does it matter? It's not a research project trying to rigorously evaluate novel architectural modifications or something, but just a project trying to be useful within the limited resources of a hobbyist. If someone labeled a bunch of the remaining errors, that data would then be better used as more training data than to benchmark.<br><br>In practice, the accuracy, whatever it is, appears to be very high and more than adequate to justify its use.|

|   |   |   |
|---|---|---|
|![](app://obsidian.md/s.gif)|[](app://obsidian.md/vote?id=39862718&how=up&goto=item%3Fid%3D39821632)|Yes it does. You will always get close to 100% accuracy on small datasets if you evaluate the model using the train dataset - due to overfit.|

|   |   |   |
|---|---|---|
|![](app://obsidian.md/s.gif)|[](app://obsidian.md/vote?id=39824866&how=up&goto=item%3Fid%3D39821632)|It used to be implemented in Chrome, it was part of the feature called "Force Dark Mode Web Contents" and it had a runtime tflite model that determines if the lightness should be inverted (and a simpler heuristics that just counts the number of colored pixels).|