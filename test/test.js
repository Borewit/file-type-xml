import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {readFile} from 'node:fs/promises';
import {describe, it} from 'mocha';
import {fromFile} from 'strtok3';
import {assert} from 'chai';

import {detectXml, XmlTextDetector} from '../lib/index.js';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

function getSamplePath(filename) {
	return path.join(dirname, 'fixture', filename);
}


describe('XML detector', () => {

	describe('XML types', () => {

		it('should detect simple XML', async () => {
			const samplePath = getSamplePath('simple.xml');
			const tokenizer = await fromFile(samplePath);
			try {
				const fileType = await detectXml.detect(tokenizer);
				assert.isDefined(fileType, 'should detect the file type');
				assert.strictEqual(fileType.mime, 'application/xml');
				assert.strictEqual(fileType.ext, 'xml');
			} finally {
				await tokenizer.close();
			}

		});

		describe('SVG', () => {

			it('should detect SVG', async () => {
				const samplePath = getSamplePath('sample-svg-files-sample-4.svg');
				const tokenizer = await fromFile(samplePath);
				try {
					const fileType = await detectXml.detect(tokenizer);
					assert.isDefined(fileType, 'should detect the file type');
					assert.strictEqual(fileType.mime, 'image/svg+xml');
					assert.strictEqual(fileType.ext, 'svg');
				} finally {
					await tokenizer.close();
				}
			});

			it('should detect SVG without any namespace', async () => {
				const samplePath = getSamplePath('no-namespace.svg');
				const tokenizer = await fromFile(samplePath);
				try {
					const fileType = await detectXml.detect(tokenizer);
					assert.isDefined(fileType, 'should detect the file type');
					assert.strictEqual(fileType.mime, 'image/svg+xml');
					assert.strictEqual(fileType.ext, 'svg');
				} finally {
					await tokenizer.close();
				}
			});

			describe('SVG without XML header', () => {

				async function detectSvg(fixture) {
					const samplePath = getSamplePath(fixture);
					const tokenizer = await fromFile(samplePath);
					try {
						const fileType = await detectXml.detect(tokenizer);
						assert.isDefined(fileType, 'should detect the file type');
						assert.strictEqual(fileType.mime, 'image/svg+xml');
						assert.strictEqual(fileType.ext, 'svg');
					} finally {
						await tokenizer.close();
					}
				}

				it('should detect UTF-8 without XML header', () => {
					return detectSvg('no-xml-header-utf8.svg');
				});

				it('should detect UTF-8 with BOM, without XML header',() => {
					return detectSvg('no-xml-header-utf8-bom.svg');
				});

				it('should detect UTF-16-BE with BOM, without XML header',() => {
					return detectSvg('no-xml-header-utf16-be-bom.svg');
				});

				it('should detect UTF-16-LE with BOM, without XML header',() => {
					return detectSvg('no-xml-header-utf16-le-bom.svg');
				});
			});
		});

		it('should detect XHTML', async () => {
			const samplePath = getSamplePath('simple.xhtml');
			const tokenizer = await fromFile(samplePath);
			try {
				const fileType = await detectXml.detect(tokenizer);
				assert.isDefined(fileType, 'should detect the file type');
				assert.strictEqual(fileType.mime, 'application/xhtml+xml');
				assert.strictEqual(fileType.ext, 'xhtml');
			} finally {
				await tokenizer.close();
			}
		});

		it('should detect RSS', async () => {
			const samplePath = getSamplePath('simple-rss20-feed.rss');
			const tokenizer = await fromFile(samplePath);
			try {
				const fileType = await detectXml.detect(tokenizer);
				assert.isDefined(fileType, 'should detect the file type');
				assert.strictEqual(fileType.mime, 'application/rss+xml');
				assert.strictEqual(fileType.ext, 'rss');
			} finally {
				await tokenizer.close();
			}
		});

		it('should detect KML', async () => {
			const samplePath = getSamplePath('example.kml');
			const tokenizer = await fromFile(samplePath);
			try {
				const fileType = await detectXml.detect(tokenizer);
				assert.isDefined(fileType, 'should detect the file type');
				assert.strictEqual(fileType.mime, 'application/vnd.google-earth.kml+xml');
				assert.strictEqual(fileType.ext, 'kml');
			} finally {
				await tokenizer.close();
			}
		});

		it('should detect GML', async () => {
			const samplePath = getSamplePath('sample.gml');
			const tokenizer = await fromFile(samplePath);
			try {
				const fileType = await detectXml.detect(tokenizer);
				assert.isDefined(fileType, 'should detect the file type');
				assert.strictEqual(fileType.mime, 'application/gml+xml');
				assert.strictEqual(fileType.ext, 'gml');
			} finally {
				await tokenizer.close();
			}
		});

		it('should detect Uncompressed MusicXML', async () => {
			const samplePath = getSamplePath('MozartPianoSonata.musicxml');
			const tokenizer = await fromFile(samplePath);
			try {
				const fileType = await detectXml.detect(tokenizer);
				assert.isDefined(fileType, 'should detect the file type');
				assert.strictEqual(fileType.mime, 'application/vnd.recordare.musicxml+xml');
				assert.strictEqual(fileType.ext, 'musicxml');
			} finally {
				await tokenizer.close();
			}
		});

		it('should detect Apple Property list (.plist)', async () => {
			const samplePath = getSamplePath('plist.xml');
			const tokenizer = await fromFile(samplePath);
			try {
				const fileType = await detectXml.detect(tokenizer);
				assert.isDefined(fileType, 'should detect Apple Property list');
				assert.strictEqual(fileType.mime, 'application/x-plist');
				assert.strictEqual(fileType.ext, 'plist');
			} finally {
				await tokenizer.close();
			}
		});

		it('should detect TTML', async () => {
			const samplePath = getSamplePath('sample.ttml');
			const tokenizer = await fromFile(samplePath);
			try {
				const fileType = await detectXml.detect(tokenizer);
				assert.isDefined(fileType, 'should detect TTML');
				assert.strictEqual(fileType.mime, 'application/ttml+xml');
				assert.strictEqual(fileType.ext, 'ttml');
			} finally {
				await tokenizer.close();
			}
		});

		it('should detect SMIL when no XML namespace is declared', async () => {
			const samplePath = getSamplePath('no-namespace.smil');
			const tokenizer = await fromFile(samplePath);

			try {
				const fileType = await detectXml.detect(tokenizer);
				assert.isDefined(fileType, 'Expected SMIL file type to be detected');
				assert.strictEqual(fileType.mime, 'application/smil+xml', 'Expected SMIL MIME type');
				assert.strictEqual(fileType.ext, 'smil', 'Expected SMIL file extension');
			} finally {
				await tokenizer.close();
			}
		});

		it('should detect SMIL when an XML namespace is declared', async () => {
			const samplePath = getSamplePath('tears_of_steel.smil');
			const tokenizer = await fromFile(samplePath);

			try {
				const fileType = await detectXml.detect(tokenizer);
				assert.isDefined(fileType, 'Expected SMIL file type to be detected');
				assert.strictEqual(fileType.mime, 'application/smil+xml', 'Expected SMIL MIME type');
				assert.strictEqual(fileType.ext, 'smil', 'Expected SMIL file extension');
			} finally {
				await tokenizer.close();
			}
		});

		it('should detect Atom', async () => {
			const samplePath = getSamplePath('sample.atom');
			const tokenizer = await fromFile(samplePath);

			try {
				const fileType = await detectXml.detect(tokenizer);
				assert.isDefined(fileType, 'Expected Atom file type to be detected');
				assert.strictEqual(fileType.mime, 'application/atom+xml', 'Expected Atom MIME type');
				assert.strictEqual(fileType.ext, 'atom', 'Expected Atom file extension');
			} finally {
				await tokenizer.close();
			}
		});

		it('should detect XLIFF', async () => {
			const samplePath = getSamplePath('fixture.xlf');
			const tokenizer = await fromFile(samplePath);

			try {
				const fileType = await detectXml.detect(tokenizer);
				assert.isDefined(fileType, 'Expected XLIFF file type to be detected');
				assert.strictEqual(fileType.mime, 'application/xliff+xml', 'Expected SMIL MIME type');
				assert.strictEqual(fileType.ext, 'xlf', 'Expected XLIFF file extension');
			} finally {
				await tokenizer.close();
			}
		});

	});

	describe('Handle different text encoding', () => {
		it('should handle UTF-8 BOM field', async () => {
			const samplePath = getSamplePath('fixture-utf8-bom.xml');
			const tokenizer = await fromFile(samplePath);
			try {
				const fileType = await detectXml.detect(tokenizer);
				assert.isDefined(fileType, 'should detect the file type');
				assert.strictEqual(fileType.mime, 'application/xml');
				assert.strictEqual(fileType.ext, 'xml');
			} finally {
				await tokenizer.close();
			}
		});

		it('should handle UTF-16-BE encoded text with BOM field', async () => {
			const samplePath = getSamplePath('fixture-utf16-be-bom.xml');
			const tokenizer = await fromFile(samplePath);
			try {
				const fileType = await detectXml.detect(tokenizer);
				assert.isDefined(fileType, 'should detect the file type');
				assert.strictEqual(fileType.mime, 'application/xml');
				assert.strictEqual(fileType.ext, 'xml');
			} finally {
				await tokenizer.close();
			}
		});

		it('should handle UTF-16-LE encoded text with BOM field', async () => {
			const samplePath = getSamplePath('fixture-utf16-le-bom.xml');
			const tokenizer = await fromFile(samplePath);
			try {
				const fileType = await detectXml.detect(tokenizer);
				assert.isDefined(fileType, 'should detect the file type');
				assert.strictEqual(fileType.mime, 'application/xml');
				assert.strictEqual(fileType.ext, 'xml');
			} finally {
				await tokenizer.close();
			}
		});

		it('should handle UTF-16-BE encoded text without BOM field', async () => {
			const samplePath = getSamplePath('fixture-utf16-be.xml');
			const tokenizer = await fromFile(samplePath);
			try {
				const fileType = await detectXml.detect(tokenizer);
				assert.isDefined(fileType, 'should detect the file type');
				assert.strictEqual(fileType.mime, 'application/xml');
				assert.strictEqual(fileType.ext, 'xml');
			} finally {
				await tokenizer.close();
			}
		});

		it('should handle UTF-16-LE encoded text without BOM field', async () => {
			const samplePath = getSamplePath('fixture-utf16-le.xml');
			const tokenizer = await fromFile(samplePath);
			try {
				const fileType = await detectXml.detect(tokenizer);
				assert.isDefined(fileType, 'should detect the file type');
				assert.strictEqual(fileType.mime, 'application/xml');
				assert.strictEqual(fileType.ext, 'xml');
			} finally {
				await tokenizer.close();
			}
		});

	});

	describe('XmlTextDetector', () => {

		describe('SVG Text detection', () => {

			function detectSvg(svgText) {
				const xmlTextDetector = new XmlTextDetector({fullScan: true});
				xmlTextDetector.write(svgText);
				const fileType = xmlTextDetector.isValid() ? xmlTextDetector.fileType : undefined;
				assert.isDefined(fileType, 'should detect the file type');
				assert.strictEqual(fileType.mime, 'image/svg+xml');
				assert.strictEqual(fileType.ext, 'svg');
			}

			function isNotSvg(svgText) {
				const xmlTextDetector = new XmlTextDetector({fullScan: true});
				xmlTextDetector.write(svgText);
				const fileType = xmlTextDetector.isValid() ? xmlTextDetector.fileType : undefined;
				assert.isUndefined(fileType, `should not be detected as SVG: "${svgText}"`);
			}

			describe('valid SVG', () => {
				it('should be able to detect SVG', () => {
					detectSvg('<svg xmlns="http://www.w3.org/2000/svg"><path fill="#00CD9F"/></svg>');
				});

				it('should be able to detect Non-namespaced SVG', () => {
					detectSvg('<svg width="100" height="100" viewBox="0 0 30 30" version="1.1"></svg>');
				});

				it('should be able to detect Non-namespaced SVG with mixed case tags', () => {
					detectSvg('<SvG version="1.1"></SvG>');
				});

				it('support markup inside Entity tags', async () => {
					const svgText = await readFile(getSamplePath('markup-inside-entity.svg'), 'utf-8');
					detectSvg(svgText);
				});
			});


			describe('invalid SVG', () => {
				it('SVG in text', () => {
					isNotSvg('this string contains an svg <svg></svg> in the middle');
				});

				it('text mentioning SVG', () => {
					isNotSvg('this is not svg, but it mentions <svg> tags');
				});

				it('SVG with invalid closing tag in the content', () => {
					isNotSvg('<svg><div></svg>');
				});

				it('Just an SVG starting tag', () => {
					isNotSvg('<svg> hello I am an svg oops maybe not');
				});
			});
		});
	});


});
