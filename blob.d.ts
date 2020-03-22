/// <reference lib="dom"/>

// /** A file-like object of immutable, raw data. Blobs represent data that isn't necessarily in a JavaScript-native format. The File interface is based on Blob, inheriting blob functionality and expanding it to support files on the user's system. */
declare interface FetchBlob extends Blob {
    stream(): ReadableStream
    text(): Promise<string>
    arrayBuffer(): Promise<ArrayBuffer>
    toString(): "[object Blob]"
    [Symbol.toStringTag]: "Blob"

}

declare const FetchBlob: {
    prototype: FetchBlob
    new(blobParts?: BlobPart[], options?: BlobPropertyBag): FetchBlob
};

export = FetchBlob
