import {statSync, createReadStream, promises as fs} from 'fs';
import DOMException from 'domexception';
import Blob from './index.js';

const {stat} = fs;

/**
 * @param {string} path filepath on the disk
 * @returns {Blob}
 */
const blobFrom = path => from(statSync(path), path);

/**
 * @param {string} path filepath on the disk
 * @returns {Promise<Blob>}
 */
 const blobFromAsync = path => stat(path).then(stat => from(stat, path));

const from = (stat, path) => new Blob([new BlobDataItem({
	path,
	size: stat.size,
	lastModified: Number(stat.mtime),
	start: 0
})]);

/**
 * This is a blob backed up by a file on the disk
 * with minium requirement. Its wrapped around a Blob as a blobPart
 * so you have no direct access to this.
 *
 * @private
 */
class BlobDataItem {
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
			path: this.path,
			start,
			mtime: this.mtime,
			size: end - start
		});
	}

	async * stream() {
		const metadata = await stat(this.#path)
		if (metadata.mtime > this.lastModified) {
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

export default blobFrom;
export {Blob, blobFrom, blobFromAsync};
