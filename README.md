# fetch-blob

[![npm version][npm-image]][npm-url]
[![build status][ci-image]][ci-url]
[![coverage status][codecov-image]][codecov-url]
[![install size][install-size-image]][install-size-url]

A Blob implementation in Node.js, originally from [node-fetch](https://github.com/node-fetch/node-fetch).

## Installation

```sh
npm install fetch-blob
```

<details>
  <summary>Upgrading from 2x to 3x</summary>

  Updating from 2 to 3 should be a breeze since there is not many changes to the blob specification.
  The major cause of a major release is coding standards.
    - internal WeakMaps was replaced with private fields
    - internal Buffer.from was replaced with TextEncoder/Decoder
    - internal buffers was replaced with Uint8Arrays
    - CommonJS was replaced with ESM
    - The node stream returned by calling `blob.stream()` was replaced with a simple generator function that yields Uint8Array (Breaking change)

  The reasoning behind `Blob.prototype.stream()` is that node readable stream
  isn't spec compatible with whatwg stream and we didn't want to import a hole whatwg stream polyfill for node
  or browserify hole node-stream for browsers and picking any flavor over the other. So we decided to opted out
  of any stream and just implement the bear minium of what both streams have in common which is the asyncIterator
  that both yields Uint8Array. It would be redundant to convert anything to whatwg streams and than convert it back to
  node streams since you work inside of Node.
  It will probably stay like this until nodejs get native support for whatwg<sup>[1][https://github.com/nodejs/whatwg-stream]</sup> streams and whatwg stream add the node
  equivalent for `Readable.from(iterable)`<sup>[2](https://github.com/whatwg/streams/issues/1018)</sup>

  But for now if you really want/need a Node Stream then you can do so using this transformation
  ```js
    import {Readable} from 'stream'
    const stream = Readable.from(blob.stream())
  ```
  But if you don't need it to be a stream then you can just use the asyncIterator part of it that both whatwg stream and node stream have in common
  ```js
    for await (const chunk of blob.stream()) {
      console.log(chunk) // uInt8Array
    }
  ```

  All of this changes have made it dependency free of any core node modules, so it would be possible to just import it using http-import from a CDN without any bundling

</details>

## Usage

```js
// Ways to import
// (note that it's dependency free ESM package so regular http-import from CDN works too)
import Blob from 'fetch-blob';
import {Blob} from 'fetch-blob';
const {Blob} = await import('fetch-blob');

const blob = new Blob(['hello, world']);

// Ways to read the blob:

await blob.text()

await blob.arrayBuffer()

for await (let chunk of  blob.stream()) { ... }

// turn the async iterator into a node stream
stream.Readable.from(blob.stream())

// turn the async iterator into a whatwg stream (feature)
globalThis.ReadableStream.from(blob.stream())
```

### Blob part backed up by filesystem
To use, install [domexception](https://github.com/jsdom/domexception).

```sh
npm install fetch-blob domexception
```

```js
// The default export is sync and use fs.stat to retrieve size & last modified
import blobFromSync from 'fetch-blob/from.js'
import {Blob, blobFrom, blobFromSync} 'fetch-blob/from.js'

const fsBlob1 = blobFromSync('./2-GiB-file.bin');
const fsBlob2 = await blobFrom('./2-GiB-file.bin');

// Not a 4 GiB memory snapshot, just holds 3 references
// points to where data is located on the disk
const blob = new Blob([fsBlob1, fsBlob2, 'memory']);
console.log(blob.size) // 4 GiB
```

See the [MDN documentation](https://developer.mozilla.org/en-US/docs/Web/API/Blob) and [tests](https://github.com/node-fetch/fetch-blob/blob/master/test.js) for more details.

[npm-image]: https://flat.badgen.net/npm/v/fetch-blob
[npm-url]: https://www.npmjs.com/package/fetch-blob
[ci-image]: https://github.com/node-fetch/fetch-blob/workflows/CI/badge.svg
[ci-url]: https://github.com/node-fetch/fetch-blob/actions
[codecov-image]: https://flat.badgen.net/codecov/c/github/node-fetch/fetch-blob/master
[codecov-url]: https://codecov.io/gh/node-fetch/fetch-blob
[install-size-image]: https://flat.badgen.net/packagephobia/install/fetch-blob
[install-size-url]: https://packagephobia.now.sh/result?p=fetch-blob
