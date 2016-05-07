/// <reference path="./typings/main.d.ts" />

import * as cheerio from 'cheerio';
import {Plugin, IResult, ICallback} from 'webcheck';

import * as pkg from './package.json';

export interface ISimplifiedRegExpr {
    test(txt: string): boolean;
}

export interface ICheerioPluginOptions {
    filterStatusCode?: ISimplifiedRegExpr | RegExp;
    filterContentType?: ISimplifiedRegExpr | RegExp;
}

export interface ICheerioPluginCallback {
    (err: Error, $: CheerioStatic): void;
}

export interface ICheerioPluginResult extends IResult {
    getCheerio(cb: ICheerioPluginCallback): void;
}

/**
 * A helper function for empty regular expressions
 * @private
 * @type {{test: Function}}
 */
var emptyFilter: ISimplifiedRegExpr = { // a spoofed RegExpr...
    test: (): boolean => {
        return true;
    }
};

/**
 * Cheerio plugin for webcheck
 * @author Arne Schubert <atd.schubert@gmail.com>
 * @param {{}} [opts] - Options for this plugin
 * @param {RegExp|{test:Function}} [opts.filterStatusCode] - Filter HTTP status code (default all)
 * @param {RegExp|{test:Function}} [opts.filterContentType] - Filter content-type (default html and xml)
 * @augments Plugin
 * @constructor
 */

export class CheerioPlugin extends Plugin {

    public package: any = pkg;

    constructor(opts: ICheerioPluginOptions) {
        super();

        opts = opts || {};

        opts.filterContentType = opts.filterContentType || /html|xml/;
        opts.filterStatusCode = opts.filterStatusCode || emptyFilter;

        this.middleware = (result: ICheerioPluginResult, next: ICallback): void => {
            var triggered: boolean,
                $: CheerioStatic,
                error: Error,
                cbList: ICheerioPluginCallback[] = [];

            if (!opts.filterContentType.test(result.response.headers['content-type']) ||
                !opts.filterStatusCode.test(result.response.statusCode.toString())) {
                return next();
            }
            /**
             * GetCheerio function added to webcheck result.
             * @param {CheerioPlugin~getCheerio} cb
             * @returns {*}
             */
            result.getCheerio = (cb: ICheerioPluginCallback): void => {
                var chunks: string[] = [];

                if ($ || error) {
                    return cb(error, $);
                }
                cbList.push(cb);
                if (!triggered) {
                    triggered = true;
                    result.response.on('data', (chunk: Buffer): void => {
                        chunks.push(chunk.toString());
                    });
                    result.response.on('end', (): void => {
                        try {
                            $ = cheerio.load(chunks.join(''));
                        } catch (err) {
                            error = err;
                        }
                        for (let i: number = 0; i < cbList.length; i += 1) {
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
    }
}
