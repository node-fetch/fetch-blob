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

## Usage

```js
const Blob = require('fetch-blob');
const fetch = require('node-fetch');

fetch('https://httpbin.org/post', {
    method: 'POST',
    body: new Blob(['Hello World'], { type: 'text/plain' })
})
    .then(res => res.json());
    .then(json => console.log(json));
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
