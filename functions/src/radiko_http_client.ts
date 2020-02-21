import * as rp from "request-promise";
import * as fs from "fs-extra";
const {Parser} = require('m3u8-parser');
import {Util} from "./util";

export class RadikoHttpClient {
    constructor(station: string, ftStr: string, toStr: string) {
        this.station = station;
        this.ftStr = ftStr;
        this.toStr = toStr;
    }

    private readonly station: string;
    private readonly ftStr: string;
    private readonly toStr: string;

    private authToken: string | undefined;
    private partialKey: string | undefined;
    private playlistUrl: string | undefined;

    private manifestUrl: string| undefined;
    private location: string | undefined;

    private static get defaultHeaders(): Map<string, string> {
        return new Map().set('User-Agent', 'Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36')
            .set('Referer', 'http://radiko.jp/')
            .set('X-Radiko-App', 'aSmartPhone6')
            .set('X-Radiko-App-Version', '0.0.1')
            .set('X-Radiko-User', 'dummy_user')
            .set('X-Radiko-Device', '19.NX513J')
            .set('X-Radiko-AppType', 'android')
            .set('X-Radiko-Delay', '0')
            .set('X-Radiko-AuthWait', '0')
            .set('X-Radiko-Connection', 'mobile');
    }

    private static get headersForRequest1st() {
        return this.defaultHeaders.set('Access-Control-Request-Headers', 'x-radiko-app,x-radiko-app-version,x-radiko-device,x-radiko-user');
    }

    private get headersForRequestWithAuth() {
        return RadikoHttpClient.defaultHeaders
            .set('X-Radiko-AuthToken', this.authToken!!)
            .set('X-Radiko-Partialkey', this.partialKey!!)
            .set('X-Radiko-Location', this.location!!);
    }

    async request1stInClient() {
        const options = {
            url: 'https://radiko.jp/v2/api/auth1',
            headers: Util.map2Obj(RadikoHttpClient.headersForRequest1st),
        };

        const response = await rp(options);
        this.authToken = response.headers['x-radiko-authtoken'];
        const keyLen = response.headers['x-radiko-keylength'];
        const keyOffset = response.headers['x-radiko-keyoffset'];

        const authKey = "bcd151073c03b352e1ef2fd66c32209da9ca0afa";
        if (!this.authToken || !keyLen || !keyOffset)
            throw new Error(`${this.authToken}, ${keyLen}, ${keyOffset}`);

        const splicedStr = authKey.substr(keyOffset, keyLen);
        this.partialKey = atob(splicedStr);
        console.log('body', response.body);
        console.log('authToken', this.authToken, 'keyLen', keyLen, 'keyOffset', keyOffset, 'partialKey', this.partialKey);
    }

    async request2nd(location: string) {
        const opt = {
            url: 'https://radiko.jp/v2/api/auth2',
            headers: Util.map2Obj(this.headersForRequestWithAuth),
        };
        await rp(opt);
    }

    async requestStationUrl(){
        const $ = await rp({
            url: `http://radiko.jp/v2/station/stream_rpaa/${this.station}.xml`,
            transform: (body: any) => cheerio.load(body),
        });
        const url = $('url[areafree=0][timefree=1] > playlist_create_url');
        if (Util.isString(url))
            throw new Error(`wrong url:: ${url}`);
        this.playlistUrl = url;
    }

    async setGps(){
        const json = await fs.readJson(`${__dirname}/../json/st_list_for_all.json`);
        const list = json['StListForAll'][this.station]['stIdarr'] as Array<number>;
        const index = Util.getRandomInt(0, list.length-1);
        const prefectureNum = list[index];
        const gpsJson = await fs.readJson(`${__dirname}/../json/gps.json`);
        const gps = gpsJson[`areaId_${prefectureNum}`][0];
        this.location = `${gps},gps`;
    }

    async requestPlaylistM3U8(){
        const resp = await rp({
            url: this.playlistUrl!!,
            qs: {
                station_id: this.station,
                l: '15',
                ft: this.ftStr,
                to: this.toStr,
            },
            headers: Util.map2Obj(this.headersForRequestWithAuth),
        });

        const parser = new Parser();
        parser.push(resp.toString());
        parser.end();
        const manifestUrl = parser.manifest['playlists'][0]['uri'];
        if (!Util.isString(manifestUrl))
            throw new Error(`invalid url: ${manifestUrl}`);

        this.manifestUrl = manifestUrl;
        console.log(this.manifestUrl);
    }
}