import type { ExtensionContext } from '../context'
import { registerPhpFileCommand } from '../utils/commands'
import { getTestRunner, hasTestRunner } from '../utils/composer'
import { runTestsTask } from '../utils/tests'

export async function registerRunCurrentTestCommand(context: ExtensionContext) {
	registerPhpFileCommand(context, 'run-current-test', async ({ editor }) => {
		if (!hasTestRunner(context.cwd)) {
			return
		}

		let line = editor.selection.active.line
		let method: string | undefined
		const testRunner = getTestRunner(context.cwd)

		if (testRunner === 'pest') {
			while (line > 0) {
				const lineText = editor.document.lineAt(line).text
				const match = lineText.match(/^\s*(?:it|test)\((.+['"])[,)]/m)

				if (match) {
					method = match[1]
					break
				}

				line = line - 1
			}
		}

		if (testRunner === 'phpunit') {
			while (line > 0) {
				const lineText = editor.document.lineAt(line).text

				const testPrefixMatch = lineText.match(/^\s*(?:public|private|protected)\s+function\s+(test_.+)\s*\(/m)
				if (testPrefixMatch) {
					method = testPrefixMatch[1]
					break
				}

				if (lineText.match(/^\s*#\[Test(?:\(\))?\]/m)) {
					const methodLine = editor.document.lineAt(line + 1).text
					const methodMatch = methodLine.match(/^\s*(?:public|private|protected)\s+function\s+(.+)\s*\(/m)

					if (methodMatch) {
						method = methodMatch[1]
						break
					}
				}

				line = line - 1
			}
		}

		const filter = method ? ` --filter ${method}` : ''
		const args = `${editor.document.fileName}${filter}`
		await runTestsTask(context.cwd, args)
	})
}
