import * as admin from "firebase-admin";
import {FfmpegRequestData} from "./ffmpeg_request_data";

export class FirestoreClient {

    private firestore: FirebaseFirestore.Firestore;

    constructor() {
        this.firestore = admin.firestore();
    }

    async postRemoteFfmpegStatus(data: FfmpegRequestData) {

        const query = this.firestore.collection('remoteFfmpegStatus')
            .where('format', '==', data.format)
            .where('station', '==', data.station)
            .where('ft', '==', data.ft)
            .where('to', '==', data.to);

        return this.firestore.runTransaction( (transaction) =>
            transaction.get(query).then(value => {
                if (!value.empty)
                    return Promise.reject();

                const doc = this.firestore.collection('remoteFfmpegStatus').doc();

                return transaction.set(doc ,{
                    format: data.format,
                    station: data.station,
                    ft: data.ft,
                    to: data.to,
                });
            }).catch(e => Promise.reject(e))
        );
    }
}