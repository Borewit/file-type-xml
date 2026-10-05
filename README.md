[![NPM version](https://img.shields.io/npm/v/@file-type/xml.svg)](https://npmjs.org/package/@file-type/xml)
[![Node.js CI](https://github.com/Borewit/file-type-xml/actions/workflows/nodejs-ci.yml/badge.svg)](https://github.com/Borewit/file-type-xml/actions/workflows/nodejs-ci.yml)
[![npm downloads](http://img.shields.io/npm/dm/@file-type/xml.svg)](https://npmcharts.com/compare/@file-type/xml?start=365)

# @file-type/xml

Detector plugin for [file-type](https://github.com/sindresorhus/file-type) for XML files.

## Installation

```bash
npm install @file-type/xml
```

## Usage

The following example shows how to add the XML detector to [file-type](https://github.com/sindresorhus/file-type).
```js
import {FileTypeParser} from 'file-type';
import {detectXml} from '@file-type/xml';

const parser = new FileTypeParser({customDetectors: [detectXml]});
const fileType = await parser.fromFile('example.kml');
console.log(fileType);
```

With `file-type` 22, Node.js 22 or newer is required. For stream detection, pass a
web `ReadableStream` to `parser.fromStream()`. Convert a Node.js `Readable` with
`Readable.toWeb()`:

```js
import {createReadStream} from 'node:fs';
import {Readable} from 'node:stream';

const fileType = await parser.fromStream(Readable.toWeb(createReadStream('example.kml')));
```

The detector inspects at most 16 KiB, including any byte order mark. To change this
limit, create a detector with a `sampleSize` in bytes:

```js
import {FileTypeParser} from 'file-type';
import {createXmlDetector} from '@file-type/xml';

const parser = new FileTypeParser({
    customDetectors: [createXmlDetector({sampleSize: 64 * 1024})]
});
```

The limit applies to both prolog detection and XML parsing. If no XML signature is
found within the sample, the detector returns `undefined` without consuming input.
If XML is recognized but its specific format cannot be determined within the sample,
it returns `application/xml`. `sampleSize` must be a positive safe integer.
The `file-type` stream sampling option is separate; when using `fileTypeStream`, set
its `sampleSize` as well if you want a larger sample.

You can also use the XML detector outside [file-type](https://github.com/sindresorhus/file-type):
```js
import {XmlTextDetector} from '@file-type/xml';

const xmlTextDetector = new XmlTextDetector();
xmlTextDetector.write('<svg xmlns="http://www.w3.org/2000/svg"><path fill="#00CD9F"/></svg>');
const fileType = xmlTextDetector.fileType;
console.log(JSON.stringify(fileType)); // Outputs: {"ext":"svg","mime":"image/svg+xml"}
```

## Support file formats

- [XML](https://en.wikipedia.org/wiki/XML) (default for XML, unless a more specific format was detected)
- [Apple Property list, `.plist`](https://en.wikipedia.org/wiki/Property_list)
- [Atom](<https://en.wikipedia.org/wiki/Atom_(web_standard)>)
- [DocBook](https://en.wikipedia.org/wiki/DocBook)
- [GML (Geography Markup Language)](https://en.wikipedia.org/wiki/Geography_Markup_Language)
- [GPX (GPS Exchange Format)](https://en.wikipedia.org/wiki/GPS_Exchange_Format)
- [KML (Keyhole Markup Language)](https://en.wikipedia.org/wiki/Keyhole_Markup_Language)
- [MathML (Mathematical Markup Language)](https://en.wikipedia.org/wiki/MathML)
- [MusicXML, Uncompressed](https://en.wikipedia.org/wiki/MusicXML)
- [OPML (Outline Processor Markup Language)](https://en.wikipedia.org/wiki/OPML)
- [RSS (RDF Site Summary or Really Simple Syndication)](https://en.wikipedia.org/wiki/RSS)
- [SMIL: (Synchronized Multimedia Integration Language)](https://en.wikipedia.org/wiki/Synchronized_Multimedia_Integration_Language)
- [SVG: (Scalable Vector Graphics)](https://en.wikipedia.org/wiki/SVG)
- [TEI, Text Encoding Initiative](https://en.wikipedia.org/wiki/Text_Encoding_Initiative)
- [TTML: (Timed Text Markup Language)](https://en.wikipedia.org/wiki/Timed_Text_Markup_Language)
- [X3D (Extensible 3D)](https://en.wikipedia.org/wiki/X3D)
- [XHTML](https://en.wikipedia.org/wiki/XHTML)
- [XLIFF (XML Localization Interchange File Format)](https://en.wikipedia.org/wiki/XLIFF)

## Licence

This project is licensed under the [MIT License](LICENSE.txt). Feel free to use, modify, and distribute as needed.
