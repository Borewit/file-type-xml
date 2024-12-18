import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {describe, it} from 'mocha';
import {fromFile} from 'strtok3';
import {assert} from 'chai';

import {detectXml} from '../lib/index.js';

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
  });
});
