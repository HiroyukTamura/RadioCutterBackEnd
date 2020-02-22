import * as admin from "firebase-admin";
import * as storage from "@google-cloud/storage";
import {Format} from "./ffmpeg_request_data";

export class CloudStorage {

    private bucket: storage.Bucket;
    private static CFG: storage.GetSignedUrlConfig = {
        action: 'read',
        expires: '03-01-2500',
    };

    constructor() {
        this.bucket = admin.storage().bucket('gs://radiko-7e63e.appspot.com/');
    }

    async queryFfmpegExportedFileUrl(format: string, station: string, ft: string){
        const path = CloudStorage.storagePath(format, station, ft);
        const file = this.bucket.file(path);
        const exists =  await file.exists();
        if (exists) {
            const urls = await file.getSignedUrl(CloudStorage.CFG);
            return urls[0];
        }
        return;
    }

    async upload(format: string, station: string, ft: string, localPath: string) {
        const path = CloudStorage.storagePath(format, station, ft);
        const file = this.bucket.file(path);
        const exists = await file.exists();
        if (exists[0])
            return;
        const result = await this.bucket.upload(localPath, {
            gzip: true,
            destination: path,
            metadata: {
                contentType: Format.toMimeType(format)
            }
        });
        const urlResp = await result[0].getSignedUrl(CloudStorage.CFG);
        return urlResp[0];
    }

    private static storagePath(format: string, station: string, ft: string){
        const suffix = Format.toSuffix(format);
        return `FfmpegExportedFile/${station}/${ft}.${suffix}`;
    }
}