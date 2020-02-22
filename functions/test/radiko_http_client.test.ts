/**
 * @see RadikoHttpClient
 */
import {RadikoHttpClient, Request1stResult} from "../src/radiko_http_client";
import {AuthTokenGenerator} from "../src/auth_token_generator";


describe('all', () => {
    jest.setTimeout(100000000);

    const station = 'TBS';
    const ftStr = '20200221200000';
    const toStr = '20200221210000';

    const client = new RadikoHttpClient(station, ftStr, toStr);
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

    test('requestPlaylistM3U8', async () => {
       await client.requestPlaylistM3U8();
    });
});