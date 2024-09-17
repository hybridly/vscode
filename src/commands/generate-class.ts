import { Position, Range, commands, window } from 'vscode'
import type { ExtensionContext } from '../context'
import { registerPhpFileCommand } from '../utils/commands'
import type { ClassType } from '../utils/generate-php-class'
import { generatePhpClass } from '../utils/generate-php-class'

export async function registerInsertClassCommand(context: ExtensionContext) {
	registerPhpFileCommand(context, 'generate-class', async ({ file, editor }) => {
		if (editor.document.getText().trim().length) {
			await commands.executeCommand('hybridly.php.update-namespace')
			return
		}

		const type = await window.showQuickPick<{ label: string, value: ClassType }>(
			[
				{ label: 'Class', value: 'class' },
				{ label: 'Invokable class', value: 'invokable-class' },
				{ label: 'Trait', value: 'trait' },
				{ label: 'Interface', value: 'interface' },
				{ label: 'Enum', value: 'enum' },
			],
			{
				placeHolder: 'Which type of PHP file would you like?',
				ignoreFocusOut: true,
			},
		)

		if (!type) {
			return
		}

		const newDocumentText = generatePhpClass(editor, file, type.value)

		editor.edit((builder) => {
			builder.replace(
				new Range(new Position(0, 0), new Position(editor.document.lineCount, 0)),
				newDocumentText,
			)
		})
	})
}
