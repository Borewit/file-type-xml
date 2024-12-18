[![NPM version](https://img.shields.io/npm/v/@file-type/xml.svg)](https://npmjs.org/package/@file-type/xml)
[![Node.js CI](https://github.com/Borewit/file-type-xml/actions/workflows/nodejs-ci.yml/badge.svg)](https://github.com/Borewit/file-type-xml/actions/workflows/nodejs-ci.yml)
# @file-type/xml

Detector plugin for [file-type](https://github.com/sindresorhus/file-type) for XML files.

## Installation

```bash
npm install @file-type/xml
```

### Usage

The following example shows how add the XML detector to [file-type](https://github.com/sindresorhus/file-type).
```js
import {NodeFileTypeParser} from 'file-type';
import {detectXml} from '@file-type/xml';

const parser = new NodeFileTypeParser({customDetectors: [detectXml]});
const fileType = await parser.fromFile('example.kml');
console.log(fileType);
```


