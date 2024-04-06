---
link: https://invertornot.com/
author: Mattis Megevand
site: InvertOrNot
slurped: true
---
Make your app's dark-mode smarter with InvertOrNot. Our API predicts if an image should be inverted for optimal dark-mode rendering.  
This API is free, and is open source (both the code and the weights of the model are [available](https://github.com/mattismegevand/invertornot)).

![Example of outputs](https://invertornot.com/static/examples.png)

#### Try it out

Upload an image to see InvertOrNot what transformation it would apply to it.

#### Background

Despite dark-mode's popularity, images often aren't automatically adapted to fit it. The conservative approach is to reduce the brightness of the image, which can degrade it significantly. Inverting the image can be a better solution, but it can't be applied to all images (see the poor Queen Victoria).  
Using our API you can make your website more pleasant to use in dark-mode, without having to manually adapt each image.

#### How does it work?

The API works by finetuning an [EfficientNet](https://arxiv.org/abs/1905.11946) model on a custom dataset using PyTorch. By using deep learning we are able to have a much more reliable approach to solve this problem, the only alternative being heuristics.

#### How can I use it?

Documentation is available [here](https://invertornot.com/docs/). If possible cache or store the results provided by the API to avoid unnecessary calls.

|Endpoint|Method|Input|Output|
|---|---|---|---|
|`/api/file`|`POST`|List of image files|List of `{invert, sha1, error}` for each file.|
|`/api/url`|`POST`|List of image URLs|List of `{invert, sha1, error, url}` for each URL.|
|`/api/sha1`|`POST`|List of SHA-1 hashes|List of `{invert, sha1, error}` for each SHA-1.|

Example of a request:

            `curl -X 'POST' \                   'https://invertornot.com/api/url' \                   -H 'accept: application/json' \                   -H 'Content-Type: application/json' \                   -d '[                   "https://upload.wikimedia.org/wikipedia/commons/e/e3/Queen_Victoria_by_Bassano.jpg"                 ]'`
            
        

Response:

            `[                   {                     "invert": 0,                     "sha1": "da487e2e9855362b4a5f4fdb531c55ae47ac6e1b",                     "error": "",                     "url": "https://upload.wikimedia.org/wikipedia/commons/e/e3/Queen_Victoria_by_Bassano.jpg"                   }                 ]`
            
        

If you've never adapted images for dark-mode, here's a quick example of what the CSS can look like:

- no inversion: `filter: grayscale(50%);`
- inversion: `filter: grayscale(50%) invert(100%) brightness(95%) hue-rotate(180deg);`

Feel free to tweak these based on your dark mode setup.

#### Goal

InvertOrNot is a public demonstration and proof of concept of using a NN classifier to choose how to handle images in dark-mode.

#### Support

InvertOrNot offers no warranties or guaranties and is done on a best-effort basis. If you need reliable or large-scale inversion APIs, I strongly recommend you download the FLOSS code and model and run your own instance. The model is lightweight (16MB) and can be run on a CPU (≈ 100ms using ONNX Runtime).

#### Side note

Images may be retained for training purposes. Should you prefer your images not be saved, hosting your own instance is recommended. Additionally, it's important to note that these images will not be distributed; they are solely used for training purposes