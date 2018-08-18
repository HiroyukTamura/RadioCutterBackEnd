const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { execSync } = require('child_process');
const request = require('request');
admin.initializeApp();

// Saves a message to the Firebase Realtime Database but sanitizes the text by removing swearwords.
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


// void request1st() throws IOException, HttpChainException {
// @Cleanup Response response = request(AUTH1_URL, HEADERS_AUTH1, null);
//     if (!response.isSuccessful())
//         throw new HttpChainException(HTTP_ERROR, TAG, "errCode: "+ response.code() + "e rrMsg:"+ response.message(), "request1st");
//
//     authToken = response.header("x-radiko-authtoken");
//     int keyLen = Integer.parseInt(response.header("x-radiko-keylength"));
//     int offset = Integer.parseInt(response.header("x-radiko-keyoffset"));
//     String splicedStr = AUTH_KEY.substring(offset, keyLen + offset);
//     partialKey = Base64.encodeToString(splicedStr.getBytes(), Base64.NO_WRAP | Base64.URL_SAFE);
// }

// .add("Access-Control-Request-Headers", "x-radiko-app,x-radiko-app-version,x-radiko-device,x-radiko-user")
//     .add("X-Radiko-App", "pc_html5")
//     .add("X-Radiko-App-Version", "0.0.1")
//     .add("X-Radiko-User", "dummy_user")
//     .add("X-Radiko-Device", "pc")
//     .build();

// exports.request1st = functions.https.onCall((data, context) => {
exports.date = functions.https.onRequest((req, res) => {
    const options = {
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

    request(options, (error, response, body)=> {
        console.log("request");

        if (!error && response.statusCode == 200) {
            const authToken = response.headers['x-radiko-authtoken'];
            const keyLen = response.headers['x-radiko-keylength'];
            const keyOffset  = response.headers['x-radiko-keyoffset'];

            const authKey = "bcd151073c03b352e1ef2fd66c32209da9ca0afa";
            if (!authToken || !keyLen || !keyOffset) {
                console.log('httpErr', response.statusCode, body);
                postError('err', response.statusCode, body);
                return;
            }
            const splicedStr = authKey.substr(keyOffset, keyLen);
            const partialKey = atob(splicedStr);
            console.log('body', body);
            console.log('response', response);
            console.log('partialKey', partialKey);
        } else {
            console.log('httpErr', response.statusCode, body);
            postError('httpErr', response.statusCode, body);
        }
    });
});

function postError(witchErr, resCode, body) {
    const fireStotre = admin.firestore();
    fireStotre.collection('request1st')
        .doc().set({
            witchErr: witchErr,
            statusCode: resCode,
            body: body,
            timestamp: fireStotre.serverTimestamp()
    }).then(ref => {
        console.log('ログポスト完了 ', ref);
    }).catch(e => {
        console.error(e);
    });
}

function atob(a) {
    return new Buffer(a, 'base64').toString('binary');
}