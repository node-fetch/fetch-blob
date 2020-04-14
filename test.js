const test = require('ava');
const Blob = require('.');
const getStream = require('get-stream');
const {Response} = require('node-fetch');

test('Blob ctor', t => {
	const data = 'a=1';
	const blob = new Blob([data]); // eslint-disable-line no-unused-vars
	t.pass();
});

test('Blob size', t => {
	const data = 'a=1';
	const blob = new Blob([data]);
	t.is(blob.size, data.length);
});

test('Blob type', t => {
	const data = 'a=1';
	const type = 'text/plain';
	const blob = new Blob([data], {type});
	t.is(blob.type, type);
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
	const data = 'a=1';
	const type = 'text/plain';
	const blob = new Blob([data], {type});
	const blob2 = blob.slice(0, 1);
	t.is(await blob2.text(), data.slice(0, 1));
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
