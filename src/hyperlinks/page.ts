import { DocumentLinkProvider, languages } from 'vscode'
import { Context } from '../context'
import { getComponentMethods } from '../settings'
import { locateInDocument } from '../utils/locate-in-document'
import { log } from '../utils/log'
import { escapeRegExp } from '../utils/regexp'

export async function registerPageLinkProvider(context: Context) {
	log.appendLine('Registering page link provider.')

	const methods = getComponentMethods()
	const provider: DocumentLinkProvider = {
		async provideDocumentLinks(document) {
			const links = locateInDocument(
				new RegExp(`(?:${methods.map(escapeRegExp).join('|')})\\(\\s*([\\'"])(?<component>.+)(\\1)\s*[\\),]`, 'gmd'),
				'component',
				document,
			)

			return links.flatMap((link) => {
				const page = context.completions.pages.find((page) => link.value === page.identifier)

				if (!page) {
					return []
				}

				return [{
					target: page.target,
					range: link.range,
				}]
			})
		},
	}

	context.extension.subscriptions.push(languages.registerDocumentLinkProvider(
		{ scheme: 'file', language: 'php', pattern: '**/*.php' },
		provider,
	))
}
