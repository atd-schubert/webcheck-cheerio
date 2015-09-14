# webcheck-cheerio
A cheerio plugin for [webcheck](https://github.com/atd-schubert/node-webcheck).

## How to install

```bash
npm install --save webcheck-cheerio
```

## How to use

```js
var Webcheck = require('webcheck');
var CheerioPlugin = require('webcheck-cheerio');

var plugin = CheerioPlugin();

var webcheck = new Webcheck();
webcheck.addPlugin(plugin);

plugin.enable();

// now continue with your code...

webcheck.on('result', function (result) {
    if (typeof result.getCheerio === 'function') {
        result.getCheerio(function (err, $) {
            // now continue with cheerio...
        });
    }
});

```
