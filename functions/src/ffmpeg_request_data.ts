import * as moment from "moment";
import {Util} from "./util";

export class FfmpegRequestData {

    constructor(format: string, station: string, ftStr: string, toStr: string, ft: moment.Moment, to: moment.Moment) {
        this.format = format;
        this.station = station;
        this.ftStr = ftStr
        this.toStr = toStr;
        this.ft = ft;
        this.to = to;
    }

    readonly format: string;
    readonly station: string;
    readonly ftStr: string;
    readonly toStr: string;
    readonly ft: moment.Moment;
    readonly to: moment.Moment;

    /**
     * @throws FfmpegRequestData
     * @param data ft, toは`20180514050000`などといったパターンで与えられる
     */
    static parse(data: any){
        if (!Util.isString(data.format) || !Util.isString(data.station) || !Util.isString(data.ft) || !Util.isString(data.to))
            throw new FormatException(data.toString());
        const format = data.format as string;
        const station = data.station as string;
        const ft = data.ft as string;
        const to = data.to as string;

        const ftTime = moment('YYYYMMDDMMDDHHmmss', ft);
        const toTime = moment('YYYYMMDDMMDDHHmmss', to);

        if (!ftTime.isValid() || !toTime.isValid() || !FfmpegRequestData.isValid(format, station))
            throw new FormatException(data.toString());

        return new FfmpegRequestData(format, station, ft, to, ftTime, toTime);
    }

    private static isValid(format: string, station: string) {
        return Object.keys(Format).includes(format) && Object.keys(Station).includes(station);
    }
}

export class Format {
    static AAC = 'AAC';
    static MP3 = 'MP3';
    static M4A = 'M4A';
    static WAV = 'WAV';

    static toSuffix(format: string){
        switch (format) {
            case Format.AAC:
                return 'aac';
            case Format.WAV:
                return 'wav';
            case Format.M4A:
                return 'm4a';
            case Format.MP3:
                return 'mp3';
            default:
                throw new Error(format);
        }
    }

    static toMimeType(format: string) {
        switch (format) {
            case Format.AAC:
            case Format.M4A:
                return 'audio/aac';
            case Format.MP3:
                return 'audio/mpeg';
            case Format.WAV:
                return 'audio/wav';
            default:
                throw new Error(format);
        }
    }
}

class Station {
    static HBC = "HBC";
    static STV = "STV";
    static AIR_G = "AIR-G";
    static NORTHWAVE = "NORTHWAVE";
    static RAB = "RAB";
    static AFB = "AFB";
    static IBC = "IBC";
    static FMI = "FMI";
    static TBC = "TBC";
    static DATEFM = "DATEFM";
    static ABS = "ABS";
    static YBC = "YBC";
    static RFC = "RFC";
    static FMF = "FMF";
    static JOIK = "JOIK";
    static JOHK = "JOHK";
    static TBS = "TBS";
    static QRR = "QRR";
    static LFR = "LFR";
    static INT = "INT";
    static FMT = "FMT";
    static FMJ = "FMJ";
    static JORF = "JORF";
    static BAYFM78 = "BAYFM78";
    static NACK5 = "NACK5";
    static YFM = "YFM";
    static IBS = "IBS";
    static CRT = "CRT";
    static RADIOBERRY = "RADIOBERRY";
    static FMGUNMA = "FMGUNMA";
    static JOAK = "JOAK";
    static BSN = "BSN";
    static FMNIIGATA = "FMNIIGATA";
    static FMPORT = "FMPORT";
    static KNB = "KNB";
    static FMTOYAMA = "FMTOYAMA";
    static MRO = "MRO";
    static HELLOFIVE = "HELLOFIVE";
    static FBC = "FBC";
    static FMFUKUI = "FMFUKUI";
    static YBS = "YBS";
    static FM_FUJI = "FM-FUJI";
    static SBC = "SBC";
    static FMN = "FMN";
    static JOCK = "JOCK";
    static CBC = "CBC";
    static TOKAIRADIO = "TOKAIRADIO";
    static GBS = "GBS";
    static ZIP_FM = "ZIP-FM";
    static RADIONEO = "RADIONEO";
    static FMAICHI = "FMAICHI";
    static FMGIFU = "FMGIFU";
    static SBS = "SBS";
    static K_MIX = "K-MIX";
    static FMMIE = "FMMIE";
    static ABC = "ABC";
    static MBS = "MBS";
    static OBC = "OBC";
    static CCL = "CCL";
    static _802 = "802";
    static FMO = "FMO";
    static CRK = "CRK";
    static KISSFMKOBE = "KISSFMKOBE";
    static E_RADIO = "E-RADIO";
    static KBS = "KBS";
    static ALPHA_STATION = "ALPHA-STATION";
    static WBS = "WBS";
    static JOBK = "JOBK";
    static BSS = "BSS";
    static RSK = "RSK";
    static RCC = "RCC";
    static HFM = "HFM";
    static KRY = "KRY";
    static FMY = "FMY";
    static JRT = "JRT";
    static RNC = "RNC";
    static FMKAGAWA = "FMKAGAWA";
    static RNB = "RNB";
    static JOEU_FM = "JOEU-FM";
    static RKC = "RKC";
    static JOFK = "JOFK";
    static JOZK = "JOZK";
    static RKB = "RKB";
    static KBC = "KBC";
    static LOVEFM = "LOVEFM";
    static CROSSFM = "CROSSFM";
    static FMFUKUOKA = "FMFUKUOKA";
    static NBC = "NBC";
    static FMNAGASAKI = "FMNAGASAKI";
    static RKK = "RKK";
    static FMK = "FMK";
    static OBS = "OBS";
    static FM_OITA = "FM_OITA";
    static MRT = "MRT";
    static MBC = "MBC";
    static MYUFM = "MYUFM";
    static RBC = "RBC";
    static ROK = "ROK";
    static FM_OKINAWA = "FM_OKINAWA";
    static JOLK = "JOLK";
    static RN1 = "RN1";
    static RN2 = "RN2";
    static HOUSOU_DAIGAKU = "HOUSOU-DAIGAKU";
    static JOAB = "JOAB";
    static JOAK_FM = "JOAK-FM";
}

class FormatException extends Error {
    constructor(msg?: string) {
        super(msg);
    }
}