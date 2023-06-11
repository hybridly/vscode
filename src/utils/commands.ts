import { TextEditor, commands, window } from 'vscode'
import { ExtensionContext } from '../context'
import { PhpFile, resolvePhpFile } from './psr4'
import { log } from './log'

interface CommandArguments {
	file: PhpFile
	editor: TextEditor
}

class CommandError extends Error {}

export async function registerCommand(context: ExtensionContext, name: string, callback: (params: CommandArguments) => Promise<void>) {
	log.appendLine(`Registering command [${name}].`)

	context.extension.subscriptions.push(
		commands.registerCommand(`hybridly.php.${name}`, async() => {
			try {
				await callback(assertPhpFile(context))
			} catch (error) {
				if (error instanceof CommandError) {
					window.showWarningMessage(error.message)
				} else {
					throw error
				}
			}
		}),
	)
}

export function assertPhpFile(context: ExtensionContext): CommandArguments {
	if (!window.activeTextEditor) {
		throw new CommandError('There is no active editor.')
	}

	if (!context.workspace) {
		throw new CommandError('You may only insert a namespace when inside a workspace.')
	}

	const file = resolvePhpFile(context.uri, window.activeTextEditor.document.uri)
	log.appendLine(JSON.stringify(file, null, 2))

	if (!file) {
		throw new CommandError('Current file could not be resolved as a valid PSR-4 PHP file.')
	}

	const editor = window.activeTextEditor

	return {
		file,
		editor,
	}
}
