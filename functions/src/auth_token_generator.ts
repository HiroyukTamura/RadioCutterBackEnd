const { execSync } = require('child_process');
import * as functions from "firebase-functions";

export class AuthTokenGenerator {
    /**
     * @throws functions.https.HttpsError
     */
    static async generate(offset : number, keyLen: number, version: number){
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
                throw new functions.https.HttpsError('invalid-argument', 'version is wrong : version : '+ version);
        }

        const stdout = execSync(`dd if=PartialKey/${segment} bs=1 skip=${offset} count=${keyLen} 2> /dev/null | base64`).toString();
        console.log(stdout);
        return stdout;
    }
}