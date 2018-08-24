"use strict";

require('babel-polyfill');

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var functions = require('firebase-functions');
var admin = require('firebase-admin');

var _require = require('child_process'),
    execSync = _require.execSync;

var request = require('request');
var rp = require('request-promise');
var cheerio = require('cheerio');
var exec = require('child-process-promise').exec;

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

var getDefaultHeader = function getDefaultHeader() {
    return {
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
    };
};

var headers1st = function headers1st(version) {
    var segment = void 0;
    switch (version) {
        case 4:
            segment = "4.0.3";
            break;
        case 5:
            segment = "5.0.4";
            break;
        case 6:
            segment = "6.3.0";
            break;
    }

    if (!segment) return;

    return {
        'Access-Control-Request-Headers': 'x-radiko-app,x-radiko-app-version,x-radiko-device,x-radiko-user',
        'X-Radiko-App-Version': segment,
        'X-Radiko-User': 'dummy_user',
        'X-Radiko-Device': '23.5080K',
        'X-Radiko-App': 'aSmartPhone6'
    };
};

var getHeaders2nd = function getHeaders2nd(authToken, partialKey) {
    return {
        'X-Radiko-AuthToken': authToken,
        'X-Radiko-Partialkey': partialKey,
        'X-Radiko-User': 'dummy_user',
        'X-Radiko-Device': '23.5080K',
        'X-Radiko-App': 'aSmartPhone6',
        'X-Radiko-Delay': 0,
        'X-Radiko-AuthWait': 0,
        'X-Radiko-Connection': 0,
        'X-Radiko-Location': '34.39639,132.45944,gps'
    };
};

// exports.request1st = functions.https.onCall(async (data, context) => {
exports.request1st = functions.region('asia-northeast1').https.onRequest(function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(req, res) {
        var version, options, response1st, response, authToken, keyLen, keyOffset, segment, stdout, partialKey, options2nd;
        return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        version = 5; /*4-6であること*/

                        options = {
                            resolveWithFullResponse: true,
                            url: 'https://radiko.jp/v2/api/auth1',
                            headers: headers1st(version)
                        };
                        _context.next = 4;
                        return rp(options).catch(function (e) {
                            console.error(e);
                            res.status(200).end(e);
                            return;
                        });

                    case 4:
                        response1st = _context.sent;
                        _context.next = 7;
                        return rp(option).catch(function (err) {
                            res.status(200).end(err);
                            return;
                        });

                    case 7:
                        response = _context.sent;
                        authToken = response.headers['x-radiko-authtoken'];
                        keyLen = response.headers['x-radiko-keylength'];
                        keyOffset = response.headers['x-radiko-keyoffset'];
                        segment = void 0;
                        _context.t0 = version;
                        _context.next = _context.t0 === 4 ? 15 : _context.t0 === 5 ? 17 : _context.t0 === 6 ? 19 : 21;
                        break;

                    case 15:
                        segment = "aSmartPhone4v4.0.3.bin";
                        return _context.abrupt('break', 21);

                    case 17:
                        segment = "aSmartPhone6v5.0.6.bin";
                        return _context.abrupt('break', 21);

                    case 19:
                        segment = "aSmartPhone7av6.3.0.bin";
                        return _context.abrupt('break', 21);

                    case 21:
                        stdout = execSync('dd if=PartialKey/' + segment + ' bs=1 skip=' + keyOffset + ' count=' + keyLen + ' 2> /dev/null | base64').toString();
                        partialKey = stdout.split('\n')[0];


                        console.log('partialKey', partialKey);

                        options2nd = {
                            resolveWithFullResponse: true,
                            url: 'https://radiko.jp/v2/api/auth2',
                            headers: getHeaders2nd(authToken, partialKey)
                        };
                        return _context.abrupt('return', rp(options).then(function (body) {
                            console.log('2nd body', body);
                            res.status(200).end(err);
                        }).catch(function (err) {
                            console.log(err);
                            res.status(200).end(err);
                        }));

                    case 26:
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