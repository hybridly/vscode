import { ExtensionContext, languages } from 'vscode'
import { ComponentLinkProvider } from './providers/component-link-provider'

export async function activate(context: ExtensionContext) {
	console.log('Hybridly extension is active.')

	const definitionProvider = languages.registerDocumentLinkProvider(
		{ scheme: 'file', language: 'php', pattern: '**/*.php' },
		new ComponentLinkProvider(),
	)

	context.subscriptions.push(definitionProvider)
}

export function deactivate() {
}
