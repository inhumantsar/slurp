Did some quick hackery around keyword extraction for tag suggestion. Took the basic approach of a standard keyword extractor library which includes a default set of stopwords for a number of languages.

The results were about as "meh" as I expected. Raw frequency sort did a reasonable job. Using fuzzysort to find and combine similar keywords (eg: `worker`, `worker nodes`, etc) helped in some ways and hurt in others (eg: `ai` turns up a lot of results).

Tag suggestion is not super high on my priority list at the moment and the results of this weren't good enough to warrant moving ahead.

# Options for the future

## Only suggest existing tags
Match extracted keywords against Obsidian's built-in fuzzy tag search. This would have the benefit of being fast, simple, and well-supported but at the cost of not being able to suggest new tags. Considering one of the goals of Slurp is to go from paste-to-save with minimal interaction, this might not be much better than simply letting people enter their own tags.

## Levenshtein graph
Using similarity scores as an edge weight in a graph could help cluster keywords and identify an ideal representative keyword for each cluster. This would help generate small lists of well-targeted suggestions. Runtime would be relatively quick, though obviously not as fast as a more naive approach like simple threshold matching.

## Tiny WASM Embeddings model
Use one of the newer super-tiny LLMs compiled to WASM to build out embeddings. Like this [Candle BERT WASM example](https://huggingface.co/spaces/radames/Candle-BERT-Semantic-Similarity-Wasm/tree/main). This would produce the best results by far and the models could be as small as 35MB, enabling fairly quick results. Using the same test article below (scrubbed of markdown) and the smallest model (bge_micro), it took about 5s to download the model and build the embeddings. Using the embeddings to find the keywords would take additional time, though the search function on that demo was pretty much instantaneous. Might be something to consider as a standalone plugin if:
	- works on mobile
	- is reasonably performant
	- a model with permissive licensing is available

# Hackery

```typescript
const keyword_extractor = require("keyword-extractor");
const fuzzysort = require('fuzzysort');

// read local markdown file
const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'test-resources/vault/Slurped Pages/Building a Fly.io-like Scheduler Part 1- Basic Coordinator and Workers.md');
const md = fs.readFileSync(filePath, 'utf8');

// Regular expressions to match Markdown syntax
const rules = [
    // Headers
    { regex: /^(#{1,6})\s+(.*)$/gm, replace: '$2' },
    // Images
    { regex: /!\[(.*?)\]\((.*?)\)/g, replace: '' },
    // Links
    { regex: /\[(.*?)\]\((.*?)\)/g, replace: '$1' },
    // Inline code and code blocks
    { regex: /(```\s*[\w\W]+?\s*```|`[\w\W]+?`)/g, replace: '' },
    // Bold, italic, and strikethrough text
    { regex: /(\*\*|__)(.*?)\1/g, replace: '$2' },
    { regex: /(\*|_)(.*?)\1/g, replace: '$2' },
    { regex: /~~(.*?)~~/g, replace: '$1' },
    // Blockquotes
    { regex: /^>\s+(.*)$/gm, replace: '$1' },
    // Lists (unordered and ordered)
    { regex: /^\s*([\*\-\+]|(\d+\.)\s)(.*)$/gm, replace: '$3' },
];

// Remove Markdown formatting
let plainText = md;
rules.forEach(({ regex, replace }) => {
    plainText = plainText.replace(regex, replace);
});

// extract keywords
const extraction_result = keyword_extractor.extract(plainText, {
    language: "english",
    remove_digits: true,
    return_changed_case: true,
    remove_duplicates: false,
    return_chained_words: false,
    return_max_ngrams: 2
});

console.log(`found ${extraction_result.length} keywords`);

// find the top 10 words by frequency
const frequency = {};
extraction_result.forEach(function (word) {
    if (frequency[word]) {
        frequency[word]++;
    } else {
        frequency[word] = 1;
    }
});

const sorted = Object.keys(frequency).sort(function (a, b) {
    return frequency[b] - frequency[a];
});

console.log(sorted.slice(0, 50));
// console.log(frequency);


let deduped = {};
let matched = new Array();
sorted.forEach(function (word) {
    // skip if the word is already in the map
    if (matched.includes(word)) return;
    // add matching word scores to the deduped map
    deduped[word] = frequency[word];
    const results = fuzzysort.go(word, sorted);
    let wMatches = [];
    const oldScore = deduped[word];
    results.forEach(result => {
        wMatches.push(result.target);
        deduped[word] += frequency[result.target];
    });
    matched.concat(wMatches);
    // console.log(`${word}: ${oldScore} -> ${deduped[word]} / ${wMatches}`);
});

const dedupedSorted = Object.keys(deduped).sort(function (a, b) {
    return deduped[b] - deduped[a];
});

console.log(dedupedSorted.slice(0, 50));
```

Results from [[Building a Fly.io-like Scheduler Part 1- Basic Coordinator and Workers]] 
```json
// raw frequency sort
[
  'workers',      'resources',            'coordinator',
  'worker nodes', 'build',                'scheduler',
  'worker',       'worker node',          'request',
  'task',         'post',                 'simple',
  'node',         'make',                 'number',
  'ai',           'inference',            'fly',
  'building',     'nodes',                'requirements',
  'response',     'client',               'nats',
  'run',          'serverless functions', 'execution',
  'sql',          'code',                 'machine',
  'dont',         'availability',         'cluster',
  'add',          'fulfill',              'bids',
  'reservation',  'tells',                'docker container',
  'function',     'memory',               'reserve',
  'set',          'endpoint',             'release',
  'respond',      'output',               'executing',
  'result',       'increment'
]

// frequency after combining fuzzysort matches
[
  'ai',            'work',        'worker',
  'node',          'run',         'set',
  'workers',       'coordinator', 'request',
  'resources',     'worker node', 'nodes',
  'fly',           'nats',        'coodinator',
  'worker nodes',  'build',       'source',
  'scheduler',     'task',        'post',
  'lot',           'code',        'simple',
  'dan',           'date',        'lets',
  'case',          'put',         'number',
  'dont',          'site',        'db',
  'workers nodes', 'schedules',   'free',
  'scheduling',    'make',        'inference',
  'building',      'client',      'function',
  'reserve',       'respond',     'requirements',
  'cluster',       'add',         'release',
  'increment',     'terminal'
]
```