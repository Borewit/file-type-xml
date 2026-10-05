import sax from "sax";
import type { ITokenizer } from "strtok3";
import type { FileTypeResult, Detector } from "file-type";
import { parseDoctype } from "./xmlDocTypeParser.js";

type XmlTextEncoding = "utf-8" | "utf-16be" | "utf-16le";

function startsWith(
	array: Uint8Array | number[],
	prefix: Uint8Array | number[],
) {
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

// Let SAX handle XML syntax; only distinguish a completed root from a partial sample.
function probeXml(text: string): { xml: boolean; incomplete: boolean } {
	// Require a DOCTYPE completion event before accepting a root following a DOCTYPE.
	const misc = /[ \t\r\n]+|<!--[\s\S]*?-->|<\?[\s\S]*?\?>/y;
	let offset = 0;
	while (misc.exec(text)) {
		offset = misc.lastIndex;
	}
	let doctypeComplete = !text.startsWith("<!DOCTYPE", offset);
	let xml = false;
	let invalid = false;
	const parser = sax.parser(true);
	parser.ondoctype = () => {
		doctypeComplete = true;
	};
	parser.onerror = (error) => {
		if (!error.message.startsWith("Invalid character entity")) {
			invalid = true;
		}
	};
	parser.onopentag = () => {
		if (!invalid && doctypeComplete) {
			xml = true;
		}
	};
	parser.write(text);
	return { xml, incomplete: !xml && !invalid };
}

function xmlEncoding(array: Uint8Array): {
	encoding: XmlTextEncoding;
	offset: number;
} {
	if (startsWith(array, [0xef, 0xbb, 0xbf])) {
		return { encoding: "utf-8", offset: 3 };
	}
	if (startsWith(array, [0xfe, 0xff])) {
		return { encoding: "utf-16be", offset: 2 };
	}
	if (startsWith(array, [0xff, 0xfe])) {
		return { encoding: "utf-16le", offset: 2 };
	}
	if (startsWith(array, [0, 60, 0, 63, 0, 120, 0, 109, 0, 108, 0, 32])) {
		return { encoding: "utf-16be", offset: 0 };
	}
	if (startsWith(array, [60, 0, 63, 0, 120, 0, 109, 0, 108, 0, 32, 0])) {
		return { encoding: "utf-16le", offset: 0 };
	}
	return { encoding: "utf-8", offset: 0 };
}

function probeXmlBuffer(array: Uint8Array) {
	const { encoding, offset } = xmlEncoding(array);
	const negative = { xml: false, incomplete: false, encoding, offset };
	const width = encoding === "utf-8" ? 1 : 2;
	let position = offset;
	for (; position + width <= array.length; position += width) {
		const character =
			width === 1
				? array[position]
				: encoding === "utf-16le"
					? array[position] | (array[position + 1] << 8)
					: (array[position] << 8) | array[position + 1];
		if (
			character === 32 ||
			character === 9 ||
			character === 10 ||
			character === 13
		) {
			continue;
		}
		if (character !== 60) {
			return negative;
		}
		break;
	}
	if (position + width > array.length) {
		return { ...negative, incomplete: true };
	}
	let text: string;
	try {
		// A sample may end midway through a character; reject invalid bytes within it.
		text = new TextDecoder(encoding, { fatal: true }).decode(
			array.subarray(offset),
			{ stream: true },
		);
	} catch (error) {
		if (!(error instanceof TypeError)) {
			throw error;
		}
		return negative;
	}
	const probe = text.startsWith("<?xml ")
		? { xml: true, incomplete: false }
		: probeXml(text);
	return { ...probe, encoding, offset };
}

export function isXml(
	array: Uint8Array,
): { xml: true; encoding: XmlTextEncoding; offset: number } | { xml: false } {
	const { xml, encoding, offset } = probeXmlBuffer(array);
	return xml ? { xml: true, encoding, offset } : { xml: false };
}

export const fileType = {
	docBook: {
		ext: "dbk",
		mime: "application/docbook+xml",
	},
	gpx: {
		ext: "gpx",
		mime: "application/gpx+xml",
	},
	musicXml: {
		ext: "musicxml",
		mime: "application/vnd.recordare.musicxml+xml",
	},
	plist: {
		ext: "plist",
		mime: "application/x-plist",
	},
	smil: {
		ext: "smil",
		mime: "application/smil+xml",
	},
	svg: {
		ext: "svg",
		mime: "image/svg+xml",
	},
	x3d: {
		ext: "x3d",
		mime: "model/x3d+xml",
	},
} as const satisfies Record<string, FileTypeResult>;

interface IXmlTextDetectorOptions {
	fullScan?: boolean;
}

/**
 * Maps the root element namespace to the corresponding file-type
 */
const namespaceMapping: { [id: string]: FileTypeResult } = {
	"http://www.w3.org/2000/svg": fileType.svg,
	"http://www.w3.org/1999/xhtml": {
		ext: "xhtml",
		mime: "application/xhtml+xml",
	},
	"http://www.opengis.net/kml/2.2": {
		ext: "kml",
		mime: "application/vnd.google-earth.kml+xml",
	},
	"http://www.opengis.net/gml": {
		ext: "gml",
		mime: "application/gml+xml",
	},
	"http://www.w3.org/ns/ttml": {
		ext: "ttml",
		mime: "application/ttml+xml",
	},
	"http://www.w3.org/2001/SMIL20/Language": fileType.smil,
	"http://www.w3.org/2005/Atom": {
		ext: "atom",
		mime: "application/atom+xml",
	},
	"urn:oasis:names:tc:xliff:document:2.0": {
		ext: "xlf",
		mime: "application/xliff+xml",
	},
	"http://docbook.org/ns/docbook": fileType.docBook,
	"http://www.tei-c.org/ns/1.0": {
		ext: "tei",
		mime: "application/tei+xml",
	},
	"http://www.w3.org/1998/Math/MathML": {
		ext: "mml",
		mime: "application/mathml+xml",
	},
	"http://www.topografix.com/GPX/1/0": fileType.gpx,
	"http://www.topografix.com/GPX/1/1": fileType.gpx,
};

/**
 * Maps the root element name to the corresponding file-type.
 * Used for Non-namespaced XML
 */
const rootNameMapping: { [id: string]: FileTypeResult } = {
	opml: {
		ext: "opml",
		mime: "text/x-opml",
	},
	plist: fileType.plist,
	rss: {
		ext: "rss",
		mime: "application/rss+xml",
	},
	"score-partwise": fileType.musicXml,
	smil: fileType.smil,
	svg: fileType.svg,
};

/**
 * Maps DOCTYPE public identifier to the corresponding file-type
 */
const docTypeMapping: { [id: string]: FileTypeResult } = {
	"-//OASIS//DTD DocBook XML V4.0//EN": fileType.docBook,
	"-//OASIS//DTD DocBook XML V4.1//EN": fileType.docBook,
	"-//OASIS//DTD DocBook XML V4.2//EN": fileType.docBook,
	"-//OASIS//DTD DocBook XML V4.3//EN": fileType.docBook,
	"-//OASIS//DTD DocBook XML V4.4//EN": fileType.docBook,
	"-//OASIS//DTD DocBook XML V4.5//EN": fileType.docBook,
	"-//Recordare//DTD MusicXML 4.0 Partwise//EN": fileType.musicXml,
	"-//Apple//DTD PLIST 1.0//EN": fileType.plist,
	"ISO//Web3D//DTD X3D 3.3//EN": fileType.x3d,
};

export class XmlTextDetector {
	private options: IXmlTextDetectorOptions;
	private firstTag: boolean;
	private parser: sax.SAXParser;
	private nesting: number;
	public onEnd: boolean;
	public fileType?: FileTypeResult;

	constructor(options?: IXmlTextDetectorOptions) {
		this.options = options ?? {};
		this.firstTag = true;
		this.onEnd = false;
		this.parser = sax.parser(true, { xmlns: true });
		this.nesting = 0;
		this.parser.onerror = (e) => {
			if (e.message.startsWith("Invalid character entity")) {
				// Allow entity reference
				return;
			}
			this.fileType = undefined;
			this.onEnd = true;
		};
		this.parser.onopentag = (node) => {
			++this.nesting;
			if (!this.firstTag || this.onEnd) {
				return;
			}
			this.firstTag = false;
			if ((node as sax.QualifiedTag).uri) {
				// Resolve file-type boot root element namespace
				this.fileType = namespaceMapping[(node as sax.QualifiedTag).uri];
			} else if (node.name) {
				// Fall back on element name if there is no namespace
				this.fileType = rootNameMapping[node.name.toLowerCase()];
			}
			if (this.fileType && !this.options.fullScan) {
				this.onEnd = true;
			}
		};
		this.parser.ondoctype = (rawDocType) => {
			if (this.fileType || this.onEnd) {
				return;
			}
			const docType = parseDoctype(rawDocType);
			if (docType.kind === "PUBLIC" && docType.publicId) {
				this.fileType = docTypeMapping[docType.publicId];
				if (this.fileType && !this.options.fullScan) {
					this.onEnd = true;
				}
			}
		};
		this.parser.onclosetag = () => {
			--this.nesting;
		};
	}

	write(text: string) {
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

export interface XmlDetectorOptions {
	/** Maximum number of bytes inspected, including the BOM. Defaults to 16 KiB. */
	sampleSize?: number;
}

export function createXmlDetector(options: XmlDetectorOptions = {}): Detector {
	const sampleSize = options.sampleSize ?? 16_384;
	if (!Number.isSafeInteger(sampleSize) || sampleSize < 1) {
		throw new RangeError("sampleSize must be a positive safe integer");
	}

	return {
		id: "xml",
		detect: async (tokenizer: ITokenizer) => {
			let sample = new Uint8Array(Math.min(128, sampleSize));
			let length = await tokenizer.peekBuffer(sample, { mayBeLess: true });
			let xmlDetection = probeXmlBuffer(sample.subarray(0, length));
			// Peek beyond long comments/whitespace without consuming non-XML input.
			while (
				!xmlDetection.xml &&
				length === sample.length &&
				sample.length < sampleSize &&
				xmlDetection.incomplete
			) {
				sample = new Uint8Array(Math.min(sample.length * 2, sampleSize));
				length = await tokenizer.peekBuffer(sample, { mayBeLess: true });
				xmlDetection = probeXmlBuffer(sample.subarray(0, length));
			}
			if (xmlDetection.xml) {
				const buffer = new Uint8Array(Math.min(512, sampleSize));
				await tokenizer.ignore(xmlDetection.offset);
				let remaining = sampleSize - xmlDetection.offset;
				const xmlTextDetector = new XmlTextDetector();
				const textDecoder = new TextDecoder(xmlDetection.encoding);
				while (remaining > 0 && !xmlTextDetector.onEnd) {
					const chunk = buffer.subarray(0, Math.min(buffer.length, remaining));
					const len = await tokenizer.readBuffer(chunk, { mayBeLess: true });
					remaining -= len;
					const text = textDecoder.decode(chunk.subarray(0, len));
					xmlTextDetector.write(text);
					if (len < chunk.length) {
						xmlTextDetector.close();
					}
				}
				return (
					xmlTextDetector.fileType ?? {
						ext: "xml",
						mime: "application/xml",
					}
				);
			}
		},
	};
}

export const detectXml: Detector = createXmlDetector();
