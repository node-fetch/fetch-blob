// Based on https://github.com/tmpvar/jsdom/blob/aa85b2abf07766ff7bf5c1f6daafb3726f2f2db5/lib/jsdom/living/blob.js
// (MIT licensed)

const {Readable: ReadableStream} = require('stream');

const wm = new WeakMap();

class Blob {
	constructor(blobParts = [], options = {type: ''}) {
		const buffers = [];
		let size = 0;

		blobParts.forEach(element => {
			let buffer;
			if (element instanceof Buffer) {
				buffer = element;
			} else if (ArrayBuffer.isView(element)) {
				buffer = Buffer.from(element.buffer, element.byteOffset, element.byteLength);
			} else if (element instanceof ArrayBuffer) {
				buffer = Buffer.from(element);
			} else if (element instanceof Blob) {
				buffer = wm.get(element).buffer;
			} else {
				buffer = Buffer.from(typeof element === 'string' ? element : String(element));
			}

			size += buffer.length;
			buffers.push(buffer);
		});

		const buffer = Buffer.concat(buffers, size);

		const type = options.type === undefined ? '' : String(options.type).toLowerCase();

		wm.set(this, {
			type: /[^\u0020-\u007E]/.test(type) ? '' : type,
			size,
			buffer
		});
	}

	get size() {
		return wm.get(this).size;
	}

	get type() {
		return wm.get(this).type;
	}

	text() {
		return Promise.resolve(wm.get(this).buffer.toString());
	}

	arrayBuffer() {
		const buf = wm.get(this).buffer;
		const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
		return Promise.resolve(ab);
	}

	stream() {
		const readable = new ReadableStream();
		readable._read = () => { };
		readable.push(wm.get(this).buffer);
		readable.push(null);
		return readable;
	}

	toString() {
		return '[object Blob]';
	}

	slice(...args) {
		const {size} = this;

		const start = args[0];
		const end = args[1];
		let relativeStart;
		let relativeEnd;

		if (start === undefined) {
			relativeStart = 0; //
		} else if (start < 0) {
			relativeStart = Math.max(size + start, 0); //
		} else {
			relativeStart = Math.min(start, size);
		}

		if (end === undefined) {
			relativeEnd = size; //
		} else if (end < 0) {
			relativeEnd = Math.max(size + end, 0); //
		} else {
			relativeEnd = Math.min(end, size);
		}

		const span = Math.max(relativeEnd - relativeStart, 0);
		const slicedBuffer = wm.get(this).buffer.slice(
			relativeStart,
			relativeStart + span
		);
		const blob = new Blob([], {type: args[2]});
		const _ = wm.get(blob);
		_.buffer = slicedBuffer;
		return blob;
	}
}

Object.defineProperties(Blob.prototype, {
	size: {enumerable: true},
	type: {enumerable: true},
	slice: {enumerable: true}
});

Object.defineProperty(Blob.prototype, Symbol.toStringTag, {
	value: 'Blob',
	writable: false,
	enumerable: false,
	configurable: true
});

module.exports = Blob;
