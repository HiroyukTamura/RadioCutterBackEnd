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
        this.bucket = admin.storage().bucket();
    }

    async queryFfmpegExportedFileUrl(format: string, station: string, ft: string){
        const suffix = Format.toSuffix(format);
        const path = `FfmpegExportedFile/${station}/${ft}.${suffix}`;
        const file = this.bucket.file(path);
        const exists =  await file.exists();
        if (exists) {
            const urls = await file.getSignedUrl(CloudStorage.CFG);
            return urls[0];
        }
        return;
    }
}