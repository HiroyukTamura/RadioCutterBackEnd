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

admin.initializeApp();
var fireStore = admin.firestore();
fireStore.settings({
    timestampsInSnapshots: true
});

http.createServer(function (req, resp) {
    response.writeHead(200, { 'Content-Type': 'text/plain' }); //レスポンスヘッダーに書き込み
    response.write('Hello World\n'); // レスポンスボディに「Hello World」を書き込み
    response.end(); // レスポンス送信を完了する
});

server.listen(process.env.PORT || 8080); //8080番ポートで待ち受け

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

exports.request1st = functions.https.onCall(function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(data, context) {
        var options, response, authToken, keyLen, keyOffset, authKey, splicedStr, partialKey;
        return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
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
                        _context.next = 3;
                        return rp(options).catch(function (e) {
                            console.error(e);
                        });

                    case 3:
                        response = _context.sent;

                        if (!(response.statusCode == 200)) {
                            _context.next = 19;
                            break;
                        }

                        authToken = response.headers['x-radiko-authtoken'];
                        keyLen = response.headers['x-radiko-keylength'];
                        keyOffset = response.headers['x-radiko-keyoffset'];
                        authKey = "bcd151073c03b352e1ef2fd66c32209da9ca0afa";

                        if (!(!authToken || !keyLen || !keyOffset)) {
                            _context.next = 13;
                            break;
                        }

                        console.log('httpErr', response.statusCode, response.body);
                        postError('err', response.body);
                        return _context.abrupt('return');

                    case 13:
                        splicedStr = authKey.substr(keyOffset, keyLen);
                        partialKey = atob(splicedStr);

                        console.log('body', response.body);
                        console.log('authToken', authToken, 'keyLen', keyLen, 'keyOffset', keyOffset, 'partialKey', partialKey);
                        // res.status(200).end();

                        _context.next = 21;
                        break;

                    case 19:
                        console.log('httpErr', e);
                        return _context.abrupt('return', postError('httpErr', e));

                    case 21:
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