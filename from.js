import {statSync, createReadStream} from 'fs';
import {stat} from 'fs/promises';
import DOMException from 'domexception';
import Blob from './index.js';

/**
 * @param {string} path filepath on the disk
 * @returns {Blob}
 */
const blobFromSync = path => from(statSync(path), path);

/**
 * @param {string} path filepath on the disk
 * @returns {Promise<Blob>}
 */
 const blobFrom = path => stat(path).then(stat => from(stat, path));

const from = (stat, path) => new Blob([new BlobDataItem({
	path,
	size: stat.size,
	lastModified: stat.mtimeMs,
	start: 0
})]);

/**
 * This is a blob backed up by a file on the disk
 * with minium requirement. Its wrapped around a Blob as a blobPart
 * so you have no direct access to this.
 *
 * @private
 */
export default class BlobDataItem {
	#path;
	#start;

	constructor(options) {
		this.#path = options.path;
		this.#start = options.start;
		this.size = options.size;
		this.lastModified = options.lastModified
	}

	/**
	 * Slicing arguments is first validated and formatted
	 * to not be out of range by Blob.prototype.slice
	 */
	slice(start, end) {
		return new BlobDataItem({
			path: this.#path,
			lastModified: this.lastModified,
			size: end - start,
			start
		});
	}

	async * stream() {
		const {mtimeMs} = await stat(this.#path)
		if (mtimeMs > this.lastModified) {
			throw new DOMException('The requested file could not be read, typically due to permission problems that have occurred after a reference to a file was acquired.', 'NotReadableError');
		}
		if (this.size) {
			yield * createReadStream(this.#path, {
				start: this.#start,
				end: this.#start + this.size - 1
			});
		}
	}

	get [Symbol.toStringTag]() {
		return 'Blob';
	}
}

export {Blob, blobFrom, blobFromSync};
