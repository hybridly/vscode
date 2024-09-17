import type { ExtensionContext } from '../context'
import { registerPhpFileCommand } from '../utils/commands'
import { hasPest } from '../utils/composer'
import { runTestsTask } from '../utils/tests'

export async function registerRunCurrentTestCommand(context: ExtensionContext) {
	registerPhpFileCommand(context, 'run-current-test', async ({ editor }) => {
		if (!hasPest(context.cwd)) {
			return
		}

		let line = editor.selection.active.line
		let method: string | undefined

		while (line > 0) {
			const lineText = editor.document.lineAt(line).text
			const match = lineText.match(/^\s*(?:it|test)\((.+['"])[,)]/m)

			if (match) {
				method = match[1]
				break
			}

			line = line - 1
		}

		const filter = method ? ` --filter ${method}` : ''
		const args = `${editor.document.fileName}${filter}`
		await runTestsTask(context.cwd, args)
	})
}
