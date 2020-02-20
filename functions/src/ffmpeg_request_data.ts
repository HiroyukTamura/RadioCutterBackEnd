class FfmpegRequestData {


    constructor(format: string, station: string, ft: number, to: number) {
        this.format = format;
        this.station = station;
        this.ft = ft;
        this.to = to;
        this.isValid();
    }

    readonly format: string;
    readonly station: string;
    readonly ft: number;
    readonly to: number;

    isValid(){
        switch (this.format) {
            case Format.AAC:
            case Format.MP3:
            case Format.M4A:
            case Format.WAV:
                return true;
            default:
                return false;
        }
    }
}

class Format {
    static AAC = 'AAC';
    static MP3 = 'MP3';
    static M4A = 'M4A';
    static WAV = 'WAV';
}

class STATION {
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
    static 802 = "802";
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