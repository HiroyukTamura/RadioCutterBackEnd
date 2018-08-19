"use strict";

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var functions = require('firebase-functions');
var admin = require('firebase-admin');

var _require = require('child_process'),
    execSync = _require.execSync;
// const request = require('request');


var rp = require('request-promise');
var cheerio = require('cheerio');

admin.initializeApp();
var fireStore = admin.firestore();
fireStore.settings({
    timestampsInSnapshots: true
});

exports.askAuthToken = functions.https.onCall(function (data, context) {
    var offset = data.offset;
    var keyLen = data.keyLen;
    var version = data.version;

    if (!(typeof offset === 'number')) throw new functions.https.HttpsError('invalid-argument', 'offset is wrong : offset : ' + offset);else if (!(typeof keyLen === 'number')) throw new functions.https.HttpsError('invalid-argument', 'keyLen is wrong : length : ' + keyLen);

    var segment = void 0;
    switch (version) {
        case 4:
            segment = "aSmartPhone4v4.0.3.bin";
            break;
        case 5:
            segment = "aSmartPhone6v5.0.6.bin";
            break;
        case 6:
            segment = "aSmartPhone7av6.3.0.bin";
            break;
        default:
            console.log("data.version is wrong : version : " + version);
            throw new functions.https.HttpsError('invalid-argument', 'version is wrong : version : ' + version);
    }

    var stdout = execSync('dd if=PartialKey/' + segment + ' bs=1 skip=' + offset + ' count=' + keyLen + ' 2> /dev/null | base64').toString();
    console.log(stdout);
    return stdout;
});

var stationCodeArr = [["802", "ABC", "ABS", "AFB", "AIR-G", "ALPHA-STATION", "BAYFM78", "BSN", "BSS", "CBC"], ["CCL", "CRK", "CROSSFM", "CRT", "DATEFM", "E-RADIO", "FBC", "FM_OITA", "FM_OKINAWA", "FM-FUJI"], ["FMAICHI", "FMF", "FMFUKUOKA", "FMGIFU", "FMGUNMA", "FMI", "FMJ", "FMK", "FMKAGAWA", "FMMIE"], ["FMN", "FMNAGASAKI", "FMNIIGATA", "FMO", "FMPORT", "FMT", "FMTOYAMA", "FMY", "GBS", "HBC"], ["HELLOFIVE", "HFM", "HOUSOU-DAIGAKU", "IBC", "IBS", "INT", "JOAB", "JOAK-FM", "JOAK", "JOAK"], ["JOBK", "JOCK", "JOCK", "JOEU-FM", "JOFK", "JOHK", "JOIK", "JOLK", "JORF", "JOZK"], ["JRT", "K-MIX", "KBC", "KBS", "KISSFMKOBE", "KNB", "KRY", "LFR", "LOVEFM", "MBC"], ["MBS", "MRO", "MRT", "MYUFM", "NACK5", "NBC", "NORTHWAVE", "OBC", "OBS", "QRR"], ["RAB", "RADIOBERRY", "RADIONEO", "RBC", "RCC", "RFC", "RKB", "RKC", "RKK", "RN1"], ["RN2", "RNB", "RNC", "ROK", "RSK", "SBC", "SBS", "STV", "TBC", "TBS"], ["TOKAIRADIO", "WBS", "YBC", "YBS", "YFM", "ZIP-FM"]];

exports.getWeekPrg = functions.https.onRequest(function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(req, res) {
        return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        if (!(req.body.pass != 'radiko' || !req.body.witch || req.body.witch > 9)) {
                            _context.next = 4;
                            break;
                        }

                        res.status(403).end();
                        _context.next = 7;
                        break;

                    case 4:
                        _context.next = 6;
                        return getWeekPrg(req.body.witch);

                    case 6:
                        res.status(200).end();

                    case 7:
                    case 'end':
                        return _context.stop();
                }
            }
        }, _callee, undefined);
    }));

    return function (_x, _x2) {
        return _ref.apply(this, arguments);
    };
}());

var getWeekPrg = function () {
    var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(arrayNum) {
        var _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, stCode, url, body, $, ttl, srvtime, progs, i, item, date;

        return regeneratorRuntime.wrap(function _callee2$(_context2) {
            while (1) {
                switch (_context2.prev = _context2.next) {
                    case 0:
                        _iteratorNormalCompletion = true;
                        _didIteratorError = false;
                        _iteratorError = undefined;
                        _context2.prev = 3;
                        _iterator = stationCodeArr[arrayNum][Symbol.iterator]();

                    case 5:
                        if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
                            _context2.next = 30;
                            break;
                        }

                        stCode = _step.value;
                        url = 'http://radiko.jp/v3/program/station/weekly/' + stCode + '.xml';
                        _context2.next = 10;
                        return rp(url).catch(function (e) {
                            console.error(e);
                        });

                    case 10:
                        body = _context2.sent;

                        if (body) {
                            _context2.next = 13;
                            break;
                        }

                        return _context2.abrupt('continue', 27);

                    case 13:
                        $ = cheerio.load(body);
                        ttl = $(body).find('ttl').html();
                        srvtime = $(body).find('srvtime').html();
                        progs = $(body).find('progs');
                        i = 0;

                    case 18:
                        if (!(i < progs.length)) {
                            _context2.next = 26;
                            break;
                        }

                        item = progs.eq(i);
                        date = item.find('date').html();
                        _context2.next = 23;
                        return fireStore.collection('progs').doc(stCode).collection(date).doc('single').set({
                            ttl: ttl,
                            srvtime: srvtime,
                            date: date,
                            xml: '<progs>' + item.html() + '</progs>' /*todo これ*/
                        }).catch(function (e) {
                            console.error(e);
                        });

                    case 23:
                        i++;
                        _context2.next = 18;
                        break;

                    case 26:

                        console.info('完了:', stCode);

                    case 27:
                        _iteratorNormalCompletion = true;
                        _context2.next = 5;
                        break;

                    case 30:
                        _context2.next = 36;
                        break;

                    case 32:
                        _context2.prev = 32;
                        _context2.t0 = _context2['catch'](3);
                        _didIteratorError = true;
                        _iteratorError = _context2.t0;

                    case 36:
                        _context2.prev = 36;
                        _context2.prev = 37;

                        if (!_iteratorNormalCompletion && _iterator.return) {
                            _iterator.return();
                        }

                    case 39:
                        _context2.prev = 39;

                        if (!_didIteratorError) {
                            _context2.next = 42;
                            break;
                        }

                        throw _iteratorError;

                    case 42:
                        return _context2.finish(39);

                    case 43:
                        return _context2.finish(36);

                    case 44:
                    case 'end':
                        return _context2.stop();
                }
            }
        }, _callee2, undefined, [[3, 32, 36, 44], [37,, 39, 43]]);
    }));

    return function getWeekPrg(_x3) {
        return _ref2.apply(this, arguments);
    };
}();

exports.request1st = functions.https.onCall(function () {
    var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(data, context) {
        var options, response, authToken, keyLen, keyOffset, authKey, splicedStr, partialKey;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
            while (1) {
                switch (_context3.prev = _context3.next) {
                    case 0:
                        // exports.request1st = functions.https.onRequest(async (req, res) => {
                        options = {
                            resolveWithFullResponse: true,
                            url: 'https://radiko.jp/v2/api/auth1',
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36',
                                'Accept-Encoding': 'ja,en-US;q=0.9,en;q=0.8',
                                'Access-Control-Request-Method': 'GET',
                                'Accept': '*/*',
                                'DNT': '1',
                                'Host': 'radiko.jp',
                                'Origin': 'http://radiko.jp',
                                'Referer': 'http://radiko.jp/',
                                'Access-Control-Request-Headers': 'x-radiko-app,x-radiko-app-version,x-radiko-device,x-radiko-user',
                                'X-Radiko-App': 'pc_html5',
                                'X-Radiko-App-Version': '0.0.1',
                                'X-Radiko-User': 'DUMMY_USER',
                                'X-Radiko-Device': 'pc'
                            }
                        };
                        _context3.next = 3;
                        return rp(options).catch(function (e) {
                            console.error(e);
                        });

                    case 3:
                        response = _context3.sent;

                        if (!(response.statusCode == 200)) {
                            _context3.next = 19;
                            break;
                        }

                        authToken = response.headers['x-radiko-authtoken'];
                        keyLen = response.headers['x-radiko-keylength'];
                        keyOffset = response.headers['x-radiko-keyoffset'];
                        authKey = "bcd151073c03b352e1ef2fd66c32209da9ca0afa";

                        if (!(!authToken || !keyLen || !keyOffset)) {
                            _context3.next = 13;
                            break;
                        }

                        console.log('httpErr', response.statusCode, response.body);
                        postError('err', response.body);
                        return _context3.abrupt('return');

                    case 13:
                        splicedStr = authKey.substr(keyOffset, keyLen);
                        partialKey = atob(splicedStr);

                        console.log('body', response.body);
                        console.log('authToken', authToken, 'keyLen', keyLen, 'keyOffset', keyOffset, 'partialKey', partialKey);
                        // res.status(200).end();

                        _context3.next = 21;
                        break;

                    case 19:
                        console.log('httpErr', e);
                        return _context3.abrupt('return', postError('httpErr', e));

                    case 21:
                    case 'end':
                        return _context3.stop();
                }
            }
        }, _callee3, undefined);
    }));

    return function (_x4, _x5) {
        return _ref3.apply(this, arguments);
    };
}());

function postError(witchErr, e) {
    fireStore.collection('request1st').doc().set({
        witchErr: witchErr,
        error: e
        // timestamp: fireStore.serverTimestamp().toDate()
    }).then(function (ref) {
        console.log('ログポスト完了 ', ref);
    }).catch(function (e) {
        console.error(e);
    });
}

function atob(a) {
    return new Buffer(a, 'base64').toString('binary');
}

// const sleep = msec => new Promise(resolve => setTimeout(resolve, msec));