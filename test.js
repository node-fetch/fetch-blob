const fs = require('fs');
const test = require('ava');
const getStream = require('get-stream');
const {Response} = require('node-fetch');
const {TextDecoder} = require('util');
const Blob = require('./index.js');
const blobFrom = require('./from.js');

test('new Blob()', t => {
	const blob = new Blob(); // eslint-disable-line no-unused-vars
	t.pass();
});

test('new Blob(parts)', t => {
	const data = 'a=1';
	const blob = new Blob([data]); // eslint-disable-line no-unused-vars
	t.pass();
});

test('Blob ctor parts', async t => {
	const parts = [
		'a',
		new Uint8Array([98]),
		new Uint16Array([25699]),
		new Uint8Array([101]).buffer,
		Buffer.from('f'),
		new Blob(['g']),
		{}
	];

	const blob = new Blob(parts);
	t.is(await blob.text(), 'abcdefg[object Object]');
});

test('Blob size', t => {
	const data = 'a=1';
	const blob = new Blob([data]);
	t.is(blob.size, data.length);
});

test('Blob type', t => {
	const type = 'text/plain';
	const blob = new Blob([], {type});
	t.is(blob.type, type);
});

test('Blob slice type', t => {
	const type = 'text/plain';
	const blob = new Blob().slice(0, 0, type);
	t.is(blob.type, type);
});

test('invalid Blob type', t => {
	const blob = new Blob([], {type: '\u001Ftext/plain'});
	t.is(blob.type, '');
});

test('invalid Blob slice type', t => {
	const blob = new Blob().slice(0, 0, '\u001Ftext/plain');
	t.is(blob.type, '');
});

test('Blob text()', async t => {
	const data = 'a=1';
	const type = 'text/plain';
	const blob = new Blob([data], {type});
	t.is(await blob.text(), data);
});

test('Blob arrayBuffer()', async t => {
	const data = 'a=1';
	const type = 'text/plain';
	const blob = new Blob([data], {type});

	const decoder = new TextDecoder('utf-8');
	const buffer = await blob.arrayBuffer();
	t.is(decoder.decode(buffer), data);
});

test('Blob stream()', async t => {
	const data = 'a=1';
	const type = 'text/plain';
	const blob = new Blob([data], {type});
	const result = await getStream(blob.stream());
	t.is(result, data);
});

test('Blob toString()', t => {
	const data = 'a=1';
	const type = 'text/plain';
	const blob = new Blob([data], {type});
	t.is(blob.toString(), '[object Blob]');
});

test('Blob slice()', async t => {
	const data = 'abcdefgh';
	const blob = new Blob([data]).slice();
	t.is(await blob.text(), data);
});

test('Blob slice(0, 1)', async t => {
	const data = 'abcdefgh';
	const blob = new Blob([data]).slice(0, 1);
	t.is(await blob.text(), 'a');
});

test('Blob slice(-1)', async t => {
	const data = 'abcdefgh';
	const blob = new Blob([data]).slice(-1);
	t.is(await blob.text(), 'h');
});

test('Blob slice(0, -1)', async t => {
	const data = 'abcdefgh';
	const blob = new Blob([data]).slice(0, -1);
	t.is(await blob.text(), 'abcdefg');
});

test('Blob(["hello ", "world"]).slice(5)', async t => {
	const parts = ['hello ', 'world'];
	const blob = new Blob(parts);
	t.is(await blob.slice(5).text(), ' world');
});

test('throw away unwanted parts', async t => {
	const blob = new Blob(['a', 'b', 'c']).slice(1, 2);
	t.is(await blob.text(), 'b');
});

test('Blob works with node-fetch Response.blob()', async t => {
	const data = 'a=1';
	const type = 'text/plain';
	const blob = new Blob([data], {type});
	const response = new Response(blob);
	const blob2 = await response.blob();
	t.is(await blob2.text(), data);
});

test('Blob works with node-fetch Response.text()', async t => {
	const data = 'a=1';
	const type = 'text/plain';
	const blob = new Blob([data], {type});
	const response = new Response(blob);
	const text = await response.text();
	t.is(text, data);
});

test('blob part backed up by filesystem', async t => {
	const blob = blobFrom('./LICENSE');
	t.is(await blob.slice(0, 3).text(), 'MIT');
	t.is(await blob.slice(4, 11).text(), 'License');
});

test('Reading after modified should fail', async t => {
	const blob = blobFrom('./LICENSE');
	await new Promise(resolve => {
		setTimeout(resolve, 100);
	});
	const now = new Date();
	// Change modified time
	fs.utimesSync('./LICENSE', now, now);
	const error = await blob.text().catch(error => error);
	t.is(error.name, 'NotReadableError');
});

test('Blob-ish class is an instance of Blob', t => {
	class File {
		stream() {}

		get [Symbol.toStringTag]() {
			return 'File';
		}
	}

	t.true(new File() instanceof Blob);
});

test('Instanceof check returns false for nullish values', t => {
	t.false(null instanceof Blob);
});
