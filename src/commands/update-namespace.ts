import type { TextEditor, TextLine } from 'vscode'
import { Position, Range } from 'vscode'
import type { ExtensionContext } from '../context'
import { registerPhpFileCommand } from '../utils/commands'
import { generatePhpPrelude } from '../utils/generate-php-class'

const classDeclarationRE = /class ([a-zA-Z_\x7F-\xFF][a-zA-Z0-9_\x7F-\xFF]*)/

export async function registerUpdateNamespaceCommand(context: ExtensionContext) {
	registerPhpFileCommand(context, 'update-namespace', async ({ file, editor }) => {
		const currentlySpecifiedNamespace = editor.document.getText(
			new Range(new Position(0, 0), new Position(6, 0)),
		).match(/namespace [^;]+;/)

		const currentlySpecifiedClassName = findClassDeclarationLine(editor)
		let documentText = editor.document.getText()
		const newDocumentText = (() => {
			// Replaces the class declaration
			if (currentlySpecifiedClassName) {
				const line = currentlySpecifiedClassName.lineNumber
				const lineText = editor.document.lineAt(line).text

				documentText = documentText.replace(lineText, lineText.replace(classDeclarationRE, `class ${file.className}`))
			}

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

function findClassDeclarationLine(editor: TextEditor): TextLine | undefined {
	let line = 0
	let previousLineIsClassDeclaration = false
	const lines = editor.document.lineCount

	while (line < lines) {
		const lineText = editor.document.lineAt(line).text
		const classOpenerRE = /^{$/

		if (previousLineIsClassDeclaration && lineText.match(classOpenerRE)) {
			return editor.document.lineAt(line - 1)
		}

		previousLineIsClassDeclaration = classDeclarationRE.test(lineText)

		line++
	}
}
