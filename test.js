import fs from 'fs';
import test from 'ava';
import {Response} from 'node-fetch';
import {Readable} from 'stream';
import Blob from './index.js';
import blobFrom from './from.js';

const license = fs.readFileSync('./LICENSE', 'utf-8');

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

	for await (const chunk of blob.stream()) {
		t.is(chunk.join(), [97, 61, 49].join());
	}
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
	const response = new Response(Readable.from(blob.stream()));
	const blob2 = await response.blob();
	t.is(await blob2.text(), data);
});

test('Blob works with node-fetch Response.text()', async t => {
	const data = 'a=1';
	const type = 'text/plain';
	const blob = new Blob([data], {type});
	const response = new Response(Readable.from(blob.stream()));
	const text = await response.text();
	t.is(text, data);
});

test('blob part backed up by filesystem', async t => {
	const blob = blobFrom('./LICENSE');
	t.is(await blob.slice(0, 3).text(), license.slice(0, 3));
	t.is(await blob.slice(4, 11).text(), license.slice(4, 11));
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
	t.is(error instanceof Error, true);
	t.is(error.name, 'NotReadableError');
});

test('Reading from the stream created by blobFrom', async t => {
	const blob = blobFrom('./LICENSE');
	const actual = await blob.text();
	t.is(actual, license);
});

test('Reading empty blobs', async t => {
	const blob = blobFrom('./LICENSE').slice(0, 0);
	const actual = await blob.text();
	t.is(actual, '');
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

/** @see https://github.com/w3c/FileAPI/issues/43 - important to keep boundary value */
test('Dose not lowercase the blob type', t => {
	const type = 'multipart/form-data; boundary=----WebKitFormBoundaryTKqdrVt01qOBltBd';
	t.is(new Blob([], {type}).type, type);
});

test('Parts are immutable', async t => {
	const buf = new Uint8Array([97]);
	const blob = new Blob([buf]);
	buf[0] = 98;
	t.is(await blob.text(), 'a');
});

test('Blobs are immutable', async t => {
	const buf = new Uint8Array([97]);
	const blob = new Blob([buf]);
	const chunk = await blob.stream().next();
	t.is(chunk.value[0], 97);
	chunk.value[0] = 98;
	t.is(await blob.text(), 'a');
});

// This was necessary to avoid large ArrayBuffer clones (slice)
test('Large chunks are divided into smaller chunks', async t => {
	const buf = new Uint8Array(65590);
	const blob = new Blob([buf]);
	let i = 0;
	// eslint-disable-next-line no-unused-vars
	for await (const chunk of blob.stream()) {
		i++;
	}

	t.is(i === 2, true);
});

test('Can use named import - as well as default', async t => {
	const {Blob, default: def} = await import('./index.js');
	t.is(Blob, def);
});
