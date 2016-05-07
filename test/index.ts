/// <reference path="../typings/main.d.ts" />

import { CheerioPlugin, ICheerioPluginResult } from '../webcheck-cheerio';
import { Webcheck } from 'webcheck';
import * as freeport from 'freeport';
import * as express from 'express';

/* tslint:disable:align */

describe('Cheerio Plugin', (): void => {
    var port: number;
    before((done: MochaDone): void => {
        var app: express.Express = express();

        /*jslint unparam: true*/
        app.get('/', (req: express.Request, res: express.Response): void => {
            res.send('<html><head></head><body><p>index</p></body></html>');
        });
        app.get('/500', (req: express.Request, res: express.Response): void => {
            res.status(500).send('<html><head></head><body><p>500</p></body></html>');
        });
        app.get('/xml', (req: express.Request, res: express.Response): void => {
            res.type('xml').send('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><directory><title>XML</title></directory>');
        });
        app.get('/json', (req: express.Request, res: express.Response): void => {
            res.send({test: 'OK'});
        });
        /*jslint unparam: false*/

        freeport((err: Error, p: number): void => {
            if (err) {
                done(err);
            }
            port = p;
            app.listen(port);
            done();
        });
    });

    describe('Basic functions', (): void => {
        var webcheck: Webcheck,
            plugin: CheerioPlugin;

        before((): void => {
            webcheck = new Webcheck({});
            plugin = new CheerioPlugin({});

            webcheck.addPlugin(plugin);
            plugin.enable();
        });
        it('should have a getCheerio function in result', (done: MochaDone): void => {
            var found: boolean;

            webcheck.once('result', (result: ICheerioPluginResult): void => {
                if (typeof result.getCheerio === 'function') {
                    found = true;
                }
            });

            webcheck.crawl({
                url: 'http://localhost:' + port
            }, (err: Error): void => {
                if (err) {
                    return done(err);
                }
                if (found) {
                    return done();
                }
                return done(new Error('Function not found'));
            });
        });
        it('should have cheerioize result', (done: MochaDone): void => {
            webcheck.once('result', (result: ICheerioPluginResult): void => {
                result.getCheerio((err: Error, $: CheerioStatic): void => {
                    if (err) {
                        return done(err);
                    }
                    if ($('p').text() === 'index') {
                        return done();
                    }
                    return done(new Error('Wrong content'));
                });
            });
            webcheck.crawl({
                url: 'http://localhost:' + port
            }, (err: Error): void => {
                if (err) {
                    return done(err);
                }
            });
        });
        it('should have cheerioize result on http-error', (done: MochaDone): void => {
            webcheck.once('result', (result: ICheerioPluginResult): void => {
                result.getCheerio((err: Error, $: CheerioStatic): void => {
                    if (err) {
                        return done(err);
                    }
                    if ($('p').text() === '500') {
                        return done();
                    }
                    return done(new Error('Wrong content'));
                });
            });
            webcheck.crawl({
                url: 'http://localhost:' + port + '/500'
            }, (err: Error): void => {
                if (err) {
                    return done(err);
                }
            });
        });
        it('should not have getCheerio if result is not html or xml', (done: MochaDone): void => {
            var notFound: boolean;
            webcheck.once('result', (result: ICheerioPluginResult): void => {
                if (typeof result.getCheerio !== 'function') {
                    notFound = true;
                }
            });
            webcheck.crawl({
                url: 'http://localhost:' + port + '/json'
            }, (err: Error): void => {
                if (err) {
                    return done(err);
                }
                if (notFound) {
                    return done();
                }
                return done(new Error('There was a getCheerio function'));
            });
        });
        it('should process xml', (done: MochaDone): void => {
            webcheck.once('result', (result: ICheerioPluginResult): void => {
                result.getCheerio((err: Error, $: CheerioStatic): void => {
                    if (err) {
                        return done(err);
                    }
                    if ($('title').text() === 'XML') {
                        return done();
                    }
                    return done(new Error('Wrong content'));
                });
            });
            webcheck.crawl({
                url: 'http://localhost:' + port + '/xml'
            }, (err: Error): void => {
                if (err) {
                    return done(err);
                }
            });
        });
        it('should load cheerio once', (done: MochaDone): void => {
            var first: CheerioStatic;
            webcheck.once('result', (result: ICheerioPluginResult): void => {
                result.getCheerio((err: Error, $: CheerioStatic): void => {
                    if (err) {
                        return done(err);
                    }
                    first = $;
                });
            });
            webcheck.once('result', (result: ICheerioPluginResult): void => {
                result.getCheerio((err: Error, $: CheerioStatic): void => {
                    if (err) {
                        return done(err);
                    }
                    if (first === $) {
                        return done();
                    }
                    return done(new Error('Not the same cheerio object'));
                });
            });
            webcheck.crawl({
                url: 'http://localhost:' + port
            }, (err: Error): void => {
                if (err) {
                    return done(err);
                }
            });
        });
        it('should get cheerio after processing', (done: MochaDone): void => {
            var first: CheerioStatic;
            webcheck.once('result', (result: ICheerioPluginResult): void => {
                result.getCheerio((err: Error, $: CheerioStatic): void => {
                    if (err) {
                        return done(err);
                    }
                    first = $;
                    setTimeout((): void => {
                        result.getCheerio((err2: Error, $2: CheerioStatic): void => {
                            if (err2) {
                                return done(err2);
                            }
                            if (first === $2) {
                                return done();
                            }
                            return done(new Error('Not the same cheerio object'));
                        });
                    }, 5);
                });
            });
            webcheck.crawl({
                url: 'http://localhost:' + port
            }, (err: Error): void => {
                if (err) {
                    return done(err);
                }
            });
        });
    });
    describe('Filter HTTP status code', (): void => {
        var webcheck: Webcheck,
            plugin: CheerioPlugin;

        before((): void => {
            webcheck = new Webcheck({});
            plugin = new CheerioPlugin({
                filterStatusCode: /^2/
            });
            webcheck.addPlugin(plugin);
            plugin.enable();
        });
        it('should have a getCheerio function in result', (done: MochaDone): void => {
            var found: boolean;
            webcheck.once('result', (result: ICheerioPluginResult): void => {
                if (typeof result.getCheerio === 'function') {
                    found = true;
                }
            });
            webcheck.crawl({
                url: 'http://localhost:' + port
            }, (err: Error): void => {
                if (err) {
                    return done(err);
                }
                if (found) {
                    return done();
                }
                return done(new Error('Function not found'));
            });
        });
        it('should have cheerioize result', (done: MochaDone): void => {
            webcheck.once('result', (result: ICheerioPluginResult): void => {
                result.getCheerio((err: Error, $: CheerioStatic): void => {
                    if (err) {
                        return done(err);
                    }
                    if ($('p').text() === 'index') {
                        return done();
                    }
                    return done(new Error('Wrong content'));
                });
            });
            webcheck.crawl({
                url: 'http://localhost:' + port
            }, (err: Error): void => {
                if (err) {
                    return done(err);
                }
            });
        });
        it('should have cheerioize result on http-error', (done: MochaDone): void => {
            webcheck.once('result', (result: ICheerioPluginResult): void => {
                if (typeof result.getCheerio === 'function') {
                    return done(new Error('Does not filter status code'));
                }
                return done();
            });
            webcheck.crawl({
                url: 'http://localhost:' + port + '/500'
            }, (err: Error): void => {
                if (err) {
                    return done(err);
                }
            });
        });
        it('should not have getCheerio if result is not html or xml', (done: MochaDone): void => {
            var notFound: boolean;
            webcheck.once('result', (result: ICheerioPluginResult): void => {
                if (typeof result.getCheerio !== 'function') {
                    notFound = true;
                }
            });
            webcheck.crawl({
                url: 'http://localhost:' + port + '/json'
            }, (err: Error): void => {
                if (err) {
                    return done(err);
                }
                if (notFound) {
                    return done();
                }
                return done(new Error('There was a getCheerio function'));
            });
        });
        it('should process xml', (done: MochaDone): void => {
            webcheck.once('result', (result: ICheerioPluginResult): void => {
                result.getCheerio((err: Error, $: CheerioStatic): void => {
                    if (err) {
                        return done(err);
                    }
                    if ($('title').text() === 'XML') {
                        return done();
                    }
                    return done(new Error('Wrong content'));
                });
            });
            webcheck.crawl({
                url: 'http://localhost:' + port + '/xml'
            }, (err: Error): void => {
                if (err) {
                    return done(err);
                }
            });
        });
        it('should load cheerio once', (done: MochaDone): void => {
            var first: CheerioStatic;
            webcheck.once('result', (result: ICheerioPluginResult): void => {
                result.getCheerio((err: Error, $: CheerioStatic): void => {
                    if (err) {
                        return done(err);
                    }
                    first = $;
                });
            });
            webcheck.once('result', (result: ICheerioPluginResult): void => {
                result.getCheerio((err: Error, $: CheerioStatic): void => {
                    if (err) {
                        return done(err);
                    }
                    if (first === $) {
                        return done();
                    }
                    return done(new Error('Not the same cheerio object'));
                });
            });
            webcheck.crawl({
                url: 'http://localhost:' + port
            }, (err: Error): void => {
                if (err) {
                    return done(err);
                }
            });
        });
        it('should get cheerio after processing', (done: MochaDone): void => {
            var first: CheerioStatic;
            webcheck.once('result', (result: ICheerioPluginResult): void => {
                result.getCheerio((err: Error, $: CheerioStatic): void => {
                    if (err) {
                        return done(err);
                    }
                    first = $;
                    setTimeout((): void => {
                        result.getCheerio((err2: Error, $2: CheerioStatic): void => {
                            if (err2) {
                                return done(err2);
                            }
                            if (first === $2) {
                                return done();
                            }
                            return done(new Error('Not the same cheerio object'));
                        });
                    }, 5);
                });
            });
            webcheck.crawl({
                url: 'http://localhost:' + port
            }, (err: Error): void => {
                if (err) {
                    return done(err);
                }
            });
        });
    });
});
