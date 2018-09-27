"use strict";

import 'babel-polyfill'

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { execSync, spawnSync, exec } = require('child_process');
const request = require('request');
const rp = require('request-promise');
const cheerio = require('cheerio');
// const exec = require('child-process-promise').exec;
const gcs = require('@google-cloud/storage')();
const path = require('path');
const os = require('os');
// const ffmpeg = require('fluent-ffmpeg');
const ffmpeg_static = require('ffmpeg-static');
const fs = require('fs');
const ffmpeg = require('android-ffmpeg-wrpaeer');


var serviceAccount = require('./radiko-7e63e-firebase-adminsdk-fikz0-9d7213ff57.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://radiko-7e63e.firebaseio.com"
});

const fireStore = admin.firestore();
fireStore.settings({
    timestampsInSnapshots: true
});

exports.askAuthToken = functions.https.onCall((data, context) => {
    const offset = data.offset;
    const keyLen = data.keyLen;
    const version = data.version;

    if (!(typeof offset === 'number'))
        throw new functions.https.HttpsError('invalid-argument', 'offset is wrong : offset : '+ offset);
    else if (!(typeof keyLen === 'number'))
        throw new functions.https.HttpsError('invalid-argument', 'keyLen is wrong : length : '+ keyLen);

    let segment;
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
            console.log("data.version is wrong : version : "+ version);
            throw new functions.https.HttpsError('invalid-argument', 'version is wrong : version : '+ version);
    }

    const stdout = execSync(`dd if=PartialKey/${segment} bs=1 skip=${offset} count=${keyLen} 2> /dev/null | base64`).toString();
    console.log(stdout);
    return stdout;
});

const getDefaultHeader = () => {
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
}

const headers1st = (version) => {
    let segment;
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

    if (!segment)
        return;

    return {
        'Access-Control-Request-Headers': 'x-radiko-app,x-radiko-app-version,x-radiko-device,x-radiko-user',
        'X-Radiko-App-Version': segment,
        'X-Radiko-User': 'dummy_user',
        'X-Radiko-Device': '23.5080K',
        'X-Radiko-App': 'aSmartPhone6'
    }
}

const getHeaders2nd = (authToken, partialKey)=> {
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
    }
}

// exports.request1st = functions.https.onCall(async (data, context) => {
exports.request1st = functions.region('asia-northeast1')
    .https.onRequest((req, res) => {

    const version = 5;/*4-6であること*/

    const options = {
        resolveWithFullResponse: true,
        host: 'https://radiko.jp',
        path: 'v2/api/auth1',
        headers: headers1st(version)
    };

    return request(options, (error, response, body) => {
        if (error || response.statusCode != 200) {
            res.status(200).end(error +"  "+ response);
            return;
        }

        console.log('body:', body); // Print the HTML for the Google homepage.
        res.status(200).end('body'+ body);
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

exports.testMethod = functions.region('asia-northeast1')
    .https.onRequest(async (req, res) => {


        res.status(200).end();

        return null;
    });


exports.generateThumbnail = functions.storage.object().onFinalize(async object => {

    if (object.name.split('/')[0] !== 'AacMp3' || path.extname(object.name).toLowerCase() === '.mp3')
        return null;


    const bucket = gcs.bucket(object.bucket);


    const results = await bucket.file(object.name).getMetadata().catch(e => {
        console.error(e);
        return null;
    });

    const metaData = results[0];
    const token = metaData.token;

    console.log('token', token);

    const tempFilePath = path.join(os.tmpdir(), path.basename(object.name));

    console.log('tempFilePath', tempFilePath);


    const outputName = path.basename(object.name, '.aac') +'.mp3';
    console.log('outputName', outputName);
    const outputFilePath = path.join(os.tmpdir(), outputName);
    console.log('outputFilePath', outputFilePath);

    await bucket.file(object.name).download({
        destination: tempFilePath,
    }).catch(e => {
        console.error(e);
        return null;
    });

    console.log('ふにふに');
    fs.closeSync(fs.openSync(outputFilePath, 'w'));//空ファイルを作成
    // const command = ffmpeg.getCurrentDir() +'/ffmpeg -y -i '+ tempFilePath +' -codec:a libmp3lame '+ outputFilePath;
    // const command = ffmpeg_static.path +' -y -protocol_whitelist file,http,https,tcp,tls,crypto -i '+ __dirname +'/sample_input.aac -codec:a libmp3lame '+ outputFilePath;
    // console.log(command);

    const args = ['-y', '-protocol_whitelist', 'file,http,https,tcp,tls,crypto', '-i', tempFilePath, '-codec:a', 'libmp3lame', outputFilePath];
    console.log(args);
    const output = spawnSync(ffmpeg_static.path, args, {timeout: 400 * 1000});
    console.log(output.stderr, output.error);

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

    const uploadPath = object.name.split('.')[0] + '.mp3';
    console.log('uploadPath', uploadPath);

    await bucket.upload(outputFilePath, {
        destination: uploadPath,
        resumable: false//tmpファイルに書き込む際、resumable:falseでなければならない @see https://cloud.google.com/nodejs/docs/reference/storage/1.7.x/Bucket#upload
    }).catch(e => {
        console.error(e);
        return null;
    });

    fs.unlinkSync(tempFilePath);
    fs.unlinkSync(outputFilePath);

    await bucket.file(object.name).delete().catch(e => {
        console.error(e);
        return null;
    });

    const message = {
        token: 'sample_token',
        data: {
            uploadPath: uploadPath
        }
    };

    return await admin.messaging().send(message).catch(e => {
        console.error(e);
    });
});

// Makes an ffmpeg command return a promise.
function execPromise(command) {
    return new Promise((resolve, reject) => {
        const process = exec(command, (error, stdout, stderr) => {
            if (error)
                return resolve(false);
            if (stderr)
                return resolve(false);

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
    fireStore.collection('request1st')
        .doc().set({
            witchErr: witchErr,
            error: e
            // timestamp: fireStore.serverTimestamp().toDate()
    }).then(ref => {
        console.log('ログポスト完了 ', ref);
    }).catch(e => {
        console.error(e);
    });
}

function atob(a) {
    return new Buffer(a, 'base64').toString('binary');
}

const sleep = msec => new Promise(resolve => setTimeout(resolve, msec));