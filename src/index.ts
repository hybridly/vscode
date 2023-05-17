import { ExtensionContext } from 'vscode'
import { version } from '../package.json'
import { log } from './utils/log'
import { loadContext, registerContextUpdater } from './context'
import { registerPageAutocomplete } from './autocomplete/page'
import { registerPageLinkProvider } from './hyperlinks/page'
import { registerLayoutAutocomplete } from './autocomplete/layout'
import { registerRouteLinkProvider } from './hyperlinks/route'
import { registerLayoutLinkProvider } from './hyperlinks/layout'
import { registerUpdateNamespaceCommand } from './commands/update-namespace'
import { registerInsertClassCommand } from './commands/generate-class'

export async function activate(extension: ExtensionContext) {
	log.appendLine(`Hybridly for Code v${version}\n`)

	const context = await loadContext(extension)
	if (!context) {
		return
	}

	await registerContextUpdater(context)
	await registerPageAutocomplete(context)
	await registerLayoutAutocomplete(context)
	await registerPageLinkProvider(context)
	await registerRouteLinkProvider(context)
	await registerLayoutLinkProvider(context)
	await registerUpdateNamespaceCommand(context)
	await registerInsertClassCommand(context)
}

export function deactivate() {
	log.appendLine('Disabled.')
}
