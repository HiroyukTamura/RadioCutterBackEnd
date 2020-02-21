export class Util {

    static isString(it: any): it is string {
        return typeof it === 'string';
    }
}