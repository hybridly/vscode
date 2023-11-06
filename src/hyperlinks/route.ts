import { DocumentLinkProvider, languages } from 'vscode'
import { HybridlyContext } from '../context'
import { locateInDocument } from '../utils/locate-in-document'
import { log } from '../utils/log'
import { escapeRegExp } from '../utils/regexp'
import { getSetting } from '../settings'

export async function registerRouteLinkProvider(context: HybridlyContext) {
	log.appendLine('Registering route link provider.')

	const methods = getSetting<string[]>('routeMethods')
	const provider: DocumentLinkProvider = {
		async provideDocumentLinks(document) {
			const links = methods.flatMap((method) => locateInDocument(
				new RegExp(`${escapeRegExp(method)}\\(\\s*([\\'"])(?<route>[^)]+)(\\1\\s*[\\),])`, 'gmd'),
				'route',
				document,
			))

			return links.flatMap((link) => {
				const route = context.routes.find((route) => link.value === route.name)

				if (!route) {
					return []
				}

				return [{
					target: route.controller.uri,
					range: link.range,
				}]
			})
		},
	}

	context.extension.subscriptions.push(languages.registerDocumentLinkProvider(
		[
			{ scheme: 'file', language: 'php', pattern: '**/*.php' },
			{ scheme: 'file', language: 'vue', pattern: '**/*.vue' },
			{ scheme: 'file', language: 'ts', pattern: '**/*.ts' },
		],
		provider,
	))
}
