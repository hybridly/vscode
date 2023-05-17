/* eslint-disable brace-style */
import { Position, Range, commands, window } from 'vscode'
import { Context } from '../context'
import { log } from '../utils/log'
import { resolvePhpFile } from '../utils/psr4'

export async function registerUpdateNamespaceCommand(context: Context) {
	log.appendLine('Registering the namespace command.')

	async function insertNamespace() {
		if (!window.activeTextEditor) {
			return
		}

		if (!context.workspace) {
			window.showWarningMessage('You may only insert a namespace when inside a workspace.')
		}

		const file = resolvePhpFile(context.uri, window.activeTextEditor.document.uri)

		if (!file) {
			window.showWarningMessage('Current file could not be resolved as a validd PSR-4 PHP file.')
			return
		}

		const editor = window.activeTextEditor

		// Checks if there is a `namespace` statement in the first 5 lines
		const currentlySpecifiedNamespace = editor.document.getText(
			new Range(new Position(0, 0), new Position(6, 0)),
		).match(/namespace [^;]+;/)

		const documentText = editor.document.getText()
		const newDocumentText = (() => {
			if (currentlySpecifiedNamespace) {
				return documentText.replace(currentlySpecifiedNamespace[0], `namespace ${file.fqcn};`)
			}

			const eol = editor.document.eol === 1 ? '\n' : '\r\n'

			if (documentText.startsWith('<?php')) {
				return documentText.replace('<?php', `<?php${eol}${eol}namespace ${file.fqcn};${eol}`)
			}

			return `<?php${eol}${eol}namespace ${file.fqcn};${eol}${documentText}`
		})()

		editor.edit((builder) => {
			builder.replace(
				new Range(new Position(0, 0), new Position(editor.document.lineCount, 0)),
				newDocumentText,
			)
		})
	}

	context.extension.subscriptions.push(
		commands.registerCommand('hybridly.php.update-namespace', insertNamespace),
	)
}
