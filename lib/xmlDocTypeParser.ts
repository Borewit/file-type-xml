type DoctypeKind = 'PUBLIC' | 'SYSTEM' | 'UNKNOWN';

export interface ParsedDoctype {
	raw: string;
	name: string | undefined;        // e.g. "article"
	kind: DoctypeKind;               // PUBLIC | SYSTEM | UNKNOWN
	publicId?: string;               // e.g. -//OASIS//DTD DocBook XML V4.5//EN
	systemId?: string;               // e.g. http://.../docbookx.dtd
	internalSubset?: string;         // everything between [ ... ], if present
}

/**
 * Parse the string provided by `sax`'s `ondoctype` callback.
 *
 * Examples of input:
 *  - "article PUBLIC '-//OASIS//DTD DocBook XML V4.5//EN' 'http://.../docbookx.dtd'"
 *  - "svg SYSTEM 'http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd'"
 *  - "plist SYSTEM \"http://www.apple.com/DTDs/PropertyList-1.0.dtd\""
 *  - "root [ <!ENTITY ...> ]"
 */
export function parseDoctype(raw: string): ParsedDoctype {
	const normalized = raw.replace(/\s+/g, ' ').trim();

	// Extract internal subset, if any: "... [ ... ]"
	let internalSubset: string | undefined;
	let head = normalized;
	const subsetStart = normalized.indexOf('[');
	if (subsetStart !== -1 && normalized.endsWith(']')) {
		head = normalized.slice(0, subsetStart).trim();
		internalSubset = normalized.slice(subsetStart + 1, -1).trim();
	}

	// name is first token (DOCTYPE root name)
	const nameMatch = /^([^\s]+)\b/.exec(head);
	const name = nameMatch?.[1];

	// Capture quoted ids
	// PUBLIC "pubid" "sysid" OR SYSTEM "sysid"
	const publicRe =
		/\bPUBLIC\s+(?:'([^']*)'|"([^"]*)")\s+(?:'([^']*)'|"([^"]*)")/i;
	const systemRe =
		/\bSYSTEM\s+(?:'([^']*)'|"([^"]*)")/i;

	const publicMatch = publicRe.exec(head);
	if (publicMatch) {
		const publicId = publicMatch[1] ?? publicMatch[2] ?? '';
		const systemId = publicMatch[3] ?? publicMatch[4] ?? '';
		return { raw, name, kind: 'PUBLIC', publicId, systemId, internalSubset };
	}

	const systemMatch = systemRe.exec(head);
	if (systemMatch) {
		const systemId = systemMatch[1] ?? systemMatch[2] ?? '';
		return { raw, name, kind: 'SYSTEM', systemId, internalSubset };
	}

	return { raw, name, kind: 'UNKNOWN', internalSubset };
}
