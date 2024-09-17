import { Position, Range } from 'vscode'
import type { ExtensionContext } from '../context'
import { registerPhpFileCommand } from '../utils/commands'
import { generatePhpPrelude } from '../utils/generate-php-class'

export async function registerUpdateNamespaceCommand(context: ExtensionContext) {
	registerPhpFileCommand(context, 'update-namespace', async ({ file, editor }) => {
		const currentlySpecifiedNamespace = editor.document.getText(
			new Range(new Position(0, 0), new Position(6, 0)),
		).match(/namespace [^;]+;/)

		const documentText = editor.document.getText()
		const newDocumentText = (() => {
			// Replaces the existing namespace if any
			if (currentlySpecifiedNamespace) {
				return documentText.replace(currentlySpecifiedNamespace[0], `namespace ${file.fqcn};`)
			}

			const prelude = generatePhpPrelude(editor, file)

			// Replaces <?php if it's there with a namespace statement
			if (documentText.startsWith('<?php')) {
				return documentText.replace('<?php', prelude)
			}

			// Adds a prelude otherwise
			return `${prelude}${documentText}`
		})()

		editor.edit((builder) => {
			builder.replace(
				new Range(new Position(0, 0), new Position(editor.document.lineCount, 0)),
				newDocumentText,
			)
		})
	})
}
