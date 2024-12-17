
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
  if (startsWith(array,[60, 63, 120, 109, 108, 32])) {
     return {xml: true,  encoding: 'utf-8'}
  }
  // else if (startsWith(array,[0xFF, 0xFE, 0, 60,  0, 63, 0, 120, 0, 109, 0, 108, 0, 32 ])) {
  //   return {xml: true,  encoding: 'utf-16-be'}
  // } else if (startsWith(array,[0xFF, 0xFE, 60,  0, 63, 0, 120, 0, 109, 0, 108, 0, 32, 0 ])) {
  //   return {xml: true,  encoding: 'utf-16-le'}
  // }
  return {xml: false, encoding: undefined}
}

function extractNsElement(node) {
  const parts = node.name.split(':');
  if(parts.length === 1) {
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
 * Maps the root element name to corresponding file-type
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
  }
}

export const detectXml = async tokenizer => {

  const buffer = new Uint8Array(512);

  // Increase sample size from 12 to 256.
  await tokenizer.peekBuffer(buffer, {length: 128, mayBeLess: true});

  const {xml, encoding} = isXml(buffer);

  if (xml) {
    let fileType;

    const parser = sax.parser(true);

    let firstTag = true;
    let onEnd = false;

    parser.onerror = e => {
      onEnd = true;
    };
    parser.onopentag = node => {
      if (!firstTag) {
        return;
      }
      firstTag = false;
      const nsNode = extractNsElement(node);
      if (nsNode.ns) {
        // Resolve file-type boot root element namespace
        fileType = namespaceMapping[nsNode.ns];
      } else {
        // Fall back on element name if there is no namespace
        fileType = rootNameMapping[nsNode.name];
      }

      if (fileType) {
        onEnd = true;
      }
    };
    parser.onend = () => {
      onEnd = true;
    };

    do {
      const len = await tokenizer.readBuffer(buffer, {mayBeLess: true});
      const portion = buffer.subarray(0, len);
      const text = new TextDecoder().decode(portion);
      parser.write(text);
      if (len < buffer.length) {
        parser.close();
        onEnd = true;
      }
    } while(!onEnd)

    return fileType ?? {
      ext: 'xml',
      mime: 'application/xml',
    }
  }

};