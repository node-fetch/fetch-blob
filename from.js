const {statSync, createReadStream, promises: fs} = require('fs');
const Blob = require('./index.js');
const DOMException = require('domexception');

/**
 * Creates a Blob referencing to a file on disk. Synchronous version of blobFrom
 *
 * @param {string} path filepath on the disk
 * @returns {Blob}
 */
function blobFromSync(path) {
	const {size, mtime} = statSync(path);
	const blob = new BlobDataItem({path, size, mtime});

	return new Blob([blob]);
}

/**
 * Creates a Blob referencing to a file on disk.
 *
 * @param {string} path
 * @returns {Promise<Blob>}
 */
async function blobFrom(path) {
	const {size, mtime} = await fs.stat(path);
	const blob = new BlobDataItem({path, size, mtime});

	return new Blob([blob]);
}

/**
 * This is a blob backed up by a file on the disk
 * with minium requirement
 *
 * @private
 */
class BlobDataItem {
	constructor(options) {
		this.size = options.size;
		this.path = options.path;
		this.start = options.start || 0;
		this.mtime = options.mtime;
	}

	// Slicing arguments is first validated and formated
	// to not be out of range by Blob.prototype.slice
	slice(start, end) {
		return new BlobDataItem({
			path: this.path,
			start,
			mtime: this.mtime,
			size: end - start
		});
	}

	async* stream() {
		const {mtime} = await fs.stat(this.path);

		if (mtime > this.mtime) {
			throw new DOMException('The requested file could not be read, typically due to permission problems that have occurred after a reference to a file was acquired.', 'NotReadableError');
		}

		yield* this.size
			? createReadStream(this.path, {start: this.start, end: this.start + this.size - 1})
			: new Blob().stream();
	}

	get [Symbol.toStringTag]() {
		return 'Blob';
	}
}

module.exports = blobFromSync;
module.exports.blobFrom = blobFrom;
module.exports.blobFromSync = blobFromSync;
