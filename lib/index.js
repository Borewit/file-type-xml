import sax from 'sax';

function startsWith(array, prefix) {
	if (prefix.length > array.length) {
		return false;
	}
	for (let i = 0; i < prefix.length; i++) {
		if (array[i] !== prefix[i]) {
			return false;
		}
	}
	return true;
}

function isXml(array) {
	if (startsWith(array, [60, 63, 120, 109, 108, 32])) {
		return {xml: true, encoding: 'utf-8', offset: 0}
	} else if (startsWith(array, [0xEF, 0xBB, 0xBF, 60, 63, 120, 109, 108, 32])) { // UTF-8 BOM
		return {xml: true, encoding: 'utf-8', offset: 3}
	} else if (startsWith(array, [0xFE, 0xFF, 0, 60, 0, 63, 0, 120, 0, 109, 0, 108, 0, 32])) {
		return {xml: true, encoding: 'utf-16be', offset: 2}
	} else if (startsWith(array, [0xFF, 0xFE, 60, 0, 63, 0, 120, 0, 109, 0, 108, 0, 32, 0])) {
		return {xml: true, encoding: 'utf-16le', offset: 2}
	} else if (startsWith(array, [0, 60, 0, 63, 0, 120, 0, 109, 0, 108, 0, 32])) {
		return {xml: true, encoding: 'utf-16be', offset: 0}
	} else if (startsWith(array, [60, 0, 63, 0, 120, 0, 109, 0, 108, 0, 32, 0])) {
		return {xml: true, encoding: 'utf-16le', offset: 0}
	}
	return {xml: false, encoding: undefined}
}

function extractNsElement(node) {
	const parts = node.name.split(':');
	if (parts.length === 1) {
		return {name: parts[0], ns: node.attributes['xmlns']};
	} else if (parts.length === 2) {
		return {name: parts[1], ns: node.attributes[`xmlns:${parts[0]}`]};
	}
}

/**
 * Maps the root element namespace to corresponding file-type
 */
const namespaceMapping = {
	'http://www.w3.org/2000/svg': {
		ext: 'svg',
		mime: 'image/svg+xml',
	},
	'http://www.w3.org/1999/xhtml': {
		ext: 'xhtml',
		mime: 'application/xhtml+xml',
	},
	'http://www.opengis.net/kml/2.2': {
		ext: 'kml',
		mime: 'application/vnd.google-earth.kml+xml',
	},
	'http://www.opengis.net/gml': {
		ext: 'gml',
		mime: 'application/gml+xml',
	}
}

/**
 * Maps the root element name to corresponding file-type.
 * Used for Non-namespaced XML
 * @type {{rss: {ext: string, mime: string}}}
 */
const rootNameMapping = {
	rss: {
		ext: 'rss',
		mime: 'application/rss+xml',
	},
	'score-partwise': {
		ext: 'musicxml',
		mime: 'application/vnd.recordare.musicxml+xml',
	},
	svg: {
		ext: 'svg',
		mime: 'image/svg+xml',
	},
}

export class XmlTextDetector {

	constructor(options) {
		this.options = options ?? {};
		this.firstTag = true;
		this.onEnd = false;
		this.parser = sax.parser(true);
		this.nesting = 0;

		this.parser.onerror = e => {
			if (e.message.startsWith('Invalid character entity')) { // Allow entity reference
				return;
			}
			this.fileType = undefined;
			this.onEnd = true;
		};
		this.parser.onopentag = node => {
			++this.nesting;
			if (!this.firstTag || this.onEnd) {
				return;
			}
			this.firstTag = false;
			const nsNode = extractNsElement(node);
			if (nsNode.ns) {
				// Resolve file-type boot root element namespace
				this.fileType = namespaceMapping[nsNode.ns.toLowerCase()];
			} else {
				// Fall back on element name if there is no namespace
				this.fileType = rootNameMapping[nsNode.name?.toLowerCase()];
			}

			if (this.fileType && !this.options.fullScan) {
				this.onEnd = true;
			}
		};

		this.parser.onclosetag = () => {
			--this.nesting;
		}
	}

	write(text) {
		this.parser.write(text);
	}

	close() {
		this.parser.close();
		this.onEnd = true;
	}

	isValid() {
		return this.nesting === 0;
	}
}

export const detectXml = async tokenizer => {

	const buffer = new Uint8Array(512);

	// Increase sample size from 12 to 256.
	await tokenizer.peekBuffer(buffer, {length: 128, mayBeLess: true});

	const {xml, encoding, offset} = isXml(buffer);

	if (xml) {
		await tokenizer.ignore(offset);

		const xmlTextDetector = new XmlTextDetector();

		const textDecoder = new TextDecoder(encoding);

		do {
			const len = await tokenizer.readBuffer(buffer, {mayBeLess: true});
			const portion = buffer.subarray(0, len);
			const text = textDecoder.decode(portion);
			xmlTextDetector.write(text);
			if (len < buffer.length) {
				xmlTextDetector.close();
			}
		} while (!xmlTextDetector.onEnd)

		return xmlTextDetector.fileType ?? {
			ext: 'xml',
			mime: 'application/xml',
		}
	}

};

