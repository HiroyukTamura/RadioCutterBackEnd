import * as rp from "request-promise";
import * as fs from "fs-extra";
import * as cheerio from "cheerio";
import {Util} from "./util";
import {Env} from "./env";
import * as path from "path";
import * as os from "os";

const {Parser} = require('m3u8-parser');

export class RadikoHttpClient {

    get manifestUrl(): string | undefined {
        return this._manifestUrl;
    }

    get location(): string | undefined {
        return this._location;
    }

    get playlistUrl(): string | undefined {
        return this._playlistUrl;
    }

    constructor(station: string, ftStr: string, toStr: string) {
        this.station = station;
        this.ftStr = ftStr;
        this.toStr = toStr;
        this.txtFilePath = this.genTxtFilePath();
    }

    private readonly station: string;
    private readonly ftStr: string;
    private readonly toStr: string;
    readonly txtFilePath: string;

    authToken: string | undefined;
    partialKey: string | undefined;
    private _playlistUrl: string | undefined;

    private _manifestUrl: string | undefined;
    private _location: string | undefined;

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

    private get headersForRequestWithAuth() {
        return RadikoHttpClient.defaultHeaders
            .set('X-Radiko-AuthToken', this.authToken!!)
            .set('X-Radiko-Partialkey', this.partialKey!!)
            .set('X-Radiko-Location', this._location!!);
    }

    async request1stInClient() {
        const options = {
            resolveWithFullResponse: true,
            url: 'https://radiko.jp/v2/api/auth1',
            headers: Util.map2Obj(RadikoHttpClient.defaultHeaders),
        };

        const response = await rp(options);
        const authToken = response.headers['x-radiko-authtoken'];
        const keyLen = response.headers['x-radiko-keylength'];
        const keyOffset = response.headers['x-radiko-keyoffset'];

        console.log('authToken', authToken, 'keyLen', keyLen, 'keyOffset', keyOffset);
        this.authToken = authToken;
        return new Request1stResult(authToken, keyLen, keyOffset);
    }

    async request2nd() {
        const opt = {
            url: 'https://radiko.jp/v2/api/auth2',
            headers: Util.map2Obj(this.headersForRequestWithAuth),
        };
        await rp(opt);
    }

    async requestStationUrl() {
        const $ = await rp({
            url: `http://radiko.jp/v2/station/stream_rpaa/${this.station}.xml`,
            transform: (body: any) => cheerio.load(body),
        });
        this._playlistUrl = $('url[areafree=0][timefree=1] > playlist_create_url').text();
    }

    async setGps() {
        const json = await fs.readJson(`${__dirname}/../json/st_list_for_all.json`);
        const list = json['StListForAll'][this.station]['stIdarr'] as Array<number>;
        const index = Util.getRandomInt(0, list.length - 1);
        const prefectureNum = list[index];
        const gpsJson = await fs.readJson(`${__dirname}/../json/gps.json`);
        const gps = gpsJson[`areaId_${prefectureNum}`][0];
        this._location = `${gps},gps`;
    }

    async requestPlaylistM3U8() {
        const resp = await rp({
            url: this._playlistUrl!!,
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

        this._manifestUrl = manifestUrl;
        console.log(this._manifestUrl);
    }

    async downloadAllAac() {
        const resp = await rp(this.manifestUrl!!);
        const parser = new Parser();
        parser.push(resp.toString());
        parser.end();

        const segments = parser.manifest.segments as Array<any>;
        let count = 0;
        const localPathList: Array<string> = [];
        for (const segment of segments) {
            const localPath = path.join(os.tmpdir(), `${count}.aac`);
            localPathList.push(localPath);
            const data = await rp({uri: segment.uri, encoding: null});
            await fs.writeFile(localPath, data);
            count++;
            await Util.sleep(250);
            console.log(count);
        }
        const string = localPathList.map((value, index) => `file '${value}'`).join('\n');
        await fs.writeFile(this.genTxtFilePath(), string);
    }

    private genTxtFilePath() {
        if (Env.IS_RELEASE)
            return path.join(os.tmpdir(), `${this.station}_${this.ftStr}.txt`);
        else
            return path.join(__dirname, `${this.station}_${this.ftStr}.txt`);
    }
}

export class Request1stResult {
    constructor(authToken: string, keyLen: number, keyOffset: number) {
        this.authToken = authToken;
        this.keyLen = keyLen;
        this.keyOffset = keyOffset;
    }

    readonly authToken: string;
    readonly keyLen: number;
    readonly keyOffset: number;
}