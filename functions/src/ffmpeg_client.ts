import * as path from "path";
import * as os from "os";
import * as cp from "child_process";
import * as fs from "fs-extra";
import * as ffmpeg_static from "ffmpeg-static";
import {Env} from "./env";
import {FfmpegRequestData, Format} from "./ffmpeg_request_data";

export class FfmpegTask {

    readonly ffmpegRequestData: FfmpegRequestData;
    readonly txtFile: string;
    readonly outputPath: string;

    private static FFMPEG_CODE_SUCCESS = 0;

    constructor(ffmpegRequestData: FfmpegRequestData, txtFile: string) {
        this.ffmpegRequestData = ffmpegRequestData;
        this.txtFile = txtFile;
        this.outputPath = this.genOutputPath();
    }

    async startFfmpegSpawn(): Promise<void> {

        return new Promise((resolve, reject) => {
            let output = '';
            let err = '';
            const timeout = setTimeout(async () => {
                console.error('timed out');

                ffmpeg.kill();
                console.log(output);
                // await fs.emptyDir(os.tmpdir());
                reject();
            }, 1000 * 60 * 20);

            const ffmpeg = cp.spawn(ffmpeg_static, this.genFfmpegCommand());

            ffmpeg.stdout
                .on('data', c => output += c)
                .on('end', () => console.log('stdout', output));
            ffmpeg.stderr
                .on('data', (c) => err += c)
                .on('end', () => console.log('stderr:', err));
            ffmpeg.on('exit', async code => {
                clearTimeout(timeout);
                if (code !== FfmpegTask.FFMPEG_CODE_SUCCESS) {
                    await fs.remove(this.outputPath);
                    console.error('oooops!');
                    console.error(err);
                    if (Env.IS_RELEASE)
                        await fs.emptyDir(os.tmpdir());
                    reject();
                } else
                    resolve();
            });
        });
    }

    genOutputPath() {
        const format = Format.toSuffix(this.ffmpegRequestData.format);
        if (Env.IS_RELEASE)
            return path.join(os.tmpdir(), `${this.ffmpegRequestData.station}_${this.ffmpegRequestData.ftStr}.${format}`);
        else
            return path.join(__dirname, `../test/output/${this.ffmpegRequestData.station}_${this.ffmpegRequestData.ftStr}.${format}`);
    }

    private genFfmpegCommand(){
        switch (this.ffmpegRequestData.format) {
            case Format.AAC:
                return [
                    '-protocol_whitelist',
                    'file,http,https,tcp,tls,crypto',
                    '-safe',
                    '0',
                    '-f',
                    'concat',
                    '-y',
                    '-i',
                    this.txtFile,
                    "-c",
                    "copy",
                    this.outputPath,
                ];
            case Format.MP3:
            case Format.WAV:
                return [
                    '-protocol_whitelist',
                    'file,http,https,tcp,tls,crypto',
                    '-safe',
                    '0',
                    '-f',
                    'concat',
                    '-y',
                    '-i',
                    this.txtFile,
                    "-c:a",
                    "libmp3lame",
                    this.outputPath,
                ];
            case Format.M4A:
                return [
                    '-protocol_whitelist',
                    'file,http,https,tcp,tls,crypto',
                    '-safe',
                    '0',
                    '-f',
                    'concat',
                    '-y',
                    '-i',
                    this.txtFile,
                    "-acodec",
                    "copy",
                    "-bsf",
                    "aac_adtstoasc",
                    this.outputPath,
                ];
            default:
                throw new Error();
        }
    }
}