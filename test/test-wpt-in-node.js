// Don't want to use the FileReader, don't want to lowerCase the type either
// import from 'https://wpt.live/resources/testharnessreport.js'
import { File, Blob } from '../from.js'

let hasFailed
globalThis.self = globalThis
await import('https://wpt.live/resources/testharness.js')

setup({
  explicit_timeout: true,
  explicit_done: true
})

function test_blob (fn, expectations) {
  const expected = expectations.expected
  const type = expectations.type
  const desc = expectations.desc
  const length = expectations.length

  const t = async_test(desc)
  t.step(async function () {
    const blob = fn()
    assert_true(blob instanceof Blob)
    assert_false(blob instanceof File)
    assert_equals(blob.type.toLowerCase(), type)
    assert_equals(await blob.text(), expected)
    t.done()
  })
}

function test_blob_binary (fn, expectations) {
  const expected = expectations.expected
  const type = expectations.type
  const desc = expectations.desc

  const t = async_test(desc)
  t.step(async function () {
    const blob = fn()
    assert_true(blob instanceof Blob)
    assert_false(blob instanceof File)
    assert_equals(blob.type.toLowerCase(), type)
    const result = await blob.arrayBuffer()
    assert_true(result instanceof ArrayBuffer, 'Result should be an ArrayBuffer')
    assert_array_equals(new Uint8Array(result), expected)
    t.done()
  })
}

// Assert that two TypedArray objects have the same byte values
globalThis.assert_equals_typed_array = (array1, array2) => {
  const [view1, view2] = [array1, array2].map((array) => {
    assert_true(array.buffer instanceof ArrayBuffer,
      'Expect input ArrayBuffers to contain field `buffer`')
    return new DataView(array.buffer, array.byteOffset, array.byteLength)
  })

  assert_equals(view1.byteLength, view2.byteLength,
    'Expect both arrays to be of the same byte length')

  const byteLength = view1.byteLength

  for (let i = 0; i < byteLength; ++i) {
    assert_equals(view1.getUint8(i), view2.getUint8(i),
      `Expect byte at buffer position ${i} to be equal`)
  }
}

globalThis.add_result_callback((test, ...args) => {
  if ([
    'Blob with type "A"',
    'Blob with type "TEXT/HTML"',
    'Getters and value conversions should happen in order until an exception is thrown.',
    'Using type in File constructor: TEXT/PLAIN',
    'Using type in File constructor: text/plain;charset=UTF-8'
  ].includes(test.name)) return

  const INDENT_SIZE = 2
  const reporter = {}

  reporter.startSuite = name => console.log(`\n  ${(name)}\n`)

  reporter.pass = message => console.log((indent(('√ ') + message, INDENT_SIZE)))

  reporter.fail = message => console.log((indent('\u00D7 ' + message, INDENT_SIZE)))

  reporter.reportStack = stack => console.log((indent(stack, INDENT_SIZE * 2)))

  function indent (string, times) {
    const prefix = ' '.repeat(times)
    return string.split('\n').map(l => prefix + l).join('\n')
  }

  if (test.status === 0) {
    reporter.pass(test.name)
  } else if (test.status === 1) {
    reporter.fail(`${test.name}\n`)
    reporter.reportStack(`${test.message}\n${test.stack}`)
    hasFailed = true
  } else if (test.status === 2) {
    reporter.fail(`${test.name} (timeout)\n`)
    reporter.reportStack(`${test.message}\n${test.stack}`)
    hasFailed = true
  } else if (test.status === 3) {
    reporter.fail(`${test.name} (incomplete)\n`)
    reporter.reportStack(`${test.message}\n${test.stack}`)
    hasFailed = true
  } else if (test.status === 4) {
    reporter.fail(`${test.name} (precondition failed)\n`)
    reporter.reportStack(`${test.message}\n${test.stack}`)
    hasFailed = true
  } else {
    reporter.fail(`unknown test status: ${test.status}`)
    hasFailed = true
  }
})

globalThis.File = File
globalThis.Blob = Blob
globalThis.garbageCollect = () => {}
globalThis.test_blob = test_blob
globalThis.test_blob_binary = test_blob_binary
// Cuz WPT don't clean up after itself
globalThis.MessageChannel = class extends MessageChannel {
  constructor () {
    super()
    setTimeout(() => {
      this.port1.close()
      this.port2.close()
      this.port1.onmessage = this.port2.onmessage = null
    }, 100)
  }
}

import('https://wpt.live/FileAPI/file/File-constructor.any.js')
import('https://wpt.live/FileAPI/blob/Blob-constructor.any.js')
import('https://wpt.live/FileAPI/blob/Blob-array-buffer.any.js')
import('https://wpt.live/FileAPI/blob/Blob-slice-overflow.any.js')
import('https://wpt.live/FileAPI/blob/Blob-slice.any.js')
import('https://wpt.live/FileAPI/blob/Blob-stream.any.js')
import('https://wpt.live/FileAPI/blob/Blob-text.any.js')
import('./own-misc-test.js')

hasFailed && process.exit(1)