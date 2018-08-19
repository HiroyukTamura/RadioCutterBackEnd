"use strict";

const functions = require('firebase-functions');
const admin = require('firebase-admin');
// const { execSync } = require('child_process');
const request = require('request');
const rp = require('request-promise');
const cheerio = require('cheerio');

admin.initializeApp();
const fireStore = admin.firestore();
fireStore.settings({
    timestampsInSnapshots: true
});

const getWeekPrg = async (arrayNum) => {
    for (const stCode of stationCodeArr[arrayNum]) {
        const url = 'http://radiko.jp/v3/program/station/weekly/'+ stCode +'.xml';
        const body = await rp(url).catch(e => {
            console.error(e);
        });

        if (!body) continue;
        const $ = cheerio.load(body);

        const ttl = $(body).find('ttl').html();
        const srvtime = $(body).find('srvtime').html();
        const progs = $(body).find('progs');
        for(let i=0; i<progs.length; i++){
            const item = progs.eq(i);
            const date = item.find('date').html();
            await fireStore.collection('progs').doc(stCode).collection(date).doc('single').set({
                ttl: ttl,
                srvtime: srvtime,
                date: date,
                xml: '<progs>'+ item.html() +'</progs>'/*todo これ*/
            }).catch(e => {
                console.error(e);
            });
        }

        console.info('完了:', stCode);
    }

};
