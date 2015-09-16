/*jslint node:true*/

/*global describe, it, before, after, beforeEach, afterEach*/

'use strict';

var CheerioPlugin = require('../');

var Webcheck = require('webcheck');
var freeport = require('freeport');
var express = require('express');

describe('Cheerio Plugin', function () {
    var port;
    before(function (done) {
        var app = express();

        /*jslint unparam: true*/
        app.get('/', function (req, res) {
            res.send('<html><head></head><body><p>index</p></body></html>');
        });
        app.get('/500', function (req, res) {
            res.status(500).send('<html><head></head><body><p>500</p></body></html>');
        });
        app.get('/xml', function (req, res) {
            res.type('xml').send('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><directory><title>XML</title></directory>');
        });
        app.get('/json', function (req, res) {
            res.send({test: 'OK'});
        });
        /*jslint unparam: false*/

        freeport(function (err, p) {
            if (err) {
                done(err);
            }
            port = p;
            app.listen(port);
            done();
        });
    });

    describe('Basic functions', function () {
        var webcheck, plugin;

        before(function () {
            webcheck = new Webcheck();
            plugin = new CheerioPlugin();
            webcheck.addPlugin(plugin);
            plugin.enable();
        });
        it('should have a getCheerio function in result', function (done) {
            var found;
            webcheck.once('result', function (result) {
                if (typeof result.getCheerio === 'function') {
                    found = true;
                }
            });
            webcheck.crawl({
                url: 'http://localhost:' + port
            }, function (err) {
                if (err) {
                    return done(err);
                }
                if (found) {
                    return done();
                }
                return done(new Error('Function not found'));
            });
        });
        it('should have cheerioize result', function (done) {
            webcheck.once('result', function (result) {
                result.getCheerio(function (err, $) {
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
            }, function (err) {
                if (err) {
                    return done(err);
                }
            });
        });
        it('should have cheerioize result on http-error', function (done) {
            webcheck.once('result', function (result) {
                result.getCheerio(function (err, $) {
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
            }, function (err) {
                if (err) {
                    return done(err);
                }
            });
        });
        it('should not have getCheerio if result is not html or xml', function (done) {
            var notFound;
            webcheck.once('result', function (result) {
                if (typeof result.getCheerio !== 'function') {
                    notFound = true;
                }
            });
            webcheck.crawl({
                url: 'http://localhost:' + port + '/json'
            }, function (err) {
                if (err) {
                    return done(err);
                }
                if (notFound) {
                    return done();
                }
                return done(new Error('There was a getCheerio function'));
            });
        });
        it('should process xml', function (done) {
            webcheck.once('result', function (result) {
                result.getCheerio(function (err, $) {
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
            }, function (err) {
                if (err) {
                    return done(err);
                }
            });
        });
        it('should load cheerio once', function (done) {
            var first;
            webcheck.once('result', function (result) {
                result.getCheerio(function (err, $) {
                    if (err) {
                        return done(err);
                    }
                    first = $;
                });
            });
            webcheck.once('result', function (result) {
                result.getCheerio(function (err, $) {
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
            }, function (err) {
                if (err) {
                    return done(err);
                }
            });
        });
        it('should get cheerio after processing', function (done) {
            var first;
            webcheck.once('result', function (result) {
                result.getCheerio(function (err, $) {
                    if (err) {
                        return done(err);
                    }
                    first = $;
                    setTimeout(function () {
                        result.getCheerio(function (err, $) {
                            if (err) {
                                return done(err);
                            }
                            if (first === $) {
                                return done();
                            }
                            return done(new Error('Not the same cheerio object'));
                        });
                    }, 5);
                });
            });
            webcheck.crawl({
                url: 'http://localhost:' + port
            }, function (err) {
                if (err) {
                    return done(err);
                }
            });
        });
    });
    describe('Filter HTTP status code', function () {
        var webcheck, plugin;

        before(function () {
            webcheck = new Webcheck();
            plugin = new CheerioPlugin({
                filterStatusCode: /^2/
            });
            webcheck.addPlugin(plugin);
            plugin.enable();
        });
        it('should have a getCheerio function in result', function (done) {
            var found;
            webcheck.once('result', function (result) {
                if (typeof result.getCheerio === 'function') {
                    found = true;
                }
            });
            webcheck.crawl({
                url: 'http://localhost:' + port
            }, function (err) {
                if (err) {
                    return done(err);
                }
                if (found) {
                    return done();
                }
                return done(new Error('Function not found'));
            });
        });
        it('should have cheerioize result', function (done) {
            webcheck.once('result', function (result) {
                result.getCheerio(function (err, $) {
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
            }, function (err) {
                if (err) {
                    return done(err);
                }
            });
        });
        it('should have cheerioize result on http-error', function (done) {
            webcheck.once('result', function (result) {
                if (typeof result.getCheerio === 'function') {
                    return done(new Error('Does not filter status code'));
                }
                return done();
            });
            webcheck.crawl({
                url: 'http://localhost:' + port + '/500'
            }, function (err) {
                if (err) {
                    return done(err);
                }
            });
        });
        it('should not have getCheerio if result is not html or xml', function (done) {
            var notFound;
            webcheck.once('result', function (result) {
                if (typeof result.getCheerio !== 'function') {
                    notFound = true;
                }
            });
            webcheck.crawl({
                url: 'http://localhost:' + port + '/json'
            }, function (err) {
                if (err) {
                    return done(err);
                }
                if (notFound) {
                    return done();
                }
                return done(new Error('There was a getCheerio function'));
            });
        });
        it('should process xml', function (done) {
            webcheck.once('result', function (result) {
                result.getCheerio(function (err, $) {
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
            }, function (err) {
                if (err) {
                    return done(err);
                }
            });
        });
        it('should load cheerio once', function (done) {
            var first;
            webcheck.once('result', function (result) {
                result.getCheerio(function (err, $) {
                    if (err) {
                        return done(err);
                    }
                    first = $;
                });
            });
            webcheck.once('result', function (result) {
                result.getCheerio(function (err, $) {
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
            }, function (err) {
                if (err) {
                    return done(err);
                }
            });
        });
        it('should get cheerio after processing', function (done) {
            var first;
            webcheck.once('result', function (result) {
                result.getCheerio(function (err, $) {
                    if (err) {
                        return done(err);
                    }
                    first = $;
                    setTimeout(function () {
                        result.getCheerio(function (err, $) {
                            if (err) {
                                return done(err);
                            }
                            if (first === $) {
                                return done();
                            }
                            return done(new Error('Not the same cheerio object'));
                        });
                    }, 5);
                });
            });
            webcheck.crawl({
                url: 'http://localhost:' + port
            }, function (err) {
                if (err) {
                    return done(err);
                }
            });
        });
    });
});
