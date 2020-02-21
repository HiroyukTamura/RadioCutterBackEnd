export class Util {

    static isString(it: any): it is string {
        return typeof it === 'string';
    }

    static getRandomInt(min: number, max: number) {
        const minInt = Math.ceil(min);
        const maxInt = Math.floor(max);
        return Math.floor(Math.random() * (maxInt - minInt)) + min;
    }

    static map2Obj(map: Map<string, string>){
        const obj:any = {};
        map.forEach((key,value) => obj[key] = value);
        return obj;
    }
}