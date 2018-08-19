"use strict";

import 'babel-polyfill'

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { execSync } = require('child_process');
const request = require('request');
const rp = require('request-promise');
const cheerio = require('cheerio');

admin.initializeApp();
const fireStore = admin.firestore();
fireStore.settings({
    timestampsInSnapshots: true
});

http.createServer((req, resp) => {
    response.writeHead(200, {'Content-Type': 'text/plain'}); //レスポンスヘッダーに書き込み
    response.write('Hello World\n'); // レスポンスボディに「Hello World」を書き込み
    response.end(); // レスポンス送信を完了する
});

server.listen(process.env.PORT || 8080);  //8080番ポートで待ち受け

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


const stationCodeArr = [["802","ABC","ABS","AFB","AIR-G","ALPHA-STATION","BAYFM78","BSN","BSS","CBC"],
    ["CCL","CRK","CROSSFM","CRT","DATEFM","E-RADIO","FBC","FM_OITA","FM_OKINAWA","FM-FUJI"],
    ["FMAICHI","FMF","FMFUKUOKA","FMGIFU","FMGUNMA","FMI","FMJ","FMK","FMKAGAWA","FMMIE"],
    ["FMN","FMNAGASAKI","FMNIIGATA","FMO","FMPORT","FMT","FMTOYAMA","FMY","GBS","HBC"],
    ["HELLOFIVE","HFM","HOUSOU-DAIGAKU","IBC","IBS","INT","JOAB","JOAK-FM","JOAK","JOAK"],
    ["JOBK","JOCK","JOCK","JOEU-FM","JOFK","JOHK","JOIK","JOLK","JORF","JOZK"],
    ["JRT","K-MIX","KBC","KBS","KISSFMKOBE","KNB","KRY","LFR","LOVEFM","MBC"],
    ["MBS","MRO","MRT","MYUFM","NACK5","NBC","NORTHWAVE","OBC","OBS","QRR"],
    ["RAB","RADIOBERRY","RADIONEO","RBC","RCC","RFC","RKB","RKC","RKK","RN1"],
    ["RN2","RNB","RNC","ROK","RSK","SBC","SBS","STV","TBC","TBS"],
    ["TOKAIRADIO","WBS","YBC","YBS","YFM","ZIP-FM"]];

// exports.getWeekPrg = functions.https.onRequest(async (req, res) => {
//     if (req.body.pass != 'radiko' || !req.body.witch || req.body.witch > 9)
//         res.status(403).end();
//     else {
//         await getWeekPrg(req.body.witch);
//         res.status(200).end();
//     }
// });

const getWeekPrg = async (arrayNum) => {
    for (const stCode of stationCodeArr[arrayNum]) {
        const url = 'http://radiko.jp/v3/program/station/weekly/'+ stCode +'.xml';
        const body = await rp(url).catch(e => {
            console.error(e);
        });

        if (!body) continue;
        const $ = cheerio.load(body);

        const ttl = $(body).find('ttl').html();
        const srvtime = $(body).find('srvtime').html();
        const progs = $(body).find('progs');
        for(let i=0; i<progs.length; i++){
            const item = progs.eq(i);
            const date = item.find('date').html();
            await fireStore.collection('progs').doc(stCode).collection(date).doc('single').set({
                ttl: ttl,
                srvtime: srvtime,
                date: date,
                xml: '<progs>'+ item.html() +'</progs>'/*todo これ*/
            }).catch(e => {
                console.error(e);
            });
        }

        console.info('完了:', stCode);
    }
};


exports.request1st = functions.https.onCall(async (data, context) => {
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

    const response = await rp(options).catch(e => {
        console.error(e);
    });

    if (response.statusCode == 200) {
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
        // res.status(200).end();

    } else {
        console.log('httpErr', e);
        return postError('httpErr', e);
    }
});

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