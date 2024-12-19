import path from 'node:path';
import {fileURLToPath} from 'node:url';
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
      const fileType = await detectXml(tokenizer);
      assert.isDefined(fileType, 'should detect the file type');
      assert.strictEqual(fileType.mime, 'application/xml');
      assert.strictEqual(fileType.ext, 'xml');
    });

    it('should detect SVG', async () => {
      const samplePath = getSamplePath('sample-svg-files-sample-4.svg');
      const tokenizer = await fromFile(samplePath);
      const fileType = await detectXml(tokenizer);
      assert.isDefined(fileType, 'should detect the file type');
      assert.strictEqual(fileType.mime, 'image/svg+xml');
      assert.strictEqual(fileType.ext, 'svg');
    });

    it('should detect XHTML', async () => {
      const samplePath = getSamplePath('simple.xhtml');
      const tokenizer = await fromFile(samplePath);
      const fileType = await detectXml(tokenizer);
      assert.isDefined(fileType, 'should detect the file type');
      assert.strictEqual(fileType.mime, 'application/xhtml+xml');
      assert.strictEqual(fileType.ext, 'xhtml');
    });

    it('should detect RSS', async () => {
      const samplePath = getSamplePath('simple-rss20-feed.rss');
      const tokenizer = await fromFile(samplePath);
      const fileType = await detectXml(tokenizer);
      assert.isDefined(fileType, 'should detect the file type');
      assert.strictEqual(fileType.mime, 'application/rss+xml');
      assert.strictEqual(fileType.ext, 'rss');
    });

    it('should detect KML', async () => {
      const samplePath = getSamplePath('example.kml');
      const tokenizer = await fromFile(samplePath);
      const fileType = await detectXml(tokenizer);
      assert.isDefined(fileType, 'should detect the file type');
      assert.strictEqual(fileType.mime, 'application/vnd.google-earth.kml+xml');
      assert.strictEqual(fileType.ext, 'kml');
    });

    it('should detect GML', async () => {
      const samplePath = getSamplePath('sample.gml');
      const tokenizer = await fromFile(samplePath);
      const fileType = await detectXml(tokenizer);
      assert.isDefined(fileType, 'should detect the file type');
      assert.strictEqual(fileType.mime, 'application/gml+xml');
      assert.strictEqual(fileType.ext, 'gml');
    });

    it('should detect Uncompressed MusicXML', async () => {
      const samplePath = getSamplePath('MozartPianoSonata.musicxml');
      const tokenizer = await fromFile(samplePath);
      const fileType = await detectXml(tokenizer);
      assert.isDefined(fileType, 'should detect the file type');
      assert.strictEqual(fileType.mime, 'application/vnd.recordare.musicxml+xml');
      assert.strictEqual(fileType.ext, 'musicxml');
    });
  });

  describe('Handle different text encoding', () => {
    it('should handle UTF-8 BOM field', async () => {
      const samplePath = getSamplePath('fixture-utf8-bom.xml');
      const tokenizer = await fromFile(samplePath);
      const fileType = await detectXml(tokenizer);
      assert.isDefined(fileType, 'should detect the file type');
      assert.strictEqual(fileType.mime, 'application/xml');
      assert.strictEqual(fileType.ext, 'xml');
    });

    it('should handle UTF-16-BE encoded text with BOM field', async () => {
      const samplePath = getSamplePath('fixture-utf16-be-bom.xml');
      const tokenizer = await fromFile(samplePath);
      const fileType = await detectXml(tokenizer);
      assert.isDefined(fileType, 'should detect the file type');
      assert.strictEqual(fileType.mime, 'application/xml');
      assert.strictEqual(fileType.ext, 'xml');
    });

    it('should handle UTF-16-LE encoded text with BOM field', async () => {
      const samplePath = getSamplePath('fixture-utf16-le-bom.xml');
      const tokenizer = await fromFile(samplePath);
      const fileType = await detectXml(tokenizer);
      assert.isDefined(fileType, 'should detect the file type');
      assert.strictEqual(fileType.mime, 'application/xml');
      assert.strictEqual(fileType.ext, 'xml');
    });

    it('should handle UTF-16-BE encoded text without BOM field', async () => {
      const samplePath = getSamplePath('fixture-utf16-be.xml');
      const tokenizer = await fromFile(samplePath);
      const fileType = await detectXml(tokenizer);
      assert.isDefined(fileType, 'should detect the file type');
      assert.strictEqual(fileType.mime, 'application/xml');
      assert.strictEqual(fileType.ext, 'xml');
    });

    it('should handle UTF-16-LE encoded text without BOM field', async () => {
      const samplePath = getSamplePath('fixture-utf16-le.xml');
      const tokenizer = await fromFile(samplePath);
      const fileType = await detectXml(tokenizer);
      assert.isDefined(fileType, 'should detect the file type');
      assert.strictEqual(fileType.mime, 'application/xml');
      assert.strictEqual(fileType.ext, 'xml');
    });

  });

  describe('XmlTextDetector', () => {

    function detectSvg(svgText) {
      const xmlTextDetector = new XmlTextDetector();
      xmlTextDetector.write(svgText);
      const fileType = xmlTextDetector.fileType;
      assert.isDefined(fileType, 'should detect the file type');
      assert.strictEqual(fileType.mime, 'image/svg+xml');
      assert.strictEqual(fileType.ext, 'svg');
      console.log(JSON.stringify(fileType));
    }

    function isNotSvg(svgText) {
      const xmlTextDetector = new XmlTextDetector();
      xmlTextDetector.write(svgText);
      const fileType = xmlTextDetector.fileType;
      assert.isUndefined(fileType, 'should not be detected');
    }

    it('should be able to detect SVG', async () => {
      detectSvg('<svg xmlns="http://www.w3.org/2000/svg"><path fill="#00CD9F"/></svg>');
    });

    it('should be able to detect Non-namespaced SVG', async () => {
      detectSvg('<svg width="100" height="100" viewBox="0 0 30 30" version="1.1"></svg>');
    });

    it('should be able to detect Non-namespaced SVG with mixed case tags', async () => {
      detectSvg('<SvG version="1.1"></SvG>');
    });

    it('should not be detected as SVG', async () => {
      isNotSvg('this string contains an svg <svg></svg> in the middle')
    });
  });

});
