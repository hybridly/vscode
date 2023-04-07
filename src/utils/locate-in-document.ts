import { Range, TextDocument } from 'vscode'

export type LocatedPattern = { value: string; range: Range }

/**
 * Locates a pattern in a document an returns the range of all occurences.
 */
export function locateInDocument(pattern: RegExp, group: string, document: TextDocument): LocatedPattern[] {
	let match: RegExpExecArray | null
	const results: LocatedPattern[] = []

	// eslint-disable-next-line no-cond-assign
	while ((match = pattern.exec(document.getText())) !== null) {
		if (match.groups?.[group] && match.indices?.groups?.[group]) {
			results.push({
				value: match.groups?.[group],
				range: new Range(
					document.positionAt(match.indices.groups[group][0]),
					document.positionAt(match.indices.groups[group][1]),
				),
			})
		}
	}

	return results
}
