// @ts-nocheck
// @ts-ignore

import fs from 'node:fs'
import buffer from 'node:buffer'
import syncBlob, {
  blobFromSync,
  blobFrom,
  fileFromSync,
  fileFrom,
  createTemporaryBlob,
  createTemporaryFile
} from '../from.js'

const license = fs.readFileSync('./LICENSE')

test_blob(() => new Blob([
  'a',
  new Uint8Array([98]),
  new Uint16Array([25699]),
  new Uint8Array([101]).buffer,
  Buffer.from('f'),
  new Blob(['g']),
  {},
  new URLSearchParams('foo')
]), {
  desc: 'Blob ctor parts',
  expected: 'abcdefg[object Object]foo=',
  type: '',
  length: 26
})

promise_test(async () => {
  assert_equals(fileFromSync('./LICENSE').name, 'LICENSE')
  assert_equals((await fileFrom('./LICENSE')).name, 'LICENSE')
}, 'file from returns the same name')

// Could not find similar test on WPT
test(() => {
  const now = new Date()
  assert_equals(new File([], '', { lastModified: now }).lastModified, +now)
  assert_equals(new File([], '', { lastModified: +now }).lastModified, +now)
  assert_equals(new File([], '', { lastModified: 100 }).lastModified, 100)
  assert_equals(new File([], '', { lastModified: '200' }).lastModified, 200)
  assert_equals(new File([], '', { lastModified: true }).lastModified, 1)
  assert_equals(new File([], '', { lastModified: false }).lastModified, 0)
  assert_approx_equals(new File([], '').lastModified, Date.now(), 0.020)
  assert_approx_equals(new File([], '', { lastModified: undefined }).lastModified, Date.now(), 0.020)
}, 'File sets current time')

// Could not find similar test on WPT
test(() => {
  const values = ['Not a Number', [], {}, null]
  // I can't really see anything about this in the spec,
  // but this is how browsers handle type casting for this option...
  for (const lastModified of values) {
    const file = new File([], '', { lastModified })
    assert_equals(file.lastModified, 0)
  }
}, 'Interpretes NaN value in lastModified option as 0')

test(() => {
  assert_equals(blobFromSync, syncBlob)
}, 'default export is named exported blobFromSync')

promise_test(async () => {
  const { Blob, default: def } = await import('../index.js')
  assert_equals(Blob, def)
}, 'Can use named import - as well as default')

// This was necessary to avoid large ArrayBuffer clones (slice)
promise_test(async t => {
  const buf = new Uint8Array(65590)
  const blob = new Blob([buf])
  let i = 0
  // eslint-disable-next-line no-unused-vars
  for await (const chunk of blob.stream()) {
    i++
  }

  assert_equals(i, 2)
}, 'Large chunks are divided into smaller chunks')

// Couldn't find a test for this on WPT
promise_test(async () => {
  const buf = new Uint8Array([97])
  const blob = new Blob([buf])
  const chunk = await blob.stream().getReader().read()
  assert_equals(chunk.value[0], 97)
  chunk.value[0] = 98
  assert_equals(await blob.text(), 'a')
}, 'Blobs are immutable')

/**
 * Deviation from WPT: it's important to keep boundary value
 * so we don't lowercase the type
 * @see https://github.com/w3c/FileAPI/issues/43
 */
test(() => {
  const type = 'multipart/form-data; boundary=----WebKitFormBoundaryTKqdrVt01qOBltBd'
  assert_equals(new Blob([], { type }).type, type)
  assert_equals(new File([], '', { type }).type, type)
}, 'Dose not lowercase the type')


test( // Because we have symbol.hasInstance it's best to test it...
  () => (assert_false(null instanceof Blob), assert_false(null instanceof File)),
 'Instanceof check returns false for nullish values'
)

test( // Because browser normally never tries things taken for granted
  () => assert_equals(new Blob().toString(), '[object Blob]'),
  'blob.toString() returns [object Blob]'
)

test( // Because browser normally never tries things taken for granted
  () => assert_equals(new File([], '').toString(), '[object File]'),
  'file.toString() returns [object File]'
)

// fetch-blob uniques is that it supports arbitrary blobs too
test(() => {
  class File {
    stream () {}
    get [Symbol.toStringTag] () { return 'File' }
  }
  assert_true(new File() instanceof Blob)
}, 'Blob-ish class is an instance of Blob')

// fetch-blob uniques is that it supports arbitrary blobs too
if (buffer.Blob) {
  test_blob(() => new Blob([new buffer.Blob(['blob part'])]), {
    desc: 'Can wrap buffer.Blob to a fetch-blob',
    expected: 'blob part',
    type: '',
  })
}

/**
 * Test if Blob can be constructed with BOM and keep it when casted to string
 * Test if blob.text() can correctly remove BOM - `buffer.toString()` is bad
 */
promise_test(async () => {
  const text = '{"foo": "bar"}'
  const blob = new Blob([`\uFEFF${text}`])
  assert_equals(blob.size, 17)
  assert_equals(await blob.text(), text)
  const ab = await blob.slice(0, 3).arrayBuffer()
  assert_equals_typed_array(new Uint8Array(ab), new Uint8Array([0xEF, 0xBB, 0xBF]))
}, 'Can wrap buffer.Blob to a fetch-blob')

// Here to make sure our `toIterator` is working as intended
promise_test(async () => {
  const stream = new Blob(['Some content']).stream()

  // Cancel the stream before start reading, or this will throw an error
  await stream.cancel()
  const reader = stream.getReader()
  const { done, value: chunk } = await reader.read()

  assert_true(done)
  assert_equals(chunk, undefined)
}, 'Blob stream() can be cancelled')

/******************************************************************************/
/*                                                                            */
/*                   Test Blobs backed up by the filesystem                   */
/*                                                                            */
/******************************************************************************/

promise_test(async () => {
  assert_equals(fileFromSync('./LICENSE', 'text/plain').type, 'text/plain')
  assert_equals(fileFromSync('./LICENSE').type, '')

  assert_equals(blobFromSync('./LICENSE', 'text/plain').type, 'text/plain')
  assert_equals(blobFromSync('./LICENSE').type, '')

  assert_equals((await fileFrom('./LICENSE', 'text/plain')).type, 'text/plain')
  assert_equals((await fileFrom('./LICENSE')).type, '')

  assert_equals((await blobFrom('./LICENSE', 'text/plain')).type, 'text/plain')
  assert_equals((await blobFrom('./LICENSE')).type, '')
}, 'from utilities sets correct type')

promise_test(async () => {
  assert_equals(await blobFromSync('./LICENSE').text(), license.toString())
  assert_equals(await fileFromSync('./LICENSE').text(), license.toString())
  assert_equals(await (await blobFrom('./LICENSE')).text(), license.toString())
  assert_equals(await (await fileFrom('./LICENSE')).text(), license.toString())
}, 'blob part backed up by filesystem can be read')

promise_test(async () => {
  assert_equals(await blobFromSync('./LICENSE').text(), license.toString())
  assert_equals(await fileFromSync('./LICENSE').text(), license.toString())
  assert_equals(await (await blobFrom('./LICENSE')).text(), license.toString())
  assert_equals(await (await fileFrom('./LICENSE')).text(), license.toString())
}, 'blob part backed up by filesystem slice correctly')

promise_test(async () => {
  let blob
  // Can construct a temporary blob from a string
  blob = await createTemporaryBlob(license.toString())
  assert_equals(await blob.text(), license.toString())

  // Can construct a temporary blob from a async iterator
  blob = await createTemporaryBlob(blob.stream())
  assert_equals(await blob.text(), license.toString())

  // Can construct a temporary file from a arrayBuffer
  blob = await createTemporaryBlob(await blob.arrayBuffer())
  assert_equals(await blob.text(), license.toString())

  // Can construct a temporary file from a arrayBufferView
  blob = await createTemporaryBlob(await blob.arrayBuffer().then(ab => new Uint8Array(ab)))
  assert_equals(await blob.text(), license.toString())

  // Can specify a mime type
  blob = await createTemporaryBlob('abc', { type: 'text/plain' })
  assert_equals(blob.type, 'text/plain')

  // Can create files too
  let file = await createTemporaryFile('abc', 'abc.txt', {
    type: 'text/plain',
    lastModified: 123
  })
  assert_equals(file.name, 'abc.txt')
  assert_equals(file.size, 3)
  assert_equals(file.lastModified, 123)
}, 'creating temporary blob/file backed up by filesystem')

promise_test(async () => {
  fs.writeFileSync('temp', '')
  await blobFromSync('./temp').text()
  fs.unlinkSync('./temp')
}, 'can read empty files')

test(async () => {
  const blob = blobFromSync('./LICENSE')
  await new Promise(resolve => setTimeout(resolve, 2000))
  const now = new Date()
  // Change modified time
  fs.utimesSync('./LICENSE', now, now)
  const error = await blob.text().then(assert_unreached, e => e)
  assert_equals(error.constructor.name, 'DOMException')
  assert_equals(error instanceof Error, true)
  assert_equals(error.name, 'NotReadableError')

  const file = fileFromSync('./LICENSE')
  // Above test updates the last modified date to now
  assert_equals(typeof file.lastModified, 'number')
  // The lastModifiedDate is deprecated and removed from spec
  assert_false('lastModifiedDate' in file)
  assert_approx_equals(file.lastModified, +now, 1000)
}, 'Reading after modified should fail')

promise_test(async () => {
  assert_equals(await blobFromSync('./LICENSE').slice(0, 0).text(), '')
  assert_equals(await blobFromSync('./LICENSE').slice(0, 3).text(), license.slice(0, 3).toString())
  assert_equals(await blobFromSync('./LICENSE').slice(4, 11).text(), license.slice(4, 11).toString())
  assert_equals(await blobFromSync('./LICENSE').slice(-11).text(), license.slice(-11).toString())
  assert_equals(await blobFromSync('./LICENSE').slice(4, 11).slice(2, 5).text(), license.slice(4, 11).slice(2, 5).toString())
}, 'slicing blobs backed up by filesystem returns correct string')
