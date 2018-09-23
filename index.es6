"use strict";

import 'babel-polyfill'

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { execSync } = require('child_process');
const request = require('request');
const rp = require('request-promise');
const cheerio = require('cheerio');
const exec = require('child-process-promise').exec;
const gcs = require('@google-cloud/storage')();
const path = require('path');
const os = require('os');
const ffmpeg = require('fluent-ffmpeg');
const ffmpeg_static = require('ffmpeg-static');
const fs = require('fs');

admin.initializeApp();
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
    .https.onRequest((req, res) => {
        res.status(200).end();
        // if (object.name.split('/')[0] !== 'AacMp3')
        //     return

        // return ffmpegPromise().then(()=> {
        //     console.log('good work');
        // }).catch(e => {
        //     console.log(e.message);
        // });
        const command = 'ffmpeg -y -i '+ __dirname +'/sample_input.aac -codec:a libmp3lame -loglevel debug'+ __dirname  +'/output.mp3';
        console.log(command);
        exec(command);

        return null;
    });


exports.generateThumbnail = functions.storage.object().onFinalize(async object => {
    const bucket = gcs.bucket(object.bucket);
    const results = await bucket.file(object.name).getMetadata().catch(e => {
        console.error(e);
        return null;
    });

    const metaData = results[0];
    const token = metaData.token;

    console.log('token', token);

    const tempFilePath = path.join(os.tmpdir(), path.basename(object.name));

    if (object.name.split('/')[0] !== 'AacMp3')
        return;

    console.log('hmm');


    const outputName = path.basename(object.name, '.aac') +'.mp3';
    const outputFilePath = path.join(os.tmpdir(), outputName);
    console.log('outputFilePath', outputFilePath);

    await bucket.file(object.name).download({
        destination: tempFilePath,
    });

    fs.closeSync(fs.openSync(outputFilePath, 'w'));//空ファイルを作成
    const command = ffmpeg_static.path +' -y -i '+ tempFilePath +' -codec:a libmp3lame -loglevel debug '+ outputFilePath;
    console.log(command);
    exec(command);


    const uploadPath = path.join(path.dirname(object.bucket), '.mp3');
    await bucket.upload(outputFilePath, {
        destination: uploadPath,
        metadata: object.metadata
    });

    fs.unlinkSync(tempFilePath);
    fs.unlinkSync(outputFilePath);

    await await bucket.file(object.name).delete();

    const message = {
        "message":{
            "token": token,
            "data": {
                uploadPath: uploadPath
            }
        }
    };

    await admin.messaging().send(message).catch(e => {
        console.error(e);
    });

    return null;
});

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

// const sleep = msec => new Promise(resolve => setTimeout(resolve, msec));