import { ExtensionContext } from 'vscode'
import { version } from '../package.json'
import { log } from './utils/log'
import { loadHybridlyContext, loadExtensionContext, registerContextUpdater } from './context'
import { registerPageAutocomplete } from './autocomplete/page'
import { registerPageLinkProvider } from './hyperlinks/page'
import { registerLayoutAutocomplete } from './autocomplete/layout'
import { registerRouteLinkProvider } from './hyperlinks/route'
import { registerLayoutLinkProvider } from './hyperlinks/layout'
import { registerUpdateNamespaceCommand } from './commands/update-namespace'
import { registerInsertClassCommand } from './commands/generate-class'
import { registerRunCurrentTestCommand } from './commands/run-current-test'
import { registerRunTestsCommand } from './commands/run-tests'
import { registerRunCurrentTestFileCommand } from './commands/run-current-test-file'
import { registerRunPreviousTestCommand } from './commands/run-previous-test'
import { registerRunDirectoryTestsCommand } from './commands/run-directory-tests'

export async function activate(extension: ExtensionContext) {
	log.appendLine(`Hybridly for Code v${version}\n`)

	const extensionContext = await loadExtensionContext(extension)
	if (!extensionContext) {
		return
	}

	log.appendLine('Loading agnostic features...')
	await registerUpdateNamespaceCommand(extensionContext)
	await registerInsertClassCommand(extensionContext)
	await registerRunCurrentTestCommand(extensionContext)
	await registerRunTestsCommand(extensionContext)
	await registerRunCurrentTestFileCommand(extensionContext)
	await registerRunPreviousTestCommand(extensionContext)
	await registerRunDirectoryTestsCommand(extensionContext)

	const context = await loadHybridlyContext(extensionContext)
	if (!context) {
		return
	}

	log.appendLine('Loading Hybridly features...')
	await registerContextUpdater(context)
	await registerPageAutocomplete(context)
	await registerLayoutAutocomplete(context)
	await registerPageLinkProvider(context)
	await registerRouteLinkProvider(context)
	await registerLayoutLinkProvider(context)
}

export function deactivate() {
	log.appendLine('Disabled.')
}
