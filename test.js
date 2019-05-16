
import test from 'ava';
import Blob from './blob';
import util from 'util';
import stream from 'stream';
import getStream from 'get-stream';
import { Response } from 'node-fetch';

const TextDecoder = util.TextDecoder;
const Readable = stream.Readable;

test('Blob ctor', t => {
	let data = 'a=1';
	let blob = new Blob([data]);
	t.pass();
});

test('Blob size', t => {
	let data = 'a=1';
	let blob = new Blob([data]);
	t.is(blob.size, data.length);
});

test('Blob type', t => {
	let data = 'a=1';
	let type = 'text/plain';
	let blob = new Blob([data], { type });
	t.is(blob.type, type);
});

test('Blob text()', async t => {
	let data = 'a=1';
	let type = 'text/plain';
	let blob = new Blob([data], { type });
	t.is(await blob.text(), data);
});

test('Blob arrayBuffer()', async t => {
	let data = 'a=1';
	let type = 'text/plain';
	let blob = new Blob([data], { type });

	let decoder = new TextDecoder('utf-8');
	let buffer = await blob.arrayBuffer();
	t.is(decoder.decode(buffer), data);
});

test('Blob stream()', async t => {
	let data = 'a=1';
	let type = 'text/plain';
	let blob = new Blob([data], { type });
	let result = await getStream(blob.stream());
	t.is(result, data);
});

test('Blob toString()', t => {
	let data = 'a=1';
	let type = 'text/plain';
	let blob = new Blob([data], { type });
	t.is(blob.toString(), '[object Blob]');
});

test('Blob slice()', async t => {
	let data = 'a=1';
	let type = 'text/plain';
	let blob = new Blob([data], { type });
	let blob2 = blob.slice(0, 1);
	t.is(await blob2.text(), data.slice(0, 1));
});

test('Blob works with node-fetch Response.blob()', async t => {
	let data = 'a=1';
	let type = 'text/plain';
	let blob = new Blob([data], { type });
	let res = new Response(blob);
	let blob2 = await res.blob();
	t.is(await blob2.text(), data);
});

test('Blob works with node-fetch Response.text()', async t => {
	let data = 'a=1';
	let type = 'text/plain';
	let blob = new Blob([data], { type });
	let res = new Response(blob);
	let text = await res.text();
	t.is(text, data);
});
