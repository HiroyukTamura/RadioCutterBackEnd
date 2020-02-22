/**
 * @see RadikoHttpClient
 */
import {RadikoHttpClient, Request1stResult} from "../src/radiko_http_client";
import {AuthTokenGenerator} from "../src/auth_token_generator";
import {FfmpegTask} from "../src/ffmpeg_client";
import {CloudStorage} from "../src/cloud_storage";
import {FfmpegStatus, FirestoreClient} from "../src/firestore_client";
import {FfmpegRequestData, Format} from "../src/ffmpeg_request_data";
import * as moment from "moment";
import * as admin from "firebase-admin";
import {Env} from "../src/env";
// import * as os from "os";
// import * as fs from "fs-extra";

describe('all', () => {

    const serviceAccount = require("../../radiko-7e63e-firebase-adminsdk-jc8w7-e7d7a4334d.json");

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://radiko-7e63e.firebaseio.com"
    });

    admin.firestore().settings({
        timestampsInSnapshots: true
    });

    Env.IS_RELEASE = false;

    jest.setTimeout(100000000);

    const STATION = 'TBS';
    const ftStr = '20200221200000';
    const toStr = '20200221210000';
    const ftTime = moment('YYYYMMDDMMDDHHmmss', ftStr);
    const toTime = moment('YYYYMMDDMMDDHHmmss', toStr);

    const format = Format.MP3;
    const firestoreClient = new FirestoreClient();

    const client = new RadikoHttpClient(STATION, ftStr, toStr);
    let request1stResult: Request1stResult;

    test('requestStationUrl', async () => {
        await client.requestStationUrl();
        expect(client.playlistUrl);
    });

    test('getGps', async () => {
        await client.setGps();
        expect(client.location);
    });

    test('request1stInClient', async () => {
        request1stResult = await client.request1stInClient();
        expect(request1stResult);
        expect(request1stResult.keyLen);
        expect(request1stResult.keyOffset);
        expect(request1stResult.authToken);
    });

    test('request2nd', async () => {
        const key = await AuthTokenGenerator.generate(request1stResult.keyOffset, request1stResult.keyLen, 5);
        client.partialKey = key.replace('\n', '');
        await client.request2nd();
    });

    test('requestPlaylistM3U8', async () => await client.requestPlaylistM3U8());

    test('downloadAllAac', async () => await client.downloadAllAac());

    test('ffmpegService', async () => {

        const data = new FfmpegRequestData(format, STATION, ftStr, toStr, ftTime, toTime);
        const task = new FfmpegTask(data, client.txtFilePath);
        await task.startFfmpegSpawn();
        const remoteUrl = await new CloudStorage().upload(data.format, data.station, data.ftStr, task.outputPath);
        await firestoreClient.postRemoteFfmpegStatus(data, FfmpegStatus.SUCCESS, true, remoteUrl);
        // await fs.emptyDir(os.tmpdir());

    }, 1000 * 60 * 20);
});