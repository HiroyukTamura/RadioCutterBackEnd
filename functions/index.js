"use strict";

require('babel-polyfill');

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var functions = require('firebase-functions');
var admin = require('firebase-admin');

var _require = require('child_process'),
    execSync = _require.execSync,
    spawnSync = _require.spawnSync,
    exec = _require.exec;

var request = require('request');
var rp = require('request-promise');
var cheerio = require('cheerio');
// const exec = require('child-process-promise').exec;
var gcs = require('@google-cloud/storage')();
var path = require('path');
var os = require('os');
// const ffmpeg = require('fluent-ffmpeg');
var ffmpeg_static = require('ffmpeg-static');
var fs = require('fs');
var ffmpeg = require('android-ffmpeg-wrpaeer');

var serviceAccount = require('./radiko-7e63e-firebase-adminsdk-fikz0-9d7213ff57.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://radiko-7e63e.firebaseio.com"
});

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
        'X-Radiko-Delay': '0',
        'X-Radiko-AuthWait': '0',
        'X-Radiko-Connection': '0',
        'X-Radiko-Location': '34.39639,132.45944,gps'
    };
};

// exports.request1st = functions.https.onCall(async (data, context) => {
exports.request1st = functions.region('asia-northeast1').https.onRequest(function (req, res) {

    var version = 5; /*4-6であること*/

    var options = {
        resolveWithFullResponse: true,
        host: 'https://radiko.jp',
        path: 'v2/api/auth1',
        headers: headers1st(version)
    };

    return request(options, function (error, response, body) {
        if (error || response.statusCode != 200) {
            res.status(200).end(error + "  " + response);
            return;
        }

        console.log('body:', body); // Print the HTML for the Google homepage.
        res.status(200).end('body' + body);
        return;
    });

    // return rp(options).then(response => {
    // const authToken = response.headers['x-radiko-authtoken'];
    // const keyLen = response.headers['x-radiko-keylength'];
    // const keyOffset  = response.headers['x-radiko-keyoffset'];
    //
    // let segment;
    // switch (version) {
    //     case 4:
    //         segment = "aSmartPhone4v4.0.3.bin";
    //         break;
    //     case 5:
    //         segment = "aSmartPhone6v5.0.6.bin";
    //         break;
    //     case 6:
    //         segment = "aSmartPhone7av6.3.0.bin";
    //         break;
    // }
    //
    // const stdout = execSync(`dd if=PartialKey/${segment} bs=1 skip=${keyOffset} count=${keyLen} 2> /dev/null | base64`).toString();
    // const partialKey = stdout.split('\n')[0];

    // console.log('partialKey', partialKey);

    // const options2nd = {
    //     resolveWithFullResponse: true,
    //     url: 'https://radiko.jp/v2/api/auth2',
    //     headers: getHeaders2nd(authToken, partialKey)
    // };

    // return res.status(200).end('good work.');

    //     return rp(options2nd);
    //
    // })
    // .then(response => {
    //     console.log('2nd body', response);
    //     res.status(200).end(response);
    // })
    // .catch(e => {
    //     console.error(e);
    //     return res.status(200).end(e);
    // });
});

exports.testMethod = functions.region('asia-northeast1').https.onRequest(function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(req, res) {
        var command;
        return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        // if (object.name.split('/')[0] !== 'AacMp3')
                        //     return

                        // return ffmpegPromise().then(()=> {
                        //     console.log('good work');
                        // }).catch(e => {
                        //     console.log(e.message);
                        // });
                        command = ffmpeg_static.path + ' -y -protocol_whitelist file,http,https,tcp,tls,crypto -i ' + __dirname + '/sample_input.aac -codec:a libmp3lame -loglevel debug ' + __dirname + '/output.mp3';

                        console.log(command);
                        exec(command, { timeout: 30 * 1000 });

                        // const process = exec(command, (error, stdout, stderr) => {
                        //     if (error)
                        //         console.error(error);
                        //     if (stderr)
                        //         console.error(error)
                        //
                        //     console.log('まさかの完了');
                        // });
                        //
                        // await sleep(20 * 1000);
                        //
                        // if (process)
                        //     process.kill();

                        // await execPromise(command).catch(e => {
                        //     console.error(e);
                        //     return null;
                        // });

                        res.status(200).end();

                    case 4:
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

exports.generateThumbnail = functions.storage.object().onFinalize(function () {
    var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(object) {
        var bucket, results, metaData, token, tempFilePath, outputName, outputFilePath, command, uploadPath, message;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
            while (1) {
                switch (_context2.prev = _context2.next) {
                    case 0:
                        if (!(object.name.split('/')[0] !== 'AacMp3' || path.extname(object.name).toLowerCase() === '.mp3')) {
                            _context2.next = 2;
                            break;
                        }

                        return _context2.abrupt('return', null);

                    case 2:
                        bucket = gcs.bucket(object.bucket);
                        _context2.next = 5;
                        return bucket.file(object.name).getMetadata().catch(function (e) {
                            console.error(e);
                            return null;
                        });

                    case 5:
                        results = _context2.sent;
                        metaData = results[0];
                        token = metaData.token;


                        console.log('token', token);

                        tempFilePath = path.join(os.tmpdir(), path.basename(object.name));


                        console.log('tempFilePath', tempFilePath);

                        outputName = path.basename(object.name, '.aac') + '.mp3';

                        console.log('outputName', outputName);
                        outputFilePath = path.join(os.tmpdir(), outputName);

                        console.log('outputFilePath', outputFilePath);

                        _context2.next = 17;
                        return bucket.file(object.name).download({
                            destination: tempFilePath
                        }).catch(function (e) {
                            console.error(e);
                            return null;
                        });

                    case 17:

                        console.log('ふにふに');
                        fs.closeSync(fs.openSync(outputFilePath, 'w')); //空ファイルを作成
                        // const command = ffmpeg.getCurrentDir() +'/ffmpeg -y -i '+ tempFilePath +' -codec:a libmp3lame '+ outputFilePath;
                        command = ffmpeg_static.path + ' -y -protocol_whitelist file,http,https,tcp,tls,crypto -i ' + __dirname + '/sample_input.aac -codec:a libmp3lame ' + outputFilePath;

                        console.log(command);

                        execSync(command, { timeout: 40 * 1000 });

                        // await execPromise(command).catch(e => {
                        //     console.error(e);
                        //     return null;
                        // });

                        // const process = exec(command, (error, stdout, stderr) => {
                        //     if (error)
                        //         console.error(error);
                        //     if (stderr)
                        //         console.error(error)
                        //
                        //     console.log('まさかの完了');
                        // });
                        //
                        // await sleep(20 * 1000);

                        // if (process)
                        //     process.kill();

                        uploadPath = object.name.split('.')[0] + '.mp3';

                        console.log('uploadPath', uploadPath);

                        _context2.next = 26;
                        return bucket.upload(outputFilePath, {
                            destination: uploadPath
                        }).catch(function (e) {
                            console.error(e);
                            return null;
                        });

                    case 26:

                        fs.unlinkSync(tempFilePath);
                        fs.unlinkSync(outputFilePath);

                        _context2.next = 30;
                        return bucket.file(object.name).delete().catch(function (e) {
                            console.error(e);
                            return null;
                        });

                    case 30:
                        message = {
                            token: 'sample_token',
                            data: {
                                uploadPath: uploadPath
                            }
                        };
                        _context2.next = 33;
                        return admin.messaging().send(message).catch(function (e) {
                            console.error(e);
                        });

                    case 33:
                        return _context2.abrupt('return', _context2.sent);

                    case 34:
                    case 'end':
                        return _context2.stop();
                }
            }
        }, _callee2, undefined);
    }));

    return function (_x3) {
        return _ref2.apply(this, arguments);
    };
}());

// Makes an ffmpeg command return a promise.
function execPromise(command) {
    return new Promise(function (resolve, reject) {
        var process = exec(command, function (error, stdout, stderr) {
            if (error) return resolve(false);
            if (stderr) return resolve(false);

            resolve(true);
        });

        // setTimeout(() => {
        //     // タイムアウト後に行う処理を書く
        //     console.log('time out!');
        //     process.kill();
        //     resolve(true);
        // }, 30 * 1000);
    });
}

// const ffmpegPromise = ()=> {
//     return new Promise((resolve, reject) => {
//         ffmpeg(__dirname +'/sample_input.aac')
//             .setFfmpegPath(ffmpeg_static.path)
//             .audioCodec('libmp3lame')
//             .on('start', commandLine => {
//                 console.log('Spawned Ffmpeg with command: ' + commandLine);
//             })
//             .on('error', (err, stdout, stderr) => {
//                 console.log('Cannot process video: ' + err.message);
//                 reject(err);
//             })
//             .on('end', (stdout, stderr) => {
//                 console.log('Transcoding s  ucceeded !');
//                 resolve();
//             })
//             .on('progress', progress => {
//                 console.log('Processing: ' + progress.percent + '% done');
//             })
//             .inputOptions([
//                 '-protocol_whitelist', 'file,http,https,tcp,tls,crypto'
//             ])
//             // .outputOptions([
//             //     '-codec:a libmp3lame'
//             // ])
//             .output(__dirname  +'/output.mp3')
//             .run();
//     });
// };


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

var sleep = function sleep(msec) {
    return new Promise(function (resolve) {
        return setTimeout(resolve, msec);
    });
};