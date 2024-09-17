import type { TextEditor } from 'vscode'
import { commands, window } from 'vscode'
import type { ExtensionContext } from '../context'
import type { PhpFile } from './psr4'
import { resolvePhpFile } from './psr4'
import { log } from './log'

interface CommandArguments {
	file: PhpFile
	editor: TextEditor
}

class CommandError extends Error {}

function registerCommand(name: string, cb: Function) {
	log.appendLine(`Registering command [${name}].`)

	return commands.registerCommand(name, async () => {
		try {
			await cb()
		} catch (error) {
			if (error instanceof CommandError) {
				window.showWarningMessage(error.message)
			} else {
				throw error
			}
		}
	})
}

export async function registerEditorCommand(context: ExtensionContext, name: string, callback: (editor?: TextEditor) => Promise<void>) {
	context.extension.subscriptions.push(
		registerCommand(`hybridly.${name}`, async () => await callback(window.activeTextEditor)),
	)
}

export async function registerPhpFileCommand(context: ExtensionContext, name: string, callback: (params: CommandArguments) => Promise<void>) {
	context.extension.subscriptions.push(
		registerCommand(`hybridly.php.${name}`, async () => await callback(assertPhpFile(context))),
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

	if (!file) {
		throw new CommandError('Current file could not be resolved as a valid PSR-4 PHP file.')
	}

	const editor = window.activeTextEditor

	return {
		file,
		editor,
	}
}
