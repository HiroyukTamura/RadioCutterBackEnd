"use strict";

import {CallableContext} from "firebase-functions/lib/providers/https";
import * as moment from "moment";
import {FfmpegRequestData} from "./ffmpeg_request_data";
import {FirestoreClient} from "./firestore_client";

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { execSync } = require('child_process');
require('request');
const rp = require('request-promise');

moment().format();

admin.initializeApp();
const fireStore = admin.firestore();
fireStore.settings({
    timestampsInSnapshots: true
});


exports.askAuthToken = functions.https.onCall((data: any, context: CallableContext) => {
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

exports.request1st = functions.https.onCall(async (data: any, context: CallableContext) => {
// exports.request1st = functions.https.onRequest(async (req, res) => {
    const options = {
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

    const response = await rp(options).catch((e: any) => {
        console.error(e);
    });

    if (response.statusCode === 200) {
        const authToken = response.headers['x-radiko-authtoken'];
        const keyLen = response.headers['x-radiko-keylength'];
        const keyOffset  = response.headers['x-radiko-keyoffset'];

        const authKey = "bcd151073c03b352e1ef2fd66c32209da9ca0afa";
        if (!authToken || !keyLen || !keyOffset) {
            console.log('httpErr', response.statusCode, response.body);
            postError('err', response.body);
            return;
        }

        const splicedStr = authKey.substr(keyOffset, keyLen);
        const partialKey = atob(splicedStr);
        console.log('body', response.body);
        console.log('authToken', authToken, 'keyLen', keyLen, 'keyOffset', keyOffset, 'partialKey', partialKey);

    } else {
        console.log('httpErr', response.statusCode);
        postError('httpErr', response.statusCode);
    }
});

function postError(witchErr: string, e: any) {
    fireStore.collection('request1st')
        .doc().set({
        witchErr: witchErr,
        error: e
        // timestamp: fireStore.serverTimestamp().toDate()
    }).then((ref: any) => {
        console.log('ログポスト完了 ', ref);
    }).catch((err: any) => {
        console.error(err);
    });
}

function atob(a: string) {
    return new Buffer(a, 'base64').toString('binary');
}

exports.requestRemoteFfmpeg = functions.https.onCall(async (data: any, context: CallableContext) => {
    let ffmpegRequestData: FfmpegRequestData;
    try {
        ffmpegRequestData = FfmpegRequestData.parse(data);
    } catch (e) {
        throw new functions.https.HttpsError('invalid-argument', e.toString());
    }

    await new FirestoreClient().postRemoteFfmpegStatus(data).catch(e => {
        console.error(e);
        throw e;
    });


});
// const sleep = msec => new Promise(resolve => setTimeout(resolve, msec));