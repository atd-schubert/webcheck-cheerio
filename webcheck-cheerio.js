/*jslint node:true*/
'use strict';

var cheerio = require('cheerio');
var WebcheckPlugin = require('webcheck/plugin');

var pkg = require('./package.json');
/**
 * A helper function for empty regular expressions
 * @private
 * @type {{test: Function}}
 */
var emptyFilter = {
    test: function () {
        return true;
    }
};
/**
 * Cheerio plugin for webcheck
 * @author Arne Schubert <atd.schubert@gmail.com>
 * @param {{}} [opts] - Options for this plugin
 * @param {RegExp|{test:Function}} [opts.filterContentType] - Filter content-type (defaults xml and html)
 * @param {RegExp|{test:Function}} [opts.filterStatusCode] - Filter HTTP status code (default all)
 * @augments Webcheck.Plugin
 * @constructor
 */
var CheerioPlugin = function (opts) {
    WebcheckPlugin.apply(this, arguments);

    opts = opts || {};

    opts.filterContentType = opts.filterContentType || /html|xml/;
    opts.filterStatusCode = opts.filterStatusCode || emptyFilter;

    this.middleware = function (result, next) {
        var triggered,
            $,
            error,
            cbList = [];
        if (!opts.filterContentType.test(result.response.headers['content-type']) ||
            !opts.filterStatusCode.test(result.response.statusCode.toString())) {
            return next();
        }
        /**
         * GetCheerio function added to webcheck result.
         * @param {CheerioPlugin~getCheerio} cb
         * @returns {*}
         */
        result.getCheerio = function getCheerio(cb) {
            var chunks = [];

            if ($ || error) {
                return cb(error, $);
            }
            cbList.push(cb);
            if (!triggered) {
                triggered = true;
                result.response.on('data', function (chunk) {
                    chunks.push(chunk.toString());
                });
                result.response.on('end', function () {
                    var i;
                    try {
                        $ = cheerio.load(chunks.join(''));
                    } catch (err) {
                        error = err;
                    }
                    for (i = 0; i < cbList.length; i += 1) {
                        /**
                         * @callback CheerioPlugin~getCheerio
                         * @params {null|error} error - Error if there was one
                         * @params {cheerio.load} $ - Cheerio representation of DOM
                         */
                        cbList[i](error, $);
                    }
                });
            }
        };
        next();
    };
};

CheerioPlugin.prototype = {
    '__proto__': WebcheckPlugin.prototype,
    package: pkg
};

module.exports = CheerioPlugin;
