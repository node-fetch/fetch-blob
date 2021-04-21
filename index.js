// 64 KiB (same size chrome slice theirs blob into Uint8array's)
const POOL_SIZE = 65536;

export default class Blob {

	/** @type {Array.<(Blob|Uint8Array)>} */
	#parts = [];
	#type = '';
	#size = 0;
	#avoidClone = false

	/**
	 * The Blob() constructor returns a new Blob object. The content
	 * of the blob consists of the concatenation of the values given
	 * in the parameter array.
	 *
	 * @param {(ArrayBufferLike | ArrayBufferView | Blob | string)[]} blobParts
	 * @param {{ type?: string }} [options]
	 */
	constructor(blobParts = [], options = {}) {
		let size = 0;

		const parts = blobParts.map(element => {
			let part;
			if (ArrayBuffer.isView(element)) {
				part = new Uint8Array(element.buffer.slice(element.byteOffset, element.byteOffset + element.byteLength));
			} else if (element instanceof ArrayBuffer) {
				part = new Uint8Array(element.slice(0));
			} else if (element instanceof Blob) {
				part = element;
			} else {
				part = new TextEncoder().encode(String(element));
			}

			size += ArrayBuffer.isView(part) ? part.byteLength : part.size;
			return part;
		});

		const type = options.type === undefined ? '' : String(options.type);

		this.#type = /[^\u0020-\u007E]/.test(type) ? '' : type;
		this.#size = size;
		this.#parts = parts;
	}

	/**
	 * The Blob interface's size property returns the
	 * size of the Blob in bytes.
	 */
	get size() {
		return this.#size;
	}

	/**
	 * The type property of a Blob object returns the MIME type of the file.
	 */
	get type() {
		return this.#type;
	}

	/**
	 * The text() method in the Blob interface returns a Promise
	 * that resolves with a string containing the contents of
	 * the blob, interpreted as UTF-8.
	 *
	 * @return {Promise<string>}
	 */
	async text() {
		this.#avoidClone = true
		// More optimized than using this.arrayBuffer()
		// that requires twice as much ram
		const decoder = new TextDecoder();
		let str = '';
		for await (let part of this.stream()) {
			str += decoder.decode(part, { stream: true });
		}
		// Remaining
		str += decoder.decode();
		return str;
	}

	/**
	 * The arrayBuffer() method in the Blob interface returns a
	 * Promise that resolves with the contents of the blob as
	 * binary data contained in an ArrayBuffer.
	 *
	 * @return {Promise<ArrayBuffer>}
	 */
	async arrayBuffer() {
		this.#avoidClone = true
		const data = new Uint8Array(this.size);
		let offset = 0;
		for await (const chunk of this.stream()) {
			data.set(chunk, offset);
			offset += chunk.length;
		}

		return data.buffer;
	}

	/**
	 * The Blob stream() implements partial support of the whatwg stream
	 * by being only async iterable.
	 *
	 * @returns {AsyncGenerator<Uint8Array>}
	 */
	async * stream() {
		for (let part of this.#parts) {
			if ('stream' in part) {
				yield * part.stream();
			} else {
				if (this.#avoidClone) {
					yield part
				} else {
					let position = part.byteOffset;
					let end = part.byteOffset + part.byteLength;
					while (position !== end) {
						const size = Math.min(end - position, POOL_SIZE);
						const chunk = part.buffer.slice(position, position + size);
						yield new Uint8Array(chunk);
						position += chunk.byteLength;
					}
				}
			}
		}
		this.#avoidClone = false
	}

	/**
	 * The Blob interface's slice() method creates and returns a
	 * new Blob object which contains data from a subset of the
	 * blob on which it's called.
	 *
	 * @param {number} [start]
	 * @param {number} [end]
	 * @param {string} [type]
	 */
	slice(start = 0, end = this.size, type = '') {
		const {size} = this;

		let relativeStart = start < 0 ? Math.max(size + start, 0) : Math.min(start, size);
		let relativeEnd = end < 0 ? Math.max(size + end, 0) : Math.min(end, size);

		const span = Math.max(relativeEnd - relativeStart, 0);
		const parts = this.#parts;
		const blobParts = [];
		let added = 0;

		for (const part of parts) {
			const size = ArrayBuffer.isView(part) ? part.byteLength : part.size;
			if (relativeStart && size <= relativeStart) {
				// Skip the beginning and change the relative
				// start & end position as we skip the unwanted parts
				relativeStart -= size;
				relativeEnd -= size;
			} else {
				let chunk
				if (ArrayBuffer.isView(part)) {
					chunk = part.subarray(relativeStart, Math.min(size, relativeEnd));
					added += chunk.byteLength
				} else {
					chunk = part.slice(relativeStart, Math.min(size, relativeEnd));
					added += chunk.size
				}
				blobParts.push(chunk);
				relativeStart = 0; // All next sequental parts should start at 0

				// don't add the overflow to new blobParts
				if (added >= span) {
					break;
				}
			}
		}

		const blob = new Blob([], {type: String(type).toLowerCase()});
		blob.#size = span;
		blob.#parts = blobParts;

		return blob;
	}

	get [Symbol.toStringTag]() {
		return 'Blob';
	}

	static [Symbol.hasInstance](object) {
		return (
			object &&
			typeof object === 'object' &&
			typeof object.stream === 'function' &&
			object.stream.length === 0 &&
			typeof object.constructor === 'function' &&
			/^(Blob|File)$/.test(object[Symbol.toStringTag])
		);
	}
}

Object.defineProperties(Blob.prototype, {
	size: {enumerable: true},
	type: {enumerable: true},
	slice: {enumerable: true}
});

export { Blob };
