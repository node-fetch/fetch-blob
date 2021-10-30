import fs from 'fs'
import { Readable } from 'stream'
import buffer from 'buffer'
import test from 'ava'
import { Response } from 'node-fetch'
import syncBlob, { blobFromSync, blobFrom, fileFromSync, fileFrom } from './from.js'
import File from './file.js'
import Blob from './index.js'

const license = fs.readFileSync('./LICENSE', 'utf-8')

test('new Blob()', t => {
  const blob = new Blob() // eslint-disable-line no-unused-vars
  t.pass()
})

test('new Blob(parts)', t => {
  const data = 'a=1'
  const blob = new Blob([data]) // eslint-disable-line no-unused-vars
  t.pass()
})

test('Blob ctor parts', async t => {
  const parts = [
    'a',
    new Uint8Array([98]),
    new Uint16Array([25699]),
    new Uint8Array([101]).buffer,
    Buffer.from('f'),
    new Blob(['g']),
    {},
    new URLSearchParams('foo')
  ]

  const blob = new Blob(parts)
  t.is(await blob.text(), 'abcdefg[object Object]foo=')
})

test('Blob ctor threats an object with @@iterator as a sequence', async t => {
  const blob = new Blob({ [Symbol.iterator]: Array.prototype[Symbol.iterator] })

  t.is(blob.size, 0)
  t.is(await blob.text(), '')
})

test('Blob ctor reads blob parts from object with @@iterator', async t => {
  const input = ['one', 'two', 'three']
  const expected = input.join('')

  const blob = new Blob({
    * [Symbol.iterator] () {
      yield * input
    }
  })

  t.is(blob.size, new TextEncoder().encode(expected).byteLength)
  t.is(await blob.text(), expected)
})

test('Blob ctor throws a string', t => {
  t.throws(() => new Blob('abc'), {
    instanceOf: TypeError,
    message: 'Failed to construct \'Blob\': The provided value cannot be converted to a sequence.'
  })
})

test('Blob ctor throws an error for an object that does not have @@iterable method', t => {
  t.throws(() => new Blob({}), {
    instanceOf: TypeError,
    message: 'Failed to construct \'Blob\': The object must have a callable @@iterator property.'
  })
})

test('Blob ctor threats Uint8Array as a sequence', async t => {
  const input = [1, 2, 3]
  const blob = new Blob(new Uint8Array(input))

  t.is(await blob.text(), input.join(''))
})

test('Blob size', t => {
  const data = 'a=1'
  const blob = new Blob([data])
  t.is(blob.size, data.length)
})

test('Blob type', t => {
  const type = 'text/plain'
  const blob = new Blob([], { type })
  t.is(blob.type, type)
})

test('Blob slice type', t => {
  const type = 'text/plain'
  const blob = new Blob().slice(0, 0, type)
  t.is(blob.type, type)
})

test('invalid Blob type', t => {
  const blob = new Blob([], { type: '\u001Ftext/plain' })
  t.is(blob.type, '')
})

test('invalid Blob slice type', t => {
  const blob = new Blob().slice(0, 0, '\u001Ftext/plain')
  t.is(blob.type, '')
})

test('Blob text()', async t => {
  const data = 'a=1'
  const type = 'text/plain'
  const blob = new Blob([data], { type })
  t.is(await blob.text(), data)
})

test('Blob arrayBuffer()', async t => {
  const data = 'a=1'
  const type = 'text/plain'
  const blob = new Blob([data], { type })

  const decoder = new TextDecoder('utf-8')
  const buffer = await blob.arrayBuffer()
  t.is(decoder.decode(buffer), data)
})

test('Blob stream()', async t => {
  const data = 'a=1'
  const type = 'text/plain'
  const blob = new Blob([data], { type })

  for await (const chunk of blob.stream()) {
    t.is(chunk.join(), [97, 61, 49].join())
  }
})

test('Blob stream() can be cancelled', async t => {
  const stream = new Blob(['Some content']).stream()

  // Cancel the stream before start reading, or this will throw an error
  await stream.cancel()

  const reader = stream.getReader()

  const { done, value: chunk } = await reader.read()

  t.true(done)
  t.is(chunk, undefined)
})

test('Blob toString()', t => {
  const data = 'a=1'
  const type = 'text/plain'
  const blob = new Blob([data], { type })
  t.is(blob.toString(), '[object Blob]')
})

test('Blob slice()', async t => {
  const data = 'abcdefgh'
  const blob = new Blob([data]).slice()
  t.is(await blob.text(), data)
})

test('Blob slice(0, 1)', async t => {
  const data = 'abcdefgh'
  const blob = new Blob([data]).slice(0, 1)
  t.is(await blob.text(), 'a')
})

test('Blob slice(-1)', async t => {
  const data = 'abcdefgh'
  const blob = new Blob([data]).slice(-1)
  t.is(await blob.text(), 'h')
})

test('Blob slice(0, -1)', async t => {
  const data = 'abcdefgh'
  const blob = new Blob([data]).slice(0, -1)
  t.is(await blob.text(), 'abcdefg')
})

test('Blob(["hello ", "world"]).slice(5)', async t => {
  const parts = ['hello ', 'world']
  const blob = new Blob(parts)
  t.is(await blob.slice(5).text(), ' world')
})

test('throw away unwanted parts', async t => {
  const blob = new Blob(['a', 'b', 'c']).slice(1, 2)
  t.is(await blob.text(), 'b')
})

test('Blob works with node-fetch Response.blob()', async t => {
  const data = 'a=1'
  const type = 'text/plain'
  const blob = new Blob([data], { type })
  const response = new Response(Readable.from(blob.stream()))
  const blob2 = await response.blob()
  t.is(await blob2.text(), data)
})

test('Blob works with node-fetch Response.text()', async t => {
  const data = 'a=1'
  const type = 'text/plain'
  const blob = new Blob([data], { type })
  const response = new Response(Readable.from(blob.stream()))
  const text = await response.text()
  t.is(text, data)
})

test('blob part backed up by filesystem', async t => {
  const blob = blobFromSync('./LICENSE')
  t.is(await blob.slice(0, 3).text(), license.slice(0, 3))
  t.is(await blob.slice(4, 11).text(), license.slice(4, 11))
})

test('Reading after modified should fail', async t => {
  const blob = blobFromSync('./LICENSE')
  await new Promise(resolve => {
    setTimeout(resolve, 500)
  })
  fs.closeSync(fs.openSync('./LICENSE', 'a'))
  const error = await t.throwsAsync(blob.text())
  t.is(error.constructor.name, 'DOMException')
  t.is(error instanceof Error, true)
  t.is(error.name, 'NotReadableError')

  const file = fileFromSync('./LICENSE')
  // Above test updates the last modified date to now
  t.is(typeof file.lastModified, 'number')
  // The lastModifiedDate is deprecated and removed from spec
  t.false('lastModifiedDate' in file)
  const mod = file.lastModified - Date.now()
  t.true(mod <= 0 && mod >= -500) // Close to tolerance: 0.500ms
})

test('Reading file after modified should fail', async t => {
  const file = fileFromSync('./LICENSE')
  await new Promise(resolve => {
    setTimeout(resolve, 100)
  })
  const now = new Date()
  // Change modified time
  fs.utimesSync('./LICENSE', now, now)
  const error = await t.throwsAsync(file.text())
  t.is(error.constructor.name, 'DOMException')
  t.is(error instanceof Error, true)
  t.is(error.name, 'NotReadableError')
})

test('Reading from the stream created by blobFrom', async t => {
  const blob = blobFromSync('./LICENSE')
  const actual = await blob.text()
  t.is(actual, license)
})

test('create a blob from path asynchronous', async t => {
  const blob = await blobFrom('./LICENSE')
  const actual = await blob.text()
  t.is(actual, license)
})

test('Reading empty blobs', async t => {
  const blob = blobFromSync('./LICENSE').slice(0, 0)
  const actual = await blob.text()
  t.is(actual, '')
})

test('Blob-ish class is an instance of Blob', t => {
  class File {
    stream () {}

    get [Symbol.toStringTag] () {
      return 'File'
    }
  }

  t.true(new File() instanceof Blob)
})

test('Instanceof check returns false for nullish values', t => {
  t.false(null instanceof Blob)
})

/** @see https://github.com/w3c/FileAPI/issues/43 - important to keep boundary value */
test('Dose not lowercase the blob values', t => {
  const type = 'multipart/form-data; boundary=----WebKitFormBoundaryTKqdrVt01qOBltBd'
  t.is(new Blob([], { type }).type, type)
})

test('Parts are immutable', async t => {
  const buf = new Uint8Array([97])
  const blob = new Blob([buf])
  buf[0] = 98
  t.is(await blob.text(), 'a')
})

test('Blobs are immutable', async t => {
  const buf = new Uint8Array([97])
  const blob = new Blob([buf])
  const chunk = await blob.stream().getReader().read()
  t.is(chunk.value[0], 97)
  chunk.value[0] = 98
  t.is(await blob.text(), 'a')
})

// This was necessary to avoid large ArrayBuffer clones (slice)
test('Large chunks are divided into smaller chunks', async t => {
  const buf = new Uint8Array(65590)
  const blob = new Blob([buf])
  let i = 0
  // eslint-disable-next-line no-unused-vars
  for await (const chunk of blob.stream()) {
    i++
  }

  t.is(i === 2, true)
})

test('Can use named import - as well as default', async t => {
  // eslint-disable-next-line node/no-unsupported-features/es-syntax
  const { Blob, default: def } = await import('./index.js')
  t.is(Blob, def)
})

test('default from.js exports blobFromSync', t => {
  t.is(blobFromSync, syncBlob)
})

if (buffer.Blob) {
  test('Can wrap buffer.Blob to a fetch-blob', async t => {
    const blob1 = new buffer.Blob(['blob part'])
    const blob2 = new Blob([blob1])
    t.is(await blob2.text(), 'blob part')
  })
}

test('File is a instance of blob', t => {
  t.true(new File([], '') instanceof Blob)
})

test('fileFrom returns the name', async t => {
  t.is((await fileFrom('./LICENSE')).name, 'LICENSE')
})

test('fileFromSync returns the name', t => {
  t.is(fileFromSync('./LICENSE').name, 'LICENSE')
})

test('fileFromSync(path, type) sets the type', t => {
  t.is(fileFromSync('./LICENSE', 'text/plain').type, 'text/plain')
})

test('blobFromSync(path, type) sets the type', t => {
  t.is(blobFromSync('./LICENSE', 'text/plain').type, 'text/plain')
})

test('fileFrom(path, type) sets the type', async t => {
  const file = await fileFrom('./LICENSE', 'text/plain')
  t.is(file.type, 'text/plain')
})

test('new File(,,{lastModified: 100})', t => {
  const mod = new File([], '', { lastModified: 100 }).lastModified
  t.is(mod, 100)
})

test('new File(,,{lastModified: "200"})', t => {
  const mod = new File([], '', { lastModified: '200' }).lastModified
  t.is(mod, 200)
})

test('new File(,,{lastModified: true})', t => {
  const mod = new File([], '', { lastModified: true }).lastModified
  t.is(mod, 1)
})

test('new File(,,{lastModified: new Date()})', t => {
  const mod = new File([], '', { lastModified: new Date() }).lastModified - Date.now()
  t.true(mod <= 0 && mod >= -20) // Close to tolerance: 0.020ms
})

test('new File(,,{lastModified: undefined})', t => {
  const mod = new File([], '', { lastModified: undefined }).lastModified - Date.now()
  t.true(mod <= 0 && mod >= -20) // Close to tolerance: 0.020ms
})

test('new File(,,{lastModified: null})', t => {
  const mod = new File([], '', { lastModified: null }).lastModified
  t.is(mod, 0)
})

test('Interpretes NaN value in lastModified option as 0', t => {
  t.plan(3)

  const values = ['Not a Number', [], {}]

  // I can't really see anything about this in the spec,
  // but this is how browsers handle type casting for this option...
  for (const lastModified of values) {
    const file = new File(['Some content'], 'file.txt', { lastModified })

    t.is(file.lastModified, 0)
  }
})

test('new File(,,{}) sets current time', t => {
  const mod = new File([], '').lastModified - Date.now()
  t.true(mod <= 0 && mod >= -20) // Close to tolerance: 0.020ms
})

test('blobFrom(path, type) sets the type', async t => {
  const blob = await blobFrom('./LICENSE', 'text/plain')
  t.is(blob.type, 'text/plain')
})

test('blobFrom(path) sets empty type', async t => {
  const blob = await blobFrom('./LICENSE')
  t.is(blob.type, '')
})

test('new File() throws with too few args', t => {
  t.throws(() => new File(), {
    instanceOf: TypeError,
    message: 'Failed to construct \'File\': 2 arguments required, but only 0 present.'
  })
})

test('can slice zero sized blobs', async t => {
  const blob = new Blob()
  const txt = await blob.slice(0, 0).text()
  t.is(txt, '')
})

test('returns a readable stream', t => {
  const stream = new File([], '').stream()
  t.true(typeof stream.getReader === 'function')
})

test('checking instanceof blob#stream', t => {
  const stream = new File([], '').stream()
  t.true(stream instanceof globalThis.ReadableStream)
})
