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

## Options

- `filterContentType`: Filter content-type that should process cheerio (default xml and html).
- `filterStatusCode`: Filter status codes that should process cheerio (default all).

### Note for filters

Filters are regular expressions, but the plugin uses only the `.test(str)` method to proof. You are able to write
your own and much complexer functions by writing the logic in the test method of an object like this:

```js
opts = {
   filterSomething: {
       test: function (val) {
           return false || true;
       }
   }
}
```
