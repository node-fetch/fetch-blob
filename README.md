
fetch-blob
==========

[![npm version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![coverage status][codecov-image]][codecov-url]
[![install size][install-size-image]][install-size-url]

A Blob implementation on node.js, originally from node-fetch

## Usage

```sh
$ npm install fetch-blob
```

```js
const Blob = require('fetch-blob');
const fetch = require('node-fetch');
fetch('https://httpbin.org/post', {
        method: 'POST',
        body: new Blob(['hello'], { type: 'text/plain' })
    })
    .then(res => res.json()) // expecting a json response
    .then(json => console.log(json));
```

See [MDN doc](https://developer.mozilla.org/en-US/docs/Web/API/Blob) and [Tests](https://github.com/bitinn/fetch-blob/blob/master/test.js) for more details.

[npm-image]: https://flat.badgen.net/npm/v/fetch-blob
[npm-url]: https://www.npmjs.com/package/fetch-blob
[travis-image]: https://flat.badgen.net/travis/bitinn/fetch-blob
[travis-url]: https://travis-ci.org/bitinn/fetch-blob
[codecov-image]: https://flat.badgen.net/codecov/c/github/bitinn/fetch-blob/master
[codecov-url]: https://codecov.io/gh/bitinn/fetch-blob
[install-size-image]: https://flat.badgen.net/packagephobia/install/fetch-blob
[install-size-url]: https://packagephobia.now.sh/result?p=fetch-blob
