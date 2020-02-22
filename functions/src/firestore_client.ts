import * as admin from "firebase-admin";
import {FfmpegRequestData} from "./ffmpeg_request_data";

export class FirestoreClient {

    private firestore: FirebaseFirestore.Firestore;

    constructor() {
        this.firestore = admin.firestore();
    }

    async postRemoteFfmpegStatus(data: FfmpegRequestData, status: FfmpegStatus, isUpdate: boolean, url?: string) {

        const query = this.firestore.collection('remoteFfmpegStatus')
            .where('format', '==', data.format)
            .where('station', '==', data.station)
            .where('ft', '==', data.ftStr)
            .where('to', '==', data.toStr);

        return this.firestore.runTransaction(async transaction => {
            const value = await transaction.get(query);
            if (!value.empty && !isUpdate)
                throw new Error('value is not empty');
            if (value.empty && isUpdate)
                throw new Error('value is empty');

            const doc = this.firestore.collection('remoteFfmpegStatus').doc();

            const documentData: any = {
                format: data.format,
                station: data.station,
                ft: data.ftStr,
                to: data.toStr,
                status: FfmpegStatus[status],
            };
            if (url)
                documentData.url = url;

            return transaction.set(doc, documentData);
        });
    }
}

export enum FfmpegStatus {
    PROCESSING, FAILED, SUCCESS
}