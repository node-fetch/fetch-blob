export default class File extends Blob {
    /**
     * @param {*[]} fileBits
     * @param {string} fileName
     * @param {FilePropertyBag} options
     */ constructor(fileBits: any[], fileName: string, options?: FilePropertyBag, ...args: any[]);
    get name(): string;
    get lastModified(): number;
    #private;
}
import Blob from "./index.js";
