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
      (Read "Differences from other blobs" for more info.)

    All of this changes have made it dependency free of any core node modules, so it would be possible to just import it using http-import from a CDN without any bundling

</details>

<details>
  <summary>Differences from other Blobs</summary>

  - Unlike NodeJS `buffer.Blob` (Added in: v15.7.0) and browser native Blob this polyfilled version can't be sent via PostMessage
  - This blob version is more arbitrary, it can be constructed with blob parts that isn't a instance of itself
  it has to look and behave as a blob to be accepted as a blob part.
    - The benefit of this is that you can create other types of blobs that don't contain any internal data that has to be read in other ways, such as the `BlobDataItem` created in `from.js` that wraps a file path into a blob-like item and read lazily (nodejs plans to [implement this][fs-blobs] as well)
  - The `blob.stream()` is the most noticeable differences. It returns a AsyncGeneratorFunction that yields Uint8Arrays

  The reasoning behind `Blob.prototype.stream()` is that NodeJS readable stream
  isn't spec compatible with whatwg streams and we didn't want to import the hole whatwg stream polyfill for node
  or browserify NodeJS streams for the browsers and picking any flavor over the other. So we decided to opted out
  of any stream and just implement the bear minium of what both streams have in common which is the asyncIterator
  that both yields Uint8Array. this is the most isomorphic way with the use of `for-await-of` loops.
  It would be redundant to convert anything to whatwg streams and than convert it back to
  node streams since you work inside of Node.
  It will probably stay like this until nodejs get native support for whatwg<sup>[1][https://github.com/nodejs/whatwg-stream]</sup> streams and whatwg stream add the node
  equivalent for `Readable.from(iterable)`<sup>[2](https://github.com/whatwg/streams/issues/1018)</sup>

  But for now if you really need a Node Stream then you can do so using this transformation
  ```js
    import {Readable} from 'stream'
    const stream = Readable.from(blob.stream())
  ```
  But if you don't need it to be a stream then you can just use the asyncIterator part of it that is isomorphic.
  ```js
    for await (const chunk of blob.stream()) {
      console.log(chunk) // uInt8Array
    }
  ```
  If you need to make some feature detection to fix this different behavior
  ```js
  if (Blob.prototype.stream?.constructor?.name === 'AsyncGeneratorFunction') {
    // not spec compatible, monkey patch it...
    // (Alternative you could extend the Blob and use super.stream())
    let orig = Blob.prototype.stream
    Blob.prototype.stream = function () {
      const iterator = orig.call(this)
      return new ReadableStream({
        async pull (ctrl) {
          const next = await iterator.next()
          return next.done ? ctrl.close() : ctrl.enqueue(next.value)
        }
      })
    }
  }
  ```
  Possible feature whatwg version: `ReadableStream.from(iterator)`
  It's also possible to delete this method and instead use `.slice()` and `.arrayBuffer()` since it has both a public and private stream method
</details>

## Usage

```js
// Ways to import
// (PS it's dependency free ESM package so regular http-import from CDN works too)
import Blob from 'fetch-blob'
import File from 'fetch-blob/file.js'

import {Blob} from 'fetch-blob'
import {File} from 'fetch-blob/file.js'

const {Blob} = await import('fetch-blob')


// Ways to read the blob:
const blob = new Blob(['hello, world'])

await blob.text()
await blob.arrayBuffer()
for await (let chunk of  blob.stream()) { ... }

// turn the async iterator into a node stream
stream.Readable.from(blob.stream())

// turn the async iterator into a whatwg stream (feature)
globalThis.ReadableStream.from(blob.stream())
```

### Blob part backed up by filesystem

`fetch-blob/from.js` comes packed with tools to convert any filepath into either a Blob or a File
It will not read the content into memory. It will only stat the file for last modified date and file size.

```js
// The default export is sync and use fs.stat to retrieve size & last modified as a blob
import blobFromSync from 'fetch-blob/from.js'
import {File, Blob, blobFrom, blobFromSync, fileFrom, fileFromSync} from 'fetch-blob/from.js'

const fsFile = fileFromSync('./2-GiB-file.bin', 'application/octet-stream')
const fsBlob = await blobFrom('./2-GiB-file.mp4')

// Not a 4 GiB memory snapshot, just holds references
// points to where data is located on the disk
const blob = new Blob([fsFile, fsBlob, 'memory', new Uint8Array(10)])
console.log(blob.size) // ~4 GiB
```

`blobFrom|blobFromSync|fileFrom|fileFromSync(path, [mimetype])`

### Creating Blobs backed up by other async sources
Our Blob & File class are more generic then any other polyfills in the way that it can accept any blob look-a-like item
An example of this is that our blob implementation can be constructed with parts coming from [BlobDataItem](https://github.com/node-fetch/fetch-blob/blob/8ef89adad40d255a3bbd55cf38b88597c1cd5480/from.js#L32) (aka a filepath) or from [buffer.Blob](https://nodejs.org/api/buffer.html#buffer_new_buffer_blob_sources_options), It dose not have to implement all the methods - just enough that it can be read/understood by our Blob implementation. The minium requirements is that it has `Symbol.toStringTag`, `size`, `slice()` and either a `stream()` or a `arrayBuffer()` method. If you then wrap it in our Blob or File `new Blob([blobDataItem])` then you get all of the other methods that should be implemented in a blob or file

An example of this could be to create a file or blob like item coming from a remote HTTP request. Or from a DataBase

See the [MDN documentation](https://developer.mozilla.org/en-US/docs/Web/API/Blob) and [tests](https://github.com/node-fetch/fetch-blob/blob/master/test.js) for more details of how to use the Blob.

[npm-image]: https://flat.badgen.net/npm/v/fetch-blob
[npm-url]: https://www.npmjs.com/package/fetch-blob
[ci-image]: https://github.com/node-fetch/fetch-blob/workflows/CI/badge.svg
[ci-url]: https://github.com/node-fetch/fetch-blob/actions
[codecov-image]: https://flat.badgen.net/codecov/c/github/node-fetch/fetch-blob/master
[codecov-url]: https://codecov.io/gh/node-fetch/fetch-blob
[install-size-image]: https://flat.badgen.net/packagephobia/install/fetch-blob
[install-size-url]: https://packagephobia.now.sh/result?p=fetch-blob
[fs-blobs]: https://github.com/nodejs/node/issues/37340
