import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile, mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { Readable } from "node:stream";
import { after, before, describe, it } from "mocha";
import { fromBuffer, fromFile, fromStream } from "strtok3";
import { FileTypeParser } from "file-type";
import { assert } from "chai";

import {
	createXmlDetector,
	detectXml,
	isXml,
	XmlTextDetector,
} from "../lib/index.js";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

function getSamplePath(filename) {
	return path.join(dirname, "fixture", filename);
}

async function expectXmlDetection(filename, expected, message) {
	const samplePath = getSamplePath(filename);
	const tokenizer = await fromFile(samplePath);
	try {
		const fileType = await detectXml.detect(tokenizer);
		assert.isDefined(
			fileType,
			message ?? `Expected ${filename} to be detected`,
		);
		assert.strictEqual(
			fileType.mime,
			expected.mime,
			`Unexpected MIME type for ${filename}`,
		);
		assert.strictEqual(
			fileType.ext,
			expected.ext,
			`Unexpected extension for ${filename}`,
		);
	} finally {
		await tokenizer.close();
	}
}

describe("XML detector", () => {
	describe("XML types", () => {
		it("should detect simple XML", async () => {
			await expectXmlDetection("simple.xml", {
				mime: "application/xml",
				ext: "xml",
			});
		});

		describe("SVG", () => {
			it("should detect SVG", async () => {
				await expectXmlDetection("sample-svg-files-sample-4.svg", {
					mime: "image/svg+xml",
					ext: "svg",
				});
			});

			it("should detect SVG without any namespace", async () => {
				await expectXmlDetection("no-namespace.svg", {
					mime: "image/svg+xml",
					ext: "svg",
				});
			});

			describe("SVG without XML header", () => {
				function detectSvg(fixture) {
					return expectXmlDetection(fixture, {
						mime: "image/svg+xml",
						ext: "svg",
					});
				}

				it("should detect UTF-8 without XML header", () => {
					return detectSvg("no-xml-header-utf8.svg");
				});

				it("should detect UTF-8 with BOM, without XML header", () => {
					return detectSvg("no-xml-header-utf8-bom.svg");
				});

				it("should detect UTF-16-BE with BOM, without XML header", () => {
					return detectSvg("no-xml-header-utf16-be-bom.svg");
				});

				it("should detect UTF-16-LE with BOM, without XML header", () => {
					return detectSvg("no-xml-header-utf16-le-bom.svg");
				});
			});
		});

		it("should detect XHTML", async () => {
			await expectXmlDetection("simple.xhtml", {
				mime: "application/xhtml+xml",
				ext: "xhtml",
			});
		});

		it("should detect RSS", async () => {
			await expectXmlDetection("simple-rss20-feed.rss", {
				mime: "application/rss+xml",
				ext: "rss",
			});
		});

		it("should detect KML", async () => {
			await expectXmlDetection("example.kml", {
				mime: "application/vnd.google-earth.kml+xml",
				ext: "kml",
			});
		});

		it("should detect GML", async () => {
			await expectXmlDetection("sample.gml", {
				mime: "application/gml+xml",
				ext: "gml",
			});
		});

		it("should detect Uncompressed MusicXML", async () => {
			await expectXmlDetection("MozartPianoSonata.musicxml", {
				mime: "application/vnd.recordare.musicxml+xml",
				ext: "musicxml",
			});
		});

		it("should detect Apple Property list (.plist)", async () => {
			await expectXmlDetection("plist.xml", {
				mime: "application/x-plist",
				ext: "plist",
			});
		});

		it("should detect TTML", async () => {
			await expectXmlDetection("sample.ttml", {
				mime: "application/ttml+xml",
				ext: "ttml",
			});
		});

		it("should detect SMIL when no XML namespace is declared", async () => {
			await expectXmlDetection("no-namespace.smil", {
				mime: "application/smil+xml",
				ext: "smil",
			});
		});

		it("should detect SMIL when an XML namespace is declared", async () => {
			await expectXmlDetection("tears_of_steel.smil", {
				mime: "application/smil+xml",
				ext: "smil",
			});
		});

		it("should detect Atom", async () => {
			await expectXmlDetection("sample.atom", {
				mime: "application/atom+xml",
				ext: "atom",
			});
		});

		it("should detect XLIFF", async () => {
			await expectXmlDetection("fixture.xlf", {
				mime: "application/xliff+xml",
				ext: "xlf",
			});
		});

		it("should detect DocBook v4", async () => {
			await expectXmlDetection("docbookv4_sample1.dbk", {
				mime: "application/docbook+xml",
				ext: "dbk",
			});
		});

		it("should detect DocBook v5", async () => {
			await expectXmlDetection("docbookv5_sample2.dbk", {
				mime: "application/docbook+xml",
				ext: "dbk",
			});
		});

		it("should detect TEI", async () => {
			await expectXmlDetection("sample.tei", {
				mime: "application/tei+xml",
				ext: "tei",
			});
		});

		it("should detect X3D", async () => {
			await expectXmlDetection("BoxExample.x3d", {
				mime: "model/x3d+xml",
				ext: "x3d",
			});
		});

		it("should detect OPML", async () => {
			await expectXmlDetection("playlist.opml", {
				mime: "text/x-opml",
				ext: "opml",
			});
		});

		it("should detect MathML", async () => {
			await expectXmlDetection("quadratic_formula.mml", {
				mime: "application/mathml+xml",
				ext: "mml",
			});
		});

		it("should detect GPX 1.0", async () => {
			await expectXmlDetection("sample_1.0.gpx", {
				mime: "application/gpx+xml",
				ext: "gpx",
			});
		});

		it("should detect GPX 1.1", async () => {
			await expectXmlDetection("sample_1.1.gpx", {
				mime: "application/gpx+xml",
				ext: "gpx",
			});
		});
	});

	describe("Handle different text encoding", () => {
		it("should handle UTF-8 BOM field", async () => {
			await expectXmlDetection("fixture-utf8-bom.xml", {
				mime: "application/xml",
				ext: "xml",
			});
		});

		it("should handle UTF-16-BE encoded text with BOM field", async () => {
			await expectXmlDetection("fixture-utf16-be-bom.xml", {
				mime: "application/xml",
				ext: "xml",
			});
		});

		it("should handle UTF-16-LE encoded text with BOM field", async () => {
			await expectXmlDetection("fixture-utf16-le-bom.xml", {
				mime: "application/xml",
				ext: "xml",
			});
		});

		it("should handle UTF-16-BE encoded text without BOM field", async () => {
			await expectXmlDetection("fixture-utf16-be.xml", {
				mime: "application/xml",
				ext: "xml",
			});
		});

		it("should handle UTF-16-LE encoded text without BOM field", async () => {
			await expectXmlDetection("fixture-utf16-le.xml", {
				mime: "application/xml",
				ext: "xml",
			});
		});

		describe("non-XML text file", () => {
			async function expectNonXml(filename) {
				const samplePath = getSamplePath(filename);
				const tokenizer = await fromFile(samplePath);

				try {
					const fileType = await detectXml.detect(tokenizer);
					assert.isUndefined(fileType, "should not be detected as XML");
				} finally {
					await tokenizer.close();
				}
			}

			it("should handle UTF-8 encoded text file", async () => {
				await expectNonXml("fixture-utf8.txt");
			});

			it("should handle UTF-16-BE encoded non-XML text file", async () => {
				await expectNonXml("fixture-utf16-be.txt");
			});

			it("should handle UTF-16-LE encoded non-XML text file", async () => {
				await expectNonXml("fixture-utf16-le.txt");
			});
		});
	});

	describe("XmlTextDetector", () => {
		describe("SVG Text detection", () => {
			function detectSvg(svgText) {
				const xmlTextDetector = new XmlTextDetector({ fullScan: true });
				xmlTextDetector.write(svgText);
				const fileType = xmlTextDetector.isValid()
					? xmlTextDetector.fileType
					: undefined;
				assert.isDefined(fileType, "should detect the file type");
				assert.strictEqual(fileType.mime, "image/svg+xml");
				assert.strictEqual(fileType.ext, "svg");
			}

			function isNotSvg(svgText) {
				const xmlTextDetector = new XmlTextDetector({ fullScan: true });
				xmlTextDetector.write(svgText);
				const fileType = xmlTextDetector.isValid()
					? xmlTextDetector.fileType
					: undefined;
				assert.isUndefined(
					fileType,
					`should not be detected as SVG: "${svgText}"`,
				);
			}

			describe("valid SVG", () => {
				it("should be able to detect SVG", () => {
					detectSvg(
						'<svg xmlns="http://www.w3.org/2000/svg"><path fill="#00CD9F"/></svg>',
					);
				});

				it("should be able to detect Non-namespaced SVG", () => {
					detectSvg(
						'<svg width="100" height="100" viewBox="0 0 30 30" version="1.1"></svg>',
					);
				});

				it("should be able to detect Non-namespaced SVG with mixed case tags", () => {
					detectSvg('<SvG version="1.1"></SvG>');
				});

				it("support markup inside Entity tags", async () => {
					const svgText = await readFile(
						getSamplePath("markup-inside-entity.svg"),
						"utf-8",
					);
					detectSvg(svgText);
				});
			});

			describe("invalid SVG", () => {
				it("SVG in text", () => {
					isNotSvg("this string contains an svg <svg></svg> in the middle");
				});

				it("text mentioning SVG", () => {
					isNotSvg("this is not svg, but it mentions <svg> tags");
				});

				it("SVG with invalid closing tag in the content", () => {
					isNotSvg("<svg><div></svg>");
				});

				it("Just an SVG starting tag", () => {
					isNotSvg("<svg> hello I am an svg oops maybe not");
				});
			});
		});
	});
});

describe("XML prolog detection (#114)", () => {
	const svg =
		'<svg xmlns="http://www.w3.org/2000/svg"><path fill="#00CD9F"/></svg>';
	const expected = { ext: "svg", mime: "image/svg+xml" };
	const prologs = [
		["no prolog", ""],
		["empty comment", "<!---->"],
		[
			"Illustrator comment",
			"<!-- Generator: Adobe Illustrator 27.9.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->\n",
		],
		["long comment", `<!-- ${"x".repeat(4096)} -->`],
		["XML whitespace", "\n\t\r  "],
		["long whitespace", " ".repeat(4096)],
		["root split across initial sample", " ".repeat(126)],
		["comment split across initial sample", `${" ".repeat(126)}<!-- x -->`],
		["multiple comments and whitespace", "\n<!-- first -->\t<!---->\r\n"],
		["processing instruction", "<?generator illustrator?>\n<!-- x -->"],
		["XML declaration and comment", '<?xml version="1.0"?>\n<!-- x -->\n'],
		[
			"multibyte comment crossing initial sample",
			`<!-- ${"x".repeat(122)}é😀 -->`,
		],
		[
			"multibyte comment crossing read boundary",
			`<!-- ${"x".repeat(506)}é😀 -->`,
		],
	];

	const encodings = [
		["UTF-8", (text) => Buffer.from(text)],
		[
			"UTF-8 BOM",
			(text) =>
				Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from(text)]),
		],
		[
			"UTF-16 LE BOM",
			(text) =>
				Buffer.concat([
					Buffer.from([0xff, 0xfe]),
					Buffer.from(text, "utf16le"),
				]),
		],
		[
			"UTF-16 BE BOM",
			(text) =>
				Buffer.concat([
					Buffer.from([0xfe, 0xff]),
					Buffer.from(text, "utf16le").swap16(),
				]),
		],
	];

	let directory;
	before(async () => {
		directory = await mkdtemp(path.join(tmpdir(), "file-type-xml-prolog-"));
	});
	after(async () => {
		await rm(directory, { recursive: true, force: true });
	});

	for (const [encoding, encode] of encodings) {
		describe(encoding, () => {
			for (const [label, prolog] of prologs) {
				it(`detects SVG with ${label} from buffers, files and streams`, async () => {
					const buffer = encode(prolog + svg);
					assert.isTrue(isXml(buffer).xml);
					const parser = new FileTypeParser({ customDetectors: [detectXml] });
					assert.deepEqual(await parser.fromBuffer(buffer), expected);
					const filename = path.join(directory, "sample.svg");
					await writeFile(filename, buffer);
					assert.deepEqual(await parser.fromFile(filename), expected);
					assert.deepEqual(
						await parser.fromStream(
							Readable.toWeb(Readable.from([buffer], { objectMode: false })),
						),
						expected,
					);
				});
			}

			for (const [label, doctype] of [
				["simple DOCTYPE", "<!DOCTYPE svg>"],
				[
					"quoted greater-than in system identifier",
					'<!DOCTYPE svg SYSTEM "example>file.dtd">',
				],
				[
					"single-quoted system identifier",
					"<!DOCTYPE svg SYSTEM 'example>file.dtd'>",
				],
				["internal subset", "<!DOCTYPE svg [<!ELEMENT svg EMPTY>]>"],
				["quoted subset delimiters", '<!DOCTYPE svg [<!ENTITY text "]>[">]>'],
				[
					"comment inside subset",
					"<!DOCTYPE svg [<!-- ]> [ --> <!ELEMENT svg EMPTY>]>",
				],
				[
					"processing instruction inside subset",
					"<!DOCTYPE svg [<?generator ]> [ ?> <!ELEMENT svg EMPTY>]>",
				],
				[
					"long internal subset",
					`<!DOCTYPE svg [<!-- ${"x".repeat(4096)} --> <!ELEMENT svg EMPTY>]>`,
				],
			]) {
				it(`detects SVG after comments and ${label}`, async () => {
					const data = encode(
						`<!-- x --> \n${doctype}\n<!-- after -->\n<svg/>`,
					);
					assert.isTrue(isXml(data).xml);
					const parser = new FileTypeParser({ customDetectors: [detectXml] });
					assert.deepEqual(await parser.fromBuffer(data), expected);
					const filename = path.join(directory, "doctype.svg");
					await writeFile(filename, data);
					assert.deepEqual(await parser.fromFile(filename), expected);
					assert.deepEqual(
						await parser.fromStream(
							Readable.toWeb(Readable.from([data], { objectMode: false })),
						),
						expected,
					);
				});
			}

			it("detects SVG with multiple whitespace characters before an attribute", async () => {
				const data = encode('<svg\t \r\n xmlns="http://www.w3.org/2000/svg"/>');
				assert.isTrue(isXml(data).xml);
				assert.deepEqual(await detectXml.detect(fromBuffer(data)), expected);
			});

			for (const [label, prolog] of [
				["large whitespace prefix", " ".repeat(65_536)],
				["many comments", "<!-- x -->".repeat(10_000)],
				[
					"many processing instructions",
					"<?generator illustrator?>".repeat(4000),
				],
			]) {
				it(`detects SVG after ${label} with a larger sample`, async () => {
					const data = encode(prolog + svg);
					assert.isTrue(isXml(data).xml);
					const detector = createXmlDetector({ sampleSize: data.length });
					assert.deepEqual(await detector.detect(fromBuffer(data)), expected);
				});
			}

			it("does not detect incomplete prolog markers after comments", async () => {
				for (const marker of [
					"<",
					"<!",
					"<!-",
					"<?",
					"<!D",
					"<!DOCTYP",
					"<!DOCTYPE",
				]) {
					const data = encode(`<!-- complete --> \n${marker}`);
					assert.isFalse(isXml(data).xml);
					const tokenizer = fromBuffer(data);
					assert.isUndefined(await detectXml.detect(tokenizer));
					assert.strictEqual(tokenizer.position, 0);
				}
			});

			for (const [label, text] of [
				["empty input", ""],
				["DOCTYPE without root", "<!-- x --><!DOCTYPE svg>"],
				[
					"unterminated DOCTYPE quote",
					'<!DOCTYPE svg SYSTEM "example>file.dtd><svg/>',
				],
				[
					"unterminated internal subset",
					"<!DOCTYPE svg [<!ELEMENT svg EMPTY><svg/>",
				],
				["unterminated subset comment", "<!DOCTYPE svg [<!-- ]><svg/>"],
				[
					"unterminated subset processing instruction",
					"<!DOCTYPE svg [<?generator ]><svg/>",
				],
				["repeated DOCTYPE", "<!DOCTYPE svg><!DOCTYPE svg><svg/>"],
				["whitespace only", " ".repeat(4096)],
				["comment only", `<!-- ${"x".repeat(4096)} -->`],
				["unterminated comment", `<!-- ${"x".repeat(4096)}`],
				["text after comments", "<!-- x -->not XML"],
				["SVG mentioned in text", "text <svg></svg>"],
				[
					"incomplete tag with long attribute whitespace",
					"<svg" + " ".repeat(20_000),
				],
				["non-XML whitespace", "\u00A0" + svg],
			]) {
				it(`does not consume or detect ${label}`, async () => {
					const buffer = encode(text);
					assert.isFalse(isXml(buffer).xml);
					const tokenizers = [
						fromBuffer(buffer),
						await fromStream(Readable.from([buffer], { objectMode: false })),
					];
					for (const tokenizer of tokenizers) {
						try {
							assert.isUndefined(await detectXml.detect(tokenizer));
							assert.strictEqual(tokenizer.position, 0);
						} finally {
							await tokenizer.close();
						}
					}
				});
			}
		});
	}

	describe("fast rejection of non-XML input", () => {
		for (const [label, prefix] of [
			["PNG", Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])],
			["JPEG", Buffer.from([0xff, 0xd8, 0xff])],
			["ZIP", Buffer.from("PK")],
			["PDF", Buffer.from("%PDF-1.7")],
			["ordinary text", Buffer.from("This is ordinary text.")],
			["JSON", Buffer.from('  {"value": true}')],
			["NUL bytes", Buffer.from([0, 0, 0, 0])],
			["invalid UTF-8 after markup", Buffer.from([60, 33, 0xff])],
			[
				"invalid UTF-8 after an XML declaration",
				Buffer.concat([Buffer.from("<?xml "), Buffer.from([0xff])]),
			],
		]) {
			it(`rejects ${label} after one small peek`, async () => {
				const data = Buffer.concat([prefix, Buffer.alloc(20_000)]);
				assert.isFalse(isXml(data).xml);
				const tokenizers = [
					fromBuffer(data),
					await fromStream(Readable.from([data], { objectMode: false })),
				];
				for (const tokenizer of tokenizers) {
					let peeks = 0;
					const original = tokenizer.peekBuffer.bind(tokenizer);
					tokenizer.peekBuffer = (buffer, options) => {
						++peeks;
						assert.isAtMost(buffer.length, 128);
						return original(buffer, options);
					};
					try {
						assert.isUndefined(await detectXml.detect(tokenizer));
						assert.strictEqual(peeks, 1);
						assert.strictEqual(tokenizer.position, 0);
					} finally {
						await tokenizer.close();
					}
				}
			});
		}
	});

	describe("sampleSize", () => {
		for (const [encoding, encode] of encodings) {
			for (const sampleSize of [1, 127, 128, 129, 257, 1024]) {
				it(`bounds peeking to ${sampleSize} bytes for ${encoding}`, async () => {
					const data = encode(" ".repeat(4096) + svg);
					await expectBoundedDetection(data, sampleSize, undefined, 0);
				});
			}

			it(`bounds parsing after an XML declaration for ${encoding}`, async () => {
				const data = encode(
					`<?xml version="1.0"?><!-- ${"x".repeat(4096)} -->${svg}`,
				);
				await expectBoundedDetection(
					data,
					257,
					{ ext: "xml", mime: "application/xml" },
					257,
				);
			});

			it(`bounds scanning an internal subset for ${encoding}`, async () => {
				const data = encode(
					`<!-- x --><!DOCTYPE svg [<!-- ${"x".repeat(4096)} -->]><svg/>`,
				);
				await expectBoundedDetection(data, 257, undefined, 0);
			});

			it(`allows a larger sample for ${encoding}`, async () => {
				const data = encode(`<!-- ${"x".repeat(4096)} -->${svg}`);
				await expectBoundedDetection(data, 12_000, expected);
			});

			it(`caps the default sample for ${encoding}`, async () => {
				await expectBoundedDetection(
					encode(" ".repeat(20_000) + svg),
					undefined,
					undefined,
					0,
				);
			});
		}

		async function expectBoundedDetection(
			data,
			sampleSize,
			expectedType,
			expectedPosition,
		) {
			const detector =
				sampleSize === undefined
					? detectXml
					: createXmlDetector({ sampleSize });
			const limit = sampleSize ?? 16_384;
			const tokenizers = [
				fromBuffer(data),
				await fromStream(Readable.from([data], { objectMode: false })),
			];
			for (const tokenizer of tokenizers) {
				for (const method of ["peekBuffer", "readBuffer"]) {
					const original = tokenizer[method].bind(tokenizer);
					tokenizer[method] = (buffer, options) => {
						assert.isAtMost(
							tokenizer.position + buffer.length,
							limit,
							`${method} exceeds sampleSize`,
						);
						return original(buffer, options);
					};
				}
				try {
					assert.deepEqual(await detector.detect(tokenizer), expectedType);
					assert.isAtMost(tokenizer.position, limit);
					if (expectedPosition !== undefined) {
						assert.strictEqual(tokenizer.position, expectedPosition);
					}
				} finally {
					await tokenizer.close();
				}
			}
		}

		it("rejects invalid sample sizes", () => {
			for (const sampleSize of [
				0,
				-1,
				1.5,
				NaN,
				Infinity,
				Number.MAX_SAFE_INTEGER + 1,
			]) {
				assert.throws(() => createXmlDetector({ sampleSize }), RangeError);
			}
		});
	});

	it("keeps XmlTextDetector support for prologs", () => {
		for (const [, prolog] of prologs) {
			const detector = new XmlTextDetector({ fullScan: true });
			detector.write(prolog + svg);
			detector.close();
			assert.deepEqual(detector.fileType, expected);
			assert.isTrue(detector.isValid());
		}
	});
});
