const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { exec } = require('child_process');
admin.initializeApp();

// Saves a message to the Firebase Realtime Database but sanitizes the text by removing swearwords.
exports.askAuthToken = functions.https.onCall((data, context) => {
    const offset = data.offset;
    const length = data.length;
    const version = data.version;
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
            throw new functions.https.HttpsError('invalid-argument', 'data.version is wrong : version : '+ version);
    }

    exec(`dd if=PartialKey/${segment} bs=1 skip=${offset} count=${length}`, (err, stdout, stderr) => {
        if (err) {
            console.error(err);
            throw new functions.https.HttpsError('unknown', err);
        }
        console.log(stdout);
        return err;
    });
});
