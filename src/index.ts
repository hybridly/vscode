import { ExtensionContext, languages } from 'vscode'
import { ComponentLinkProvider } from './providers/component-link-provider'
import { RouteLinkProvider } from './providers/route-link-provider'

export async function activate(context: ExtensionContext) {
	console.log('Hybridly extension is active.')

	context.subscriptions.push(languages.registerDocumentLinkProvider(
		{ scheme: 'file', language: 'php', pattern: '**/*.php' },
		new ComponentLinkProvider(),
	))

	context.subscriptions.push(languages.registerDocumentLinkProvider(
		[
			{ scheme: 'file', language: 'php', pattern: '**/*.php' },
			{ scheme: 'file', language: 'vue', pattern: '**/*.vue' },
			{ scheme: 'file', language: 'ts', pattern: '**/*.ts' },
		],
		new RouteLinkProvider(),
	))
}

export function deactivate() {
}
