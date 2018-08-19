"use strict";

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var functions = require('firebase-functions');
var admin = require('firebase-admin');

var _require = require('child_process'),
    execSync = _require.execSync;

var request = require('request');
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

exports.getWeekPrg = functions.https.onRequest(function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(req, res) {
        var stationCodeArr, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, stCode, url, body, $, ttl, srvtime, progs, i, item, date, ref;

        return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        // setTimeout(() => {
                        //     console.log('Function running...');
                        //     res.status(200).end();
                        // }, 8 * 60 * 1000); // 8 minute delay

                        stationCodeArr = ["802", "ABC", "ABS", "AFB", "AIR-G", "ALPHA-STATION", "BAYFM78", "BSN", "BSS", "CBC", "CCL", "CRK", "CROSSFM", "CRT", "DATEFM", "E-RADIO", "FBC", "FM_OITA", "FM_OKINAWA", "FM-FUJI", "FMAICHI", "FMF", "FMFUKUOKA", "FMGIFU", "FMGUNMA", "FMI", "FMJ", "FMK", "FMKAGAWA", "FMMIE", "FMN", "FMNAGASAKI", "FMNIIGATA", "FMO", "FMPORT", "FMT", "FMTOYAMA", "FMY", "GBS", "HBC", "HELLOFIVE", "HFM", "HOUSOU-DAIGAKU", "IBC", "IBS", "INT", "JOAB", "JOAK-FM", "JOAK", "JOAK", "JOBK", "JOCK", "JOCK", "JOEU-FM", "JOFK", "JOHK", "JOIK", "JOLK", "JORF", "JOZK", "JRT", "K-MIX", "KBC", "KBS", "KISSFMKOBE", "KNB", "KRY", "LFR", "LOVEFM", "MBC", "MBS", "MRO", "MRT", "MYUFM", "NACK5", "NBC", "NORTHWAVE", "OBC", "OBS", "QRR", "RAB", "RADIOBERRY", "RADIONEO", "RBC", "RCC", "RFC", "RKB", "RKC", "RKK", "RN1", "RN2", "RNB", "RNC", "ROK", "RSK", "SBC", "SBS", "STV", "TBC", "TBS", "TOKAIRADIO", "WBS", "YBC", "YBS", "YFM", "ZIP-FM"];
                        _iteratorNormalCompletion = true;
                        _didIteratorError = false;
                        _iteratorError = undefined;
                        _context.prev = 4;
                        _iterator = stationCodeArr[Symbol.iterator]();

                    case 6:
                        if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
                            _context.next = 34;
                            break;
                        }

                        stCode = _step.value;
                        url = 'http://radiko.jp/v3/program/station/weekly/' + stCode + '.xml';
                        _context.next = 11;
                        return rp(url).catch(function (e) {
                            console.error(e);
                        });

                    case 11:
                        body = _context.sent;

                        if (body) {
                            _context.next = 14;
                            break;
                        }

                        return _context.abrupt('continue', 31);

                    case 14:
                        $ = cheerio.load(body);
                        ttl = $(body).find('ttl').html();
                        srvtime = $(body).find('srvtime').html();
                        progs = $(body).find('progs');
                        i = 0;

                    case 19:
                        if (!(i < progs.length)) {
                            _context.next = 29;
                            break;
                        }

                        item = progs.eq(i);
                        date = item.find('date').html();
                        _context.next = 24;
                        return fireStore.collection('progs').doc(stCode).collection(date).doc('single').set({
                            ttl: ttl,
                            srvtime: srvtime,
                            date: date,
                            xml: '<progs>' + item.html() + '</progs>' /*todo これ*/
                        }).catch(function (e) {
                            console.error(e);
                        });

                    case 24:
                        ref = _context.sent;


                        console.info('ref', ref);

                    case 26:
                        i++;
                        _context.next = 19;
                        break;

                    case 29:
                        _context.next = 31;
                        return sleep(1000);

                    case 31:
                        _iteratorNormalCompletion = true;
                        _context.next = 6;
                        break;

                    case 34:
                        _context.next = 40;
                        break;

                    case 36:
                        _context.prev = 36;
                        _context.t0 = _context['catch'](4);
                        _didIteratorError = true;
                        _iteratorError = _context.t0;

                    case 40:
                        _context.prev = 40;
                        _context.prev = 41;

                        if (!_iteratorNormalCompletion && _iterator.return) {
                            _iterator.return();
                        }

                    case 43:
                        _context.prev = 43;

                        if (!_didIteratorError) {
                            _context.next = 46;
                            break;
                        }

                        throw _iteratorError;

                    case 46:
                        return _context.finish(43);

                    case 47:
                        return _context.finish(40);

                    case 48:

                        res.status(200).end();

                    case 49:
                    case 'end':
                        return _context.stop();
                }
            }
        }, _callee, undefined, [[4, 36, 40, 48], [41,, 43, 47]]);
    }));

    return function (_x, _x2) {
        return _ref.apply(this, arguments);
    };
}());

// exports.request1st = functions.https.onCall((data, context) => {
exports.date = functions.https.onRequest(function (req, res) {
    var options = {
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

    request(options, function (error, response, body) {
        console.log("request");

        if (!error && response.statusCode == 200) {
            var authToken = response.headers['x-radiko-authtoken'];
            var keyLen = response.headers['x-radiko-keylength'];
            var keyOffset = response.headers['x-radiko-keyoffset'];

            var authKey = "bcd151073c03b352e1ef2fd66c32209da9ca0afa";
            if (!authToken || !keyLen || !keyOffset) {
                console.log('httpErr', response.statusCode, body);
                postError('err', response.statusCode, body);
                return;
            }
            var splicedStr = authKey.substr(keyOffset, keyLen);
            var partialKey = atob(splicedStr);
            console.log('body', body);
            console.log('authToken', authToken, 'keyLen', keyLen, 'keyOffset', keyOffset, 'partialKey', partialKey);
        } else {
            console.log('httpErr', response.statusCode, body);
            postError('httpErr', response.statusCode, body);
        }
    });
});

function postError(witchErr, resCode, body) {
    fireStore.collection('request1st').doc().set({
        witchErr: witchErr,
        statusCode: resCode,
        body: body,
        timestamp: fireStore.serverTimestamp().toDate()
    }).then(function (ref) {
        console.log('ログポスト完了 ', ref);
    }).catch(function (e) {
        console.error(e);
    });
}

function atob(a) {
    return new Buffer(a, 'base64').toString('binary');
}

var sleep = function sleep(msec) {
    return new Promise(function (resolve) {
        return setTimeout(resolve, msec);
    });
};