import * as path from "path";
import * as os from "os";
import * as cp from "child_process";
import * as uuid from "uuid";
import * as fs from "fs-extra";
import * as ffmpeg_static from "ffmpeg-static";
import * as moment from "moment";
import {FfmpegRequestData} from "./ffmpeg_request_data";

export class FfmpegIntentService {

    get taskList(): Array<FfmpegTask> {
        return this._taskList;
    }

    private static instance: FfmpegIntentService;
    private _taskList: Array<FfmpegTask> = [];
    private isRunning = false;
    private listener: FfmpegIntentServiceImpl;

    constructor(listener: FfmpegIntentServiceImpl) {
        this.listener = listener;
    }

    static getInstance(listener: FfmpegIntentServiceImpl) {
        if (!this.instance) {
            this.instance = new FfmpegIntentService(listener);
        }
        return this.instance;
    }

    addTask(...task: Array<FfmpegTask>) {
        task.forEach(it => {
            const taskedTask = this.findTask(it.userId, it.roomId, it.roomId);
            if (!taskedTask)
                this._taskList.push(it);
        });
        if (!this.isRunning)
            this.fireTask().catch(e => {
                //ここには絶対に来ない
                console.error(e);
            });
    }

    findTask(userId: string, roomId: number, liveId: number){
        return this._taskList.find(it => it.userId === userId && it.liveId === liveId && it.roomId === roomId);
    }

    private async fireTask(){
        if (!this._taskList.length) {
            this.isRunning = false;
            return;
        }

        this.isRunning = true;
        const task = this._taskList[0];

        try {
            const outputPath = await task.startFfmpegSpawn();
            await this.listener.onComplete(task.userId, task.roomId, task.liveId, outputPath);
        } catch(e) {
            console.error(e);
            this._taskList.shift();
            await this.listener.onError(task.userId, task.roomId, task.liveId);
        } finally {
            this._taskList.shift();
            this.fireTask().catch(e => {
                //ここには絶対に来ない
                console.error(e);
            });
        }
    }
}

export interface FfmpegIntentServiceImpl {
    onComplete(userId :string, roomId :number, liveId :number, outputPath: string): Promise<void>
    onError(userId :string, roomId :number, liveId :number): Promise<void>
}

export class FfmpegTask {

    tsUrlList: Array<string>;
    readonly station: string;
    readonly format: string;
    readonly ft: string;

    private static FFMPEG_CODE_SUCCESS = 1;

    constructor(station: string, format: string, ft: string) {
        this.station = station;
        this.format = format;
        this.ft = ft;
    }

    request1st(){

    }

    async startFfmpegSpawn(): Promise<string> {

        const text = this.tsUrlList.map(value => `file '${value}'`).join('\n');
        const txtFilePath = path.join(os.tmpdir(), `${uuid.v4()}.txt`);
        await fs.writeFile(txtFilePath, text);
        const outputPath = this.genOutputPath();

        return new Promise((resolve, reject) => {
            let output = '';
            let err = '';
            const timeout = setTimeout(async () => {
                console.log('time outed');

                ffmpeg.kill();
                await fs.unlink(txtFilePath);
                reject();
            }, 1000 * 180);

            const ffmpeg = cp.spawn(ffmpeg_static, [
                '-protocol_whitelist',
                'file,http,https,tcp,tls,crypto',
                '-f',
                'concat',
                '-safe',
                '0',
                '-i',
                txtFilePath,
                '-vcodec', 'libx264',
                outputPath,
            ]);

            ffmpeg.stdout
                .on('data', (c) => {
                    output += c;
                })
                .on('end', () => {
                    console.log('stdout', output);
                });
            ffmpeg.stderr
                .on('data', (c) => {
                    err += c;
                })
                .on('end', () => {
                    console.log('stderr:', err);
                });
            ffmpeg.on('exit', async code => {
                clearTimeout(timeout);
                if (code !== FfmpegTask.FFMPEG_CODE_SUCCESS) {
                    await fs.unlink(txtFilePath);
                    reject();
                }
                resolve(outputPath);
            });
        });
    }

    genOutputPath() {
        return path.join(os.tmpdir(), `${this.roomId}_${this.liveId}_${this.userId}.mp4`);
    }
}