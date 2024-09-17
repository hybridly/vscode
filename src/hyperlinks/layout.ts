import type { DocumentLinkProvider } from 'vscode'
import { Position, Range, languages } from 'vscode'
import type { HybridlyContext } from '../context'
import { locateInDocument } from '../utils/locate-in-document'
import { log } from '../utils/log'

export async function registerLayoutLinkProvider(context: HybridlyContext) {
	log.appendLine('Registering layout link provider.')

	const provider: DocumentLinkProvider = {
		async provideDocumentLinks(document) {
			const layoutWithArgument = /<template\s*layout=\s*([\'"])(?<layout>.+)(\1)\s*[>]/gmd // https://regex101.com/r/fh3XKa/1
			const layoutWithoutArgument = /<template\s*(?<layout>layout)\s*[>]/gmd // https://regex101.com/r/0aVnrx/2

			const links = [
				...locateInDocument(layoutWithArgument, 'layout', document),
				...locateInDocument(layoutWithoutArgument, 'layout', document),
			].flatMap((component) => {
				for (const separator of [', ', ',']) {
					if (component.value.includes(separator)) {
						const layouts = component.value.split(separator)
						return layouts.map((value, i) => ({
							value,
							range: new Range(
								new Position(component.range.start.line, component.range.start.character + layouts.slice(0, i).join(separator).length + (i === 0 ? 0 : separator.length)),
								new Position(component.range.start.line, component.range.start.character + layouts.slice(0, i + 1).join(separator).length),
							),
						}))
					}
				}

				return [component]
			})

			return links.flatMap((link) => {
				const layout = link.value === 'layout'
					? context.completions.layouts.find((layout) => layout.identifier === 'default')
					: context.completions.layouts.find((layout) => link.value === layout.identifier)

				if (!layout) {
					return []
				}

				return [{
					target: layout.target,
					range: link.range,
				}]
			})
		},
	}

	context.extension.subscriptions.push(languages.registerDocumentLinkProvider(
		{ scheme: 'file', language: 'vue', pattern: '**/*.vue' },
		provider,
	))
}
