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

async function expectXmlDetection(filename, expected, message) {
	const samplePath = getSamplePath(filename);
	const tokenizer = await fromFile(samplePath);
	try {
		const fileType = await detectXml.detect(tokenizer);
		assert.isDefined(fileType, message ?? `Expected ${filename} to be detected`);
		assert.strictEqual(fileType.mime, expected.mime, `Unexpected MIME type for ${filename}`);
		assert.strictEqual(fileType.ext, expected.ext, `Unexpected extension for ${filename}`);
	} finally {
		await tokenizer.close();
	}
}

describe('XML detector', () => {

	describe('XML types', () => {

		it('should detect simple XML', async () => {
			await expectXmlDetection('simple.xml', {
				mime: 'application/xml',
				ext: 'xml'
			});

		});

		describe('SVG', () => {

			it('should detect SVG', async () => {
				await expectXmlDetection('sample-svg-files-sample-4.svg', {
					mime: 'image/svg+xml',
					ext: 'svg'
				});
			});

			it('should detect SVG without any namespace', async () => {
				await expectXmlDetection('no-namespace.svg', {
					mime: 'image/svg+xml',
					ext: 'svg'
				});

			});

			describe('SVG without XML header', () => {

				function detectSvg(fixture) {
					return expectXmlDetection(fixture, {
						mime: 'image/svg+xml',
						ext: 'svg'
					});
				}

				it('should detect UTF-8 without XML header', () => {
					return detectSvg('no-xml-header-utf8.svg');
				});

				it('should detect UTF-8 with BOM, without XML header', () => {
					return detectSvg('no-xml-header-utf8-bom.svg');
				});

				it('should detect UTF-16-BE with BOM, without XML header', () => {
					return detectSvg('no-xml-header-utf16-be-bom.svg');
				});

				it('should detect UTF-16-LE with BOM, without XML header', () => {
					return detectSvg('no-xml-header-utf16-le-bom.svg');
				});
			});
		});

		it('should detect XHTML', async () => {
			await expectXmlDetection('simple.xhtml', {
				mime: 'application/xhtml+xml',
				ext: 'xhtml'
			});
		});

		it('should detect RSS', async () => {
			await expectXmlDetection('simple-rss20-feed.rss', {
				mime: 'application/rss+xml',
				ext: 'rss'
			});
		});

		it('should detect KML', async () => {
			await expectXmlDetection('example.kml', {
				mime: 'application/vnd.google-earth.kml+xml',
				ext: 'kml'
			});
		});

		it('should detect GML', async () => {
			await expectXmlDetection('sample.gml', {
				mime: 'application/gml+xml',
				ext: 'gml'
			});
		});

		it('should detect Uncompressed MusicXML', async () => {
			await expectXmlDetection('MozartPianoSonata.musicxml', {
				mime: 'application/vnd.recordare.musicxml+xml',
				ext: 'musicxml'
			});
		});

		it('should detect Apple Property list (.plist)', async () => {
			await expectXmlDetection('plist.xml', {
				mime: 'application/x-plist',
				ext: 'plist'
			});
		});

		it('should detect TTML', async () => {
			await expectXmlDetection('sample.ttml', {
				mime: 'application/ttml+xml',
				ext: 'ttml'
			});
		});

		it('should detect SMIL when no XML namespace is declared', async () => {
			await expectXmlDetection('no-namespace.smil', {
				mime: 'application/smil+xml',
				ext: 'smil'
			});
		});

		it('should detect SMIL when an XML namespace is declared', async () => {
			await expectXmlDetection('tears_of_steel.smil', {
				mime: 'application/smil+xml',
				ext: 'smil'
			});
		});

		it('should detect Atom', async () => {
			await expectXmlDetection('sample.atom', {
				mime: 'application/atom+xml',
				ext: 'atom'
			});
		});

		it('should detect XLIFF', async () => {
			await expectXmlDetection('fixture.xlf', {
				mime: 'application/xliff+xml',
				ext: 'xlf'
			});
		});

		it('should detect DocBook v4', async () => {
			await expectXmlDetection('docbookv4_sample1.dbk', {
				mime: 'application/docbook+xml',
				ext: 'dbk'
			});
		});

		it('should detect DocBook v5', async () => {
			await expectXmlDetection('docbookv5_sample2.dbk', {
				mime: 'application/docbook+xml',
				ext: 'dbk'
			});
		});

		it('should detect TEI', async () => {
			await expectXmlDetection('sample.tei', {
				mime: 'application/tei+xml',
				ext: 'tei'
			});
		});

		it('should detect X3D', async () => {
			await expectXmlDetection('BoxExample.x3d', {
				mime: 'model/x3d+xml',
				ext: 'x3d'
			});
		});

		it('should detect OPML', async () => {
			await expectXmlDetection('playlist.opml', {
				mime: 'text/x-opml',
				ext: 'opml'
			});
		});

		it('should detect MathML', async () => {
			await expectXmlDetection('quadratic_formula.mml', {
				mime: 'application/mathml+xml',
				ext: 'mml'
			});
		});

		it('should detect GPX 1.0', async () => {
			await expectXmlDetection('sample_1.0.gpx', {
				mime: 'application/gpx+xml',
				ext: 'gpx'
			});
		});

		it('should detect GPX 1.1', async () => {
			await expectXmlDetection('sample_1.1.gpx', {
				mime: 'application/gpx+xml',
				ext: 'gpx'
			});
		});

	});

	describe('Handle different text encoding', () => {
		it('should handle UTF-8 BOM field', async () => {
			await expectXmlDetection('fixture-utf8-bom.xml', {
				mime: 'application/xml',
				ext: 'xml'
			});

		});

		it('should handle UTF-16-BE encoded text with BOM field', async () => {
			await expectXmlDetection('fixture-utf16-be-bom.xml', {
				mime: 'application/xml',
				ext: 'xml'
			});
		});

		it('should handle UTF-16-LE encoded text with BOM field', async () => {
			await expectXmlDetection('fixture-utf16-le-bom.xml', {
				mime: 'application/xml',
				ext: 'xml'
			});
		});

		it('should handle UTF-16-BE encoded text without BOM field', async () => {
			await expectXmlDetection('fixture-utf16-be.xml', {
				mime: 'application/xml',
				ext: 'xml'
			});
		});

		it('should handle UTF-16-LE encoded text without BOM field', async () => {
			await expectXmlDetection('fixture-utf16-le.xml', {
				mime: 'application/xml',
				ext: 'xml'
			});
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
